"""Detect credit usage from a card's transactions (PRD F4: rules now, ML later).

Two signals, both limited to the card the credit belongs to and to the period's dates:

- issuer credit: money back on the card whose description names the credit ("Platinum
  Digital Entertainment Credit"). This is the issuer confirming the credit was used.
- qualifying purchase: a purchase at a listed merchant or in a listed category. It means the
  credit should post soon, so it counts as used before the issuer confirms it.

Every match is returned with its kind, so it can be stored and later used as training data.
"""

import datetime as dt
import uuid
from dataclasses import dataclass
from typing import Literal

from app.modules.benefits.catalog import CreditDefinition
from app.modules.benefits.periods import Window

MatchKind = Literal["issuer_credit", "purchase"]


@dataclass(frozen=True)
class Txn:
    id: uuid.UUID
    amount_cents: int  # positive = purchase, negative = money back (Plaid's sign)
    date: dt.date
    name: str
    merchant_name: str | None
    category: str | None


@dataclass(frozen=True)
class Match:
    transaction_id: uuid.UUID
    kind: MatchKind
    amount_cents: int  # always positive


@dataclass(frozen=True)
class Usage:
    used_cents: int
    confirmed: bool  # an issuer credit was seen
    matches: tuple[Match, ...]


def _text(t: Txn) -> str:
    return f"{t.merchant_name or ''} {t.name}".lower()


def is_issuer_credit(credit: CreditDefinition, t: Txn) -> bool:
    if t.amount_cents >= 0:
        return False
    text = _text(t)
    # A plain refund from a listed merchant (a returned lululemon order) is not the credit.
    return "credit" in text and any(p in text for p in credit.credit_patterns)


def is_qualifying_purchase(credit: CreditDefinition, t: Txn) -> bool:
    if t.amount_cents <= 0:
        return False
    text = _text(t)
    return any(m in text for m in credit.merchants) or (
        t.category is not None and t.category in credit.categories
    )


def usage(credit: CreditDefinition, window: Window, amount_cents: int, txns: list[Txn]) -> Usage:
    """How much of this period's credit has been used.

    Issuer credits are the truth once any have posted. Before that, qualifying purchases
    count, capped at the credit's amount.
    """
    in_window = [t for t in txns if window.start <= t.date <= window.end]
    matches: list[Match] = []
    for t in in_window:
        if is_issuer_credit(credit, t):
            matches.append(Match(t.id, "issuer_credit", -t.amount_cents))
        elif is_qualifying_purchase(credit, t):
            matches.append(Match(t.id, "purchase", t.amount_cents))

    credited = sum(m.amount_cents for m in matches if m.kind == "issuer_credit")
    purchased = sum(m.amount_cents for m in matches if m.kind == "purchase")
    confirmed = credited > 0
    used = credited if confirmed else purchased
    return Usage(used_cents=min(used, amount_cents), confirmed=confirmed, matches=tuple(matches))
