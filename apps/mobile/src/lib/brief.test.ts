import { describe, expect, it } from '@jest/globals';

import { BRIEF_MAX_CHARS, templateBrief } from './brief';
import type { Payment } from './finance';
import { budget, creditPeriod } from '@/test/fixtures';

// Friday, Nov 20 2026 (local time).
const today = new Date(2026, 10, 20, 9);

const overBudget = {
  ...budget,
  month: { ...budget.month, spent_cents: 253_600, remaining_cents: -53_600 },
};

function payment(overrides: Partial<Payment> = {}): Payment {
  return {
    account_id: 'acc-gold',
    name: 'Gold Card',
    mask: '1007',
    amount_cents: 163_200,
    minimum_due_cents: 4_000,
    due_date: '2026-11-22',
    covered: true,
    ...overrides,
  };
}

describe('templateBrief', () => {
  it('leads with how the month is going against the plan', () => {
    expect(templateBrief({ budget, today }).summary).toBe("$1,360 left in November's plan.");
    expect(templateBrief({ budget: overBudget, today }).summary).toBe(
      'November is running $536 over plan.',
    );
  });

  it('says what was spent when there is no monthly plan', () => {
    const noPlan = {
      ...budget,
      month: { ...budget.month, limit_cents: null, remaining_cents: null },
    };
    expect(templateBrief({ budget: noPlan, today }).summary).toBe('$640 spent so far in November.');
  });

  it('adds the most urgent credit that still has money left', () => {
    const used = creditPeriod({ remaining_cents: 0, name: 'Dunkin credit' });
    const uber = creditPeriod({ remaining_cents: 1500, name: 'Uber Cash', days_left: 10 });
    expect(templateBrief({ budget, expiring: [used, uber], today }).summary).toBe(
      "$1,360 left in November's plan. Your $15 Uber Cash expires in 10 days.",
    );
  });

  it('says today and tomorrow for credits about to go', () => {
    const lastDay = creditPeriod({ days_left: 0 });
    expect(templateBrief({ expiring: [lastDay], today }).summary).toBe(
      'Your $10 Dining credit expires today.',
    );
    expect(templateBrief({ expiring: [{ ...lastDay, days_left: 1 }], today }).summary).toBe(
      'Your $10 Dining credit expires tomorrow.',
    );
  });

  it('mentions a payment due within three days, with whether checking covers it', () => {
    expect(templateBrief({ payments: [payment()], today }).summary).toBe(
      '$1,632 due on Gold Card Sunday, and checking covers it.',
    );
    expect(
      templateBrief({ payments: [payment({ due_date: '2026-11-21', covered: null })], today })
        .summary,
    ).toBe('$1,632 due on Gold Card tomorrow.');
  });

  it('leaves out payments that are further off or already past', () => {
    for (const due_date of ['2026-11-30', '2026-11-18']) {
      expect(templateBrief({ payments: [payment({ due_date })], today }).summary).toBe(
        'All quiet. Nothing is due and no credits are about to expire.',
      );
    }
  });

  it('keeps the summary within 140 characters by moving whole sentences to detail', () => {
    const longName = creditPeriod({
      remaining_cents: 20_000,
      name: 'Fine Hotels and Resorts property credit',
      days_left: 10,
    });
    const brief = templateBrief({
      budget: overBudget,
      expiring: [longName],
      payments: [payment({ name: 'Platinum Card from American Express' })],
      today,
    });
    expect(brief.summary.length).toBeLessThanOrEqual(BRIEF_MAX_CHARS);
    expect(brief.summary).toBe(
      'November is running $536 over plan. Your $200 Fine Hotels and Resorts property credit expires in 10 days.',
    );
    expect(brief.detail).toBe(
      '$1,632 due on Platinum Card from American Express Sunday, and checking covers it.',
    );
  });

  it('has a calm line when there is nothing to say', () => {
    expect(templateBrief({ today })).toEqual({
      summary: 'All quiet. Nothing is due and no credits are about to expire.',
    });
  });
});
