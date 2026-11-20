"""Benefit periods: the dated window a credit applies to (PRD F4).

"Gold dining credit, November 2026: $10, resets Dec 1" is the period for the Gold's monthly
dining credit that contains Nov 20. Pure date math, no database.
"""

import calendar
import datetime as dt
from dataclasses import dataclass

from app.modules.benefits.catalog import Cadence, CreditDefinition


@dataclass(frozen=True)
class Window:
    start: dt.date
    end: dt.date  # inclusive: the last day the credit can be used

    @property
    def resets_on(self) -> dt.date:
        return self.end + dt.timedelta(days=1)

    def days_left(self, today: dt.date) -> int:
        """Days the credit can still be used, counting today (1 on its last day)."""
        return (self.end - today).days + 1


def _month_end(year: int, month: int) -> dt.date:
    return dt.date(year, month, calendar.monthrange(year, month)[1])


def window_for(
    cadence: Cadence, on: dt.date, anniversary_month: int | None = None
) -> Window | None:
    """The period of this cadence that contains `on`.

    Cardmember-year credits reset on the first of the card's anniversary month; without one
    the window is unknown and this returns None.
    """
    y, m = on.year, on.month
    if cadence == "monthly":
        return Window(dt.date(y, m, 1), _month_end(y, m))
    if cadence == "quarterly":
        first = 3 * ((m - 1) // 3) + 1
        return Window(dt.date(y, first, 1), _month_end(y, first + 2))
    if cadence == "semiannual":
        if m <= 6:
            return Window(dt.date(y, 1, 1), dt.date(y, 6, 30))
        return Window(dt.date(y, 7, 1), dt.date(y, 12, 31))
    if cadence == "calendar_year":
        return Window(dt.date(y, 1, 1), dt.date(y, 12, 31))
    # cardmember_year
    if anniversary_month is None:
        return None
    start_year = y if m >= anniversary_month else y - 1
    start = dt.date(start_year, anniversary_month, 1)
    end_month = anniversary_month - 1 or 12
    end_year = start_year if anniversary_month == 1 else start_year + 1
    return Window(start, _month_end(end_year, end_month))


def current_window(
    credit: CreditDefinition, today: dt.date, anniversary_month: int | None = None
) -> Window | None:
    """The window to track today, or None when the credit has ended or can't be placed."""
    if credit.ends is not None and today > credit.ends:
        return None
    window = window_for(credit.cadence, today, anniversary_month)
    if window is None:
        return None
    if credit.ends is not None and credit.ends < window.end:
        window = Window(window.start, credit.ends)
    return window


def amount_for(credit: CreditDefinition, window: Window) -> int:
    """The credit's value in this window (monthly credits can be larger in December)."""
    return credit.amount_for_month(window.start.month)
