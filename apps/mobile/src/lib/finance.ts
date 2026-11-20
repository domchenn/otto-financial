/**
 * Types for the accounts API (backend `app/modules/accounts`) and pure helpers that turn them
 * into the sentences and labels the screens show. All amounts are integer cents; dates are
 * ISO `YYYY-MM-DD` strings in the user's timezone.
 */
import { formatCents } from './money';

export type ConnectionStatus = 'ok' | 'needs_reauth' | 'error';

export type Account = {
  id: string;
  connection_id: string;
  institution_name: string | null;
  name: string;
  official_name: string | null;
  mask: string | null;
  kind: 'depository' | 'credit' | 'loan' | 'investment' | 'other';
  subtype: string | null;
  current_cents: number | null;
  available_cents: number | null;
  limit_cents: number | null;
  statement_balance_cents: number | null;
  minimum_due_cents: number | null;
  next_due_date: string | null;
  last_payment_cents: number | null;
  last_payment_date: string | null;
  balances_updated_at: string | null;
};

export type Connection = {
  id: string;
  institution_name: string | null;
  status: ConnectionStatus;
  error_code: string | null;
  last_synced_at: string | null;
  accounts: Account[];
};

export type Transaction = {
  id: string;
  account_id: string;
  account_name: string;
  account_mask: string | null;
  institution_name: string | null;
  /** Positive = money out (a purchase); negative = money in. */
  amount_cents: number;
  date: string;
  authorized_at: string | null;
  name: string;
  merchant_name: string | null;
  category: string | null;
  pending: boolean;
};

export type Payment = {
  account_id: string;
  name: string;
  mask: string | null;
  amount_cents: number;
  minimum_due_cents: number | null;
  due_date: string;
  covered: boolean | null;
};

export type Summary = {
  net_worth: {
    assets_cents: number;
    liabilities_cents: number;
    net_cents: number;
    week_change_cents: number | null;
  };
  card_balance_cents: number;
  card_limit_cents: number;
  card_count: number;
  utilization_pct: number | null;
  upcoming_payments: Payment[];
  week_spent_cents: number;
  week_start: string;
  attention: {
    connection_id: string;
    institution_name: string | null;
    status: ConnectionStatus;
    last_synced_at: string | null;
  }[];
  has_connections: boolean;
};

/** Parse `YYYY-MM-DD` as a local calendar date (not UTC midnight). */
export function parseDate(iso: string): Date {
  const [y = 1970, m = 1, d = 1] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

const DAY_MS = 86_400_000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' });
const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

export function formatShortDate(iso: string): string {
  return monthDay.format(parseDate(iso));
}

export function formatTime(iso: string): string {
  return time.format(new Date(iso));
}

/** "Due today", "Due tomorrow", "Due in 5 days" within a week; otherwise "Due Nov 21". */
export function dueLabel(iso: string | null, today = new Date()): { text: string; soon: boolean } {
  if (!iso) return { text: 'No payment due', soon: false };
  const days = daysBetween(today, parseDate(iso));
  if (days < 0) return { text: `Was due ${formatShortDate(iso)}`, soon: true };
  if (days === 0) return { text: 'Due today', soon: true };
  if (days === 1) return { text: 'Due tomorrow', soon: true };
  if (days <= 7) return { text: `Due in ${days} days`, soon: true };
  return { text: `Due ${formatShortDate(iso)}`, soon: false };
}

/** "Today", "Yesterday", a weekday within the last week, "Nov 3", or "Nov 3, 2025" for another year. */
export function dayLabel(iso: string, today = new Date()): string {
  const date = parseDate(iso);
  const days = daysBetween(date, today);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days > 1 && days < 7) return weekday.format(date);
  if (date.getFullYear() !== today.getFullYear())
    return `${formatShortDate(iso)}, ${date.getFullYear()}`;
  return formatShortDate(iso);
}

/** Consecutive transactions grouped by calendar day (input is newest first). */
export function groupByDay(
  items: Transaction[],
  today = new Date(),
): { key: string; day: string; items: Transaction[] }[] {
  const groups: { key: string; day: string; items: Transaction[] }[] = [];
  for (const t of items) {
    const key = t.date.slice(0, 10);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(t);
    else groups.push({ key, day: dayLabel(key, today), items: [t] });
  }
  return groups;
}

/** "just now", "5 min ago", "2 hr ago", "3 days ago". */
export function agoLabel(iso: string | null, now = new Date()): string {
  if (!iso) return 'never updated';
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

export function merchantName(t: Pick<Transaction, 'merchant_name' | 'name'>): string {
  return t.merchant_name ?? t.name;
}

const CATEGORY_NAMES: Record<string, string> = {
  BANK_FEES: 'Bank fees',
  ENTERTAINMENT: 'Entertainment',
  FOOD_AND_DRINK: 'Dining',
  GENERAL_MERCHANDISE: 'Shopping',
  GENERAL_SERVICES: 'Services',
  GOVERNMENT_AND_NON_PROFIT: 'Government & charity',
  HOME_IMPROVEMENT: 'Home',
  INCOME: 'Income',
  LOAN_PAYMENTS: 'Payments',
  MEDICAL: 'Medical',
  PERSONAL_CARE: 'Personal care',
  RENT_AND_UTILITIES: 'Rent & utilities',
  TRANSFER_IN: 'Transfer in',
  TRANSFER_OUT: 'Transfer out',
  TRANSPORTATION: 'Transport',
  TRAVEL: 'Travel',
};

export function categoryName(code: string | null): string {
  if (!code) return 'Uncategorized';
  return CATEGORY_NAMES[code] ?? code.charAt(0) + code.slice(1).toLowerCase().replace(/_/g, ' ');
}

export type CardArt = { color: string; chip: string; ink: string };

/** Real card colors for the cards in the PRD portfolio; card art keeps them in both themes. */
const CARD_ART: [RegExp, CardArt][] = [
  [/platinum/i, { color: '#D9D9DE', chip: '#B5B5BC', ink: '#17181C' }],
  [/gold/i, { color: '#D8B45E', chip: '#F5E3A8', ink: '#3B2A06' }],
  [/sapphire/i, { color: '#1F3A68', chip: '#C9CED6', ink: '#FFFFFF' }],
  [/freedom flex/i, { color: '#9CC6EC', chip: '#F5D27A', ink: '#17181C' }],
  [/freedom/i, { color: '#3565C0', chip: '#F5D27A', ink: '#FFFFFF' }],
  [/bilt/i, { color: '#141416', chip: '#7A7A80', ink: '#FFFFFF' }],
  [/quicksilver/i, { color: '#8C9096', chip: '#D6D8DB', ink: '#FFFFFF' }],
  [/apple/i, { color: '#F2F2F4', chip: '#D0D0D5', ink: '#17181C' }],
];

const DEFAULT_ART: CardArt = { color: '#2C3A4D', chip: '#F5D27A', ink: '#FFFFFF' };

export function cardArt(account: Pick<Account, 'name' | 'official_name'>): CardArt {
  const label = `${account.name} ${account.official_name ?? ''}`;
  return CARD_ART.find(([pattern]) => pattern.test(label))?.[1] ?? DEFAULT_ART;
}

export function utilizationLabel(pct: number | null): {
  text: string;
  tone: 'mint' | 'butter' | 'alert';
} {
  if (pct === null) return { text: 'No credit limit reported', tone: 'butter' };
  if (pct < 10) return { text: `${pct}% utilization · healthy`, tone: 'mint' };
  if (pct < 30) return { text: `${pct}% utilization · fine`, tone: 'butter' };
  return { text: `${pct}% utilization · high`, tone: 'alert' };
}

export function institutionCode(name: string | null): string {
  if (!name) return '··';
  const words = name
    .replace(/[^A-Za-z ]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  const [first = '', second = ''] = words;
  const code = second ? first.charAt(0) + second.charAt(0) : first.slice(0, 2);
  return code.toUpperCase() || '··';
}

/** Purchases read as plain amounts ("$16.45"); money in reads as "+$5.00". */
export function amountLabel(amountCents: number): string {
  return amountCents < 0
    ? formatCents(-amountCents, { cents: true, sign: true })
    : formatCents(amountCents, { cents: true });
}

export type NetWorthPeriod = '1W' | '1M' | '3M' | '1Y' | 'All';

export type NetWorth = {
  net_cents: number;
  cash_cents: number;
  investments_cents: number;
  cards_cents: number;
  loans_cents: number;
  changes: { period: NetWorthPeriod; change_cents: number | null; since: string | null }[];
  tracking_since: string | null;
};

const PERIOD_PHRASE: Record<NetWorthPeriod, string> = {
  '1W': 'this week',
  '1M': 'this month',
  '3M': 'in the last 3 months',
  '1Y': 'this year',
  All: 'since Otto started tracking',
};

/** "Up $120 this week", or why there's no comparison yet. */
export function netWorthChangeSentence(netWorth: NetWorth, period: NetWorthPeriod): string {
  const change = netWorth.changes.find((c) => c.period === period);
  const phrase = PERIOD_PHRASE[period];
  if (!change || change.change_cents === null) {
    return netWorth.tracking_since
      ? `Otto started tracking ${formatShortDate(netWorth.tracking_since)}. Changes appear as days go by.`
      : 'Connect an account and Otto starts tracking your net worth.';
  }
  if (change.change_cents === 0) return `No change ${phrase}.`;
  const amount = formatCents(Math.abs(change.change_cents));
  return `${change.change_cents > 0 ? 'Up' : 'Down'} ${amount} ${phrase}.`;
}
