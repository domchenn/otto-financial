import { describe, expect, it } from '@jest/globals';

import { creditPeriod as credit } from '@/test/fixtures';

import { expiringSections, isUrgent, noticeSentence, resetsLabel } from './credits';

describe('resetsLabel', () => {
  it('counts days when it resets soon', () => {
    expect(resetsLabel(credit({ days_left: 3 }))).toBe('Resets in 3 days');
  });

  it('calls out the last day', () => {
    expect(resetsLabel(credit({ days_left: 1 }))).toBe('Last day today');
  });

  it('shows the date when it is further out', () => {
    expect(resetsLabel(credit({ days_left: 38, resets_on: '2027-01-01' }))).toBe('Resets Jan 1');
  });
});

describe('isUrgent', () => {
  it('is urgent with three days or fewer left and money unused', () => {
    expect(isUrgent(credit({ days_left: 3 }))).toBe(true);
    expect(isUrgent(credit({ days_left: 4 }))).toBe(false);
    expect(isUrgent(credit({ days_left: 2, remaining_cents: 0 }))).toBe(false);
  });
});

describe('expiringSections', () => {
  it('groups unused credits by how soon they reset and leaves used ones out', () => {
    const sections = expiringSections([
      credit({ period_id: 'resy', days_left: 38 }),
      credit({ period_id: 'dunkin', days_left: 7, remaining_cents: 700 }),
      credit({ period_id: 'dining', days_left: 7 }),
      credit({ period_id: 'used', days_left: 2, remaining_cents: 0 }),
      credit({ period_id: 'lulu', days_left: 20 }),
    ]);
    expect(sections.map((s) => [s.title, s.items.map((c) => c.period_id)])).toEqual([
      ['This week', ['dining', 'dunkin']],
      ['Within a month', ['lulu']],
      ['Later', ['resy']],
    ]);
  });
});

describe('noticeSentence', () => {
  it('names the amount left, the card and the days', () => {
    expect(noticeSentence(credit({ days_left: 3 }))).toBe(
      'Your $10 Gold Card dining credit resets in 3 days.',
    );
  });

  it('uses what is left, not the full amount', () => {
    expect(noticeSentence(credit({ remaining_cents: 350, days_left: 1 }))).toBe(
      'Today is the last day to use your $3.50 Gold Card dining credit.',
    );
  });
});
