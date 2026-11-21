import datetime as dt
import uuid
from collections.abc import Callable
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.db import get_sessionmaker
from app.modules.accounts.models import Account, Connection, Transaction
from app.modules.benefits import service
from app.modules.identity.models import User
from tests.conftest import TEST_USER

TODAY = dt.date(2026, 11, 24)  # a Tuesday; the November dining credit has 7 days left


@pytest.fixture
def auth(client: TestClient, make_token: Callable[..., str]) -> dict[str, str]:
    headers = {"Authorization": f"Bearer {make_token()}"}
    client.get("/v1/benefits", headers=headers)  # creates the user
    return headers


@pytest.fixture(autouse=True)
def _fixed_today(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(service, "local_today", lambda user: TODAY)


def _user_id() -> uuid.UUID:
    with get_sessionmaker()() as s:
        user = s.scalar(select(User).where(User.clerk_user_id == TEST_USER))
        assert user is not None
        return user.id


def _add_card(name: str, official_name: str | None = None) -> uuid.UUID:
    user_id = _user_id()
    with get_sessionmaker()() as s, s.begin():
        conn = s.scalar(select(Connection).where(Connection.user_id == user_id))
        if conn is None:
            conn = Connection(
                user_id=user_id,
                provider_item_id=f"item-{uuid.uuid4()}",
                access_token_encrypted="x",
                institution_name="American Express",
            )
            s.add(conn)
            s.flush()
        account = Account(
            user_id=user_id,
            connection_id=conn.id,
            provider_account_id=f"acc-{uuid.uuid4()}",
            name=name,
            official_name=official_name,
            mask="1007",
            kind="credit",
        )
        s.add(account)
        s.flush()
        return account.id


def _add_txn(account_id: uuid.UUID, amount_cents: int, name: str, date: dt.date) -> None:
    with get_sessionmaker()() as s, s.begin():
        s.add(
            Transaction(
                user_id=_user_id(),
                account_id=account_id,
                provider_transaction_id=f"t-{uuid.uuid4()}",
                amount_cents=amount_cents,
                date=date,
                name=name,
            )
        )


def _credit(body: dict[str, Any], credit_id: str) -> dict[str, Any]:
    credits: list[dict[str, Any]] = [
        c for card in body["cards"] for c in card["credits"] if c["credit_id"] == credit_id
    ]
    assert len(credits) == 1
    return credits[0]


def test_unknown_card_is_listed_without_credits(client: TestClient, auth: dict[str, str]) -> None:
    _add_card("Plaid Credit Card", "Plaid Diamond 12.5% APR Interest Credit Card")
    body = client.get("/v1/benefits", headers=auth).json()
    assert [(c["card_id"], c["source"], c["credits"]) for c in body["cards"]] == [
        (None, "guess", [])
    ]
    assert body["remaining_cents"] == 0


def test_guessed_card_gets_current_periods(client: TestClient, auth: dict[str, str]) -> None:
    _add_card("Gold Card", "American Express Gold Card")
    body = client.get("/v1/benefits", headers=auth).json()
    card = body["cards"][0]
    assert (card["card_id"], card["source"]) == ("amex-gold", "guess")
    # Tracked statement credits only: dining, Resy, Dunkin' (Uber Cash isn't tracked yet).
    assert {c["credit_id"] for c in card["credits"]} == {"dining", "resy", "dunkin"}

    dining = _credit(body, "dining")
    assert dining["start_date"] == "2026-11-01"
    assert dining["resets_on"] == "2026-12-01"
    assert dining["days_left"] == 7
    assert dining["remaining_cents"] == 1000


def test_purchase_then_issuer_credit_uses_the_credit(
    client: TestClient, auth: dict[str, str]
) -> None:
    gold = _add_card("Gold Card")
    _add_txn(gold, 2_350, "GRUBHUB*ORDER", dt.date(2026, 11, 10))
    dining = _credit(client.get("/v1/benefits", headers=auth).json(), "dining")
    assert (dining["used_cents"], dining["confirmed"]) == (1000, False)

    _add_txn(gold, -1_000, "AMEX Dining Credit", dt.date(2026, 11, 12))
    dining = _credit(client.get("/v1/benefits", headers=auth).json(), "dining")
    assert (dining["used_cents"], dining["confirmed"], dining["remaining_cents"]) == (
        1000,
        True,
        0,
    )


def test_needs_attention_ranks_by_value_and_urgency(
    client: TestClient, auth: dict[str, str]
) -> None:
    _add_card("Gold Card")
    body = client.get("/v1/benefits", headers=auth).json()
    # Dining ($10) and Dunkin' ($7) expire Nov 30; Resy runs to Dec 31, outside 10 days.
    assert [c["credit_id"] for c in body["needs_attention"]] == ["dining", "dunkin"]
    assert body["expiring_this_month_cents"] == 1700
    assert body["expiring_this_month_count"] == 2


def test_mark_used_and_undo(client: TestClient, auth: dict[str, str]) -> None:
    _add_card("Gold Card")
    period_id = _credit(client.get("/v1/benefits", headers=auth).json(), "dunkin")["period_id"]

    body = client.post(
        f"/v1/benefit-periods/{period_id}/used", json={"used": True}, headers=auth
    ).json()
    dunkin = _credit(body, "dunkin")
    assert (dunkin["marked_used"], dunkin["remaining_cents"]) == (True, 0)
    assert [c["credit_id"] for c in body["needs_attention"]] == ["dining"]

    body = client.post(
        f"/v1/benefit-periods/{period_id}/used", json={"used": False}, headers=auth
    ).json()
    assert _credit(body, "dunkin")["remaining_cents"] == 700


def test_assigning_a_card_replaces_its_periods(client: TestClient, auth: dict[str, str]) -> None:
    account = _add_card("Plaid Credit Card")
    body = client.put(
        f"/v1/accounts/{account}/card", json={"card_id": "amex-platinum"}, headers=auth
    ).json()
    card = body["cards"][0]
    assert (card["card_id"], card["source"]) == ("amex-platinum", "user")
    assert "digital-entertainment" in {c["credit_id"] for c in card["credits"]}

    body = client.put(f"/v1/accounts/{account}/card", json={"card_id": None}, headers=auth).json()
    assert (body["cards"][0]["card_id"], body["cards"][0]["source"]) == (None, "user")
    # A user's "not in the catalog" isn't overwritten by a new guess.
    assert client.get("/v1/benefits", headers=auth).json()["cards"][0]["card_id"] is None


def test_anniversary_month_places_cardmember_year_credits(
    client: TestClient, auth: dict[str, str]
) -> None:
    account = _add_card("Credit Card")
    body = client.put(
        f"/v1/accounts/{account}/card", json={"card_id": "chase-sapphire-reserve"}, headers=auth
    ).json()
    card = body["cards"][0]
    assert card["needs_anniversary_month"]
    assert "travel" not in {c["credit_id"] for c in card["credits"]}

    body = client.put(
        f"/v1/accounts/{account}/card",
        json={"card_id": "chase-sapphire-reserve", "anniversary_month": 3},
        headers=auth,
    ).json()
    assert not body["cards"][0]["needs_anniversary_month"]
    travel = _credit(body, "travel")
    assert (travel["start_date"], travel["end_date"]) == ("2026-03-01", "2027-02-28")


def test_rejects_unknown_card_and_other_users_accounts(
    client: TestClient, auth: dict[str, str], make_token: Callable[..., str]
) -> None:
    account = _add_card("Gold Card")
    bad = client.put(f"/v1/accounts/{account}/card", json={"card_id": "nope"}, headers=auth)
    assert bad.status_code == 422

    missing = client.put(
        f"/v1/accounts/{uuid.uuid4()}/card", json={"card_id": "amex-gold"}, headers=auth
    )
    assert missing.status_code == 404
    gone = client.post(
        f"/v1/benefit-periods/{uuid.uuid4()}/used", json={"used": True}, headers=auth
    )
    assert gone.status_code == 404


def test_card_products_lists_the_catalog(client: TestClient, auth: dict[str, str]) -> None:
    products = client.get("/v1/card-products", headers=auth).json()
    ids = {p["id"] for p in products}
    assert {"amex-gold", "chase-sapphire-reserve", "bilt-palladium"} <= ids


def test_history_shows_this_years_used_and_missed_credits(
    client: TestClient, auth: dict[str, str]
) -> None:
    gold = _add_card("Gold Card")
    _add_txn(gold, -1_000, "AMEX Dining Credit", dt.date(2026, 3, 13))
    _add_txn(gold, -700, "Dunkin' Donuts", dt.date(2026, 2, 26))  # posts under the merchant

    body = client.get("/v1/benefits", headers=auth).json()
    by_period = {(c["credit_id"], c["start_date"]): c for c in body["history"]}

    march = by_period[("dining", "2026-03-01")]
    assert (march["used_value_cents"], march["missed_cents"], march["confirmed"]) == (
        1000,
        0,
        True,
    )
    assert by_period[("dining", "2026-02-01")]["missed_cents"] == 1000
    assert by_period[("dunkin", "2026-02-01")]["used_value_cents"] == 700
    # The current month and the open half-year Resy credit aren't missed yet.
    assert by_period[("dining", "2026-11-01")]["missed_cents"] == 0
    assert by_period[("resy", "2026-07-01")]["missed_cents"] == 0

    assert body["used_this_year_cents"] == 1_700
    # Dining and Dunkin' Jan-Oct, less the two used months, plus the first-half Resy credit.
    assert body["missed_this_year_cents"] == 9 * 1_000 + 9 * 700 + 5_000
    # Newest first, and the card's own list still holds only the open periods.
    assert body["history"][0]["end_date"] >= body["history"][-1]["end_date"]
    assert {c["start_date"] for c in body["cards"][0]["credits"]} == {"2026-11-01", "2026-07-01"}


def test_marking_a_past_credit_used_moves_it_from_missed_to_used(
    client: TestClient, auth: dict[str, str]
) -> None:
    _add_card("Gold Card")
    body = client.get("/v1/benefits", headers=auth).json()
    january = next(
        c for c in body["history"] if (c["credit_id"], c["start_date"]) == ("dining", "2026-01-01")
    )
    before = body["missed_this_year_cents"]

    body = client.post(
        f"/v1/benefit-periods/{january['period_id']}/used", json={"used": True}, headers=auth
    ).json()
    assert body["missed_this_year_cents"] == before - 1_000
    assert body["used_this_year_cents"] == 1_000
