"""Plaid implementation of FinancialDataProvider (Transactions + Liabilities)."""

import json
import logging
from datetime import date, datetime
from typing import Any, cast

import plaid
from plaid.api import plaid_api
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.country_code import CountryCode
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.item_remove_request import ItemRemoveRequest
from plaid.model.liabilities_get_request import LiabilitiesGetRequest
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.link_token_transactions import LinkTokenTransactions
from plaid.model.products import Products
from plaid.model.transactions_sync_request import TransactionsSyncRequest
from plaid.model.transactions_sync_request_options import TransactionsSyncRequestOptions

from app.core.config import Settings
from app.modules.accounts.provider import (
    AccountKind,
    ExchangedItem,
    ProviderAccount,
    ProviderCreditLiability,
    ProviderItemError,
    ProviderTransaction,
    TransactionsPage,
    to_cents,
)

log = logging.getLogger(__name__)

_KINDS: set[str] = {"depository", "credit", "loan", "investment"}
# Errors that mean "this institution can't do liabilities", not "the connection is broken".
_UNSUPPORTED = {"PRODUCTS_NOT_SUPPORTED", "PRODUCT_NOT_ENABLED", "NO_LIABILITY_ACCOUNTS"}


class PlaidNotConfiguredError(RuntimeError):
    pass


def _str(value: Any) -> str | None:
    return None if value is None else str(value)


def _error_code(exc: plaid.ApiException) -> tuple[str, str]:
    try:
        body = json.loads(exc.body or "{}")
    except ValueError:
        body = {}
    return str(body.get("error_code", "UNKNOWN")), str(body.get("error_message", ""))


class PlaidProvider:
    def __init__(self, settings: Settings) -> None:
        if not settings.plaid_client_id or not settings.plaid_secret:
            raise PlaidNotConfiguredError("OTTO_PLAID_CLIENT_ID / OTTO_PLAID_SECRET are not set")
        host = (
            plaid.Environment.Production
            if settings.plaid_env == "production"
            else plaid.Environment.Sandbox
        )
        configuration = plaid.Configuration(
            host=host,
            api_key={"clientId": settings.plaid_client_id, "secret": settings.plaid_secret},
        )
        self._client = plaid_api.PlaidApi(plaid.ApiClient(configuration))

    def _call(self, fn: Any, request: Any) -> Any:
        try:
            return fn(request)
        except plaid.ApiException as exc:
            code, message = _error_code(exc)
            log.warning("plaid error", extra={"fields": {"code": code}})
            raise ProviderItemError(code, message) from exc

    def create_link_token(self, user_id: str, access_token: str | None = None) -> str:
        args: dict[str, Any] = {
            "client_name": "Otto",
            "language": "en",
            "country_codes": [CountryCode("US")],
            "user": LinkTokenCreateRequestUser(client_user_id=user_id),
        }
        if access_token:
            args["access_token"] = access_token  # update mode: re-auth an existing item
        else:
            args["products"] = [Products("transactions")]
            args["optional_products"] = [Products("liabilities")]
            args["transactions"] = LinkTokenTransactions(days_requested=730)
        response = self._call(self._client.link_token_create, LinkTokenCreateRequest(**args))
        return str(response["link_token"])

    def exchange_public_token(self, public_token: str) -> ExchangedItem:
        response = self._call(
            self._client.item_public_token_exchange,
            ItemPublicTokenExchangeRequest(public_token=public_token),
        )
        return ExchangedItem(item_id=response["item_id"], access_token=response["access_token"])

    def get_accounts(self, access_token: str) -> list[ProviderAccount]:
        response = self._call(
            self._client.accounts_get, AccountsGetRequest(access_token=access_token)
        )
        accounts = []
        for a in response["accounts"]:
            balances = a["balances"]
            kind = str(a["type"])
            accounts.append(
                ProviderAccount(
                    account_id=a["account_id"],
                    name=a["name"],
                    official_name=_str(a.get("official_name")),
                    mask=_str(a.get("mask")),
                    kind=cast(AccountKind, kind if kind in _KINDS else "other"),
                    subtype=_str(a.get("subtype")),
                    current_cents=to_cents(balances.get("current")),
                    available_cents=to_cents(balances.get("available")),
                    limit_cents=to_cents(balances.get("limit")),
                    currency=balances.get("iso_currency_code") or "USD",
                )
            )
        return accounts

    def get_credit_liabilities(self, access_token: str) -> list[ProviderCreditLiability]:
        try:
            response = self._call(
                self._client.liabilities_get, LiabilitiesGetRequest(access_token=access_token)
            )
        except ProviderItemError as exc:
            if exc.code in _UNSUPPORTED:
                return []
            raise
        credit = response["liabilities"].get("credit") or []
        return [
            ProviderCreditLiability(
                account_id=c["account_id"],
                statement_balance_cents=to_cents(c.get("last_statement_balance")),
                minimum_due_cents=to_cents(c.get("minimum_payment_amount")),
                next_due_date=cast(date | None, c.get("next_payment_due_date")),
                last_payment_cents=to_cents(c.get("last_payment_amount")),
                last_payment_date=cast(date | None, c.get("last_payment_date")),
            )
            for c in credit
            if c.get("account_id")
        ]

    def sync_transactions(self, access_token: str, cursor: str | None) -> TransactionsPage:
        args: dict[str, Any] = {
            "access_token": access_token,
            "count": 500,
            "options": TransactionsSyncRequestOptions(include_personal_finance_category=True),
        }
        if cursor:
            args["cursor"] = cursor
        response = self._call(self._client.transactions_sync, TransactionsSyncRequest(**args))
        return TransactionsPage(
            added=[_transaction(t) for t in response["added"]],
            modified=[_transaction(t) for t in response["modified"]],
            removed=[r["transaction_id"] for r in response["removed"]],
            next_cursor=str(response["next_cursor"]),
            has_more=bool(response["has_more"]),
        )

    def remove_item(self, access_token: str) -> None:
        self._call(self._client.item_remove, ItemRemoveRequest(access_token=access_token))


def _transaction(t: Any) -> ProviderTransaction:
    category = t.get("personal_finance_category")
    authorized = t.get("authorized_datetime") or t.get("datetime")
    return ProviderTransaction(
        transaction_id=t["transaction_id"],
        account_id=t["account_id"],
        amount_cents=to_cents(t["amount"]) or 0,
        date=cast(date, t.get("authorized_date") or t["date"]),
        authorized_at=cast(datetime | None, authorized),
        name=t["name"],
        merchant_name=_str(t.get("merchant_name")),
        category=_str(category["primary"]) if category else None,
        pending=bool(t["pending"]),
        pending_transaction_id=_str(t.get("pending_transaction_id")),
        category_detailed=_str(category["detailed"]) if category else None,
    )
