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
    expect(screen.getByText(/Porter started tracking/)).toBeOnTheScreen();
  });

  it('shows cash and investments against cards, without account toggles', async () => {
    await renderScreen(<NetWorthScreen />);
    expect(screen.getByText('Cash')).toBeOnTheScreen(); // the bar's legend
    expect(screen.getAllByText('$5,000')).toHaveLength(2); // legend and Checking header
    expect(screen.getAllByText('−$684')).toHaveLength(2); // legend and Credit cards header
    expect(screen.queryByRole('button', { name: 'Investments' })).toBeNull();
  });

  it('lists the accounts behind each part, cards as money owed', async () => {
    await renderScreen(<NetWorthScreen />);
    expect(screen.getAllByText('Checking').length).toBeGreaterThan(0);
    expect(screen.getByText('Brokerage')).toBeOnTheScreen();
    expect(screen.getByText('−$684.22')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Gold Card'));
    expect(mockPush).toHaveBeenCalledWith('/card/acc-gold');
  });
});
