/**
 * Ask Porter (handoff §5). Every answer has the same shape the grounded assistant will
 * return: one plain answer sentence, optional plan steps, follow-ups to keep going, and the
 * accounts it was based on. Until the agent core lands, Ask answers a few canned topics from
 * sample data and says plainly that free-form questions aren't supported yet.
 */
import { formatCents, formatNumber } from './money';
import { categories, credits, getCard, points, trip, week, type CardId } from './sample';

export type AskTopic = 'dinner' | 'week' | 'japan' | 'credits';

export const ASK_QUESTIONS: Record<AskTopic, string> = {
  dinner: 'Which card for a $60 dinner tonight?',
  week: 'Summarize my week',
  japan: 'How close am I to Japan?',
  credits: 'What credits expire this month?',
};

export function isAskTopic(value: unknown): value is AskTopic {
  return typeof value === 'string' && Object.hasOwn(ASK_QUESTIONS, value);
}

export type PlanStep = {
  title: string;
  detail: string;
  done: boolean;
  /** Card whose swatch shows beside the step. */
  card?: CardId;
};

/** A "Keep going" chip: ask another topic, or open a screen. */
export type FollowUp = { label: string; topic?: AskTopic; href?: string };

export type AskAnswer = {
  answer: string;
  /** Part of `answer` to show in sage, e.g. the key amount. */
  highlight?: string;
  steps?: PlanStep[];
  followups: FollowUp[];
  basedOn: string[];
};

/** Where Ask was opened from (a tab route name), so suggestions can start there. */
export type AskContext = 'index' | 'accounts' | 'spending' | 'benefits' | undefined;

const card = (id: CardId) => getCard(id);
const cardLabel = (id: CardId) => {
  const c = card(id);
  return c ? `${c.issuer} ${c.shortName}` : id;
};

function dinner(): AskAnswer {
  const pts = 60 * 4;
  const value = formatCents(pts * points.centsPerPoint, { cents: true });
  const dining = credits.find((c) => c.id === 'gold-dining');
  return {
    answer: `Use your Amex Gold. It earns 4x on dining, so this dinner gets about ${pts} points, worth roughly ${value}.`,
    highlight: 'Amex Gold',
    steps: [
      {
        title: 'Pay with Amex Gold',
        detail: `4x on dining · about ${pts} points`,
        done: false,
        card: 'gold',
      },
      ...(dining
        ? [
            {
              title: `Your ${formatCents(dining.amountCents)} dining credit still counts`,
              detail: `Gold · ${dining.resets.toLowerCase()}`,
              done: false,
              card: 'gold' as const,
            },
          ]
        : []),
    ],
    followups: [
      { label: 'Summarize my week', topic: 'week' },
      { label: 'Credits expiring soon', topic: 'credits' },
    ],
    basedOn: ['Amex Gold', 'Freedom Unlimited', 'Bilt'],
  };
}

function summary(): AskAnswer {
  const groceries = categories.find((c) => c.id === 'groceries');
  const under = formatCents(week.underPaceCents);
  return {
    answer: `Solid week: ${formatCents(week.spentCents)} spent, ${under} under your usual pace, and the right card on 5 of 6 dinners.`,
    highlight: under,
    steps: [
      {
        title: 'Groceries went on Gold',
        detail: `4x on ${formatCents(groceries?.cents ?? 0, { cents: true })} · ${week.pointsEarned} points this week`,
        done: true,
        card: 'gold',
      },
      {
        title: 'Use your $10 dining credit',
        detail: 'Gold · resets Sunday',
        done: false,
        card: 'gold',
      },
      {
        title: 'Put Chipotle on Gold next time',
        detail: 'Freedom Unlimited earned about 33 points less',
        done: false,
      },
    ],
    followups: [
      { label: 'See spending', href: '/spending' },
      { label: 'Which card for dinner?', topic: 'dinner' },
    ],
    basedOn: ['Amex Gold', 'Freedom Unlimited', 'Chase Checking'],
  };
}

function japan(): AskAnswer {
  const businessPct = Math.round((points.total / trip.businessPoints) * 100);
  const toGo = Math.round((trip.businessPoints - points.total) / 1000);
  return {
    answer: `Closer than you think. You have enough for economy to ${trip.destination} ${trip.when}, and you're ${businessPct}% of the way to business class.`,
    highlight: 'enough for economy',
    steps: [
      {
        title: 'Economy is ready to book',
        detail: `About ${Math.round(trip.economyPoints / 1000)}k of your ${formatNumber(points.total)} points`,
        done: true,
      },
      {
        title: 'Finish the Gold sign-up bonus',
        detail: `Gets most of the ~${toGo}k points still needed for business`,
        done: false,
        card: 'gold',
      },
      {
        title: 'Watch for award seats',
        detail: 'Estimates: award prices change by date, airline and seats',
        done: false,
      },
    ],
    followups: [
      { label: 'Bonus progress', href: '/card/gold' },
      { label: 'Summarize my week', topic: 'week' },
    ],
    basedOn: ['Amex Membership Rewards', 'Chase Ultimate Rewards'],
  };
}

function expiring(): AskAnswer {
  const soon = credits.filter((c) => c.group !== 'year' && !c.used);
  const total = formatCents(soon.reduce((s, c) => s + c.amountCents, 0));
  const urgent = soon.find((c) => c.urgent) ?? soon[0];
  return {
    answer: urgent
      ? `${total} in credits reset this month. The ${formatCents(urgent.amountCents)} ${urgent.name.toLowerCase()} is the urgent one: it ${urgent.resets.toLowerCase()}.`
      : 'No credits reset this month.',
    highlight: total,
    steps: soon.map((c) => ({
      title: `Use your ${formatCents(c.amountCents)} ${c.name}`,
      detail: `${cardLabel(c.card)} · ${c.resets.toLowerCase()}`,
      done: false,
      card: c.card,
    })),
    followups: [
      { label: 'See all credits', href: '/benefits' },
      { label: 'Summarize my week', topic: 'week' },
    ],
    basedOn: [...new Set(soon.map((c) => cardLabel(c.card)))],
  };
}

const UNKNOWN: AskAnswer = {
  answer:
    'I can only answer a few questions for now, using sample data. Try one of these while the full Ask Porter is built.',
  followups: [
    { label: 'Summarize my week', topic: 'week' },
    { label: 'How close am I to Japan?', topic: 'japan' },
    { label: 'Which card for dinner?', topic: 'dinner' },
  ],
  basedOn: [],
};

export function answerFor(topic: AskTopic | 'unknown'): AskAnswer {
  switch (topic) {
    case 'dinner':
      return dinner();
    case 'week':
      return summary();
    case 'japan':
      return japan();
    case 'credits':
      return expiring();
    default:
      return UNKNOWN;
  }
}

/** Starting suggestions, with the one closest to the screen Ask was opened from first. */
export function suggestionsFor(from: AskContext): AskTopic[] {
  const first: Record<NonNullable<AskContext>, AskTopic> = {
    index: 'week',
    accounts: 'week',
    spending: 'dinner',
    benefits: 'credits',
  };
  const all: AskTopic[] = ['week', 'dinner', 'credits', 'japan'];
  const lead = from ? first[from] : undefined;
  return lead ? [lead, ...all.filter((t) => t !== lead)] : all;
}
