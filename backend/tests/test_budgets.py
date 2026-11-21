import datetime as dt
import uuid
from collections.abc import Callable
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.db import get_sessionmaker
from app.modules.accounts import service as accounts_service
from app.modules.accounts.models import Account, Connection, Transaction
from app.modules.budgets import service as budgets_service
from app.modules.budgets.service import month_window, week_window
from app.modules.identity.models import User
from tests.conftest import TEST_USER

TODAY = dt.date(2026, 11, 24)  # Tuesday: week Nov 23-29, month Nov 1-30


@pytest.fixture(autouse=True)
def _fixed_today(monkeypatch: pytest.MonkeyPatch) -> None:
    for module in (accounts_service, budgets_service):
        monkeypatch.setattr(module, "local_today", lambda user, now=None: TODAY)


@pytest.fixture
def auth(client: TestClient, make_token: Callable[..., str]) -> dict[str, str]:
    headers = {"Authorization": f"Bearer {make_token()}"}
    client.get("/v1/budget", headers=headers)  # creates the user
    return headers


def _card() -> uuid.UUID:
    with get_sessionmaker()() as s, s.begin():
        user = s.scalar(select(User).where(User.clerk_user_id == TEST_USER))
        assert user is not None
        conn = Connection(
            user_id=user.id, provider_item_id=f"item-{uuid.uuid4()}", access_token_encrypted="x"
        )
        s.add(conn)
        s.flush()
        account = Account(
            user_id=user.id,
            connection_id=conn.id,
            provider_account_id=f"acc-{uuid.uuid4()}",
            name="Gold Card",
            kind="credit",
        )
        s.add(account)
        s.flush()
        return account.id


def _spend(account_id: uuid.UUID, cents: int, day: dt.date, category: str) -> None:
    with get_sessionmaker()() as s, s.begin():
        account = s.get(Account, account_id)
        assert account is not None
        s.add(
            Transaction(
                user_id=account.user_id,
                account_id=account_id,
                provider_transaction_id=f"t-{uuid.uuid4()}",
                amount_cents=cents,
                date=day,
                name="Purchase",
                category=category,
            )
        )


def _save(client: TestClient, auth: dict[str, str], **body: object) -> dict[str, Any]:
    response = client.put("/v1/budget", json=body, headers=auth)
    assert response.status_code == 200, response.text
    data: dict[str, Any] = response.json()
    return data


def test_windows() -> None:
    assert week_window(TODAY) == (dt.date(2026, 11, 23), dt.date(2026, 11, 29))
    assert month_window(TODAY) == (dt.date(2026, 11, 1), dt.date(2026, 11, 30))
    assert month_window(dt.date(2028, 2, 10)) == (dt.date(2028, 2, 1), dt.date(2028, 2, 29))


def test_not_configured_until_saved(client: TestClient, auth: dict[str, str]) -> None:
    body = client.get("/v1/budget", headers=auth).json()
    assert body["configured"] is False
    assert body["style"] is None
    assert body["week"]["limit_cents"] is None
    assert body["week"]["remaining_cents"] is None
    assert "FOOD_AND_DRINK" in body["excludable_categories"]
    assert "RENT_AND_UTILITIES" not in body["excludable_categories"]  # always excluded


def test_weekly_budget_counts_this_weeks_spend(client: TestClient, auth: dict[str, str]) -> None:
    card = _card()
    _spend(card, 4_500, dt.date(2026, 11, 23), "FOOD_AND_DRINK")
    _spend(card, 2_000, dt.date(2026, 11, 20), "FOOD_AND_DRINK")  # last week, this month
    _spend(card, 150_000, dt.date(2026, 11, 23), "RENT_AND_UTILITIES")  # never counts

    body = _save(client, auth, style="weekly", weekly_cents=50_000, monthly_cents=200_000)
    assert body["configured"] is True
    assert body["week"] == {
        "start": "2026-11-23",
        "end": "2026-11-29",
        "limit_cents": 50_000,
        "spent_cents": 4_500,
        "remaining_cents": 45_500,
    }
    assert body["month"]["spent_cents"] == 6_500
    assert body["month"]["remaining_cents"] == 193_500


def test_remaining_goes_negative_when_over(client: TestClient, auth: dict[str, str]) -> None:
    card = _card()
    _spend(card, 62_000, TODAY, "GENERAL_MERCHANDISE")
    body = _save(client, auth, style="weekly", weekly_cents=50_000)
    assert body["week"]["remaining_cents"] == -12_000


def test_excluded_category_stops_counting_everywhere(
    client: TestClient, auth: dict[str, str]
) -> None:
    card = _card()
    _spend(card, 30_000, TODAY, "TRAVEL")
    _spend(card, 1_200, TODAY, "FOOD_AND_DRINK")

    body = _save(client, auth, style="weekly", weekly_cents=50_000)
    assert body["week"]["spent_cents"] == 31_200

    body = _save(client, auth, style="weekly", weekly_cents=50_000, excluded_categories=["TRAVEL"])
    assert body["excluded_categories"] == ["TRAVEL"]
    assert body["week"]["spent_cents"] == 1_200
    # Home and Spending use the same filters, so they agree with the budget.
    spending = client.get("/v1/spending?period=week", headers=auth).json()
    assert spending["spent_cents"] == 1_200
    assert client.get("/v1/summary", headers=auth).json()["week_spent_cents"] == 1_200


def test_none_style_keeps_limits_optional(client: TestClient, auth: dict[str, str]) -> None:
    body = _save(client, auth, style="none")
    assert (body["configured"], body["style"]) == (True, "none")
    assert body["week"]["limit_cents"] is None


@pytest.mark.parametrize(
    "body",
    [
        {"style": "weekly"},  # no weekly limit
        {"style": "monthly", "weekly_cents": 50_000},  # no monthly limit
        {"style": "weekly", "weekly_cents": 0},
        {"style": "weekly", "weekly_cents": 50_000, "excluded_categories": ["RENT_AND_UTILITIES"]},
        {"style": "daily", "weekly_cents": 50_000},
    ],
)
def test_rejects_invalid_budgets(
    client: TestClient, auth: dict[str, str], body: dict[str, object]
) -> None:
    assert client.put("/v1/budget", json=body, headers=auth).status_code == 422
