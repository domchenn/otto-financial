import { environment } from '@/config/environment';
import type { HomeData } from '@/data/home-data';

type HomeApiResponse = {
  user: {
    firstName: string;
  };
  netWorth: {
    amount: string;
    currency: string;
    change: {
      amount: string;
      period: 'MONTH_TO_DATE';
    };
    history: {
      date: string;
      amount: string;
    }[];
  };
  attentionItems: {
    id: string;
    type: 'BENEFIT_EXPIRING';
    title: string;
    description: string;
    amount: string;
    currency: string;
    dueAt: string;
  }[];
  suggestions: {
    id: string;
    type: 'CARD_OPTIMIZATION';
    category: 'OPTIMIZATION';
    title: string;
    description: string;
    pointsOpportunity: number;
  }[];
  recentActivity: {
    id: string;
    merchantName: string;
    category: 'TRAVEL';
    accountName: string;
    postedAt: string;
    amount: string;
    currency: string;
    direction: 'DEBIT' | 'CREDIT';
    status: 'POSTED';
    insight: {
      type: 'REWARD_MULTIPLIER';
      multiplier: number;
    } | null;
  }[];
};

function formatCurrency(amount: string, currency: string, maximumFractionDigits = 0) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits,
  }).format(Number(amount));
}

function formatChange(amount: string, currency: string, period: 'MONTH_TO_DATE') {
  const numericAmount = Number(amount);
  const sign = numericAmount >= 0 ? '+' : '-';
  const formattedAmount = formatCurrency(String(Math.abs(numericAmount)), currency);
  const periodLabel = period === 'MONTH_TO_DATE' ? 'this month' : 'this period';

  return `${sign}${formattedAmount} ${periodLabel}`;
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^./, (character) => character.toUpperCase());
}

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export async function fetchHomeData(fallback: HomeData, signal?: AbortSignal): Promise<HomeData> {
  const response = await fetch(`${environment.apiUrl}/api/v1/home`, { signal });

  if (!response.ok) {
    throw new Error(`Home request failed with status ${response.status}`);
  }

  const data = (await response.json()) as HomeApiResponse;

  return {
    ...fallback,
    greeting: `Good evening, ${data.user.firstName}`,
    netWorth: {
      ...fallback.netWorth,
      value: formatCurrency(data.netWorth.amount, data.netWorth.currency),
      delta: formatChange(
        data.netWorth.change.amount,
        data.netWorth.currency,
        data.netWorth.change.period
      ),
      history: data.netWorth.history.map((point) => ({
        date: point.date,
        amount: Number(point.amount),
      })),
    },
    attentionCount: `${data.attentionItems.length} ${data.attentionItems.length === 1 ? 'item' : 'items'} this week`,
    attentionItems: data.attentionItems.map((item) => ({
      title: item.title,
      description: item.description,
      status: `${formatCurrency(item.amount, item.currency)} left`,
    })),
    suggestions: data.suggestions.map((suggestion) => ({
      category: formatEnum(suggestion.category),
      title: suggestion.title,
      description: suggestion.description,
      value: `+${suggestion.pointsOpportunity.toLocaleString()} pts`,
      tone: 'success' as const,
    })),
    recentActivity: data.recentActivity.map((transaction) => {
      const positive = transaction.direction === 'CREDIT';
      const amount = formatCurrency(transaction.amount, transaction.currency, 2);

      return {
        initials: getInitials(transaction.merchantName),
        merchant: transaction.merchantName,
        details: `${formatEnum(transaction.category)} · ${transaction.accountName}`,
        amount: positive ? `+${amount}` : amount,
        status: transaction.insight
          ? `${transaction.insight.multiplier}x eligible`
          : formatEnum(transaction.status),
        positive,
      };
    }),
  };
}
