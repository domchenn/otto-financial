import { environment } from '@/config/environment';
import type { HomeSummary } from '@/data/home-data';

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
  };
};

function formatCurrency(amount: string, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function formatChange(amount: string, currency: string, period: 'MONTH_TO_DATE') {
  const numericAmount = Number(amount);
  const sign = numericAmount >= 0 ? '+' : '-';
  const formattedAmount = formatCurrency(String(Math.abs(numericAmount)), currency);
  const periodLabel = period === 'MONTH_TO_DATE' ? 'this month' : 'this period';

  return `${sign}${formattedAmount} ${periodLabel}`;
}

export async function fetchHomeSummary(fallback: HomeSummary, signal?: AbortSignal): Promise<HomeSummary> {
  const response = await fetch(`${environment.apiUrl}/api/v1/home`, { signal });

  if (!response.ok) {
    throw new Error(`Home request failed with status ${response.status}`);
  }

  const data = (await response.json()) as HomeApiResponse;

  return {
    greeting: `Good evening, ${data.user.firstName}`,
    netWorth: {
      ...fallback.netWorth,
      value: formatCurrency(data.netWorth.amount, data.netWorth.currency),
      delta: formatChange(
        data.netWorth.change.amount,
        data.netWorth.currency,
        data.netWorth.change.period
      ),
    },
  };
}
