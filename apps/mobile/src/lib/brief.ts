/**
 * The daily brief on Home (handoff §5): `{ summary ≤ 140 chars, detail? }`.
 *
 * The model-written brief arrives with the agent core. Until then (and whenever it fails),
 * Porter writes this template from the same numbers, so the slot is never empty and never
 * guesses: every figure comes from the API.
 */
import type { Budget } from './budget';
import type { CreditPeriod } from './credits';
import { daysBetween, parseDate, type Payment } from './finance';
import { formatCents } from './money';

export type DailyBrief = { summary: string; detail?: string };

export const BRIEF_MAX_CHARS = 140;

export type BriefInput = {
  budget?: Budget;
  /** Credits that need attention, most urgent first (Benefits.needs_attention). */
  expiring?: CreditPeriod[];
  /** Upcoming card payments, soonest first (Summary.upcoming_payments). */
  payments?: Payment[];
  today?: Date;
};

const monthName = (d: Date) => d.toLocaleDateString('en-US', { month: 'long' });
const weekday = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long' });
const whole = (cents: number) => formatCents(cents);

/** How the month is going against the plan, or what's been spent with no plan. */
function monthSentence(budget: Budget, today: Date): string {
  const { spent_cents, limit_cents, remaining_cents } = budget.month;
  const month = monthName(today);
  if (limit_cents === null || remaining_cents === null) {
    return `${whole(spent_cents)} spent so far in ${month}.`;
  }
  if (remaining_cents < 0) return `${month} is running ${whole(-remaining_cents)} over plan.`;
  return `${whole(remaining_cents)} left in ${month}'s plan.`;
}

function creditSentence(c: CreditPeriod): string {
  const what = `${whole(c.remaining_cents)} ${c.name}`;
  if (c.days_left <= 0) return `Your ${what} expires today.`;
  if (c.days_left === 1) return `Your ${what} expires tomorrow.`;
  return `Your ${what} expires in ${c.days_left} days.`;
}

function paymentSentence(p: Payment, today: Date): string | null {
  const days = daysBetween(today, parseDate(p.due_date));
  if (days < 0 || days > 3) return null;
  const when = days === 0 ? 'today' : days === 1 ? 'tomorrow' : weekday(parseDate(p.due_date));
  const covered = p.covered === true ? ', and checking covers it' : '';
  return `${whole(p.amount_cents)} due on ${p.name} ${when}${covered}.`;
}

/**
 * Up to three short sentences in priority order: the month, then the most urgent of an
 * expiring credit or a payment due within three days. Sentences that would push the
 * summary past 140 characters move to `detail` instead of being cut mid-word.
 */
export function templateBrief({
  budget,
  expiring = [],
  payments = [],
  today = new Date(),
}: BriefInput): DailyBrief {
  const sentences: string[] = [];
  if (budget) sentences.push(monthSentence(budget, today));
  const credit = expiring.find((c) => c.remaining_cents > 0);
  if (credit) sentences.push(creditSentence(credit));
  const payment = payments[0] ? paymentSentence(payments[0], today) : null;
  if (payment) sentences.push(payment);

  if (sentences.length === 0) {
    return { summary: 'All quiet. Nothing is due and no credits are about to expire.' };
  }

  const summary: string[] = [];
  const detail: string[] = [];
  for (const s of sentences) {
    const next = [...summary, s].join(' ');
    if (detail.length === 0 && next.length <= BRIEF_MAX_CHARS) summary.push(s);
    else detail.push(s);
  }
  // A single sentence longer than the limit still has to show; the slot clamps it to 3 lines.
  if (summary.length === 0) summary.push(detail.shift() as string);
  const brief: DailyBrief = { summary: summary.join(' ') };
  if (detail.length) brief.detail = detail.join(' ');
  return brief;
}
