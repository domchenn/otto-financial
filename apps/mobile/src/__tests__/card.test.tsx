import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import CardDetail from '@/app/(app)/card/[id]/index';
import { renderScreen } from '@/test/fixtures';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'acc-gold' }),
}));
jest.mock('@/lib/api', () => {
  const f = jest.requireActual<typeof import('@/test/fixtures')>('@/test/fixtures');
  return {
    useAccount: () => f.mockResult(f.gold),
    useTransactions: () => f.mockResult([f.sweetgreen]),
  };
});
jest.mock('@/lib/useRefresh', () => ({ useRefresh: () => undefined }));

describe('Card detail', () => {
  it('shows balance, statement, due date and minimum', async () => {
    await renderScreen(<CardDetail />);
    expect(screen.getByText('$684.22')).toBeOnTheScreen();
    expect(screen.getByText('Due in 3 days')).toBeOnTheScreen();
    expect(screen.getByText('Pay $610 to avoid interest. The minimum is $40.')).toBeOnTheScreen();
    expect(screen.getByText('$10,000')).toBeOnTheScreen();
    expect(screen.getByText('7% utilization · healthy')).toBeOnTheScreen();
  });

  it("lists this card's purchases and links to all of them", async () => {
    await renderScreen(<CardDetail />);
    expect(screen.getByText('Sweetgreen')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'See all' }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/transactions',
      params: { account: 'acc-gold' },
    });
  });
});
