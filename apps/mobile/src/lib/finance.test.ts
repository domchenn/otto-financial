import { describe, expect, it } from '@jest/globals';

import {
  agoLabel,
  amountLabel,
  cardArt,
  categoryName,
  dayLabel,
  dueLabel,
  institutionCode,
  parseDate,
  utilizationLabel,
} from './finance';

const today = new Date(2026, 10, 19, 15, 0); // Thu Nov 19 2026, 3 pm local

describe('parseDate', () => {
  it('reads ISO dates as local calendar days, not UTC midnight', () => {
    const d = parseDate('2026-11-21');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 10, 21]);
  });
});

describe('dueLabel', () => {
  it.each([
    ['2026-11-19', 'Due today', true],
    ['2026-11-20', 'Due tomorrow', true],
    ['2026-11-24', 'Due in 5 days', true],
    ['2026-12-01', 'Due Dec 1', false],
    ['2026-11-15', 'Was due Nov 15', true],
  ])('%s → %s', (iso, text, soon) => {
    expect(dueLabel(iso, today)).toEqual({ text, soon });
  });

  it('handles cards with no due date', () => {
    expect(dueLabel(null, today)).toEqual({ text: 'No payment due', soon: false });
  });
});

describe('dayLabel', () => {
  it('names recent days and dates older ones', () => {
    expect(dayLabel('2026-11-19', today)).toBe('Today');
    expect(dayLabel('2026-11-18', today)).toBe('Yesterday');
    expect(dayLabel('2026-11-16', today)).toBe('Monday');
    expect(dayLabel('2026-11-01', today)).toBe('Nov 1');
  });
});

describe('agoLabel', () => {
  const now = new Date('2026-11-19T15:00:00Z');
  it.each([
    ['2026-11-19T14:59:40Z', 'just now'],
    ['2026-11-19T14:55:00Z', '5 min ago'],
    ['2026-11-19T13:00:00Z', '2 hr ago'],
    ['2026-11-18T14:00:00Z', '1 day ago'],
    ['2026-11-16T15:00:00Z', '3 days ago'],
  ])('%s → %s', (iso, label) => {
    expect(agoLabel(iso, now)).toBe(label);
  });
  it('says when a bank never synced', () => expect(agoLabel(null, now)).toBe('never updated'));
});

describe('amountLabel', () => {
  it('shows purchases plainly and money in with a plus', () => {
    expect(amountLabel(1645)).toBe('$16.45');
    expect(amountLabel(-500)).toBe('+$5.00');
  });
});

describe('categoryName', () => {
  it('maps Plaid categories to plain names', () => {
    expect(categoryName('FOOD_AND_DRINK')).toBe('Dining');
    expect(categoryName('SOMETHING_NEW')).toBe('Something new');
    expect(categoryName(null)).toBe('Uncategorized');
  });
});

describe('cardArt', () => {
  it('keeps real card colors for known cards and falls back otherwise', () => {
    expect(cardArt({ name: 'Gold Card', official_name: null }).color).toBe('#D8B45E');
    expect(cardArt({ name: 'Credit Card', official_name: 'Chase Freedom Flex' }).color).toBe(
      '#9CC6EC',
    );
    expect(cardArt({ name: 'Freedom Unlimited', official_name: null }).color).toBe('#3565C0');
    expect(cardArt({ name: 'Plaid Credit Card', official_name: null }).color).toBe('#2C3A4D');
  });
});

describe('utilizationLabel', () => {
  it('grades utilization', () => {
    expect(utilizationLabel(7)).toEqual({ text: '7% utilization · healthy', tone: 'mint' });
    expect(utilizationLabel(25).tone).toBe('butter');
    expect(utilizationLabel(45).tone).toBe('alert');
    expect(utilizationLabel(null).text).toBe('No credit limit reported');
  });
});

describe('institutionCode', () => {
  it('makes a two-letter monogram', () => {
    expect(institutionCode('American Express')).toBe('AE');
    expect(institutionCode('Chase')).toBe('CH');
    expect(institutionCode(null)).toBe('··');
  });
});
