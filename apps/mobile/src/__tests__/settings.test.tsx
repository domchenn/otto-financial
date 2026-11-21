import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import Settings from '@/app/(app)/settings/index';
import type { Summary } from '@/lib/finance';
import { renderScreen, summary } from '@/test/fixtures';

jest.mock('@clerk/expo', () => ({
  useUser: () => ({
    user: { firstName: 'Dominic', primaryEmailAddress: { emailAddress: 'me@example.com' } },
  }),
  useAuth: () => ({ signOut: jest.fn() }),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: jest.fn() },
}));

let mockSummary: Summary = summary;
jest.mock('@/lib/api', () => ({
  useSummary: () => ({ data: mockSummary, isError: false }),
  useMe: () => ({ data: undefined, isError: false }),
  useBudget: () => ({
    data: jest.requireActual<typeof import('@/test/fixtures')>('@/test/fixtures').budget,
    isError: false,
  }),
}));

beforeEach(() => {
  mockSummary = summary;
  mockPush.mockClear();
});

describe('Settings', () => {
  it('says all banks are up to date', async () => {
    await renderScreen(<Settings />);
    expect(screen.getByText('All up to date')).toBeOnTheScreen();
  });

  it('counts banks that need attention and opens them', async () => {
    mockSummary = {
      ...summary,
      attention: [
        {
          connection_id: 'c',
          institution_name: 'Chase',
          status: 'needs_reauth',
          last_synced_at: null,
        },
      ],
    };
    await renderScreen(<Settings />);
    expect(screen.getByText('1 needs attention')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Connected accounts'));
    expect(mockPush).toHaveBeenCalledWith('/settings/accounts');
  });

  it('shows the budget and opens its settings', async () => {
    await renderScreen(<Settings />);
    expect(screen.getByText('$500 a week')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Budget'));
    expect(mockPush).toHaveBeenCalledWith('/settings/budget');
  });
});
