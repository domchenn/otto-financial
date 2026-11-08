import { describe, expect, it } from '@jest/globals';

import {
  cards,
  categories,
  credits,
  creditSummary,
  getCard,
  goldValue,
  transactions,
  wallet,
  week,
} from './sample';

/**
 * The sample data stands in for real APIs, so its figures must agree with each other the
 * way real data would. These checks catch a screen showing one total and a list summing
 * to another.
 */
describe('sample data consistency', () => {
  it('stores every amount as integer cents', () => {
    const amounts = [
      ...cards.map((c) => c.balanceCents),
      ...credits.map((c) => c.amountCents),
      ...categories.map((c) => c.cents),
      ...transactions.map((t) => t.cents),
    ];
    for (const a of amounts) expect(Number.isInteger(a)).toBe(true);
  });

  it('sums category spend to the weekly total', () => {
    expect(categories.reduce((s, c) => s + c.cents, 0)).toBe(week.spentCents);
  });

  it('sums each category transaction list to the category total where listed in full', () => {
    const dining = categories.find((c) => c.id === 'dining');
    const diningTx = transactions.filter((t) => t.category === 'dining');
    expect(diningTx.reduce((s, t) => s + t.cents, 0)).toBe(dining?.cents);
  });

  it('sums card balances to the wallet total', () => {
    expect(wallet.totalBalanceCents).toBe(cards.reduce((s, c) => s + c.balanceCents, 0));
  });

  it('counts this month’s credits as ready to use', () => {
    const monthly = credits.filter((c) => c.group !== 'year');
    expect(creditSummary.readyThisMonthCents).toBe(6500);
    expect(creditSummary.expiringThisMonth).toBe(monthly.length);
  });

  it('only references cards that exist', () => {
    for (const t of transactions) expect(getCard(t.card)).toBeDefined();
    for (const c of credits) expect(getCard(c.card)).toBeDefined();
    for (const t of transactions) if (t.missed) expect(getCard(t.missed.better)).toBeDefined();
  });

  it('uses unique ids', () => {
    const ids = [
      ...cards.map((c) => c.id),
      ...credits.map((c) => c.id),
      ...transactions.map((t) => t.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps the daily chart in line with the weekly total', () => {
    const spent = week.days.reduce<number>((s, d) => s + (d ?? 0), 0);
    expect(spent).toBe(week.spentCents);
  });

  it('keeps the Gold fee math positive', () => {
    expect(goldValue.creditsUsedCents + goldValue.extraPointsCents - goldValue.feeCents).toBe(
      28700,
    );
  });
});
