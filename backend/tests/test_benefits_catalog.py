import datetime as dt
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.modules.benefits.catalog import get_catalog, load_catalog


def test_catalog_loads_and_validates() -> None:
    catalog = get_catalog()
    assert len(catalog.cards) >= 25
    assert all(card.sources for card in catalog.cards)


def test_known_amounts_are_in_cents() -> None:
    gold = get_catalog().card("amex-gold")
    assert gold is not None
    dining = gold.credit("dining")
    assert dining is not None
    assert dining.amount_cents == 1000
    assert dining.cadence == "monthly"
    assert dining.tracked


def test_december_override_applies_only_in_december() -> None:
    quest = get_catalog().card("chase-united-quest")
    assert quest is not None
    rideshare = quest.credit("rideshare")
    assert rideshare is not None
    assert rideshare.amount_for_month(11) == 800
    assert rideshare.amount_for_month(12) == 1200


def test_non_statement_credits_are_listed_but_not_tracked() -> None:
    platinum = get_catalog().card("amex-platinum")
    assert platinum is not None
    uber_cash = platinum.credit("uber-cash")
    assert uber_cash is not None
    assert not uber_cash.tracked


def test_needs_anniversary_only_for_tracked_cardmember_year_credits() -> None:
    catalog = get_catalog()
    reserve = catalog.card("chase-sapphire-reserve")
    venture_x = catalog.card("capital-one-venture-x")  # its anniversary credit is portal-only
    assert reserve is not None and reserve.needs_anniversary
    assert venture_x is not None and not venture_x.needs_anniversary


def test_last_verified_is_not_in_the_future() -> None:
    today = dt.date.today()
    assert all(card.last_verified <= today for card in get_catalog().cards)


@pytest.mark.parametrize(
    ("texts", "expected"),
    [
        (("Platinum Card®", "American Express"), "amex-platinum"),
        (("Business Platinum Card", "American Express"), "amex-business-platinum"),
        (("CHASE SAPPHIRE RESERVE", None), "chase-sapphire-reserve"),
        (("Capital One Venture X Rewards", "Capital One"), "capital-one-venture-x"),
        (("Venture Rewards", "Capital One"), "capital-one-venture"),
        (("Delta SkyMiles® Reserve Card", "American Express"), "amex-delta-reserve"),
    ],
)
def test_guess_picks_the_most_specific_alias(texts: tuple[str | None, ...], expected: str) -> None:
    card = get_catalog().guess(*texts)
    assert card is not None
    assert card.id == expected


def test_guess_returns_none_for_unknown_cards() -> None:
    assert get_catalog().guess("Plaid Credit Card", "Plaid Diamond 12.5% APR") is None


def test_rejects_unknown_cadence(tmp_path: Path) -> None:
    bad = tmp_path / "catalog.toml"
    bad.write_text(
        """
[[cards]]
id = "x"
issuer = "X"
name = "X"
aliases = ["x"]
verified = "issuer"
last_verified = 2026-01-01
sources = ["https://example.com"]
  [[cards.credits]]
  id = "c"
  name = "C"
  amount_cents = 100
  cadence = "weekly"
  delivery = "statement_credit"
  enrollment = false
  merchants = ["c"]
"""
    )
    with pytest.raises(ValidationError):
        load_catalog(bad)


def test_rejects_tracked_credit_with_nothing_to_match(tmp_path: Path) -> None:
    bad = tmp_path / "catalog.toml"
    bad.write_text(
        """
[[cards]]
id = "x"
issuer = "X"
name = "X"
aliases = ["x"]
verified = "issuer"
last_verified = 2026-01-01
sources = ["https://example.com"]
  [[cards.credits]]
  id = "c"
  name = "C"
  amount_cents = 100
  cadence = "monthly"
  delivery = "statement_credit"
  enrollment = false
"""
    )
    with pytest.raises(ValidationError):
        load_catalog(bad)
