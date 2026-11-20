"""The FinancialDataProvider adapter: the only way bank data enters Otto.

Domain code depends on this protocol and these plain records, never on an aggregator SDK, so
Plaid can be swapped for sandbox fixtures, a second aggregator, or FinanceKit uploads.

Amounts are integer cents. Transaction amounts follow the aggregator convention: positive is
money leaving the account (a purchase), negative is money coming in (a refund or payment).
"""

from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import ROUND_HALF_UP, Decimal
from typing import Literal, Protocol

AccountKind = Literal["depository", "credit", "loan", "investment", "other"]


class ProviderItemError(Exception):
    """The provider rejected a call for one connection (e.g. the login expired)."""

    def __init__(self, code: str, message: str = "") -> None:
        super().__init__(f"{code}: {message}" if message else code)
        self.code = code

    @property
    def needs_reauth(self) -> bool:
        return self.code in {"ITEM_LOGIN_REQUIRED", "PENDING_EXPIRATION", "PENDING_DISCONNECT"}


@dataclass(frozen=True)
class ExchangedItem:
    item_id: str
    access_token: str


@dataclass(frozen=True)
class ProviderAccount:
    account_id: str
    name: str
    official_name: str | None
    mask: str | None
    kind: AccountKind
    subtype: str | None
    current_cents: int | None
    available_cents: int | None
    limit_cents: int | None
    currency: str = "USD"


@dataclass(frozen=True)
class ProviderCreditLiability:
    account_id: str
    statement_balance_cents: int | None
    minimum_due_cents: int | None
    next_due_date: date | None
    last_payment_cents: int | None
    last_payment_date: date | None


@dataclass(frozen=True)
class ProviderTransaction:
    transaction_id: str
    account_id: str
    amount_cents: int
    date: date
    authorized_at: datetime | None
    name: str
    merchant_name: str | None
    category: str | None
    pending: bool
    pending_transaction_id: str | None


@dataclass(frozen=True)
class TransactionsPage:
    added: list[ProviderTransaction] = field(default_factory=list)
    modified: list[ProviderTransaction] = field(default_factory=list)
    removed: list[str] = field(default_factory=list)
    next_cursor: str = ""
    has_more: bool = False


class FinancialDataProvider(Protocol):
    def create_link_token(self, user_id: str, access_token: str | None = None) -> str:
        """A short-lived token for the Link UI; with access_token it opens update mode."""
        ...

    def exchange_public_token(self, public_token: str) -> ExchangedItem: ...

    def get_accounts(self, access_token: str) -> list[ProviderAccount]: ...

    def get_credit_liabilities(self, access_token: str) -> list[ProviderCreditLiability]:
        """Card statement details; an empty list when the institution doesn't support it."""
        ...

    def sync_transactions(self, access_token: str, cursor: str | None) -> TransactionsPage: ...

    def remove_item(self, access_token: str) -> None: ...


def to_cents(amount: float | None) -> int | None:
    """Convert a provider's decimal dollars to integer cents without float drift."""
    if amount is None:
        return None
    # str() first: Decimal(1.005) is 1.00499..., Decimal("1.005") is exact.
    return int((Decimal(str(amount)) * 100).quantize(Decimal(1), rounding=ROUND_HALF_UP))
