import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, screen } from '@testing-library/react-native';

import Transactions from '@/app/(app)/transactions/index';
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
