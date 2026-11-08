/**
 * Sample data for the Otto screens until the real accounts, credits and spend pipeline land
 * (M1–M3). Every amount is integer cents. Replace reads from this module with API queries
 * screen by screen; nothing here is persisted.
 */
import type { ToneName } from '@/theme/tokens';

export type CardId = 'gold' | 'freedom-unlimited' | 'prime' | 'platinum' | 'freedom-flex' | 'bilt';

export type Card = {
  id: CardId;
  name: string;
  shortName: string;
  issuer: 'Amex' | 'Chase' | 'Bilt';
  last4: string;
  balanceCents: number;
  due: string;
  dueSoon?: boolean;
  color: string;
  chip: string;
  /** Text color used on the big card art. */
  ink: string;
  pointsThisMonth?: number;
  annualFeeCents?: number;
  bestFor?: string[];
  signupBonus?: { spentCents: number; targetCents: number; daysLeft: number; perDayCents: number };
};

export const cards: Card[] = [
  {
    id: 'gold',
    name: 'Gold Card',
    shortName: 'Gold',
    issuer: 'Amex',
    last4: '1007',
    balanceCents: 68422,
    due: 'Nov 21',
    color: '#D8B45E',
    chip: '#F5E3A8',
    ink: '#3B2A06',
    pointsThisMonth: 2940,
    annualFeeCents: 32500,
    bestFor: ['Dining · 4x', 'Groceries · 4x', 'Flights · 3x'],
    signupBonus: { spentCents: 264000, targetCents: 400000, daysLeft: 38, perDayCents: 3600 },
  },
  {
    id: 'freedom-unlimited',
    name: 'Freedom Unlimited',
    shortName: 'Freedom Unlimited',
    issuer: 'Chase',
    last4: '4410',
    balanceCents: 42000,
    due: 'Due in 5 days',
    dueSoon: true,
    color: '#3565C0',
    chip: '#F5D27A',
    ink: '#FFFFFF',
  },
  {
    id: 'prime',
    name: 'Prime Visa',
    shortName: 'Prime',
    issuer: 'Chase',
    last4: '3391',
    balanceCents: 25840,
    due: 'Nov 25',
    color: '#2C3A4D',
    chip: '#F5D27A',
    ink: '#FFFFFF',
  },
  {
    id: 'platinum',
    name: 'Platinum Card',
    shortName: 'Platinum',
    issuer: 'Amex',
    last4: '2008',
    balanceCents: 21460,
    due: 'Nov 28',
    color: '#D9D9DE',
    chip: '#B5B5BC',
    ink: '#17181C',
    annualFeeCents: 69500,
  },
  {
    id: 'freedom-flex',
    name: 'Freedom Flex',
    shortName: 'Freedom Flex',
    issuer: 'Chase',
    last4: '7702',
    balanceCents: 16318,
    due: 'Nov 18',
    color: '#9CC6EC',
    chip: '#F5D27A',
    ink: '#17181C',
  },
  {
    id: 'bilt',
    name: 'Bilt Mastercard',
    shortName: 'Bilt',
    issuer: 'Bilt',
    last4: '9012',
    balanceCents: 12200,
    due: 'Dec 1',
    color: '#141416',
    chip: '#7A7A80',
    ink: '#FFFFFF',
  },
];

export function getCard(id: string): Card | undefined {
  return cards.find((c) => c.id === id);
}

export const wallet = {
  totalBalanceCents: cards.reduce((sum, c) => sum + c.balanceCents, 0),
  utilizationPct: 8,
  nextDue: 'Nov 12',
};

export type CreditGroup = 'week' | 'month' | 'year';

export type Credit = {
  id: string;
  name: string;
  card: CardId;
  amountCents: number;
  resets: string;
  urgent?: boolean;
  group: CreditGroup;
  cadence: 'monthly' | 'annual';
  resetDate: string;
  /** 0–1 of the period elapsed. */
  elapsed: number;
  merchants?: string[];
  tip?: string;
  used?: boolean;
};

export const credits: Credit[] = [
  {
    id: 'gold-dining',
    name: 'Dining credit',
    card: 'gold',
    amountCents: 1000,
    resets: 'Resets in 3 days',
    urgent: true,
    group: 'week',
    cadence: 'monthly',
    resetDate: 'Nov 10',
    elapsed: 0.9,
    merchants: ['Grubhub', 'Seamless', 'The Cheesecake Factory', 'Five Guys', 'Goldbelly'],
    tip: 'Easiest win: order lunch on Grubhub before Sunday. Anything over $10 still earns 4x.',
  },
  {
    id: 'plat-uber',
    name: 'Uber Cash',
    card: 'platinum',
    amountCents: 1500,
    resets: 'Resets Nov 30',
    group: 'month',
    cadence: 'monthly',
    resetDate: 'Nov 30',
    elapsed: 0.23,
    merchants: ['Uber', 'Uber Eats'],
  },
  {
    id: 'plat-entertainment',
    name: 'Digital entertainment',
    card: 'platinum',
    amountCents: 2000,
    resets: 'Resets Nov 30',
    group: 'month',
    cadence: 'monthly',
    resetDate: 'Nov 30',
    elapsed: 0.23,
    merchants: ['Disney+', 'Hulu', 'ESPN+', 'Peacock', 'The New York Times'],
  },
  {
    id: 'plat-walmart',
    name: 'Walmart+ membership',
    card: 'platinum',
    amountCents: 1300,
    resets: 'Resets Nov 30',
    group: 'month',
    cadence: 'monthly',
    resetDate: 'Nov 30',
    elapsed: 0.23,
    merchants: ['Walmart+'],
  },
  {
    id: 'gold-dunkin',
    name: "Dunkin' credit",
    card: 'gold',
    amountCents: 700,
    resets: 'Resets Nov 30',
    group: 'month',
    cadence: 'monthly',
    resetDate: 'Nov 30',
    elapsed: 0.23,
    merchants: ["Dunkin'"],
  },
  {
    id: 'gold-resy',
    name: 'Resy credit',
    card: 'gold',
    amountCents: 5000,
    resets: 'By Dec 31',
    group: 'year',
    cadence: 'annual',
    resetDate: 'Dec 31',
    elapsed: 0.85,
    merchants: ['Any Resy restaurant in the US'],
  },
  {
    id: 'plat-saks',
    name: 'Saks credit',
    card: 'platinum',
    amountCents: 5000,
    resets: 'By Dec 31',
    group: 'year',
    cadence: 'annual',
    resetDate: 'Dec 31',
    elapsed: 0.85,
    merchants: ['Saks Fifth Avenue', 'saks.com'],
  },
  {
    id: 'plat-airline',
    name: 'Airline fee credit',
    card: 'platinum',
    amountCents: 20000,
    resets: 'By Dec 31',
    group: 'year',
    cadence: 'annual',
    resetDate: 'Dec 31',
    elapsed: 0.85,
    merchants: ['Your selected airline: bags, seats, lounge day passes'],
  },
];

export const usedCredits: { name: string; card: CardId; amountCents: number; when: string }[] = [
  { name: 'Uber Cash', card: 'gold', amountCents: 1000, when: 'Used Nov 3' },
  { name: 'Resy credit', card: 'gold', amountCents: 5000, when: 'Used Jun 14' },
  { name: 'CLEAR Plus', card: 'platinum', amountCents: 18900, when: 'Used Mar 2' },
];

export function getCredit(id: string): Credit | undefined {
  return credits.find((c) => c.id === id);
}

export const creditSummary = {
  readyThisMonthCents: credits
    .filter((c) => c.group !== 'year')
    .reduce((sum, c) => sum + c.amountCents, 0),
  usedThisYearCents: 61000,
  expiringThisMonth: credits.filter((c) => c.group !== 'year').length,
};

export type CategoryId = 'dining' | 'groceries' | 'transport' | 'shopping';

export const categories: { id: CategoryId; name: string; short: string; cents: number }[] = [
  { id: 'dining', name: 'Dining', short: 'DI', cents: 8210 },
  { id: 'groceries', name: 'Groceries', short: 'GR', cents: 5780 },
  { id: 'transport', name: 'Gas & rideshare', short: 'TR', cents: 3120 },
  { id: 'shopping', name: 'Shopping', short: 'SH', cents: 1730 },
];

export const week = {
  spentCents: categories.reduce((sum, c) => sum + c.cents, 0),
  limitCents: 50000,
  underPaceCents: 8800,
  /** Mon..Sun spend in cents; null = a day that hasn't happened yet. */
  days: [5120, 1480, 3410, 2650, 4150, 2030, null] as (number | null)[],
  todayIndex: 5,
  pointsEarned: 640,
  creditsUsedCents: 1500,
};

export type Transaction = {
  id: string;
  merchant: string;
  cents: number;
  card: CardId;
  multiplier: string;
  category: CategoryId;
  day: 'Today' | 'Yesterday' | 'Monday';
  time: string;
  points: number;
  missed?: { better: CardId; extraPoints: number };
};

export const transactions: Transaction[] = [
  {
    id: 't1',
    merchant: 'Sweetgreen',
    cents: 1645,
    card: 'gold',
    multiplier: '4x',
    category: 'dining',
    day: 'Today',
    time: '12:41 PM',
    points: 66,
  },
  {
    id: 't7',
    merchant: "Trader Joe's",
    cents: 4218,
    card: 'gold',
    multiplier: '4x',
    category: 'groceries',
    day: 'Today',
    time: '10:12 AM',
    points: 169,
  },
  {
    id: 't2',
    merchant: 'Chipotle',
    cents: 1320,
    card: 'freedom-unlimited',
    multiplier: '1.5x',
    category: 'dining',
    day: 'Yesterday',
    time: '7:05 PM',
    points: 20,
    missed: { better: 'gold', extraPoints: 33 },
  },
  {
    id: 't3',
    merchant: "Joe's Pizza",
    cents: 950,
    card: 'gold',
    multiplier: '4x',
    category: 'dining',
    day: 'Yesterday',
    time: '1:18 PM',
    points: 38,
  },
  {
    id: 't4',
    merchant: 'Cava',
    cents: 1585,
    card: 'gold',
    multiplier: '4x',
    category: 'dining',
    day: 'Monday',
    time: '12:30 PM',
    points: 63,
  },
  {
    id: 't5',
    merchant: 'Starbucks',
    cents: 610,
    card: 'gold',
    multiplier: '4x',
    category: 'dining',
    day: 'Monday',
    time: '8:44 AM',
    points: 24,
  },
  {
    id: 't6',
    merchant: "Domino's",
    cents: 2100,
    card: 'gold',
    multiplier: '4x',
    category: 'dining',
    day: 'Monday',
    time: '9:02 PM',
    points: 84,
  },
];

export function getTransaction(id: string): Transaction | undefined {
  return transactions.find((t) => t.id === id);
}

export const points = { total: 142800, travelValueCents: 214000, programs: 3, centsPerPoint: 2 };

export const nextPayment = { card: 'Freedom', cents: 42000, due: 'Nov 12' };

export const goldValue = {
  creditsUsedCents: 25000,
  extraPoints: 18100,
  extraPointsCents: 36200,
  feeCents: 32500,
  resyLeftCents: 5000,
};

export type Institution = {
  id: string;
  name: string;
  code: string;
  tone: ToneName;
  status: 'ok' | 'attention';
  updated: string;
  cards: string[];
};

export const institutions: Institution[] = [
  {
    id: 'chase',
    name: 'Chase',
    code: 'CH',
    tone: 'mint',
    status: 'attention',
    updated: 'last updated 3 days ago',
    cards: ['Freedom Unlimited', 'Freedom Flex', 'Prime Visa'],
  },
  {
    id: 'amex',
    name: 'American Express',
    code: 'AX',
    tone: 'sky',
    status: 'ok',
    updated: '2 min ago',
    cards: ['Gold Card', 'Platinum Card'],
  },
  {
    id: 'bilt',
    name: 'Bilt',
    code: 'BI',
    tone: 'lilac',
    status: 'ok',
    updated: '1 hr ago',
    cards: ['Bilt Mastercard'],
  },
];

export const trip = {
  destination: 'Japan',
  when: 'next spring',
  economyPoints: 80000,
  businessPoints: 190000,
};
