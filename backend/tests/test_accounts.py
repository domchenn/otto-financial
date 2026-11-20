import datetime as dt
from collections.abc import Callable, Iterator
from dataclasses import dataclass, field, replace
from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select, text

from app.core.db import get_engine, get_sessionmaker
from app.main import create_app
from app.modules.accounts.models import Connection
from app.modules.accounts.provider import (
    ExchangedItem,
    ProviderAccount,
    ProviderCreditLiability,
    ProviderItemError,
    ProviderTransaction,
    TransactionsPage,
    to_cents,
)
from app.modules.accounts.router import get_provider
from app.modules.accounts.service import upcoming_payments, week_start

# The user's calendar day (new users default to America/New_York), not the machine's: CI runs
# in UTC, which is already tomorrow during a New York evening.
TODAY = dt.datetime.now(ZoneInfo("America/New_York")).date()

CHECKING = ProviderAccount(
    account_id="acc-checking",
    name="Checking",
    official_name=None,
    mask="0000",
    kind="depository",
    subtype="checking",
    current_cents=500_000,
    available_cents=480_000,
    limit_cents=None,
)
GOLD = ProviderAccount(
    account_id="acc-gold",
    name="Gold Card",
    official_name="American Express Gold Card",
    mask="1007",
    kind="credit",
    subtype="credit card",
    current_cents=68_422,
    available_cents=None,
    limit_cents=1_000_000,
)
GOLD_LIABILITY = ProviderCreditLiability(
    account_id="acc-gold",
    statement_balance_cents=61_000,
    minimum_due_cents=4_000,
    next_due_date=TODAY + dt.timedelta(days=5),
    last_payment_cents=55_000,
    last_payment_date=TODAY - dt.timedelta(days=25),
)


def txn(tid: str, cents: int, **kw: object) -> ProviderTransaction:
    base = ProviderTransaction(
        transaction_id=tid,
        account_id="acc-gold",
        amount_cents=cents,
        date=TODAY,
        authorized_at=None,
        name=f"Merchant {tid}",
        merchant_name=f"Merchant {tid}",
        category="FOOD_AND_DRINK",
        pending=False,
        pending_transaction_id=None,
    )
    return replace(base, **kw)  # type: ignore[arg-type]


@dataclass
class FakeProvider:
    accounts: list[ProviderAccount] = field(default_factory=lambda: [CHECKING, GOLD])
    liabilities: list[ProviderCreditLiability] = field(default_factory=lambda: [GOLD_LIABILITY])
    pages: dict[str | None, TransactionsPage] = field(default_factory=dict)
    error: ProviderItemError | None = None
    removed: list[str] = field(default_factory=list)
    link_tokens: list[str | None] = field(default_factory=list)

    def create_link_token(self, user_id: str, access_token: str | None = None) -> str:
        self.link_tokens.append(access_token)
        return "link-sandbox-123"

    def exchange_public_token(self, public_token: str) -> ExchangedItem:
        return ExchangedItem(item_id=f"item-{public_token}", access_token=f"access-{public_token}")

    def get_accounts(self, access_token: str) -> list[ProviderAccount]:
        if self.error:
            raise self.error
        return self.accounts

    def get_credit_liabilities(self, access_token: str) -> list[ProviderCreditLiability]:
        return self.liabilities

    def sync_transactions(self, access_token: str, cursor: str | None) -> TransactionsPage:
        return self.pages.get(cursor, TransactionsPage(next_cursor=cursor or ""))

    def remove_item(self, access_token: str) -> None:
        self.removed.append(access_token)


@pytest.fixture
def provider() -> FakeProvider:
    return FakeProvider(
        pages={
            None: TransactionsPage(
                added=[txn("t1", 1_645), txn("t2", 4_218, category="GENERAL_MERCHANDISE")],
                next_cursor="c1",
                has_more=True,
            ),
            "c1": TransactionsPage(
                added=[
                    txn("rent", 250_000, category="RENT_AND_UTILITIES"),
                    txn("payment", -55_000, category="LOAN_PAYMENTS"),
                    txn("old", 9_999, date=TODAY - dt.timedelta(days=30)),
                ],
                next_cursor="c2",
            ),
        }
    )


@pytest.fixture
def api(provider: FakeProvider, make_token: Callable[..., str]) -> TestClient:
    app = create_app()
    app.dependency_overrides[get_provider] = lambda: provider
    client = TestClient(app)
    client.headers["Authorization"] = f"Bearer {make_token()}"
    return client


@pytest.fixture(autouse=True)
def _clean_accounts() -> Iterator[None]:
    yield
    with get_engine().begin() as conn:
        conn.execute(text("truncate connections, net_worth_snapshots restart identity cascade"))


def connect(api: TestClient, public_token: str = "public-1") -> dict[str, object]:
    response = api.post(
        "/v1/connections",
        json={"public_token": public_token, "institution_id": "ins_10", "institution_name": "Amex"},
    )
    assert response.status_code == 201, response.text
    body: dict[str, object] = response.json()
    return body


def test_to_cents_rounds_half_up_without_float_drift() -> None:
    assert to_cents(1.005) == 101
    assert to_cents(16.45) == 1645
    assert to_cents(-550.0) == -55000
    assert to_cents(None) is None


def test_routes_require_auth() -> None:
    assert TestClient(create_app()).get("/v1/summary").status_code == 401


def test_link_token(api: TestClient) -> None:
    response = api.post("/v1/link-token", json={})
    assert response.status_code == 200
    assert response.json() == {"link_token": "link-sandbox-123"}


def test_connect_syncs_accounts_statements_and_all_transaction_pages(api: TestClient) -> None:
    body = connect(api)
    assert body["institution_name"] == "Amex"
    assert body["status"] == "ok"
    accounts = {a["mask"]: a for a in body["accounts"]}  # type: ignore[attr-defined]
    assert accounts["1007"]["statement_balance_cents"] == 61_000
    assert accounts["1007"]["next_due_date"] == GOLD_LIABILITY.next_due_date.isoformat()  # type: ignore[union-attr]

    txns = api.get("/v1/transactions").json()
    assert {t["name"] for t in txns} == {
        f"Merchant {i}" for i in ("t1", "t2", "rent", "payment", "old")
    }
    assert txns[0]["institution_name"] == "Amex"


def test_access_token_is_encrypted_at_rest(api: TestClient) -> None:
    connect(api)
    with get_sessionmaker()() as session:
        stored = session.scalars(select(Connection.access_token_encrypted)).one()
    assert "access-public-1" not in stored


def test_summary_net_worth_cards_payments_and_week_spend(api: TestClient) -> None:
    connect(api)
    s = api.get("/v1/summary").json()
    assert s["net_worth"] == {
        "assets_cents": 500_000,
        "liabilities_cents": 68_422,
        "net_cents": 431_578,
        "week_change_cents": None,
    }
    assert s["card_balance_cents"] == 68_422
    assert s["utilization_pct"] == 7
    assert s["has_connections"] is True
    assert s["upcoming_payments"][0]["amount_cents"] == 61_000
    assert s["upcoming_payments"][0]["covered"] is True
    # Rent and the card payment are excluded; the 30-day-old purchase is outside the week.
    assert s["week_start"] == week_start(TODAY).isoformat()
    assert s["week_spent_cents"] == 1_645 + 4_218


def test_resync_is_idempotent_and_applies_modified_and_removed(
    api: TestClient, provider: FakeProvider
) -> None:
    connect(api)
    provider.pages["c2"] = TransactionsPage(
        added=[txn("t1-posted", 1_945, pending_transaction_id="t1")],
        modified=[txn("t2", 4_000, category="GENERAL_MERCHANDISE")],
        removed=["t1"],
        next_cursor="c3",
    )
    assert api.post("/v1/sync").status_code == 200
    assert api.post("/v1/sync").status_code == 200  # nothing new at c3
    by_name = {t["name"]: t for t in api.get("/v1/transactions").json()}
    assert "Merchant t1" not in by_name
    assert by_name["Merchant t1-posted"]["amount_cents"] == 1_945
    assert by_name["Merchant t2"]["amount_cents"] == 4_000
    assert len(by_name) == 5


def test_expired_login_marks_connection_and_shows_in_summary(
    api: TestClient, provider: FakeProvider
) -> None:
    connection = connect(api)
    provider.error = ProviderItemError("ITEM_LOGIN_REQUIRED")
    [synced] = api.post("/v1/sync").json()
    assert synced["status"] == "needs_reauth"
    attention = api.get("/v1/summary").json()["attention"]
    assert attention[0]["connection_id"] == connection["id"]

    # Update-mode Link gets the stored access token.
    api.post("/v1/link-token", json={"connection_id": connection["id"]})
    assert provider.link_tokens[-1] == "access-public-1"

    provider.error = None
    [fixed] = api.post("/v1/sync").json()
    assert fixed["status"] == "ok"


def test_filters_and_search(api: TestClient) -> None:
    connect(api)
    assert [t["name"] for t in api.get("/v1/transactions", params={"q": "t2"}).json()] == [
        "Merchant t2"
    ]
    rent = api.get("/v1/transactions", params={"category": "RENT_AND_UTILITIES"}).json()
    assert [t["name"] for t in rent] == ["Merchant rent"]
    assert len(api.get("/v1/transactions", params={"limit": 2}).json()) == 2


def test_delete_connection_removes_item_and_data(api: TestClient, provider: FakeProvider) -> None:
    connection = connect(api)
    assert api.delete(f"/v1/connections/{connection['id']}").status_code == 204
    assert provider.removed == ["access-public-1"]
    assert api.get("/v1/accounts").json() == []
    assert api.get("/v1/transactions").json() == []
    assert api.get("/v1/summary").json()["net_worth"]["net_cents"] == 0


def test_cannot_read_other_users_data(api: TestClient, make_token: Callable[..., str]) -> None:
    connect(api)
    account_id = api.get("/v1/accounts").json()[0]["id"]
    with get_engine().begin() as conn:
        other = conn.execute(
            text(
                "insert into users (id, clerk_user_id, timezone) "
                "values (gen_random_uuid(), 'user_other', 'UTC') returning id"
            )
        ).scalar_one()
        conn.execute(
            text("update accounts set user_id = :u where id = :id"), {"u": other, "id": account_id}
        )
    assert api.get(f"/v1/accounts/{account_id}").status_code == 404


def test_upcoming_payments_cover_cumulatively() -> None:
    from app.modules.accounts.models import Account

    def card(name: str, owed: int, days: int) -> Account:
        return Account(
            name=name,
            kind="credit",
            statement_balance_cents=owed,
            next_due_date=TODAY + dt.timedelta(days=days),
        )

    checking = Account(name="Chk", kind="depository", subtype="checking", available_cents=1_000)
    past = Account(
        name="Past",
        kind="credit",
        statement_balance_cents=1,
        next_due_date=TODAY - dt.timedelta(days=1),
    )
    payments = upcoming_payments([checking, card("B", 600, 9), card("A", 600, 2), past], TODAY)
    assert [(p.account.name, p.covered) for p in payments] == [("A", True), ("B", False)]
    assert upcoming_payments([card("A", 1, 1)], TODAY)[0].covered is None


def _snapshot(days_ago: int, assets: int, liabilities: int) -> None:
    with get_engine().begin() as conn:
        conn.execute(
            text(
                "insert into net_worth_snapshots"
                " (id, user_id, date, assets_cents, liabilities_cents)"
                " select gen_random_uuid(), id, :d, :a, :l from users"
            ),
            {"d": TODAY - dt.timedelta(days=days_ago), "a": assets, "l": liabilities},
        )


def test_net_worth_breaks_down_by_kind(api: TestClient, provider: FakeProvider) -> None:
    provider.accounts = [
        CHECKING,
        replace(
            CHECKING,
            account_id="acc-brokerage",
            kind="investment",
            subtype="brokerage",
            current_cents=1_200_000,
        ),
        GOLD,
        replace(GOLD, account_id="acc-loan", kind="loan", subtype="student", current_cents=300_000),
    ]
    connect(api)
    d = api.get("/v1/net-worth").json()
    assert (d["cash_cents"], d["investments_cents"]) == (500_000, 1_200_000)
    assert (d["cards_cents"], d["loans_cents"]) == (68_422, 300_000)
    assert d["net_cents"] == 500_000 + 1_200_000 - 68_422 - 300_000
    assert d["tracking_since"] == TODAY.isoformat()


def test_net_worth_has_no_changes_before_any_history(api: TestClient) -> None:
    connect(api)
    changes = api.get("/v1/net-worth").json()["changes"]
    assert [c["period"] for c in changes] == ["1W", "1M", "3M", "1Y", "All"]
    assert all(c["change_cents"] is None for c in changes)


def test_net_worth_changes_compare_with_the_snapshot_at_each_period_start(
    api: TestClient,
) -> None:
    connect(api)  # today: 500,000 - 68,422 = 431,578
    _snapshot(40, 400_000, 50_000)  # 350,000
    _snapshot(8, 450_000, 60_000)  # 390,000
    _snapshot(3, 999_999, 0)  # inside the week: ignored for 1W
    changes = {c["period"]: c for c in api.get("/v1/net-worth").json()["changes"]}
    assert changes["1W"]["change_cents"] == 431_578 - 390_000
    assert changes["1W"]["since"] == (TODAY - dt.timedelta(days=8)).isoformat()
    assert changes["1M"]["change_cents"] == 431_578 - 350_000
    assert changes["3M"]["change_cents"] is None
    assert changes["All"]["change_cents"] == 431_578 - 350_000


def test_spending_week_by_day_and_category(api: TestClient) -> None:
    connect(api)
    s = api.get("/v1/spending", params={"period": "week"}).json()
    assert s["start"] == week_start(TODAY).isoformat()
    assert len(s["days"]) == 7
    today = next(d for d in s["days"] if d["date"] == TODAY.isoformat())
    assert today["cents"] == 1_645 + 4_218
    assert all(d["cents"] is None for d in s["days"] if d["date"] > TODAY.isoformat())
    assert s["spent_cents"] == 1_645 + 4_218  # rent, the card payment and old purchases excluded
    assert [(c["category"], c["cents"]) for c in s["categories"]] == [
        ("GENERAL_MERCHANDISE", 4_218),
        ("FOOD_AND_DRINK", 1_645),
    ]
    assert s["categories"][0]["top_account_name"] == "Gold Card"
    assert s["categories"][0]["top_account_share"] == 1.0


def test_spending_matches_the_home_summary(api: TestClient) -> None:
    connect(api)
    week = api.get("/v1/spending").json()
    assert week["spent_cents"] == api.get("/v1/summary").json()["week_spent_cents"]


def test_spending_month_covers_every_day_of_the_month(api: TestClient) -> None:
    connect(api)
    s = api.get("/v1/spending", params={"period": "month"}).json()
    assert s["start"] == TODAY.replace(day=1).isoformat()
    next_month = (TODAY.replace(day=28) + dt.timedelta(days=4)).replace(day=1)
    assert len(s["days"]) == (next_month - TODAY.replace(day=1)).days
    assert api.get("/v1/spending", params={"period": "year"}).status_code == 422
