import datetime as dt
import uuid

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.modules.accounts.router import SessionDep, UserDep
from app.modules.benefits import service
from app.modules.benefits.catalog import get_catalog

router = APIRouter(prefix="/v1", tags=["benefits"])


# --- schemas --------------------------------------------------------------------------------


class CardProductOut(BaseModel):
    id: str
    issuer: str
    name: str
    needs_anniversary: bool


class CreditOut(BaseModel):
    period_id: uuid.UUID
    account_id: uuid.UUID
    card_id: str
    card_name: str
    account_mask: str | None
    credit_id: str
    name: str
    cadence: str
    enrollment: bool
    channel: str | None
    amount_cents: int
    used_cents: int
    remaining_cents: int
    # What it gave back (the whole credit once marked used) and what expired unused.
    used_value_cents: int
    missed_cents: int
    confirmed: bool
    marked_used: bool
    start_date: dt.date
    end_date: dt.date
    resets_on: dt.date
    days_left: int


class CardOut(BaseModel):
    account_id: uuid.UUID
    account_name: str
    account_mask: str | None
    institution_name: str | None
    card_id: str | None
    card_name: str | None
    issuer: str | None
    source: str
    anniversary_month: int | None
    needs_anniversary_month: bool
    credits: list[CreditOut]


class BenefitsOut(BaseModel):
    remaining_cents: int
    expiring_this_month_cents: int
    expiring_this_month_count: int
    used_this_year_cents: int
    missed_this_year_cents: int
    needs_attention: list[CreditOut]
    cards: list[CardOut]
    # Every period this year across all cards, newest first (for "used" and "missed").
    history: list[CreditOut]


class AssignCardIn(BaseModel):
    card_id: str | None
    anniversary_month: int | None = Field(default=None, ge=1, le=12)


class MarkUsedIn(BaseModel):
    used: bool


def _credit_out(p: service.PeriodView) -> CreditOut:
    return CreditOut(
        period_id=p.period.id,
        account_id=p.account.id,
        card_id=p.card.id,
        card_name=p.card.name,
        account_mask=p.account.mask,
        credit_id=p.credit.id,
        name=p.credit.name,
        cadence=p.credit.cadence,
        enrollment=p.credit.enrollment,
        channel=p.credit.channel,
        amount_cents=p.period.amount_cents,
        used_cents=p.period.used_cents,
        remaining_cents=p.remaining_cents,
        used_value_cents=p.used_value_cents,
        missed_cents=p.missed_cents,
        confirmed=p.period.confirmed,
        marked_used=p.period.marked_used_at is not None,
        start_date=p.period.start_date,
        end_date=p.period.end_date,
        resets_on=p.window.resets_on,
        days_left=p.days_left,
    )


def _benefits_out(view: service.BenefitsView) -> BenefitsOut:
    return BenefitsOut(
        remaining_cents=view.remaining_cents,
        expiring_this_month_cents=view.expiring_this_month_cents,
        expiring_this_month_count=view.expiring_this_month_count,
        used_this_year_cents=view.used_this_year_cents,
        missed_this_year_cents=view.missed_this_year_cents,
        needs_attention=[_credit_out(p) for p in view.needs_attention],
        history=[
            _credit_out(p)
            for p in sorted(
                view.history, key=lambda p: (p.period.end_date, p.credit.name), reverse=True
            )
        ],
        cards=[
            CardOut(
                account_id=c.account.id,
                account_name=c.account.name,
                account_mask=c.account.mask,
                institution_name=c.institution_name,
                card_id=c.card.id if c.card else None,
                card_name=c.card.name if c.card else None,
                issuer=c.card.issuer if c.card else None,
                source=c.assignment.source,
                anniversary_month=c.assignment.anniversary_month,
                needs_anniversary_month=c.needs_anniversary_month,
                credits=[
                    _credit_out(p)
                    for p in sorted(c.periods, key=lambda p: (p.period.end_date, p.credit.name))
                ],
            )
            for c in view.cards
        ],
    )


# --- routes ---------------------------------------------------------------------------------


@router.get("/card-products")
def card_products() -> list[CardProductOut]:
    return [
        CardProductOut(id=c.id, issuer=c.issuer, name=c.name, needs_anniversary=c.needs_anniversary)
        for c in get_catalog().cards
    ]


@router.get("/benefits")
def benefits(user: UserDep, session: SessionDep) -> BenefitsOut:
    return _benefits_out(service.refresh(session, user))


@router.put("/accounts/{account_id}/card")
def assign_card(
    account_id: uuid.UUID, body: AssignCardIn, user: UserDep, session: SessionDep
) -> BenefitsOut:
    try:
        service.assign_card(session, user, account_id, body.card_id, body.anniversary_month)
    except LookupError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Card account not found") from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Unknown card") from exc
    return _benefits_out(service.refresh(session, user))


@router.post("/benefit-periods/{period_id}/used")
def mark_used(
    period_id: uuid.UUID, body: MarkUsedIn, user: UserDep, session: SessionDep
) -> BenefitsOut:
    try:
        service.mark_used(session, user, period_id, body.used)
    except LookupError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Credit not found") from exc
    return _benefits_out(service.refresh(session, user))
