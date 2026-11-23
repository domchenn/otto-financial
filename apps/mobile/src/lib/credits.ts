/** Card credits from /v1/benefits (PRD F4), and the wording Porter uses for them. */
import { formatCents } from './money';

export type CreditPeriod = {
  period_id: string;
  account_id: string;
  card_id: string;
  card_name: string;
  account_mask: string | null;
  credit_id: string;
  name: string;
  cadence: 'monthly' | 'quarterly' | 'semiannual' | 'calendar_year' | 'cardmember_year';
  enrollment: boolean;
  channel: string | null;
  amount_cents: number;
  used_cents: number;
  remaining_cents: number;
  /** What it gave back (the whole credit once marked used) and what expired unused. */
  used_value_cents: number;
  missed_cents: number;
  confirmed: boolean;
  marked_used: boolean;
  start_date: string;
  end_date: string;
  resets_on: string;
  days_left: number;
};

export type BenefitCard = {
  account_id: string;
  account_name: string;
  account_mask: string | null;
  institution_name: string | null;
  card_id: string | null;
  card_name: string | null;
  issuer: string | null;
  source: 'guess' | 'user';
  anniversary_month: number | null;
  needs_anniversary_month: boolean;
  credits: CreditPeriod[];
};

export type Benefits = {
  remaining_cents: number;
  expiring_this_month_cents: number;
  expiring_this_month_count: number;
  used_this_year_cents: number;
  missed_this_year_cents: number;
  needs_attention: CreditPeriod[];
  cards: BenefitCard[];
  /** Every period this year across all cards, newest first. */
  history: CreditPeriod[];
};

export type CardProduct = {
  id: string;
  issuer: string;
  name: string;
  needs_anniversary: boolean;
};

const CADENCE_LABELS: Record<CreditPeriod['cadence'], string> = {
  monthly: 'monthly',
  quarterly: 'quarterly',
  semiannual: 'twice a year',
  calendar_year: 'yearly',
  cardmember_year: 'each card year',
};

export function cadenceLabel(cadence: CreditPeriod['cadence']): string {
  return CADENCE_LABELS[cadence];
}

function shortDate(iso: string): string {
  const [y = 0, m = 1, d = 1] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** "Last day today", "Resets in 3 days", "Resets Dec 1", or "Ended Oct 31" for a past one. */
export function resetsLabel(c: CreditPeriod): string {
  if (c.days_left < 1) return `Ended ${shortDate(c.end_date)}`;
  if (c.days_left === 1) return 'Last day today';
  if (c.days_left <= 10) return `Resets in ${c.days_left} days`;
  return `Resets ${shortDate(c.resets_on)}`;
}

/** Few enough days left that the reset date should be shown in the alert color. */
export function isUrgent(c: CreditPeriod): boolean {
  return c.remaining_cents > 0 && c.days_left >= 1 && c.days_left <= 3;
}

export function isUsed(c: CreditPeriod): boolean {
  return c.remaining_cents === 0;
}

export type CreditSection = { title: string; items: CreditPeriod[] };

/** Unused credits grouped by how soon they reset, soonest first. */
export function expiringSections(credits: CreditPeriod[]): CreditSection[] {
  const open = credits
    .filter((c) => !isUsed(c))
    .sort((a, b) => a.days_left - b.days_left || b.remaining_cents - a.remaining_cents);
  const sections: CreditSection[] = [
    { title: 'This week', items: open.filter((c) => c.days_left <= 7) },
    { title: 'Within a month', items: open.filter((c) => c.days_left > 7 && c.days_left <= 31) },
    { title: 'Later', items: open.filter((c) => c.days_left > 31) },
  ];
  return sections.filter((s) => s.items.length > 0);
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** The "Porter noticed" line for the most urgent credit. */
export function noticeSentence(c: CreditPeriod): string {
  const amount = formatCents(c.remaining_cents, { cents: 'auto' });
  const what = `${amount} ${c.card_name} ${lowerFirst(c.name)}`;
  if (c.days_left <= 1) return `Today is the last day to use your ${what}.`;
  return `Your ${what} resets in ${c.days_left} days.`;
}

/** Every credit across the user's cards. */
export function allCredits(benefits: Benefits): CreditPeriod[] {
  return benefits.cards.flatMap((card) => card.credits);
}

/** A current or past credit (past ones open from the "This year" list). */
export function findCredit(benefits: Benefits, periodId: string): CreditPeriod | undefined {
  return (
    allCredits(benefits).find((c) => c.period_id === periodId) ??
    benefits.history.find((c) => c.period_id === periodId)
  );
}

export type MonthSection = {
  key: string; // "2026-11"
  title: string; // "November"
  usedCents: number;
  missedCents: number;
  items: CreditPeriod[];
};

/**
 * This year's credits by month, newest first, for "used" and "missed". A period belongs to
 * the month it ended in (an open one to the current month). Periods with nothing used and
 * nothing missed yet are left out.
 */
export function historyByMonth(history: CreditPeriod[], today: string): MonthSection[] {
  const sections = new Map<string, MonthSection>();
  for (const c of history) {
    if (c.used_value_cents === 0 && c.missed_cents === 0) continue;
    const key = (c.end_date < today ? c.end_date : today).slice(0, 7);
    let section = sections.get(key);
    if (!section) {
      const [y = 0, m = 1] = key.split('-').map(Number);
      const title = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long' });
      section = { key, title, usedCents: 0, missedCents: 0, items: [] };
      sections.set(key, section);
    }
    section.usedCents += c.used_value_cents;
    section.missedCents += c.missed_cents;
    section.items.push(c);
  }
  return [...sections.values()].sort((a, b) => b.key.localeCompare(a.key));
}

/** "Used", "Missed", "Marked used" or "$4.23 of $10 used" for a past or current credit. */
export function historyLabel(c: CreditPeriod): string {
  if (c.marked_used) return 'Marked used';
  if (c.missed_cents > 0 && c.used_value_cents > 0) {
    const used = formatCents(c.used_value_cents, { cents: 'auto' });
    return `${used} of ${formatCents(c.amount_cents, { cents: 'auto' })} used`;
  }
  if (c.missed_cents > 0) return 'Missed';
  return 'Used';
}
