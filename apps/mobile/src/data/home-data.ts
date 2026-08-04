export type AttentionItem = {
  title: string;
  description: string;
  status: string;
};

export type Suggestion = {
  category: string;
  title: string;
  description: string;
  value: string;
  tone: 'default' | 'success' | 'danger';
};

export type RecentTransaction = {
  initials: string;
  merchant: string;
  details: string;
  amount: string;
  status: string;
  positive: boolean;
};

export type NetWorthHistoryPoint = {
  date: string,
  amount: number,
};

export type HomeData = {
  greeting: string;
  askPrompt: string;
  netWorth: {
    label: string;
    value: string;
    delta: string;
    period: string;
    history: readonly NetWorthHistoryPoint[];
  };
  attentionCount: string;
  attentionItems: readonly AttentionItem[];
  suggestions: readonly Suggestion[];
  recentActivity: readonly RecentTransaction[];
};

export const homeData = {
  greeting: 'Good evening, Dominic',
  askPrompt: 'Ask about your money',
  netWorth: {
    label: 'Net worth',
    value: '$128,406',
    delta: '+$3,182 this month',
    period: '6 months',
    history: [
      { date: '2026-02-01', amount: 115840 },
      { date: '2026-03-01', amount: 116920 },
      { date: '2026-04-01', amount: 119460 },
      { date: '2026-05-01', amount: 120110 },
      { date: '2026-06-01', amount: 123280 },
      { date: '2026-07-01', amount: 125224 },
      { date: '2026-07-31', amount: 128406 },
    ],
  },
  attentionCount: '3 items this week',
  attentionItems: [
    {
      title: 'Use your remaining Uber Cash',
      description: '$9 is still available and expires in 3 days.',
      status: '$9 left',
    },
    {
      title: 'Put your next eligible meal on Gold',
      description: 'Your Resy dining credit is still unused for this period.',
      status: '$50',
    },
    {
      title: 'Decide whether Platinum is worth renewing',
      description: 'Verified value is near break-even and the annual fee posts in 19 days.',
      status: '19d',
    },
  ],
  suggestions: [
    {
      category: 'Benefit',
      title: 'Use Uber Cash before month-end',
      description: 'Amex Platinum · One qualifying ride or Uber Eats purchase.',
      value: '$9 left',
      tone: 'default',
    },
    {
      category: 'Dining',
      title: 'Put your next eligible meal on Gold',
      description: 'Resy credit is still untouched for this period.',
      value: '$50 left',
      tone: 'default',
    },
    {
      category: 'Optimization',
      title: 'Switch dining spend to the better card',
      description: 'Recent meals were posted to a lower-earning card.',
      value: '+782 pts',
      tone: 'success',
    },
    {
      category: 'Annual fee',
      title: 'Decide whether Platinum is worth renewing',
      description: 'Compare realized value, remaining credits, and travel perks.',
      value: '19 days',
      tone: 'danger',
    },
  ],
  recentActivity: [
    {
      initials: 'DL',
      merchant: 'Delta Air Lines',
      details: 'Travel · Amex Platinum',
      amount: '$241.30',
      status: '5x eligible',
      positive: false,
    },
    {
      initials: 'RS',
      merchant: 'Raku Sake',
      details: 'Dining · Sapphire Preferred',
      amount: '$68.40',
      status: 'better card available',
      positive: false,
    },
    {
      initials: 'UB',
      merchant: 'Uber statement credit',
      details: 'Benefit posted',
      amount: '+$6.00',
      status: 'matched',
      positive: true,
    },
  ],
} satisfies HomeData;
