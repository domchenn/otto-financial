import { describe, expect, it } from '@jest/globals';

import type { Account } from './finance';
import { accountsInsight } from './insights';
import { budget, checking, gold } from '@/test/fixtures';

// $2,000 monthly plan in the budget fixture.
const flush: Account = { ...checking, current_cents: 400_000 };
const savings: Account = {
  ...checking,
  id: 'acc-savings',
  subtype: 'savings',
  current_cents: 1_000_000,
};
const base = { budget, payments: [], utilizationPct: 7 };

describe('accountsInsight', () => {
  it('points out idle checking, noting when savings holds most of the cash', () => {
    expect(accountsInsight({ ...base, accounts: [flush, savings] })).toBe(
      'Most of your cash is in savings. Checking is holding about $2,000 more than a month of your plan and card payments.',
    );
    const smallSavings = { ...savings, current_cents: 100_000 };
    expect(accountsInsight({ ...base, accounts: [flush, smallSavings] })).toBe(
      'Checking is holding about $2,000 more than a month of your plan and card payments.',
    );
  });

  it('falls back to high utilization', () => {
    expect(accountsInsight({ ...base, accounts: [gold, checking], utilizationPct: 42 })).toBe(
      'Your cards are using 42% of their limits. Under 30% is better for your credit score.',
    );
  });

  it('says nothing rather than something generic', () => {
    expect(accountsInsight({ ...base, accounts: [gold, checking] })).toBeNull();
    expect(accountsInsight({ ...base, accounts: [], utilizationPct: null })).toBeNull();
  });
});
