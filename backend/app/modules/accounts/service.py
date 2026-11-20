"""Connections, sync, and the read models the app shows (net worth, cards, payments)."""

import datetime as dt
import logging
import uuid
from dataclasses import dataclass
from zoneinfo import ZoneInfo

from sqlalchemy import delete, func, or_, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.core.crypto import decrypt, encrypt
from app.modules.accounts.models import Account, Connection, NetWorthSnapshot, Transaction
from app.modules.accounts.provider import (
    FinancialDataProvider,
    ProviderItemError,
    ProviderTransaction,
)
from app.modules.identity.models import User

log = logging.getLogger(__name__)

ASSET_KINDS = ("depository", "investment")
LIABILITY_KINDS = ("credit", "loan")
# Plaid personal-finance categories that never count as discretionary spend (PRD F5).
NON_DISCRETIONARY = frozenset(
    {"INCOME", "TRANSFER_IN", "TRANSFER_OUT", "LOAN_PAYMENTS", "RENT_AND_UTILITIES"}
)
_MAX_SYNC_PAGES = 50


def local_today(user: User, now: dt.datetime | None = None) -> dt.date:
    now = now or dt.datetime.now(dt.UTC)
    return now.astimezone(ZoneInfo(user.timezone)).date()


# --- connecting -----------------------------------------------------------------------------


def connect(
    session: Session,
    provider: FinancialDataProvider,
    user: User,
    public_token: str,
    institution_id: str | None,
    institution_name: str | None,
) -> Connection:
    exchanged = provider.exchange_public_token(public_token)
    existing = session.scalars(
        select(Connection).where(Connection.provider_item_id == exchanged.item_id)
    ).one_or_none()
    connection = existing or Connection(user_id=user.id, provider_item_id=exchanged.item_id)
    connection.access_token_encrypted = encrypt(exchanged.access_token)
    connection.institution_id = institution_id
    connection.institution_name = institution_name
    connection.status = "ok"
    connection.error_code = None
    session.add(connection)
    session.flush()
    sync_connection(session, provider, connection)
    return connection


def link_token(
    session: Session,
    provider: FinancialDataProvider,
    user: User,
    connection_id: uuid.UUID | None = None,
) -> str:
    access_token = None
    if connection_id is not None:
        connection = get_connection(session, user, connection_id)
        access_token = decrypt(connection.access_token_encrypted)
    return provider.create_link_token(str(user.id), access_token)


def get_connection(session: Session, user: User, connection_id: uuid.UUID) -> Connection:
    connection = session.scalars(
        select(Connection).where(Connection.id == connection_id, Connection.user_id == user.id)
    ).one_or_none()
    if connection is None:
        raise LookupError("connection not found")
    return connection


def remove_connection(
    session: Session, provider: FinancialDataProvider, user: User, connection_id: uuid.UUID
) -> None:
    connection = get_connection(session, user, connection_id)
    try:
        provider.remove_item(decrypt(connection.access_token_encrypted))
    except ProviderItemError as exc:
        # The item may already be gone at the provider; deleting our copy is what matters.
        log.warning("remove_item failed", extra={"fields": {"code": exc.code}})
    session.delete(connection)
    session.flush()
    write_snapshot(session, user)


# --- syncing --------------------------------------------------------------------------------


def sync_user(session: Session, provider: FinancialDataProvider, user: User) -> list[Connection]:
    connections = list(
        session.scalars(select(Connection).where(Connection.user_id == user.id)).all()
    )
    for connection in connections:
        sync_connection(session, provider, connection)
    return connections


def sync_connection(
    session: Session, provider: FinancialDataProvider, connection: Connection
) -> None:
    """Refresh balances, card statements, and transactions for one connection.

    A provider error marks the connection (e.g. needs_reauth) instead of failing the request,
    so one broken bank never blocks the others.
    """
    access_token = decrypt(connection.access_token_encrypted)
    now = dt.datetime.now(dt.UTC)
    try:
        accounts = _sync_accounts(session, provider, connection, access_token, now)
        _sync_transactions(session, provider, connection, access_token, accounts)
    except ProviderItemError as exc:
        connection.status = "needs_reauth" if exc.needs_reauth else "error"
        connection.error_code = exc.code
        session.flush()
        return
    connection.status = "ok"
    connection.error_code = None
    connection.last_synced_at = now
    session.flush()
    user = session.get(User, connection.user_id)
    if user is not None:
        write_snapshot(session, user)


def _sync_accounts(
    session: Session,
    provider: FinancialDataProvider,
    connection: Connection,
    access_token: str,
    now: dt.datetime,
) -> dict[str, uuid.UUID]:
    remote = provider.get_accounts(access_token)
    liabilities = (
        {li.account_id: li for li in provider.get_credit_liabilities(access_token)}
        if any(a.kind == "credit" for a in remote)
        else {}
    )
    for a in remote:
        li = liabilities.get(a.account_id)
        values = {
            "user_id": connection.user_id,
            "connection_id": connection.id,
            "provider_account_id": a.account_id,
            "name": a.name,
            "official_name": a.official_name,
            "mask": a.mask,
            "kind": a.kind,
            "subtype": a.subtype,
            "currency": a.currency,
            "current_cents": a.current_cents,
            "available_cents": a.available_cents,
            "limit_cents": a.limit_cents,
            "balances_updated_at": now,
        }
        if li is not None:
            values |= {
                "statement_balance_cents": li.statement_balance_cents,
                "minimum_due_cents": li.minimum_due_cents,
                "next_due_date": li.next_due_date,
                "last_payment_cents": li.last_payment_cents,
                "last_payment_date": li.last_payment_date,
            }
        stmt = insert(Account).values(id=uuid.uuid4(), **values)
        stmt = stmt.on_conflict_do_update(
            index_elements=[Account.provider_account_id],
            set_={k: stmt.excluded[k] for k in values} | {"updated_at": func.now()},
        )
        session.execute(stmt)
    rows = session.execute(
        select(Account.provider_account_id, Account.id).where(
            Account.connection_id == connection.id
        )
    ).all()
    return {provider_id: account_id for provider_id, account_id in rows}


def _sync_transactions(
    session: Session,
    provider: FinancialDataProvider,
    connection: Connection,
    access_token: str,
    accounts: dict[str, uuid.UUID],
) -> None:
    start_cursor = connection.transactions_cursor
    cursor = start_cursor
    restarts = 0
    for _ in range(_MAX_SYNC_PAGES):
        try:
            page = provider.sync_transactions(access_token, cursor)
        except ProviderItemError as exc:
            # Plaid asks callers to restart the whole pagination loop when data changes mid-way.
            if exc.code == "TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION" and restarts < 3:
                restarts += 1
                cursor = start_cursor
                continue
            raise
        for t in [*page.added, *page.modified]:
            account_id = accounts.get(t.account_id)
            if account_id is not None:
                _upsert_transaction(session, connection.user_id, account_id, t)
        if page.removed:
            session.execute(
                delete(Transaction).where(
                    Transaction.user_id == connection.user_id,
                    Transaction.provider_transaction_id.in_(page.removed),
                )
            )
        cursor = page.next_cursor
        if not page.has_more:
            break
    connection.transactions_cursor = cursor


def _upsert_transaction(
    session: Session, user_id: uuid.UUID, account_id: uuid.UUID, t: ProviderTransaction
) -> None:
    values = {
        "user_id": user_id,
        "account_id": account_id,
        "provider_transaction_id": t.transaction_id,
        "amount_cents": t.amount_cents,
        "date": t.date,
        "authorized_at": t.authorized_at,
        "name": t.name,
        "merchant_name": t.merchant_name,
        "category": t.category,
        "pending": t.pending,
    }
    stmt = insert(Transaction).values(id=uuid.uuid4(), **values)
    stmt = stmt.on_conflict_do_update(
        index_elements=[Transaction.provider_transaction_id],
        set_={k: stmt.excluded[k] for k in values} | {"updated_at": func.now()},
    )
    session.execute(stmt)


# --- read models ----------------------------------------------------------------------------


@dataclass(frozen=True)
class NetWorth:
    assets_cents: int
    liabilities_cents: int
    week_change_cents: int | None

    @property
    def net_cents(self) -> int:
        return self.assets_cents - self.liabilities_cents


@dataclass(frozen=True)
class UpcomingPayment:
    account: Account
    amount_cents: int
    due_date: dt.date
    covered: bool | None


@dataclass(frozen=True)
class Summary:
    net_worth: NetWorth
    card_balance_cents: int
    card_limit_cents: int
    card_count: int
    upcoming_payments: list[UpcomingPayment]
    week_spent_cents: int
    week_start: dt.date
    attention: list[Connection]

    @property
    def utilization_pct(self) -> int | None:
        if self.card_limit_cents <= 0:
            return None
        return round(self.card_balance_cents * 100 / self.card_limit_cents)


def user_accounts(session: Session, user: User) -> list[Account]:
    return list(
        session.scalars(
            select(Account).where(Account.user_id == user.id).order_by(Account.name)
        ).all()
    )


def _totals(accounts: list[Account]) -> tuple[int, int]:
    assets = sum(a.current_cents or 0 for a in accounts if a.kind in ASSET_KINDS)
    liabilities = sum(a.current_cents or 0 for a in accounts if a.kind in LIABILITY_KINDS)
    return assets, liabilities


def write_snapshot(session: Session, user: User) -> None:
    assets, liabilities = _totals(user_accounts(session, user))
    values = {
        "user_id": user.id,
        "date": local_today(user),
        "assets_cents": assets,
        "liabilities_cents": liabilities,
    }
    stmt = insert(NetWorthSnapshot).values(id=uuid.uuid4(), **values)
    session.execute(
        stmt.on_conflict_do_update(
            constraint="uq_net_worth_snapshots_user_id",
            set_={
                "assets_cents": stmt.excluded.assets_cents,
                "liabilities_cents": stmt.excluded.liabilities_cents,
                "updated_at": func.now(),
            },
        )
    )


def upcoming_payments(accounts: list[Account], today: dt.date) -> list[UpcomingPayment]:
    """Cards with a due date today or later, soonest first.

    `covered` says whether checking can pay this statement after paying every earlier one;
    None when there is no linked checking account to judge by.
    """
    checking = [a for a in accounts if a.kind == "depository" and a.subtype == "checking"]
    cash = sum((a.available_cents or a.current_cents or 0) for a in checking)
    due = sorted(
        (
            a
            for a in accounts
            if a.kind == "credit" and a.next_due_date is not None and a.next_due_date >= today
        ),
        key=lambda a: (a.next_due_date, a.name),
    )
    payments = []
    running = 0
    for a in due:
        amount = a.statement_balance_cents if a.statement_balance_cents is not None else 0
        running += max(amount, 0)
        assert a.next_due_date is not None
        payments.append(
            UpcomingPayment(
                account=a,
                amount_cents=amount,
                due_date=a.next_due_date,
                covered=(running <= cash) if checking else None,
            )
        )
    return payments


def week_start(today: dt.date) -> dt.date:
    return today - dt.timedelta(days=today.weekday())  # Monday


def discretionary_spend(session: Session, user: User, start: dt.date, end: dt.date) -> int:
    """Purchases (pending and posted) from start to end inclusive, excluding PRD F5 exclusions."""
    total = session.scalar(
        select(func.coalesce(func.sum(Transaction.amount_cents), 0))
        .join(Account, Account.id == Transaction.account_id)
        .where(
            Transaction.user_id == user.id,
            Transaction.date >= start,
            Transaction.date <= end,
            Account.kind.in_(("credit", "depository")),
            or_(Transaction.category.is_(None), Transaction.category.not_in(NON_DISCRETIONARY)),
        )
    )
    return int(total or 0)


def summary(session: Session, user: User, today: dt.date | None = None) -> Summary:
    today = today or local_today(user)
    accounts = user_accounts(session, user)
    assets, liabilities = _totals(accounts)
    week_ago = session.scalars(
        select(NetWorthSnapshot)
        .where(
            NetWorthSnapshot.user_id == user.id,
            NetWorthSnapshot.date <= today - dt.timedelta(days=7),
        )
        .order_by(NetWorthSnapshot.date.desc())
        .limit(1)
    ).one_or_none()
    change = (
        (assets - liabilities) - (week_ago.assets_cents - week_ago.liabilities_cents)
        if week_ago
        else None
    )
    cards = [a for a in accounts if a.kind == "credit"]
    start = week_start(today)
    attention = list(
        session.scalars(
            select(Connection).where(Connection.user_id == user.id, Connection.status != "ok")
        ).all()
    )
    return Summary(
        net_worth=NetWorth(assets, liabilities, change),
        card_balance_cents=sum(a.current_cents or 0 for a in cards),
        card_limit_cents=sum(a.limit_cents or 0 for a in cards),
        card_count=len(cards),
        upcoming_payments=upcoming_payments(accounts, today),
        week_spent_cents=discretionary_spend(session, user, start, today),
        week_start=start,
        attention=attention,
    )


def list_transactions(
    session: Session,
    user: User,
    *,
    account_id: uuid.UUID | None = None,
    category: str | None = None,
    query: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[tuple[Transaction, Account]]:
    stmt = (
        select(Transaction, Account)
        .join(Account, Account.id == Transaction.account_id)
        .where(Transaction.user_id == user.id)
    )
    if account_id is not None:
        stmt = stmt.where(Transaction.account_id == account_id)
    if category:
        stmt = stmt.where(Transaction.category == category)
    if query:
        like = f"%{query.strip()}%"
        stmt = stmt.where(or_(Transaction.name.ilike(like), Transaction.merchant_name.ilike(like)))
    stmt = stmt.order_by(
        Transaction.date.desc(), Transaction.authorized_at.desc().nulls_last(), Transaction.id
    )
    rows = session.execute(stmt.limit(limit).offset(offset)).all()
    return [(t, a) for t, a in rows]


# --- net worth ------------------------------------------------------------------------------

NET_WORTH_PERIODS: dict[str, int | None] = {"1W": 7, "1M": 30, "3M": 90, "1Y": 365, "All": None}


@dataclass(frozen=True)
class NetWorthChange:
    period: str
    change_cents: int | None
    since: dt.date | None


@dataclass(frozen=True)
class NetWorthDetail:
    cash_cents: int
    investments_cents: int
    cards_cents: int
    loans_cents: int
    changes: list[NetWorthChange]
    tracking_since: dt.date | None

    @property
    def net_cents(self) -> int:
        return self.cash_cents + self.investments_cents - self.cards_cents - self.loans_cents


def net_worth_detail(session: Session, user: User, today: dt.date | None = None) -> NetWorthDetail:
    """Net worth by kind of account, and how it changed over each period.

    A change compares today's balances with the most recent daily snapshot on or before the
    period's start. Snapshots begin when the first bank is connected, so longer periods are
    None until there is that much history ("All" compares with the first snapshot).
    """
    today = today or local_today(user)
    accounts = user_accounts(session, user)

    def total(kind: str) -> int:
        return sum(a.current_cents or 0 for a in accounts if a.kind == kind)

    cash, investments = total("depository"), total("investment")
    cards, loans = total("credit"), total("loan")
    net = cash + investments - cards - loans

    snapshots = session.scalars(
        select(NetWorthSnapshot)
        .where(NetWorthSnapshot.user_id == user.id, NetWorthSnapshot.date < today)
        .order_by(NetWorthSnapshot.date)
    ).all()
    first = session.scalars(
        select(NetWorthSnapshot.date)
        .where(NetWorthSnapshot.user_id == user.id)
        .order_by(NetWorthSnapshot.date)
        .limit(1)
    ).one_or_none()

    changes = []
    for period, days in NET_WORTH_PERIODS.items():
        if days is None:
            base = snapshots[0] if snapshots else None
        else:
            cutoff = today - dt.timedelta(days=days)
            base = next((sn for sn in reversed(snapshots) if sn.date <= cutoff), None)
        changes.append(
            NetWorthChange(
                period=period,
                change_cents=(net - (base.assets_cents - base.liabilities_cents)) if base else None,
                since=base.date if base else None,
            )
        )
    return NetWorthDetail(cash, investments, cards, loans, changes, first)
