/**
 * Spending limits. Sample values until budgets are built (PRD F5); kept here so Home
 * and Spending always use the same numbers.
 */
export const budgetLimitCents = { week: 50000, month: 214000 } as const;

export type BudgetPeriod = keyof typeof budgetLimitCents;
