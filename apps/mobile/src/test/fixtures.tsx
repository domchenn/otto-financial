/** Shared helpers for screen tests: safe-area wrapper and API fixtures. */
import { jest } from '@jest/globals';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { Budget, PeriodBudget } from '@/lib/budget';
import type { Benefits, CreditPeriod } from '@/lib/credits';
import type { Points } from '@/lib/points';
import type { Account, Connection, NetWorth, Spending, Summary, Transaction } from '@/lib/finance';

export function renderScreen(ui: ReactElement) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      {ui}
    </SafeAreaProvider>,
  );
}

/** Shape of a react-query result, for mocked hooks. */
export function mockResult<T>(data: T | undefined, extra: { isError?: boolean } = {}) {
  return { data, isError: extra.isError ?? false, isPending: data === undefined };
}

export function mockMutation() {
  return { mutate: jest.fn(), isPending: false };
}

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const gold: Account = {
  id: 'acc-gold',
  connection_id: 'conn-amex',
  institution_name: 'American Express',
  name: 'Gold Card',
  official_name: 'American Express Gold Card',
  mask: '1007',
  kind: 'credit',
  subtype: 'credit card',
  current_cents: 68422,
  available_cents: 931578,
  limit_cents: 1000000,
  statement_balance_cents: 61000,
  minimum_due_cents: 4000,
  next_due_date: isoDaysFromNow(3),
  last_payment_cents: 55000,
  last_payment_date: isoDaysFromNow(-25),
  balances_updated_at: new Date().toISOString(),
};

export const checking: Account = {
  ...gold,
  id: 'acc-checking',
  connection_id: 'conn-chase',
  institution_name: 'Chase',
  name: 'Total Checking',
  official_name: null,
  mask: '0000',
  kind: 'depository',
  subtype: 'checking',
  current_cents: 500000,
  limit_cents: null,
  statement_balance_cents: null,
  minimum_due_cents: null,
  next_due_date: null,
};

export const sweetgreen: Transaction = {
  id: 'txn-1',
  account_id: gold.id,
  account_name: gold.name,
  account_mask: gold.mask,
  institution_name: gold.institution_name,
  amount_cents: 1645,
  date: isoDaysFromNow(0),
  authorized_at: null,
  name: 'SWEETGREEN NYC 123',
  merchant_name: 'Sweetgreen',
  category: 'FOOD_AND_DRINK',
  pending: false,
};

export const refund: Transaction = {
  ...sweetgreen,
  id: 'txn-2',
  amount_cents: -500,
  name: 'Amazon refund',
  merchant_name: 'Amazon',
  category: 'GENERAL_MERCHANDISE',
};

export const summary: Summary = {
  net_worth: {
    assets_cents: 500000,
    liabilities_cents: 68422,
    net_cents: 431578,
    week_change_cents: null,
  },
  card_balance_cents: 68422,
  card_limit_cents: 1000000,
  card_count: 1,
  utilization_pct: 7,
  upcoming_payments: [
    {
      account_id: gold.id,
      name: gold.name,
      mask: gold.mask,
      amount_cents: 61000,
      minimum_due_cents: 4000,
      due_date: gold.next_due_date!,
      covered: true,
    },
  ],
  week_spent_cents: 12000,
  week_start: isoDaysFromNow(-2),
  attention: [],
  has_connections: true,
};

export const amex: Connection = {
  id: 'conn-amex',
  institution_name: 'American Express',
  status: 'ok',
  error_code: null,
  last_synced_at: new Date().toISOString(),
  accounts: [gold],
};

export const chaseBroken: Connection = {
  id: 'conn-chase',
  institution_name: 'Chase',
  status: 'needs_reauth',
  error_code: 'ITEM_LOGIN_REQUIRED',
  last_synced_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
  accounts: [checking],
};

export const brokerage: Account = {
  ...checking,
  id: 'acc-brokerage',
  connection_id: 'conn-schwab',
  institution_name: 'Schwab',
  name: 'Brokerage',
  mask: '4242',
  kind: 'investment',
  subtype: 'brokerage',
  current_cents: 1200000,
};

export const netWorth: NetWorth = {
  net_cents: 500000 + 1200000 - 68422,
  cash_cents: 500000,
  investments_cents: 1200000,
  cards_cents: 68422,
  loans_cents: 0,
  changes: [
    { period: '1W', change_cents: 12000, since: isoDaysFromNow(-7) },
    { period: '1M', change_cents: -4500, since: isoDaysFromNow(-30) },
    { period: '3M', change_cents: null, since: null },
    { period: '1Y', change_cents: null, since: null },
    { period: 'All', change_cents: 30000, since: isoDaysFromNow(-40) },
  ],
  tracking_since: isoDaysFromNow(-40),
};

export function creditPeriod(overrides: Partial<CreditPeriod> = {}): CreditPeriod {
  return {
    period_id: 'p-dining',
    account_id: 'acc-gold',
    card_id: 'amex-gold',
    card_name: 'Gold Card',
    account_mask: '1007',
    credit_id: 'dining',
    name: 'Dining credit',
    cadence: 'monthly',
    enrollment: true,
    channel: null,
    amount_cents: 1000,
    used_cents: 0,
    remaining_cents: 1000,
    used_value_cents: 0,
    missed_cents: 0,
    confirmed: false,
    marked_used: false,
    start_date: '2026-11-01',
    end_date: '2026-11-30',
    resets_on: '2026-12-01',
    days_left: 3,
    ...overrides,
  };
}

const goldDining = creditPeriod();
const goldDunkin = creditPeriod({
  period_id: 'p-dunkin',
  credit_id: 'dunkin',
  name: "Dunkin' credit",
  amount_cents: 700,
  remaining_cents: 700,
});
const goldResy = creditPeriod({
  period_id: 'p-resy',
  credit_id: 'resy',
  name: 'Resy credit',
  cadence: 'semiannual',
  channel: 'U.S. Resy restaurants',
  amount_cents: 5000,
  remaining_cents: 5000,
  start_date: '2026-07-01',
  end_date: '2026-12-31',
  resets_on: '2027-01-01',
  days_left: 34,
});

/** Gold Card guessed from its name with three credits, plus a card Otto couldn't place. */
export const benefits: Benefits = {
  remaining_cents: 6700,
  expiring_this_month_cents: 1700,
  expiring_this_month_count: 2,
  used_this_year_cents: 1700,
  missed_this_year_cents: 1000,
  needs_attention: [goldDining, goldDunkin],
  cards: [
    {
      account_id: 'acc-gold',
      account_name: 'Gold Card',
      account_mask: '1007',
      institution_name: 'American Express',
      card_id: 'amex-gold',
      card_name: 'Gold Card',
      issuer: 'American Express',
      source: 'guess',
      anniversary_month: null,
      needs_anniversary_month: false,
      credits: [goldDining, goldDunkin, goldResy],
    },
    {
      account_id: 'acc-plaid',
      account_name: 'Plaid Credit Card',
      account_mask: '3333',
      institution_name: 'First Platypus Bank',
      card_id: null,
      card_name: null,
      issuer: null,
      source: 'guess',
      anniversary_month: null,
      needs_anniversary_month: false,
      credits: [],
    },
  ],
  history: [
    goldDining,
    goldDunkin,
    goldResy,
    creditPeriod({
      period_id: 'p-dining-oct',
      start_date: '2026-10-01',
      end_date: '2026-10-31',
      resets_on: '2026-11-01',
      remaining_cents: 0,
      used_cents: 1000,
      used_value_cents: 1000,
      confirmed: true,
      days_left: 0,
    }),
    creditPeriod({
      period_id: 'p-dunkin-oct',
      credit_id: 'dunkin',
      name: "Dunkin' credit",
      amount_cents: 700,
      start_date: '2026-10-01',
      end_date: '2026-10-31',
      resets_on: '2026-11-01',
      remaining_cents: 0,
      used_cents: 700,
      used_value_cents: 700,
      confirmed: true,
      days_left: 0,
    }),
    creditPeriod({
      period_id: 'p-dining-sep',
      start_date: '2026-09-01',
      end_date: '2026-09-30',
      resets_on: '2026-10-01',
      remaining_cents: 1000,
      missed_cents: 1000,
      days_left: 0,
    }),
  ],
};

/** This week: $120 so far, $82 on dining (mostly the Gold Card) and $38 shopping. */
export const weekSpending: Spending = {
  period: 'week',
  start: isoDaysFromNow(-((new Date().getDay() + 6) % 7)),
  end: isoDaysFromNow(0),
  spent_cents: 12000,
  days: Array.from({ length: 7 }, (_, i) => {
    const offset = i - ((new Date().getDay() + 6) % 7);
    return { date: isoDaysFromNow(offset), cents: offset > 0 ? null : offset === 0 ? 12000 : 0 };
  }),
  categories: [
    {
      category: 'FOOD_AND_DRINK',
      cents: 8200,
      top_account_name: 'Gold Card',
      top_account_share: 0.95,
    },
    {
      category: 'GENERAL_MERCHANDISE',
      cents: 3800,
      top_account_name: 'Gold Card',
      top_account_share: 1,
    },
  ],
};

export function periodBudget(overrides: Partial<PeriodBudget> = {}): PeriodBudget {
  return {
    start: '2026-11-23',
    end: '2026-11-29',
    limit_cents: 50000,
    spent_cents: 12000,
    remaining_cents: 38000,
    ...overrides,
  };
}

/** A weekly $500 budget with $120 spent this week, and $2,000 a month with $640 spent. */
export const budget: Budget = {
  configured: true,
  style: 'weekly',
  weekly_cents: 50000,
  monthly_cents: 200000,
  excluded_categories: [],
  excludable_categories: ['FOOD_AND_DRINK', 'GENERAL_MERCHANDISE', 'TRAVEL'],
  week: periodBudget(),
  month: periodBudget({
    start: '2026-11-01',
    end: '2026-11-30',
    limit_cents: 200000,
    spent_cents: 64000,
    remaining_cents: 136000,
  }),
};

/** Amex MR confirmed and estimated; Chase UR (two pooled cards) waiting for a balance. */
export const points: Points = {
  total_points: 122_220,
  confirmed_count: 1,
  programs: [
    {
      id: 'amex-mr',
      name: 'Membership Rewards',
      short_name: 'MR',
      cards: [{ account_id: 'acc-gold', card_name: 'Gold Card', account_mask: '1007' }],
      confirmed_points: 120_000,
      confirmed_at: new Date().toISOString(),
      earned_since: 2_220,
      estimated_points: 122_220,
    },
    {
      id: 'chase-ur',
      name: 'Ultimate Rewards',
      short_name: 'UR',
      cards: [
        { account_id: 'acc-csp', card_name: 'Sapphire Preferred', account_mask: '4421' },
        { account_id: 'acc-cfu', card_name: 'Freedom Unlimited', account_mask: '8810' },
      ],
      confirmed_points: null,
      confirmed_at: null,
      earned_since: 0,
      estimated_points: null,
    },
  ],
};
