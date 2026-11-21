/** Budgets from /v1/budget (PRD F5), and the wording Home, Spending and Settings share. */
import { formatCents } from './money';

export type BudgetPeriod = 'week' | 'month';
export type BudgetStyle = 'weekly' | 'monthly' | 'none';

export type PeriodBudget = {
  start: string;
  end: string;
  limit_cents: number | null;
  spent_cents: number;
  /** Negative when over; null with no limit. */
  remaining_cents: number | null;
};

export type Budget = {
  configured: boolean;
  style: BudgetStyle | null;
  weekly_cents: number | null;
  monthly_cents: number | null;
  excluded_categories: string[];
  excludable_categories: string[];
  week: PeriodBudget;
  month: PeriodBudget;
};

/** What the budget editor works on before saving. */
export type BudgetDraft = {
  style: BudgetStyle;
  weeklyCents: number;
  monthlyCents: number;
  excluded: string[];
};

// Starting points for someone who hasn't set budgets yet ("a rough number is fine").
const DEFAULT_WEEKLY_CENTS = 50000;
const DEFAULT_MONTHLY_CENTS = 200000;

export function draftFrom(budget: Budget | undefined): BudgetDraft {
  return {
    style: budget?.style ?? 'weekly',
    weeklyCents: budget?.weekly_cents ?? DEFAULT_WEEKLY_CENTS,
    monthlyCents: budget?.monthly_cents ?? DEFAULT_MONTHLY_CENTS,
    excluded: budget?.excluded_categories ?? [],
  };
}

/**
 * The request body. Both limits are saved whichever style leads, so switching between
 * weekly and monthly later keeps the other number.
 */
export function draftBody(draft: BudgetDraft) {
  return {
    style: draft.style,
    weekly_cents: draft.weeklyCents,
    monthly_cents: draft.monthlyCents,
    excluded_categories: draft.excluded,
  };
}

/** The period Home leads with, or null for "just show me what I spend" or not set up. */
export function leadPeriod(budget: Budget | undefined): BudgetPeriod | null {
  if (!budget?.configured) return null;
  if (budget.style === 'weekly') return 'week';
  if (budget.style === 'monthly') return 'month';
  return null;
}

export function periodBudget(budget: Budget, period: BudgetPeriod): PeriodBudget {
  return period === 'week' ? budget.week : budget.month;
}

/** "$500 a week", "$2,000 a month", "No limit" or "Not set" for the Settings row. */
export function budgetSummary(budget: Budget | undefined): string {
  if (!budget) return ' ';
  if (!budget.configured) return 'Not set';
  if (budget.style === 'weekly' && budget.weekly_cents !== null) {
    return `${formatCents(budget.weekly_cents)} a week`;
  }
  if (budget.style === 'monthly' && budget.monthly_cents !== null) {
    return `${formatCents(budget.monthly_cents)} a month`;
  }
  return 'No limit';
}

/** "$120 left" or "$12 over"; null without a limit. */
export function remainingLabel(p: PeriodBudget): string | null {
  if (p.remaining_cents === null) return null;
  return p.remaining_cents < 0
    ? `${formatCents(-p.remaining_cents)} over`
    : `${formatCents(p.remaining_cents)} left`;
}

/** Share of the limit spent, 0-1, for progress bars (0 without a limit). */
export function spentShare(p: PeriodBudget): number {
  if (!p.limit_cents) return 0;
  return Math.min(Math.max(p.spent_cents / p.limit_cents, 0), 1);
}
