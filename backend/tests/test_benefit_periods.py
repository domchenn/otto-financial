import datetime as dt

import pytest

from app.modules.benefits.catalog import CreditDefinition
from app.modules.benefits.periods import Window, amount_for, current_window, window_for

D = dt.date


def credit(**overrides: object) -> CreditDefinition:
    fields: dict[str, object] = {
        "id": "c",
        "name": "Credit",
        "amount_cents": 1000,
        "cadence": "monthly",
        "delivery": "statement_credit",
        "enrollment": False,
        "merchants": ("x",),
    }
    return CreditDefinition.model_validate(fields | overrides)


@pytest.mark.parametrize(
    ("cadence", "on", "expected"),
    [
        ("monthly", D(2026, 11, 20), Window(D(2026, 11, 1), D(2026, 11, 30))),
        ("monthly", D(2028, 2, 10), Window(D(2028, 2, 1), D(2028, 2, 29))),  # leap year
        ("quarterly", D(2026, 11, 20), Window(D(2026, 10, 1), D(2026, 12, 31))),
        ("quarterly", D(2026, 1, 1), Window(D(2026, 1, 1), D(2026, 3, 31))),
        ("quarterly", D(2026, 6, 30), Window(D(2026, 4, 1), D(2026, 6, 30))),
        ("semiannual", D(2026, 6, 30), Window(D(2026, 1, 1), D(2026, 6, 30))),
        ("semiannual", D(2026, 7, 1), Window(D(2026, 7, 1), D(2026, 12, 31))),
        ("calendar_year", D(2026, 11, 20), Window(D(2026, 1, 1), D(2026, 12, 31))),
    ],
)
def test_calendar_windows(cadence: str, on: dt.date, expected: Window) -> None:
    assert window_for(cadence, on) == expected  # type: ignore[arg-type]


@pytest.mark.parametrize(
    ("on", "anniversary", "expected"),
    [
        # Anniversary in March: Mar 1 2026 - Feb 28 2027.
        (D(2026, 11, 20), 3, Window(D(2026, 3, 1), D(2027, 2, 28))),
        (D(2026, 2, 28), 3, Window(D(2025, 3, 1), D(2026, 2, 28))),
        (D(2026, 3, 1), 3, Window(D(2026, 3, 1), D(2027, 2, 28))),
        # January anniversary lines up with the calendar year.
        (D(2026, 11, 20), 1, Window(D(2026, 1, 1), D(2026, 12, 31))),
        # December anniversary: Dec 1 2025 - Nov 30 2026.
        (D(2026, 11, 30), 12, Window(D(2025, 12, 1), D(2026, 11, 30))),
        (D(2026, 12, 1), 12, Window(D(2026, 12, 1), D(2027, 11, 30))),
    ],
)
def test_cardmember_year_windows(on: dt.date, anniversary: int, expected: Window) -> None:
    assert window_for("cardmember_year", on, anniversary) == expected


def test_cardmember_year_without_anniversary_is_unknown() -> None:
    assert window_for("cardmember_year", D(2026, 11, 20)) is None


def test_days_left_counts_today() -> None:
    window = Window(D(2026, 11, 1), D(2026, 11, 30))
    assert window.days_left(D(2026, 11, 30)) == 1
    assert window.days_left(D(2026, 11, 20)) == 11
    assert window.resets_on == D(2026, 12, 1)


def test_credit_that_has_ended_has_no_window() -> None:
    ended = credit(ends=D(2027, 9, 30))
    assert current_window(ended, D(2027, 10, 1)) is None


def test_window_is_cut_short_by_the_end_date() -> None:
    ending = credit(cadence="semiannual", ends=D(2027, 9, 30))
    assert current_window(ending, D(2027, 8, 1)) == Window(D(2027, 7, 1), D(2027, 9, 30))


def test_december_amount() -> None:
    rideshare = credit(amount_cents=800, december_amount_cents=1200)
    assert amount_for(rideshare, Window(D(2026, 11, 1), D(2026, 11, 30))) == 800
    assert amount_for(rideshare, Window(D(2026, 12, 1), D(2026, 12, 31))) == 1200
