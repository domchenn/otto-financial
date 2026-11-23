"""Benefits: assign cards, keep this year's periods up to date, and rank what needs attention."""

import datetime as dt
import uuid
from dataclasses import dataclass

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.modules.accounts.models import Account, Connection, Transaction
from app.modules.accounts.service import local_today
from app.modules.benefits.catalog import CardProduct, Catalog, CreditDefinition, get_catalog
from app.modules.benefits.matching import Txn, usage
from app.modules.benefits.models import BenefitMatch, BenefitPeriod, CardAssignment
from app.modules.benefits.periods import Window, amount_for, windows_between
from app.modules.identity.models import User

ATTENTION_DAYS = 10  # PRD F4: unused credits expiring within 10 days


@dataclass(frozen=True)
class PeriodView:
    period: BenefitPeriod
    credit: CreditDefinition
    card: CardProduct
    account: Account
    today: dt.date

    @property
    def window(self) -> Window:
        return Window(self.period.start_date, self.period.end_date)

    @property
    def remaining_cents(self) -> int:
        if self.period.marked_used_at is not None:
            return 0
        return max(self.period.amount_cents - self.period.used_cents, 0)

    @property
    def days_left(self) -> int:
        return self.window.days_left(self.today)

    @property
    def urgency(self) -> float:
        """Value times urgency (PRD F4): more money and fewer days rank higher."""
        return self.remaining_cents / max(self.days_left, 1)

    @property
    def is_current(self) -> bool:
        return self.period.start_date <= self.today <= self.period.end_date

    @property
    def used_value_cents(self) -> int:
        """What this period gave back: the whole credit once marked used by hand."""
        if self.period.marked_used_at is not None:
            return self.period.amount_cents
        return min(self.period.used_cents, self.period.amount_cents)

    @property
    def missed_cents(self) -> int:
        """Left unused when the period ended (zero while it's still open)."""
        return self.remaining_cents if self.period.end_date < self.today else 0


@dataclass(frozen=True)
class CardView:
    account: Account
    institution_name: str | None
    assignment: CardAssignment
    card: CardProduct | None
    # Every period that overlaps this year, oldest first; `periods` is the open ones.
    history: list[PeriodView]

    @property
    def periods(self) -> list[PeriodView]:
        return [p for p in self.history if p.is_current]

    @property
    def needs_anniversary_month(self) -> bool:
        return (
            self.card is not None
            and self.card.needs_anniversary
            and self.assignment.anniversary_month is None
        )


@dataclass(frozen=True)
class BenefitsView:
    cards: list[CardView]
    today: dt.date

    @property
    def periods(self) -> list[PeriodView]:
        return [p for c in self.cards for p in c.periods]

    @property
    def history(self) -> list[PeriodView]:
        return [p for c in self.cards for p in c.history]

    @property
    def used_this_year_cents(self) -> int:
        return sum(p.used_value_cents for p in self.history)

    @property
    def missed_this_year_cents(self) -> int:
        return sum(p.missed_cents for p in self.history)

    @property
    def needs_attention(self) -> list[PeriodView]:
        due = [
            p
            for p in self.periods
            if p.remaining_cents > 0 and p.days_left <= ATTENTION_DAYS and p.credit.tracked
        ]
        return sorted(due, key=lambda p: p.urgency, reverse=True)

    @property
    def remaining_cents(self) -> int:
        return sum(p.remaining_cents for p in self.periods)

    def _this_month(self) -> list[PeriodView]:
        month_end = (self.today.replace(day=28) + dt.timedelta(days=4)).replace(day=1)
        return [p for p in self.periods if p.remaining_cents > 0 and p.period.end_date < month_end]

    @property
    def expiring_this_month_cents(self) -> int:
        return sum(p.remaining_cents for p in self._this_month())

    @property
    def expiring_this_month_count(self) -> int:
        return len(self._this_month())


def _credit_accounts(session: Session, user: User) -> list[tuple[Account, str | None]]:
    rows = session.execute(
        select(Account, Connection.institution_name)
        .join(Connection, Connection.id == Account.connection_id)
        .where(Account.user_id == user.id, Account.kind == "credit")
        .order_by(Account.created_at)
    ).all()
    return [(a, name) for a, name in rows]


def _assignment(
    session: Session, user: User, account: Account, institution: str | None, catalog: Catalog
) -> CardAssignment:
    assignment = session.get(CardAssignment, account.id)
    if assignment is None:
        guess = catalog.guess(account.name, account.official_name, institution)
        assignment = CardAssignment(
            account_id=account.id,
            user_id=user.id,
            card_id=guess.id if guess else None,
            source="guess",
        )
        session.add(assignment)
        session.flush()
    return assignment


def assigned_cards(session: Session, user: User) -> list[tuple[Account, CardProduct | None]]:
    """Each linked credit account with its catalog card (guessed the first time it's seen)."""
    catalog = get_catalog()
    out: list[tuple[Account, CardProduct | None]] = []
    for account, institution in _credit_accounts(session, user):
        assignment = _assignment(session, user, account, institution, catalog)
        out.append((account, catalog.card(assignment.card_id) if assignment.card_id else None))
    return out


def _txns(session: Session, account: Account, since: dt.date) -> list[Txn]:
    rows = session.scalars(
        select(Transaction).where(Transaction.account_id == account.id, Transaction.date >= since)
    ).all()
    return [Txn(t.id, t.amount_cents, t.date, t.name, t.merchant_name, t.category) for t in rows]


def _refresh_card(
    session: Session,
    user: User,
    account: Account,
    card: CardProduct,
    assignment: CardAssignment,
    today: dt.date,
) -> list[PeriodView]:
    """Create or update every period of this card's tracked credits that overlaps this year.

    Existing periods and the card's transactions are loaded once, so a year of monthly
    credits costs a few queries rather than one per period.
    """
    year_start = today.replace(month=1, day=1)
    plan = [
        (credit, window)
        for credit in card.credits
        if credit.tracked
        for window in windows_between(credit, year_start, today, assignment.anniversary_month)
    ]
    if not plan:
        return []

    existing = {
        (p.credit_id, p.start_date): p
        for p in session.scalars(
            select(BenefitPeriod).where(
                BenefitPeriod.account_id == account.id, BenefitPeriod.card_id == card.id
            )
        )
    }
    txns = _txns(session, account, min(w.start for _, w in plan))

    views: list[PeriodView] = []
    results = []
    for credit, window in plan:
        period = existing.get((credit.id, window.start))
        if period is None:
            period = BenefitPeriod(
                user_id=user.id,
                account_id=account.id,
                card_id=card.id,
                credit_id=credit.id,
                start_date=window.start,
            )
            session.add(period)
        amount = amount_for(credit, window)
        result = usage(credit, window, amount, txns)
        period.end_date = window.end
        period.amount_cents = amount
        period.used_cents = result.used_cents
        period.confirmed = result.confirmed
        results.append((period, result))
        views.append(PeriodView(period, credit, card, account, today))
    session.flush()

    # Matches are rebuilt from scratch each time: the rules may have changed.
    period_ids = [period.id for period, _ in results]
    session.execute(delete(BenefitMatch).where(BenefitMatch.period_id.in_(period_ids)))
    session.add_all(
        BenefitMatch(
            period_id=period.id,
            transaction_id=m.transaction_id,
            kind=m.kind,
            amount_cents=m.amount_cents,
        )
        for period, result in results
        for m in result.matches
    )
    return views


def refresh(session: Session, user: User, today: dt.date | None = None) -> BenefitsView:
    """Bring every assigned card's periods for this year up to date and return them.

    Cheap at one user's scale, so it runs on every read instead of on a schedule.
    """
    today = today or local_today(user)
    catalog = get_catalog()
    cards: list[CardView] = []

    for account, institution in _credit_accounts(session, user):
        assignment = _assignment(session, user, account, institution, catalog)
        card = catalog.card(assignment.card_id) if assignment.card_id else None
        history = _refresh_card(session, user, account, card, assignment, today) if card else []
        cards.append(CardView(account, institution, assignment, card, history))

    session.flush()
    return BenefitsView(cards, today)


def assign_card(
    session: Session,
    user: User,
    account_id: uuid.UUID,
    card_id: str | None,
    anniversary_month: int | None,
) -> None:
    """Set (or clear) which catalog card an account is. Raises LookupError or ValueError."""
    account = session.get(Account, account_id)
    if account is None or account.user_id != user.id or account.kind != "credit":
        raise LookupError("account")
    if card_id is not None and get_catalog().card(card_id) is None:
        raise ValueError("card")

    assignment = session.get(CardAssignment, account_id)
    if assignment is None:
        assignment = CardAssignment(account_id=account_id, user_id=user.id, source="user")
        session.add(assignment)
    if assignment.card_id != card_id or assignment.anniversary_month != anniversary_month:
        # The periods were placed for the old card or anniversary; the next refresh rebuilds
        # them (usage is recounted from transactions, so only "mark used" is lost).
        session.execute(delete(BenefitPeriod).where(BenefitPeriod.account_id == account_id))
    assignment.card_id = card_id
    assignment.anniversary_month = anniversary_month
    assignment.source = "user"
    session.flush()


def mark_used(
    session: Session, user: User, period_id: uuid.UUID, used: bool, now: dt.datetime | None = None
) -> None:
    period = session.get(BenefitPeriod, period_id)
    if period is None or period.user_id != user.id:
        raise LookupError("period")
    period.marked_used_at = (now or dt.datetime.now(dt.UTC)) if used else None
    session.flush()
