import { describe, expect, it } from '@jest/globals';

import { budget, periodBudget as period } from '@/test/fixtures';

import {
  budgetSummary,
  draftBody,
  draftFrom,
  leadPeriod,
  remainingLabel,
  spentShare,
} from './budget';

describe('leadPeriod', () => {
  it('follows the chosen style', () => {
    expect(leadPeriod(budget)).toBe('week');
    expect(leadPeriod({ ...budget, style: 'monthly' })).toBe('month');
    expect(leadPeriod({ ...budget, style: 'none' })).toBeNull();
  });

  it('is null until budgets are set up', () => {
    expect(leadPeriod({ ...budget, configured: false, style: null })).toBeNull();
    expect(leadPeriod(undefined)).toBeNull();
  });
});

describe('budgetSummary', () => {
  it('describes the leading budget', () => {
    expect(budgetSummary(budget)).toBe('$500 a week');
    expect(budgetSummary({ ...budget, style: 'monthly' })).toBe('$2,000 a month');
    expect(budgetSummary({ ...budget, style: 'none' })).toBe('No limit');
    expect(budgetSummary({ ...budget, configured: false })).toBe('Not set');
  });
});

describe('remainingLabel', () => {
  it('says left or over', () => {
    expect(remainingLabel(period({ remaining_cents: 38000 }))).toBe('$380 left');
    expect(remainingLabel(period({ remaining_cents: -12000 }))).toBe('$120 over');
    expect(remainingLabel(period({ limit_cents: null, remaining_cents: null }))).toBeNull();
  });
});

describe('spentShare', () => {
  it('caps at a full bar and is empty without a limit', () => {
    expect(spentShare(period({ spent_cents: 12000, limit_cents: 50000 }))).toBeCloseTo(0.24);
    expect(spentShare(period({ spent_cents: 62000, limit_cents: 50000 }))).toBe(1);
    expect(spentShare(period({ limit_cents: null }))).toBe(0);
  });
});

describe('drafts', () => {
  it('starts from saved budgets or rough defaults', () => {
    expect(draftFrom(budget)).toEqual({
      style: 'weekly',
      weeklyCents: 50000,
      monthlyCents: 200000,
      excluded: [],
    });
    expect(draftFrom(undefined).style).toBe('weekly');
  });

  it('saves both limits whichever style leads', () => {
    expect(
      draftBody({
        style: 'monthly',
        weeklyCents: 40000,
        monthlyCents: 180000,
        excluded: ['TRAVEL'],
      }),
    ).toEqual({
      style: 'monthly',
      weekly_cents: 40000,
      monthly_cents: 180000,
      excluded_categories: ['TRAVEL'],
    });
  });
});
