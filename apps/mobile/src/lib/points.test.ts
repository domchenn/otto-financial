import { describe, expect, it } from '@jest/globals';

import { confirmedLabel, parsePoints, pointsCaption, type Points } from './points';

const now = new Date(2026, 10, 20, 15, 0);

describe('confirmedLabel', () => {
  it('counts calendar days, not hours', () => {
    expect(confirmedLabel(new Date(2026, 10, 20, 8).toISOString(), now)).toBe('Confirmed today');
    expect(confirmedLabel(new Date(2026, 10, 19, 23).toISOString(), now)).toBe(
      'Confirmed yesterday',
    );
    expect(confirmedLabel(new Date(2026, 10, 10, 9).toISOString(), now)).toBe(
      'Confirmed 10 days ago',
    );
  });

  it('shows the date once it is over a month old', () => {
    expect(confirmedLabel(new Date(2026, 8, 2, 12).toISOString(), now)).toBe('Confirmed Sep 2');
  });
});

describe('parsePoints', () => {
  it('accepts commas and spaces', () => {
    expect(parsePoints('120,500')).toBe(120500);
    expect(parsePoints(' 0 ')).toBe(0);
  });

  it('rejects anything that is not a whole number', () => {
    expect(parsePoints('')).toBeNull();
    expect(parsePoints('12.5')).toBeNull();
    expect(parsePoints('-3')).toBeNull();
    expect(parsePoints('abc')).toBeNull();
  });
});

describe('pointsCaption', () => {
  const program = (confirmed: boolean) => ({
    id: confirmed ? 'amex-mr' : 'chase-ur',
    name: '',
    short_name: '',
    cards: [],
    confirmed_points: confirmed ? 1 : null,
    confirmed_at: confirmed ? now.toISOString() : null,
    earned_since: 0,
    estimated_points: confirmed ? 1 : null,
  });
  const points = (confirmed: boolean[]): Points => ({
    total_points: 0,
    confirmed_count: confirmed.filter(Boolean).length,
    programs: confirmed.map(program),
  });

  it('asks for balances until every program has one', () => {
    expect(pointsCaption(points([]))).toBe('No points cards yet');
    expect(pointsCaption(points([false, false]))).toBe('Add your balance');
    expect(pointsCaption(points([true, false]))).toBe('Add 1 more balance');
    expect(pointsCaption(points([true, true]))).toBe('Estimated');
  });
});
