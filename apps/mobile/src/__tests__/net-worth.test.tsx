import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import NetWorthScreen from '@/app/(app)/net-worth';
import { renderScreen } from '@/test/fixtures';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: jest.fn() },
}));
jest.mock('@/lib/api', () => {
  const f = jest.requireActual<typeof import('@/test/fixtures')>('@/test/fixtures');
  return {
    useNetWorth: () => f.mockResult(f.netWorth),
    useAccounts: () => f.mockResult([f.gold, f.checking, f.brokerage]),
  };
});
jest.mock('@/lib/useRefresh', () => ({ useRefresh: () => undefined }));

describe('Net worth', () => {
  it('shows the total and this week in words', async () => {
    await renderScreen(<NetWorthScreen />);
    expect(screen.getByText('$16,315')).toBeOnTheScreen();
    expect(screen.getByText('Up $120 this week.')).toBeOnTheScreen();
  });

  it('switches the sentence by period, and explains missing history', async () => {
    await renderScreen(<NetWorthScreen />);
    await fireEvent.press(screen.getByRole('tab', { name: '1M' }));
    expect(screen.getByText('Down $45 this month.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('tab', { name: '1Y' }));
    expect(screen.getByText(/Otto started tracking/)).toBeOnTheScreen();
  });

  it('lists the accounts behind each part, cards as money owed', async () => {
    await renderScreen(<NetWorthScreen />);
    expect(screen.getAllByText('Checking').length).toBeGreaterThan(0);
    expect(screen.getByText('Brokerage')).toBeOnTheScreen();
    expect(screen.getByText('−$684.22')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Gold Card'));
    expect(mockPush).toHaveBeenCalledWith('/card/acc-gold');
  });

  it('offers only the views you have accounts for', async () => {
    await renderScreen(<NetWorthScreen />);
    for (const name of ['Net worth', 'Checking', 'Investments', 'Cards']) {
      expect(screen.getByRole('button', { name })).toBeOnTheScreen();
    }
    expect(screen.queryByRole('button', { name: 'Savings' })).toBeNull();
  });

  it('switches to one kind of account, without the period history', async () => {
    await renderScreen(<NetWorthScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Investments' }));
    expect(screen.getByText('$12,000')).toBeOnTheScreen();
    expect(screen.getByText('1 account · 71% of what you have.')).toBeOnTheScreen();
    expect(screen.getByText('Brokerage')).toBeOnTheScreen();
    expect(screen.queryByText('Total Checking')).toBeNull();
    expect(screen.queryByRole('tab', { name: '1W' })).toBeNull();
  });

  it('shows cards as what you owe', async () => {
    await renderScreen(<NetWorthScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Cards' }));
    expect(screen.getByText('$684')).toBeOnTheScreen();
    expect(screen.getByText('Owed across 1 card.')).toBeOnTheScreen();
  });
});
