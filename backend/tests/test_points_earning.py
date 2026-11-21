import datetime as dt

import pytest

from app.modules.benefits.catalog import CardPoints, get_catalog
from app.modules.points.earning import Purchase, multiplier_for, points_for

D = dt.date(2026, 11, 20)


def earn(card_id: str) -> CardPoints:
    card = get_catalog().card(card_id)
    assert card is not None and card.points is not None
    return card.points


def buy(
    cents: int,
    name: str = "Purchase",
    merchant: str | None = None,
    category: str | None = "GENERAL_MERCHANDISE",
    detailed: str | None = None,
    day: dt.date = D,
) -> Purchase:
    return Purchase(cents, day, name, merchant, category, detailed)


@pytest.mark.parametrize(
    ("card", "purchase", "expected"),
    [
        (
            "amex-gold",
            buy(5000, category="FOOD_AND_DRINK", detailed="FOOD_AND_DRINK_RESTAURANT"),
            4,
        ),
        ("amex-gold", buy(5000, category="FOOD_AND_DRINK", detailed="FOOD_AND_DRINK_GROCERIES"), 4),
        ("amex-gold", buy(5000, category="TRAVEL", detailed="TRAVEL_FLIGHTS"), 3),
        ("amex-gold", buy(5000), 1),
        ("amex-platinum", buy(5000, category="TRAVEL", detailed="TRAVEL_FLIGHTS"), 5),
        ("chase-sapphire-preferred", buy(5000, name="CHASE TRAVEL 123"), 5),
        ("chase-sapphire-preferred", buy(1599, merchant="Netflix"), 3),
        ("chase-sapphire-preferred", buy(5000, category="TRAVEL", detailed="TRAVEL_LODGING"), 2),
        (
            "chase-sapphire-preferred",
            buy(5000, category="TRANSPORTATION", detailed="TRANSPORTATION_GAS"),
            3,
        ),
        ("chase-freedom-unlimited", buy(5000), 1.5),
        (
            "chase-freedom-unlimited",
            buy(5000, category="MEDICAL", detailed="MEDICAL_PHARMACIES_AND_SUPPLEMENTS"),
            3,
        ),
        ("chase-freedom-flex", buy(5000), 1),
    ],
)
def test_multiplier(card: str, purchase: Purchase, expected: float) -> None:
    assert multiplier_for(earn(card), purchase) == expected


def test_highest_matching_rate_wins() -> None:
    # Lyft is "other travel" (2x) and has its own 5x rate on the Sapphire Preferred.
    lyft = buy(
        2000,
        merchant="Lyft",
        category="TRANSPORTATION",
        detailed="TRANSPORTATION_TAXIS_AND_RIDE_SHARES",
    )
    assert multiplier_for(earn("chase-sapphire-preferred"), lyft) == 5


def test_rate_stops_after_its_end_date() -> None:
    lyft = buy(2000, merchant="Lyft", day=dt.date(2027, 10, 1))
    assert multiplier_for(earn("chase-sapphire-preferred"), lyft) == 1


def test_primary_only_category_falls_back_to_base() -> None:
    # Older rows only have the primary category; FOOD_AND_DRINK alone isn't "restaurants".
    assert multiplier_for(earn("amex-gold"), buy(5000, category="FOOD_AND_DRINK")) == 1


def test_points_round_to_the_nearest_point() -> None:
    cfu = earn("chase-freedom-unlimited")
    assert points_for(cfu, buy(1001)) == 15  # $10.01 x 1.5 = 15.015
    assert points_for(cfu, buy(1033)) == 15  # 15.495
    assert points_for(cfu, buy(1034)) == 16  # 15.51


def test_refund_takes_points_back() -> None:
    refund = buy(-2500, category="FOOD_AND_DRINK", detailed="FOOD_AND_DRINK_RESTAURANT")
    assert points_for(earn("amex-gold"), refund) == -100


@pytest.mark.parametrize(
    "purchase",
    [
        buy(-50000, name="AUTOPAY PAYMENT", category="LOAN_PAYMENTS"),
        buy(-2500, name="Platinum Digital Entertainment Credit", category="GENERAL_MERCHANDISE"),
        buy(69500, name="ANNUAL MEMBERSHIP FEE", category="BANK_FEES"),
        buy(10000, name="Transfer", category="TRANSFER_OUT"),
    ],
)
def test_payments_credits_and_fees_earn_nothing(purchase: Purchase) -> None:
    assert points_for(earn("amex-platinum"), purchase) == 0
