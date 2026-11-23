import datetime as dt
import uuid

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.modules.accounts.router import SessionDep, UserDep
from app.modules.points import service

router = APIRouter(prefix="/v1", tags=["points"])


class ProgramCardOut(BaseModel):
    account_id: uuid.UUID
    card_name: str
    account_mask: str | None


class ProgramOut(BaseModel):
    id: str
    name: str
    short_name: str
    cards: list[ProgramCardOut]
    # The balance the user last entered, and when; null until they add one.
    confirmed_points: int | None
    confirmed_at: dt.datetime | None
    # Points from posted purchases since then, and the estimate (confirmed + earned).
    earned_since: int
    estimated_points: int | None


class PointsOut(BaseModel):
    total_points: int
    confirmed_count: int
    programs: list[ProgramOut]


class ConfirmIn(BaseModel):
    points: int = Field(ge=0, le=100_000_000)


def _out(view: service.PointsView) -> PointsOut:
    return PointsOut(
        total_points=view.total_points,
        confirmed_count=view.confirmed_count,
        programs=[
            ProgramOut(
                id=p.program.id,
                name=p.program.name,
                short_name=p.program.short_name,
                cards=[
                    ProgramCardOut(account_id=a.id, card_name=c.name, account_mask=a.mask)
                    for a, c in p.cards
                ],
                confirmed_points=p.balance.points if p.balance else None,
                confirmed_at=p.balance.confirmed_at if p.balance else None,
                earned_since=p.earned_since,
                estimated_points=p.estimated_points,
            )
            for p in view.programs
        ],
    )


@router.get("/points")
def get_points(user: UserDep, session: SessionDep) -> PointsOut:
    return _out(service.status(session, user))


@router.put("/points/{program_id}")
def confirm_points(
    program_id: str, body: ConfirmIn, user: UserDep, session: SessionDep
) -> PointsOut:
    try:
        service.confirm(session, user, program_id, body.points)
    except LookupError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown points program") from exc
    return _out(service.status(session, user))
