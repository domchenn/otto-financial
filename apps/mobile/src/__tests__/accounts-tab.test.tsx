import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import Accounts from '@/app/(app)/(tabs)/accounts';
import type { Account, Summary } from '@/lib/finance';
import {
  brokerage,
  checking,
  gold,
  mockMutation,
  renderScreen,
  mockResult,
  summary,
} from '@/test/fixtures';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 0 } }));

let mockSummary: Summary = summary;
let mockAccounts: Account[] | undefined = [];
const mockLink = mockMutation();
jest.mock('@/lib/api', () => {
  const fixtures = jest.requireActual<typeof import('@/test/fixtures')>('@/test/fixtures');
  return {
    useSummary: () => mockResult(mockSummary),
    useAccounts: () => mockResult(mockAccounts),
    useLinkBank: () => mockLink,
    useNetWorth: () => mockResult(fixtures.netWorth),
    useBudget: () => mockResult(fixtures.budget),
    usePrepareLink: () => {},
  };
});
jest.mock('@/lib/linkAlerts', () => ({ linkAlerts: { onSuccess: jest.fn(), onError: jest.fn() } }));
jest.mock('@/lib/useRefresh', () => ({ useRefresh: () => undefined }));

const savings: Account = {
  ...checking,
  id: 'acc-savings',
  name: 'High-yield savings',
  institution_name: 'American Express',
  mask: '7791',
  subtype: 'savings',
  current_cents: 1_133_655,
};

beforeEach(() => {
  mockSummary = summary;
  mockAccounts = [gold, checking, brokerage];
  mockPush.mockClear();
  mockLink.mutate.mockClear();
});

describe('Accounts tab', () => {
  it('leads with net worth and its parts, and opens the net worth screen', async () => {
    await renderScreen(<Accounts />);
    expect(screen.getByText('$16,315')).toBeOnTheScreen();
    expect(screen.getAllByText('Investing')).toHaveLength(2); // the bar's legend and the group
    await fireEvent.press(screen.getByRole('button', { name: 'Net worth, $16,315' }));
    expect(mockPush).toHaveBeenCalledWith('/net-worth');
  });

  it('groups cash and investing with totals and each balance to the cent', async () => {
    mockAccounts = [gold, checking, savings, brokerage];
    await renderScreen(<Accounts />);
    expect(screen.getByRole('header', { name: 'Cash' })).toBeOnTheScreen();
    expect(screen.getByText('$16,336')).toBeOnTheScreen(); // $5,000 + $11,336.55
    expect(screen.getByText('High-yield savings')).toBeOnTheScreen();
    expect(screen.getByText('American Express ··7791')).toBeOnTheScreen();
    expect(screen.getByText('$11,336.55')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Investing' })).toBeOnTheScreen();
    expect(screen.getByText('Brokerage')).toBeOnTheScreen();
  });

  it("shows Porter's read when there's something worth saying", async () => {
    // $11,336 in savings, $5,000 in checking against a $2,000 plan and $610 due.
    mockAccounts = [gold, checking, savings];
    await renderScreen(<Accounts />);
    expect(screen.getByRole('header', { name: 'Porter' })).toBeOnTheScreen();
    expect(screen.getByText(/Checking is holding about \$2,300 more/)).toBeOnTheScreen();
  });

  it('has no Porter line when there is nothing to say', async () => {
    await renderScreen(<Accounts />);
    expect(screen.queryByRole('header', { name: 'Porter' })).toBeNull();
  });

  it('offers to connect retirement accounts and opens Plaid Link', async () => {
    await renderScreen(<Accounts />);
    await fireEvent.press(screen.getByRole('button', { name: 'Connect a 401(k), IRA or Roth' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Connect another account' }));
    expect(mockLink.mutate).toHaveBeenCalledTimes(2);
  });

  it('sums up the cards in one row that opens the card list', async () => {
    await renderScreen(<Accounts />);
    expect(screen.getByText('Credit cards · 1')).toBeOnTheScreen();
    expect(screen.getByText('$684 owed · 7% of limit')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText(/^Credit cards, 1/));
    expect(mockPush).toHaveBeenCalledWith('/cards');
  });

  it('says when no cards are connected', async () => {
    mockAccounts = [checking];
    await renderScreen(<Accounts />);
    expect(screen.getByText('No cards connected yet')).toBeOnTheScreen();
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
    await renderScreen(<Accounts />);
    expect(screen.getByText('Chase needs a quick sign-in.')).toBeOnTheScreen();
    expect(screen.getByText(/last updated 3 days ago/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Fix' }));
    expect(mockPush).toHaveBeenCalledWith('/settings/accounts');
  });

  it('has no warning when every bank is fine', async () => {
    await renderScreen(<Accounts />);
    expect(screen.queryByText(/needs a quick sign-in/)).toBeNull();
  });
});
