import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import Cards from '@/app/(app)/cards';
import type { Account } from '@/lib/finance';
import { checking, gold, mockResult, renderScreen } from '@/test/fixtures';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: jest.fn() },
}));

let mockAccounts: Account[] = [];
jest.mock('@/lib/api', () => ({
  useSummary: () =>
    mockResult(jest.requireActual<typeof import('@/test/fixtures')>('@/test/fixtures').summary),
  useAccounts: () => mockResult(mockAccounts),
}));
jest.mock('@/lib/useRefresh', () => ({ useRefresh: () => undefined }));

beforeEach(() => {
  mockAccounts = [gold, checking];
  mockPush.mockClear();
});

describe('Cards', () => {
  it('lists only cards, each with its balance and due date, and opens one', async () => {
    await renderScreen(<Cards />);
    expect(screen.getByText('$684 owed across 1')).toBeOnTheScreen();
    expect(screen.getByText('$684.22')).toBeOnTheScreen();
    expect(screen.getByText('•• 1007 · Due in 3 days')).toBeOnTheScreen();
    expect(screen.queryByText('Total Checking')).toBeNull();
    await fireEvent.press(screen.getByText('Gold Card'));
    expect(mockPush).toHaveBeenCalledWith('/card/acc-gold');
  });

  it('shows utilization across the cards', async () => {
    await renderScreen(<Cards />);
    expect(screen.getByText('7% of your $10,000 limit used · healthy')).toBeOnTheScreen();
  });

  it('explains the empty state', async () => {
    mockAccounts = [checking];
    await renderScreen(<Cards />);
    expect(
      screen.getByText('No cards connected yet. Connect one from Accounts.'),
    ).toBeOnTheScreen();
  });
});
