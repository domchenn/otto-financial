import datetime as dt
import uuid

from app.modules.benefits.catalog import CreditDefinition
from app.modules.benefits.matching import Txn, usage
from app.modules.benefits.periods import Window

NOV = Window(dt.date(2026, 11, 1), dt.date(2026, 11, 30))

DINING = CreditDefinition(
    id="dining",
    name="Dining credit",
    amount_cents=1000,
    cadence="monthly",
    delivery="statement_credit",
    enrollment=True,
    merchants=("grubhub", "five guys"),
    credit_patterns=("dining credit",),
)
LULULEMON = CreditDefinition(
    id="lululemon",
    name="lululemon credit",
    amount_cents=7500,
    cadence="quarterly",
    delivery="statement_credit",
    enrollment=True,
    merchants=("lululemon",),
    credit_patterns=("lululemon",),
)
RESTAURANTS = CreditDefinition(
    id="dining",
    name="Dining credit",
    amount_cents=2500,
    cadence="monthly",
    delivery="statement_credit",
    enrollment=False,
    categories=("FOOD_AND_DRINK",),
)


def txn(
    amount_cents: int,
    name: str,
    day: int = 10,
    merchant: str | None = None,
    category: str | None = None,
) -> Txn:
    return Txn(uuid.uuid4(), amount_cents, dt.date(2026, 11, day), name, merchant, category)


def test_nothing_matched_means_unused() -> None:
    result = usage(DINING, NOV, 1000, [txn(4_500, "WHOLE FOODS")])
    assert result.used_cents == 0
    assert not result.confirmed
    assert result.matches == ()


def test_qualifying_purchase_counts_before_the_credit_posts() -> None:
    result = usage(DINING, NOV, 1000, [txn(2_350, "GRUBHUB*ORDER", merchant="Grubhub")])
    assert result.used_cents == 1000  # capped at the credit's amount
    assert not result.confirmed
    assert [m.kind for m in result.matches] == ["purchase"]


def test_small_purchase_uses_part_of_the_credit() -> None:
    result = usage(DINING, NOV, 1000, [txn(650, "FIVE GUYS 1234")])
    assert result.used_cents == 650


def test_issuer_credit_is_the_truth_once_posted() -> None:
    result = usage(
        DINING,
        NOV,
        1000,
        [
            txn(2_350, "GRUBHUB*ORDER"),
            txn(-1_000, "AMEX Dining Credit", day=12),
        ],
    )
    assert result.used_cents == 1000
    assert result.confirmed
    assert {m.kind for m in result.matches} == {"purchase", "issuer_credit"}


def test_partial_issuer_credit_wins_over_larger_purchase() -> None:
    result = usage(
        LULULEMON,
        NOV,
        7500,
        [txn(12_000, "LULULEMON"), txn(-5_000, "lululemon Credit", day=14)],
    )
    assert result.used_cents == 5000
    assert result.confirmed


def test_merchant_refund_is_not_a_credit() -> None:
    result = usage(LULULEMON, NOV, 7500, [txn(-9_800, "LULULEMON RETURN")])
    assert result.used_cents == 0
    assert not result.confirmed


def test_transactions_outside_the_window_are_ignored() -> None:
    october = Txn(uuid.uuid4(), 2_000, dt.date(2026, 10, 31), "GRUBHUB", None, None)
    assert usage(DINING, NOV, 1000, [october]).used_cents == 0


def test_category_match() -> None:
    result = usage(RESTAURANTS, NOV, 2500, [txn(1_800, "Joe's Diner", category="FOOD_AND_DRINK")])
    assert result.used_cents == 1800


DUNKIN = CreditDefinition(
    id="dunkin",
    name="Dunkin' credit",
    amount_cents=700,
    cadence="monthly",
    delivery="statement_credit",
    enrollment=True,
    merchants=("dunkin",),
    credit_patterns=("dunkin",),
    posts_as_merchant=True,
)
WALMART_PLUS = CreditDefinition(
    id="walmart-plus",
    name="Walmart+ credit",
    amount_cents=1295,
    cadence="monthly",
    delivery="statement_credit",
    enrollment=False,
    merchants=("walmart+",),
    credit_patterns=("walmart",),
    posts_as_merchant=True,
)


def test_credit_posted_under_the_merchant_name_counts() -> None:
    # Real Amex Gold line: the Dunkin' credit shows as "Dunkin' Donuts -$7.00".
    result = usage(DUNKIN, NOV, 700, [txn(-700, "Dunkin' Donuts", merchant="Dunkin'")])
    assert (result.used_cents, result.confirmed) == (700, True)


def test_merchant_posted_credit_allows_tax() -> None:
    # "up to $12.95 plus applicable taxes": a real line was Walmart -$13.76.
    result = usage(WALMART_PLUS, NOV, 1295, [txn(-1376, "Walmart")])
    assert (result.used_cents, result.confirmed) == (1295, True)


def test_large_merchant_refund_is_still_not_a_credit() -> None:
    result = usage(WALMART_PLUS, NOV, 1295, [txn(-8_999, "Walmart")])
    assert result.used_cents == 0


def test_named_credit_lines_from_real_statements() -> None:
    assert usage(DINING, NOV, 1000, [txn(-1000, "AMEX Dining Credit")]).confirmed
    assert usage(LULULEMON, NOV, 7500, [txn(-7500, "Platinum Lululemon Credit")]).confirmed
    # A plain lululemon return on the same card stays a refund.
    assert not usage(LULULEMON, NOV, 7500, [txn(-2000, "LULULEMON CHESTNUT H")]).confirmed
