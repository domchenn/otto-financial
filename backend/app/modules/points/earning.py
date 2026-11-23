"""Points earned by one purchase, from the card's earn rates in the catalog (PRD F3).

Pure functions, no database, so the estimate's math is easy to test.
"""

import datetime as dt
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

from app.modules.benefits.catalog import CardPoints, EarnRate

# Money movements that never earn points: card payments, transfers, income, fees and interest.
NO_EARN = frozenset({"INCOME", "TRANSFER_IN", "TRANSFER_OUT", "LOAN_PAYMENTS", "BANK_FEES"})


@dataclass(frozen=True)
class Purchase:
    amount_cents: int  # positive = a purchase, negative = a refund or credit
    date: dt.date
    name: str
    merchant_name: str | None
    category: str | None
    category_detailed: str | None


def _matches(rate: EarnRate, p: Purchase) -> bool:
    if rate.ends is not None and p.date > rate.ends:
        return False
    if any(c in (p.category, p.category_detailed) for c in rate.categories):
        return True
    text = f"{p.merchant_name or ''} {p.name}".lower()
    return any(m in text for m in rate.merchants)


def multiplier_for(earn: CardPoints, p: Purchase) -> float:
    """The highest bonus rate the purchase matches, or the card's base rate."""
    return max((r.multiplier for r in earn.rates if _matches(r, p)), default=earn.base)


def points_for(earn: CardPoints, p: Purchase) -> int:
    """Points for one transaction, rounded to the nearest point like the issuers do.

    Refunds take their points back. Statement credits ("Digital Entertainment Credit") and
    money movements earn nothing.
    """
    if p.category in NO_EARN:
        return 0
    if p.amount_cents < 0 and "credit" in p.name.lower():
        return 0
    dollars = Decimal(p.amount_cents) / 100
    points = dollars * Decimal(str(multiplier_for(earn, p)))
    return int(points.quantize(Decimal(1), rounding=ROUND_HALF_UP))
