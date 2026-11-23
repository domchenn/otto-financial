/**
 * One plain sentence from Porter at the top of a screen (the "● PORTER" line). Until the
 * agent writes these, each comes from code over API numbers, and there's no line at all
 * rather than a generic one.
 */
import type { Budget } from './budget';
import type { Account, Payment } from './finance';
import { formatCents } from './money';
import { idleCheckingCents } from './proposals';

/** Card utilization at or above this hurts credit scores; worth saying. */
export const HIGH_UTILIZATION_PCT = 30;

const total = (accounts: Account[]) => accounts.reduce((s, a) => s + (a.current_cents ?? 0), 0);

/** The Accounts line: idle checking first, then high card utilization. */
export function accountsInsight({
  accounts,
  budget,
  payments,
  utilizationPct,
}: {
  accounts: Account[];
  budget: Budget | undefined;
  payments: Payment[];
  utilizationPct: number | null;
}): string | null {
  const idle = idleCheckingCents(accounts, budget, payments);
  if (idle !== null) {
    const cash = accounts.filter((a) => a.kind === 'depository');
    const savings = total(cash.filter((a) => a.subtype !== 'checking'));
    const checking = total(cash.filter((a) => a.subtype === 'checking'));
    const lead = savings > checking ? 'Most of your cash is in savings. ' : '';
    return `${lead}Checking is holding about ${formatCents(idle)} more than a month of spending plus your card payments.`;
  }
  if (utilizationPct !== null && utilizationPct >= HIGH_UTILIZATION_PCT) {
    return `Your cards are using ${utilizationPct}% of their limits. Under ${HIGH_UTILIZATION_PCT}% is better for your credit score.`;
  }
  return null;
}
