import datetime as dt
import uuid
from collections.abc import Callable
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select, update

from app.core.db import get_sessionmaker
from app.modules.accounts.models import Account, Connection, Transaction
from app.modules.identity.models import User
from app.modules.points.models import PointsBalance
from tests.conftest import TEST_USER

# Confirmed on Nov 10 (New York); purchases from that day on count toward the estimate.
CONFIRMED_AT = dt.datetime(2026, 11, 10, 17, 0, tzinfo=dt.UTC)


@pytest.fixture
def auth(client: TestClient, make_token: Callable[..., str]) -> dict[str, str]:
    headers = {"Authorization": f"Bearer {make_token()}"}
    client.get("/v1/points", headers=headers)  # creates the user
    return headers


def _user_id() -> uuid.UUID:
    with get_sessionmaker()() as s:
        user = s.scalar(select(User).where(User.clerk_user_id == TEST_USER))
        assert user is not None
        return user.id


def _add_card(name: str) -> uuid.UUID:
    user_id = _user_id()
    with get_sessionmaker()() as s, s.begin():
        conn = Connection(
            user_id=user_id, provider_item_id=f"item-{uuid.uuid4()}", access_token_encrypted="x"
        )
        s.add(conn)
        s.flush()
        account = Account(
            user_id=user_id,
            connection_id=conn.id,
            provider_account_id=f"acc-{uuid.uuid4()}",
            name=name,
            mask="1007",
            kind="credit",
        )
        s.add(account)
        s.flush()
        return account.id


def _spend(
    account_id: uuid.UUID,
    cents: int,
    day: dt.date,
    detailed: str | None = None,
    pending: bool = False,
) -> None:
    with get_sessionmaker()() as s, s.begin():
        s.add(
            Transaction(
                user_id=_user_id(),
                account_id=account_id,
                provider_transaction_id=f"t-{uuid.uuid4()}",
                amount_cents=cents,
                date=day,
                name="Purchase",
                category=detailed.split("_AND_")[0] if detailed else "GENERAL_MERCHANDISE",
                category_detailed=detailed,
                pending=pending,
            )
        )


def _confirm(client: TestClient, auth: dict[str, str], program: str, points: int) -> None:
    response = client.put(f"/v1/points/{program}", json={"points": points}, headers=auth)
    assert response.status_code == 200, response.text
    with get_sessionmaker()() as s, s.begin():
        s.execute(update(PointsBalance).values(confirmed_at=CONFIRMED_AT))


def _get(client: TestClient, auth: dict[str, str]) -> dict[str, Any]:
    response = client.get("/v1/points", headers=auth)
    assert response.status_code == 200, response.text
    data: dict[str, Any] = response.json()
    return data


def _program(body: dict[str, Any], program_id: str) -> dict[str, Any]:
    return next(p for p in body["programs"] if p["id"] == program_id)


def test_no_cards_no_programs(client: TestClient, auth: dict[str, str]) -> None:
    assert _get(client, auth) == {"total_points": 0, "confirmed_count": 0, "programs": []}


def test_pooled_cards_list_one_program_waiting_for_a_balance(
    client: TestClient, auth: dict[str, str]
) -> None:
    _add_card("Sapphire Preferred")
    _add_card("Freedom Unlimited")
    _add_card("Gold Card")
    body = _get(client, auth)
    ur = _program(body, "chase-ur")
    assert ur["short_name"] == "UR"
    assert {c["card_name"] for c in ur["cards"]} == {"Sapphire Preferred", "Freedom Unlimited"}
    assert ur["confirmed_points"] is None and ur["estimated_points"] is None
    assert {p["id"] for p in body["programs"]} == {"chase-ur", "amex-mr"}
    assert body["total_points"] == 0


def test_estimate_adds_points_earned_since_confirming(
    client: TestClient, auth: dict[str, str]
) -> None:
    gold = _add_card("Gold Card")
    plat = _add_card("Platinum Card")
    _spend(gold, 5000, dt.date(2026, 11, 9), "FOOD_AND_DRINK_RESTAURANT")  # before: ignored
    _spend(gold, 5000, dt.date(2026, 11, 10), "FOOD_AND_DRINK_RESTAURANT")  # 200
    _spend(gold, 2000, dt.date(2026, 11, 12))  # 20
    _spend(gold, 9000, dt.date(2026, 11, 13), pending=True)  # pending: ignored
    _spend(plat, 40000, dt.date(2026, 11, 14), "TRAVEL_FLIGHTS")  # 2000
    _confirm(client, auth, "amex-mr", 120_000)

    mr = _program(_get(client, auth), "amex-mr")
    assert mr["confirmed_points"] == 120_000
    assert mr["earned_since"] == 2220
    assert mr["estimated_points"] == 122_220


def test_total_sums_confirmed_programs_biggest_first(
    client: TestClient, auth: dict[str, str]
) -> None:
    _add_card("Gold Card")
    _add_card("Sapphire Preferred")
    _confirm(client, auth, "chase-ur", 40_000)
    _confirm(client, auth, "amex-mr", 90_000)
    body = _get(client, auth)
    assert body["total_points"] == 130_000
    assert body["confirmed_count"] == 2
    assert [p["id"] for p in body["programs"]] == ["amex-mr", "chase-ur"]


def test_confirming_again_replaces_the_balance(client: TestClient, auth: dict[str, str]) -> None:
    _add_card("Gold Card")
    _confirm(client, auth, "amex-mr", 1000)
    _confirm(client, auth, "amex-mr", 2500)
    assert _program(_get(client, auth), "amex-mr")["confirmed_points"] == 2500


def test_rejects_unknown_programs_and_bad_numbers(client: TestClient, auth: dict[str, str]) -> None:
    assert client.put("/v1/points/nope", json={"points": 1}, headers=auth).status_code == 404
    bad = client.put("/v1/points/amex-mr", json={"points": -5}, headers=auth)
    assert bad.status_code == 422
