/** Card credits from /v1/benefits (PRD F4), and the wording Otto uses for them. */
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
  needs_attention: CreditPeriod[];
  cards: BenefitCard[];
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

/** "Resets today", "Resets in 3 days", or "Resets Dec 1" when it's further out. */
export function resetsLabel(c: CreditPeriod): string {
  if (c.days_left <= 1) return 'Last day today';
  if (c.days_left <= 10) return `Resets in ${c.days_left} days`;
  return `Resets ${shortDate(c.resets_on)}`;
}

/** Few enough days left that the reset date should be shown in the alert color. */
export function isUrgent(c: CreditPeriod): boolean {
  return c.remaining_cents > 0 && c.days_left <= 3;
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

/** The "Otto noticed" line for the most urgent credit. */
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

export function findCredit(benefits: Benefits, periodId: string): CreditPeriod | undefined {
  return allCredits(benefits).find((c) => c.period_id === periodId);
}
