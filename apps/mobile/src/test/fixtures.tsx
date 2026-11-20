/** Shared helpers for screen tests: safe-area wrapper and API fixtures. */
import { jest } from '@jest/globals';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { Account, Connection, NetWorth, Summary, Transaction } from '@/lib/finance';

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
