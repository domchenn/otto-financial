import datetime as dt
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.db import get_session
from app.modules.accounts import service
from app.modules.accounts.models import Account, Connection, Transaction
from app.modules.accounts.plaid_provider import PlaidNotConfiguredError, PlaidProvider
from app.modules.accounts.provider import FinancialDataProvider, ProviderItemError
from app.modules.identity.auth import Principal, current_principal
from app.modules.identity.models import User
from app.modules.identity.service import get_or_create_user

router = APIRouter(prefix="/v1", tags=["accounts"])


def get_provider(settings: Annotated[Settings, Depends(get_settings)]) -> FinancialDataProvider:
    try:
        return PlaidProvider(settings)
    except PlaidNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Plaid is not configured") from exc


def current_user(
    principal: Annotated[Principal, Depends(current_principal)],
    session: Annotated[Session, Depends(get_session)],
) -> User:
    return get_or_create_user(session, principal.clerk_user_id)


UserDep = Annotated[User, Depends(current_user)]
SessionDep = Annotated[Session, Depends(get_session)]
ProviderDep = Annotated[FinancialDataProvider, Depends(get_provider)]


# --- schemas --------------------------------------------------------------------------------


class AccountOut(BaseModel):
    id: uuid.UUID
    connection_id: uuid.UUID
    institution_name: str | None
    name: str
    official_name: str | None
    mask: str | None
    kind: str
    subtype: str | None
    current_cents: int | None
    available_cents: int | None
    limit_cents: int | None
    statement_balance_cents: int | None
    minimum_due_cents: int | None
    next_due_date: dt.date | None
    last_payment_cents: int | None
    last_payment_date: dt.date | None
    balances_updated_at: dt.datetime | None


class ConnectionOut(BaseModel):
    id: uuid.UUID
    institution_name: str | None
    status: str
    error_code: str | None
    last_synced_at: dt.datetime | None
    accounts: list[AccountOut]


class TransactionOut(BaseModel):
    id: uuid.UUID
    account_id: uuid.UUID
    account_name: str
    account_mask: str | None
    institution_name: str | None
    amount_cents: int
    date: dt.date
    authorized_at: dt.datetime | None
    name: str
    merchant_name: str | None
    category: str | None
    pending: bool


class NetWorthOut(BaseModel):
    assets_cents: int
    liabilities_cents: int
    net_cents: int
    week_change_cents: int | None


class PaymentOut(BaseModel):
    account_id: uuid.UUID
    name: str
    mask: str | None
    amount_cents: int
    minimum_due_cents: int | None
    due_date: dt.date
    covered: bool | None


class AttentionOut(BaseModel):
    connection_id: uuid.UUID
    institution_name: str | None
    status: str
    last_synced_at: dt.datetime | None


class SummaryOut(BaseModel):
    net_worth: NetWorthOut
    card_balance_cents: int
    card_limit_cents: int
    card_count: int
    utilization_pct: int | None
    upcoming_payments: list[PaymentOut]
    week_spent_cents: int
    week_start: dt.date
    attention: list[AttentionOut]
    has_connections: bool


class LinkTokenIn(BaseModel):
    connection_id: uuid.UUID | None = None


class LinkTokenOut(BaseModel):
    link_token: str


class ExchangeIn(BaseModel):
    public_token: str
    institution_id: str | None = None
    institution_name: str | None = None


def _account_out(a: Account, institutions: dict[uuid.UUID, str | None]) -> AccountOut:
    return AccountOut(
        id=a.id,
        connection_id=a.connection_id,
        institution_name=institutions.get(a.connection_id),
        name=a.name,
        official_name=a.official_name,
        mask=a.mask,
        kind=a.kind,
        subtype=a.subtype,
        current_cents=a.current_cents,
        available_cents=a.available_cents,
        limit_cents=a.limit_cents,
        statement_balance_cents=a.statement_balance_cents,
        minimum_due_cents=a.minimum_due_cents,
        next_due_date=a.next_due_date,
        last_payment_cents=a.last_payment_cents,
        last_payment_date=a.last_payment_date,
        balances_updated_at=a.balances_updated_at,
    )


def _connection_out(c: Connection, accounts: list[Account]) -> ConnectionOut:
    names = {c.id: c.institution_name}
    return ConnectionOut(
        id=c.id,
        institution_name=c.institution_name,
        status=c.status,
        error_code=c.error_code,
        last_synced_at=c.last_synced_at,
        accounts=[_account_out(a, names) for a in accounts if a.connection_id == c.id],
    )


def _connections(session: Session, user: User) -> list[ConnectionOut]:
    connections = session.scalars(
        select(Connection).where(Connection.user_id == user.id).order_by(Connection.created_at)
    ).all()
    accounts = service.user_accounts(session, user)
    return [_connection_out(c, accounts) for c in connections]


def _provider_error(exc: ProviderItemError) -> HTTPException:
    return HTTPException(status.HTTP_502_BAD_GATEWAY, f"Bank provider error: {exc.code}")


# --- routes ---------------------------------------------------------------------------------


@router.post("/link-token")
def create_link_token(
    body: LinkTokenIn, user: UserDep, session: SessionDep, provider: ProviderDep
) -> LinkTokenOut:
    try:
        token = service.link_token(session, provider, user, body.connection_id)
    except LookupError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Connection not found") from exc
    except ProviderItemError as exc:
        raise _provider_error(exc) from exc
    return LinkTokenOut(link_token=token)


@router.post("/connections", status_code=status.HTTP_201_CREATED)
def create_connection(
    body: ExchangeIn, user: UserDep, session: SessionDep, provider: ProviderDep
) -> ConnectionOut:
    try:
        connection = service.connect(
            session, provider, user, body.public_token, body.institution_id, body.institution_name
        )
    except ProviderItemError as exc:
        raise _provider_error(exc) from exc
    return _connection_out(connection, service.user_accounts(session, user))


@router.get("/connections")
def list_connections(user: UserDep, session: SessionDep) -> list[ConnectionOut]:
    return _connections(session, user)


@router.delete("/connections/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_connection(
    connection_id: uuid.UUID, user: UserDep, session: SessionDep, provider: ProviderDep
) -> Response:
    try:
        service.remove_connection(session, provider, user, connection_id)
    except LookupError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Connection not found") from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/sync")
def sync(user: UserDep, session: SessionDep, provider: ProviderDep) -> list[ConnectionOut]:
    service.sync_user(session, provider, user)
    return _connections(session, user)


@router.get("/accounts")
def list_accounts(user: UserDep, session: SessionDep) -> list[AccountOut]:
    names = {c.id: c.institution_name for c in _connection_rows(session, user)}
    return [_account_out(a, names) for a in service.user_accounts(session, user)]


@router.get("/accounts/{account_id}")
def get_account(account_id: uuid.UUID, user: UserDep, session: SessionDep) -> AccountOut:
    account = session.get(Account, account_id)
    if account is None or account.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Account not found")
    names = {c.id: c.institution_name for c in _connection_rows(session, user)}
    return _account_out(account, names)


def _connection_rows(session: Session, user: User) -> list[Connection]:
    return list(session.scalars(select(Connection).where(Connection.user_id == user.id)).all())


@router.get("/transactions")
def list_transactions(
    user: UserDep,
    session: SessionDep,
    account_id: uuid.UUID | None = None,
    category: str | None = None,
    q: Annotated[str | None, Query(max_length=100)] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[TransactionOut]:
    names = {c.id: c.institution_name for c in _connection_rows(session, user)}
    rows = service.list_transactions(
        session, user, account_id=account_id, category=category, query=q, limit=limit, offset=offset
    )
    return [_transaction_out(t, a, names) for t, a in rows]


@router.get("/transactions/{transaction_id}")
def get_transaction(
    transaction_id: uuid.UUID, user: UserDep, session: SessionDep
) -> TransactionOut:
    t = session.get(Transaction, transaction_id)
    if t is None or t.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Transaction not found")
    account = session.get(Account, t.account_id)
    assert account is not None
    names = {c.id: c.institution_name for c in _connection_rows(session, user)}
    return _transaction_out(t, account, names)


def _transaction_out(
    t: Transaction, a: Account, institutions: dict[uuid.UUID, str | None]
) -> TransactionOut:
    return TransactionOut(
        id=t.id,
        account_id=a.id,
        account_name=a.name,
        account_mask=a.mask,
        institution_name=institutions.get(a.connection_id),
        amount_cents=t.amount_cents,
        date=t.date,
        authorized_at=t.authorized_at,
        name=t.name,
        merchant_name=t.merchant_name,
        category=t.category,
        pending=t.pending,
    )


@router.get("/summary")
def get_summary(user: UserDep, session: SessionDep) -> SummaryOut:
    s = service.summary(session, user)
    return SummaryOut(
        net_worth=NetWorthOut(
            assets_cents=s.net_worth.assets_cents,
            liabilities_cents=s.net_worth.liabilities_cents,
            net_cents=s.net_worth.net_cents,
            week_change_cents=s.net_worth.week_change_cents,
        ),
        card_balance_cents=s.card_balance_cents,
        card_limit_cents=s.card_limit_cents,
        card_count=s.card_count,
        utilization_pct=s.utilization_pct,
        upcoming_payments=[
            PaymentOut(
                account_id=p.account.id,
                name=p.account.name,
                mask=p.account.mask,
                amount_cents=p.amount_cents,
                minimum_due_cents=p.account.minimum_due_cents,
                due_date=p.due_date,
                covered=p.covered,
            )
            for p in s.upcoming_payments
        ],
        week_spent_cents=s.week_spent_cents,
        week_start=s.week_start,
        attention=[
            AttentionOut(
                connection_id=c.id,
                institution_name=c.institution_name,
                status=c.status,
                last_synced_at=c.last_synced_at,
            )
            for c in s.attention
        ],
        has_connections=bool(_connection_rows(session, user)),
    )
