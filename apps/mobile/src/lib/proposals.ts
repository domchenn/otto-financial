/**
 * "Porter's on it" on Home (handoff §5): prepared actions the user approves or puts off.
 *
 * The approvals service (agent core) will own these, with an audit log. Until then Home
 * derives them here from API data, only for kinds whose numbers are fully known. Porter is
 * read-only today, so `primary` opens the place to act rather than moving money.
 */
import type { Budget } from './budget';
import type { CreditPeriod } from './credits';
import type { Account, Payment } from './finance';
import { formatCents } from './money';

export type ProposalKind =
  'sweep_cash' | 'default_card' | 'use_credit' | 'cancel_sub' | 'enroll_benefit';

export type ProposalStatus = 'proposed' | 'approved' | 'done' | 'dismissed';

export type Proposal = {
  id: string;
  kind: ProposalKind;
  title: string;
  reason: string;
  impact?: string;
  primary: string;
  secondary?: string;
  status: ProposalStatus;
  /** Where the primary action goes until approvals can act directly. */
  href: string;
};

/** Credits worth a nudge: money left and resetting within two weeks. */
export const USE_CREDIT_WITHIN_DAYS = 14;

/** Don't suggest moving less than this; small sweeps aren't worth the attention. */
export const MIN_SWEEP_CENTS = 50_000;

const whole = (cents: number) => formatCents(cents);

function creditProposal(c: CreditPeriod): Proposal {
  const days =
    c.days_left <= 0 ? 'today' : c.days_left === 1 ? 'tomorrow' : `in ${c.days_left} days`;
  return {
    id: `use_credit:${c.period_id}`,
    kind: 'use_credit',
    title: `Use your ${whole(c.remaining_cents)} ${c.name}`,
    reason: `${c.card_name}${c.account_mask ? ` ··${c.account_mask}` : ''} · resets ${days}`,
    primary: 'Show me how',
    secondary: 'Not now',
    status: 'proposed',
    href: `/credits/${c.period_id}`,
  };
}

/**
 * Checking above a month of spending plus the card payments coming up is idle. A month of
 * spending is the user's monthly plan, or this month's actual spend once it's past the plan.
 * Only offered with a monthly plan and a savings account to move it to. Rounded down to $100.
 */
export function idleCheckingCents(
  accounts: Account[],
  budget: Budget | undefined,
  payments: Payment[],
): number | null {
  const limit = budget?.month.limit_cents;
  if (!budget || !limit) return null;
  // A month of spending is the plan, or what's already been spent if that's more.
  const plan = Math.max(limit, budget.month.spent_cents);
  const cash = accounts.filter((a) => a.kind === 'depository');
  const checking = cash.filter((a) => a.subtype === 'checking');
  if (checking.length === 0 || !cash.some((a) => a.subtype === 'savings')) return null;
  const held = checking.reduce((sum, a) => sum + (a.current_cents ?? 0), 0);
  const due = payments.reduce((sum, p) => sum + p.amount_cents, 0);
  const idle = Math.floor((held - plan - due) / 10_000) * 10_000;
  return idle >= MIN_SWEEP_CENTS ? idle : null;
}

export type ProposalInput = {
  accounts?: Account[];
  budget?: Budget;
  payments?: Payment[];
  /** Benefits.needs_attention: most urgent first. */
  expiring?: CreditPeriod[];
};

/** Everything Porter would put in front of the user right now, most valuable first. */
export function deriveProposals({
  accounts = [],
  budget,
  payments = [],
  expiring = [],
}: ProposalInput): Proposal[] {
  const out: Proposal[] = [];
  const idle = idleCheckingCents(accounts, budget, payments);
  if (idle !== null) {
    out.push({
      id: 'sweep_cash',
      kind: 'sweep_cash',
      title: `Move ${whole(idle)} of idle checking into savings`,
      reason: 'You keep more in checking than a month of spending plus your card payments',
      primary: 'Show me',
      secondary: 'Not now',
      status: 'proposed',
      href: '/accounts',
    });
  }
  for (const c of expiring) {
    if (c.remaining_cents > 0 && c.days_left <= USE_CREDIT_WITHIN_DAYS) out.push(creditProposal(c));
  }
  return out;
}

/** Home shows at most two, skipping the ones the user put off. */
export function visibleProposals(all: Proposal[], dismissed: ReadonlySet<string>): Proposal[] {
  return all.filter((p) => p.status === 'proposed' && !dismissed.has(p.id)).slice(0, 2);
}
