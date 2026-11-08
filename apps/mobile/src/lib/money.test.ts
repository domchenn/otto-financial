import { describe, expect, it } from '@jest/globals';

import { formatCents, formatCompact, formatNumber } from './money';

describe('formatCents', () => {
  it('formats whole dollars by default', () => {
    expect(formatCents(50000)).toBe('$500');
    expect(formatCents(0)).toBe('$0');
  });

  it('truncates toward zero so "left to spend" never overstates', () => {
    expect(formatCents(31160)).toBe('$311');
    expect(formatCents(99)).toBe('$0');
  });

  it('shows cents when asked', () => {
    expect(formatCents(1645, { cents: true })).toBe('$16.45');
    expect(formatCents(186240, { cents: true })).toBe('$1,862.40');
    expect(formatCents(42000, { cents: true })).toBe('$420.00');
  });

  it('shows cents only when non-zero in auto mode', () => {
    expect(formatCents(42000, { cents: 'auto' })).toBe('$420');
    expect(formatCents(42050, { cents: 'auto' })).toBe('$420.50');
  });

  it('uses a true minus sign for negatives and an optional plus sign', () => {
    expect(formatCents(-32500)).toBe('−$325');
    expect(formatCents(28700, { sign: true })).toBe('+$287');
    expect(formatCents(0, { sign: true })).toBe('$0');
  });

  it('ignores fractional cents', () => {
    expect(formatCents(1645.9, { cents: true })).toBe('$16.45');
  });
});

describe('formatNumber and formatCompact', () => {
  it('groups thousands', () => {
    expect(formatNumber(142800)).toBe('142,800');
  });

  it('compacts to k above 1000', () => {
    expect(formatCompact(142800)).toBe('143k');
    expect(formatCompact(320)).toBe('320');
  });
});
