"""PlaidProvider request building (no network: the Plaid client is replaced)."""

from typing import Any

import pytest

from app.core.config import Settings
from app.modules.accounts.plaid_provider import PlaidProvider, display_name


class FakePlaidApi:
    def __init__(self) -> None:
        self.requests: list[Any] = []

    def link_token_create(self, request: Any) -> dict[str, str]:
        self.requests.append(request)
        return {"link_token": "link-sandbox-123"}


def provider(**overrides: Any) -> tuple[PlaidProvider, FakePlaidApi]:
    settings = Settings(plaid_client_id="id", plaid_secret="secret", **overrides)
    p = PlaidProvider(settings)
    fake = FakePlaidApi()
    p._client = fake
    return p, fake


def test_link_shows_porter_by_default() -> None:
    p, fake = provider()
    assert p.create_link_token("user-1") == "link-sandbox-123"
    assert fake.requests[0]["client_name"] == "Porter"


@pytest.mark.parametrize("name", ["PORTER", "Porter (dev)"])
def test_link_name_comes_from_settings(name: str) -> None:
    p, fake = provider(plaid_client_name=name)
    p.create_link_token("user-1")
    assert fake.requests[0]["client_name"] == name


@pytest.mark.parametrize(
    ("raw", "shown"),
    [
        ("CHASE COLLEGE", "Chase College"),
        ("BofA CHECKING", "BofA Checking"),
        ("BROKERAGE", "Brokerage"),
        ("High Yield Savings Account", "High Yield Savings Account"),
        ("USAA CLASSIC CHECKING", "USAA Classic Checking"),
        ("ROTH IRA", "Roth IRA"),
        ("401K PLAN", "401K Plan"),
        ("Gold Card", "Gold Card"),
    ],
)
def test_display_name_tames_all_caps(raw: str, shown: str) -> None:
    assert display_name(raw) == shown
