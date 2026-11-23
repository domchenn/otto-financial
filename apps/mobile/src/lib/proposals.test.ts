import { describe, expect, it } from '@jest/globals';

import type { Account, Payment } from './finance';
import {
  deriveProposals,
  idleCheckingCents,
  MIN_SWEEP_CENTS,
  visibleProposals,
  type Proposal,
} from './proposals';
import { budget, checking, creditPeriod } from '@/test/fixtures';

// $2,000 monthly plan in the budget fixture.
const savings: Account = {
  ...checking,
  id: 'acc-savings',
  subtype: 'savings',
  current_cents: 1_000_000,
};
const flush: Account = { ...checking, current_cents: 400_000 }; // $4,000 in checking
const payment: Payment = {
  account_id: 'acc-gold',
  name: 'Gold Card',
  mask: '1007',
  amount_cents: 61_000,
  minimum_due_cents: 4_000,
  due_date: '2026-11-22',
  covered: true,
};

describe('idleCheckingCents', () => {
  it('is checking above a month of the plan plus upcoming payments, rounded down to $100', () => {
    // 4,000 - 2,000 plan - 610 due = 1,390 → 1,300
    expect(idleCheckingCents([flush, savings], budget, [payment])).toBe(130_000);
  });

  // Regression: with the month already over plan, idle cash was measured against the plan
  // ($900) instead of what was really spent ($1,571), overstating what could move.
  it('uses actual spending when the month is already over plan', () => {
    const over = {
      ...budget,
      month: {
        ...budget.month,
        limit_cents: 90_000,
        spent_cents: 157_100,
        remaining_cents: -67_100,
      },
    };
    // 4,000 - 1,571 spent - 610 due = 1,819 → 1,800
    expect(idleCheckingCents([flush, savings], over, [payment])).toBe(180_000);
  });

  it('needs a monthly plan and a savings account to move it to', () => {
    const noPlan = { ...budget, month: { ...budget.month, limit_cents: null } };
    expect(idleCheckingCents([flush, savings], noPlan, [])).toBeNull();
    expect(idleCheckingCents([flush], budget, [])).toBeNull();
    expect(idleCheckingCents([flush, savings], undefined, [])).toBeNull();
  });

  it('stays quiet below the minimum worth suggesting', () => {
    const justOver = { ...flush, current_cents: 200_000 + MIN_SWEEP_CENTS - 1 };
    expect(idleCheckingCents([justOver, savings], budget, [])).toBeNull();
    const enough = { ...flush, current_cents: 200_000 + MIN_SWEEP_CENTS };
    expect(idleCheckingCents([enough, savings], budget, [])).toBe(MIN_SWEEP_CENTS);
  });
});

describe('deriveProposals', () => {
  it('puts the sweep first, then credits about to reset', () => {
    const uber = creditPeriod({
      period_id: 'p-uber',
      name: 'Uber Cash',
      card_name: 'Platinum',
      account_mask: '3002',
      remaining_cents: 1500,
      days_left: 10,
    });
    const proposals = deriveProposals({
      accounts: [flush, savings],
      budget,
      payments: [payment],
      expiring: [uber],
    });
    expect(proposals.map((p) => [p.kind, p.title, p.reason, p.href])).toEqual([
      [
        'sweep_cash',
        'Move $1,300 of idle checking into savings',
        'You keep more in checking than a month of spending plus your card payments',
        '/accounts',
      ],
      [
        'use_credit',
        'Use your $15 Uber Cash',
        'Platinum ··3002 · resets in 10 days',
        '/credits/p-uber',
      ],
    ]);
  });

  it('skips used credits and ones more than two weeks out', () => {
    const used = creditPeriod({ remaining_cents: 0 });
    const later = creditPeriod({ period_id: 'p-later', days_left: 20 });
    expect(deriveProposals({ expiring: [used, later] })).toEqual([]);
  });

  it('says today and tomorrow for the last days', () => {
    const [today] = deriveProposals({ expiring: [creditPeriod({ days_left: 0 })] });
    const [tomorrow] = deriveProposals({ expiring: [creditPeriod({ days_left: 1 })] });
    expect(today?.reason).toBe('Gold Card ··1007 · resets today');
    expect(tomorrow?.reason).toBe('Gold Card ··1007 · resets tomorrow');
  });
});

describe('visibleProposals', () => {
  const p = (id: string): Proposal => ({
    id,
    kind: 'use_credit',
    title: id,
    reason: '',
    primary: 'Show me how',
    status: 'proposed',
    href: '/benefits',
  });

  it('shows at most two and hides the ones put off', () => {
    expect(visibleProposals([p('a'), p('b'), p('c')], new Set()).map((x) => x.id)).toEqual([
      'a',
      'b',
    ]);
    expect(visibleProposals([p('a'), p('b'), p('c')], new Set(['a'])).map((x) => x.id)).toEqual([
      'b',
      'c',
    ]);
  });
});
