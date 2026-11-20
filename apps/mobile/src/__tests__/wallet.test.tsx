import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import Wallet from '@/app/(app)/(tabs)/wallet';
import type { Account, Summary } from '@/lib/finance';
import { checking, gold, mockMutation, renderScreen, mockResult, summary } from '@/test/fixtures';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }));

let mockSummary: Summary = summary;
let mockAccounts: Account[] = [];
const mockLink = mockMutation();
jest.mock('@/lib/api', () => ({
  useSummary: () => mockResult(mockSummary),
  useAccounts: () => mockResult(mockAccounts),
  useLinkBank: () => mockLink,
  usePrepareLink: () => {},
}));
jest.mock('@/lib/linkAlerts', () => ({ linkAlerts: { onSuccess: jest.fn(), onError: jest.fn() } }));
jest.mock('@/lib/useRefresh', () => ({ useRefresh: () => undefined }));

beforeEach(() => {
  mockSummary = summary;
  mockAccounts = [gold, checking];
  mockPush.mockClear();
  mockLink.mutate.mockClear();
});

describe('Wallet', () => {
  it('shows card totals, utilization and each card with its due date', async () => {
    await renderScreen(<Wallet />);
    expect(screen.getAllByText('$684.22')).toHaveLength(2);
    expect(screen.getByText('7% utilization · healthy')).toBeOnTheScreen();
    expect(screen.getByText('1 card')).toBeOnTheScreen();
    expect(screen.getByText('•• 1007 · Due in 3 days')).toBeOnTheScreen();
    expect(screen.queryByText('Total Checking')).toBeNull();
    await fireEvent.press(screen.getByText('Gold Card'));
    expect(mockPush).toHaveBeenCalledWith('/card/acc-gold');
  });

  it('warns when a bank needs a sign-in', async () => {
    mockSummary = {
      ...summary,
      attention: [
        {
          connection_id: 'conn-chase',
          institution_name: 'Chase',
          status: 'needs_reauth',
          last_synced_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
        },
      ],
    };
    await renderScreen(<Wallet />);
    expect(screen.getByText('Chase needs a quick sign-in.')).toBeOnTheScreen();
    expect(screen.getByText(/last updated 3 days ago/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Fix' }));
    expect(mockPush).toHaveBeenCalledWith('/settings/accounts');
  });

  it('has no warning when every bank is fine', async () => {
    await renderScreen(<Wallet />);
    expect(screen.queryByText(/needs a quick sign-in/)).toBeNull();
  });

  it('opens Plaid Link from the plus button', async () => {
    await renderScreen(<Wallet />);
    await fireEvent.press(screen.getByRole('button', { name: 'Connect another account' }));
    expect(mockLink.mutate).toHaveBeenCalled();
  });

  it('explains the empty state', async () => {
    mockAccounts = [];
    await renderScreen(<Wallet />);
    expect(screen.getByText('No cards connected yet. Tap + to connect one.')).toBeOnTheScreen();
  });
});
