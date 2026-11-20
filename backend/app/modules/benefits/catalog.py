"""The benefits catalog: what each card offers, read from catalog.toml.

The file is the source of truth (reviewed through commits, see ADR 0002). It is validated
when loaded, so a typo in an amount or cadence fails tests and startup rather than producing
wrong periods.
"""

import datetime as dt
import re
import tomllib
from functools import cache
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

CATALOG_PATH = Path(__file__).with_name("catalog.toml")

Cadence = Literal["monthly", "quarterly", "semiannual", "calendar_year", "cardmember_year"]
Delivery = Literal["statement_credit", "uber_cash", "travelbank", "bilt_cash", "in_app", "portal"]

_ID = r"^[a-z0-9]+(-[a-z0-9]+)*$"


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class CreditDefinition(_Strict):
    id: str = Field(pattern=_ID)
    name: str = Field(min_length=1)
    amount_cents: int = Field(gt=0)
    december_amount_cents: int | None = Field(default=None, gt=0)
    cadence: Cadence
    delivery: Delivery
    enrollment: bool
    channel: str | None = None
    merchants: tuple[str, ...] = ()
    categories: tuple[str, ...] = ()
    credit_patterns: tuple[str, ...] = ()
    ends: dt.date | None = None

    @model_validator(mode="after")
    def _check(self) -> "CreditDefinition":
        if self.december_amount_cents is not None and self.cadence != "monthly":
            raise ValueError(f"{self.id}: december_amount_cents only applies to monthly credits")
        for text in (*self.merchants, *self.credit_patterns):
            if text != text.lower() or not text.strip():
                raise ValueError(f"{self.id}: match text must be non-empty lowercase: {text!r}")
        if self.tracked and not (self.merchants or self.categories or self.credit_patterns):
            raise ValueError(f"{self.id}: a tracked credit needs something to match on")
        return self

    @property
    def tracked(self) -> bool:
        """Statement credits are tracked now; other deliveries come later (see TODO.md)."""
        return self.delivery == "statement_credit"

    def amount_for_month(self, month: int) -> int:
        if month == 12 and self.december_amount_cents is not None:
            return self.december_amount_cents
        return self.amount_cents


class CardProduct(_Strict):
    id: str = Field(pattern=_ID)
    issuer: str
    name: str
    annual_fee_cents: int | None = Field(default=None, ge=0)
    aliases: tuple[str, ...] = Field(min_length=1)
    verified: Literal["issuer", "secondary"]
    last_verified: dt.date
    sources: tuple[str, ...] = Field(min_length=1)
    credits: tuple[CreditDefinition, ...] = ()

    @model_validator(mode="after")
    def _check(self) -> "CardProduct":
        ids = [c.id for c in self.credits]
        if len(ids) != len(set(ids)):
            raise ValueError(f"{self.id}: duplicate credit ids")
        if any(a != a.lower() for a in self.aliases):
            raise ValueError(f"{self.id}: aliases must be lowercase")
        return self

    @property
    def needs_anniversary(self) -> bool:
        return any(c.tracked and c.cadence == "cardmember_year" for c in self.credits)

    def credit(self, credit_id: str) -> CreditDefinition | None:
        return next((c for c in self.credits if c.id == credit_id), None)


class Catalog(_Strict):
    cards: tuple[CardProduct, ...]

    @model_validator(mode="after")
    def _check(self) -> "Catalog":
        ids = [c.id for c in self.cards]
        if len(ids) != len(set(ids)):
            raise ValueError("duplicate card ids")
        return self

    def card(self, card_id: str) -> CardProduct | None:
        return next((c for c in self.cards if c.id == card_id), None)

    def guess(self, *texts: str | None) -> CardProduct | None:
        """Best catalog match for an account, from its name, official name and institution.

        Picks the card whose alias matches the most characters, so "business platinum" beats
        "platinum card" and "venture x" beats "venture". Returns None when nothing matches
        (Plaid's sandbox "Plaid Credit Card", for example).
        """
        haystack = " ".join(_normalize(t) for t in texts if t)
        best: tuple[int, CardProduct] | None = None
        for card in self.cards:
            for alias in card.aliases:
                if re.search(rf"\b{re.escape(alias)}\b", haystack) and (
                    best is None or len(alias) > best[0]
                ):
                    best = (len(alias), card)
        return best[1] if best else None


def _normalize(text: str) -> str:
    return re.sub(r"[®™]", "", text).lower()


def load_catalog(path: Path = CATALOG_PATH) -> Catalog:
    with path.open("rb") as f:
        return Catalog.model_validate(tomllib.load(f))


@cache
def get_catalog() -> Catalog:
    return load_catalog()
