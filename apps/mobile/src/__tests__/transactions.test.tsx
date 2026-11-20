import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, screen } from '@testing-library/react-native';

import Transactions from '@/app/(app)/transactions/index';
import { groupByDay } from '@/lib/finance';
import type { TransactionParams } from '@/lib/api';
import { checking, gold, refund, renderScreen, sweetgreen } from '@/test/fixtures';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: jest.fn() },
  useLocalSearchParams: () => ({}),
}));

const mockParams: TransactionParams[] = [];
jest.mock('@/lib/api', () => {
  const f = jest.requireActual<typeof import('@/test/fixtures')>('@/test/fixtures');
  return {
    useAccounts: () => f.mockResult([f.gold, f.checking]),
    useTransactions: (params: TransactionParams) => {
      mockParams.push(params);
      return f.mockResult(params.q === 'zzz' ? [] : [f.sweetgreen, f.refund]);
    },
  };
});
jest.mock('@/lib/useRefresh', () => ({ useRefresh: () => undefined }));

beforeEach(() => {
  mockParams.length = 0;
  mockPush.mockClear();
});

describe('Transactions', () => {
  it('groups purchases by day and opens one', async () => {
    await renderScreen(<Transactions />);
    expect(screen.getByText('Today')).toBeOnTheScreen();
    expect(screen.getByText('$16.45')).toBeOnTheScreen();
    expect(screen.getByText('+$5.00')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Sweetgreen'));
    expect(mockPush).toHaveBeenCalledWith(`/transaction/${sweetgreen.id}`);
  });

  it('filters by card', async () => {
    await renderScreen(<Transactions />);
    await fireEvent.press(screen.getByRole('button', { name: `${gold.name} ·· ${gold.mask}` }));
    expect(mockParams.at(-1)?.account_id).toBe(gold.id);
    await fireEvent.press(screen.getByRole('button', { name: 'All' }));
    expect(mockParams.at(-1)?.account_id).toBeUndefined();
    expect(
      screen.getByRole('button', { name: `${checking.name} ·· ${checking.mask}` }),
    ).toBeOnTheScreen();
  });

  it('searches merchants after typing stops', async () => {
    jest.useFakeTimers();
    await renderScreen(<Transactions />);
    await fireEvent.changeText(screen.getByLabelText('Search merchants'), 'zzz');
    await act(async () => {
      jest.advanceTimersByTime(400);
    });
    expect(mockParams.at(-1)?.q).toBe('zzz');
    expect(screen.getByText('Nothing matches "zzz".')).toBeOnTheScreen();
    expect(screen.queryByText(refund.merchant_name!)).toBeNull();
    jest.useRealTimers();
  });
});

describe('Transactions across years', () => {
  // Regression: Plaid returns two years of history, and grouping by the "Nov 3" label gave
  // two groups the same React key (and merged nothing), crashing the list.
  it('keeps the same calendar day in different years apart, with the year shown', async () => {
    const thisYear = { ...sweetgreen, id: 'a', date: '2026-01-03' };
    const lastYear = { ...sweetgreen, id: 'b', date: '2025-01-03' };
    const groups = groupByDay([thisYear, lastYear], new Date(2026, 10, 19));
    expect(groups.map((g) => g.key)).toEqual(['2026-01-03', '2025-01-03']);
    expect(groups.map((g) => g.day)).toEqual(['Jan 3', 'Jan 3, 2025']);
  });
});
