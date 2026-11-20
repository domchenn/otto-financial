import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import Home from '@/app/(app)/(tabs)/index';
import type { Summary, Transaction } from '@/lib/finance';
import type { Benefits } from '@/lib/credits';
import { benefits, refund, renderScreen, mockResult, summary, sweetgreen } from '@/test/fixtures';

jest.mock('@clerk/expo', () => ({ useUser: () => ({ user: { firstName: 'Dominic' } }) }));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }));

let mockSummary: Summary | undefined;
let mockSummaryError = false;
let mockTransactions: Transaction[] | undefined;
let mockBenefits: Benefits | undefined;
jest.mock('@/lib/api', () => ({
  useSummary: () => mockResult(mockSummary, { isError: mockSummaryError }),
  useTransactions: () => mockResult(mockTransactions),
  useBenefits: () => mockResult(mockBenefits),
  useNetWorth: () =>
    mockResult(jest.requireActual<typeof import('@/test/fixtures')>('@/test/fixtures').netWorth),
}));
jest.mock('@/lib/useRefresh', () => ({ useRefresh: () => undefined }));

beforeEach(() => {
  mockSummary = summary;
  mockSummaryError = false;
  mockTransactions = [sweetgreen, refund];
  mockBenefits = benefits;
  mockPush.mockClear();
});

describe('Home', () => {
  it('leads with what is left this week from real spend', async () => {
    await renderScreen(<Home />);
    // Sample weekly budget is $500; $120 spent.
    expect(screen.getByText('$380')).toBeOnTheScreen();
    expect(screen.getByText(/left to spend this week/)).toBeOnTheScreen();
    expect(screen.getByText("You've spent $120 since Monday.")).toBeOnTheScreen();
    expect(screen.getByText(/Dominic/)).toBeOnTheScreen();
  });

  it('says when spending is over budget', async () => {
    mockSummary = { ...summary, week_spent_cents: 62000 };
    await renderScreen(<Home />);
    expect(screen.getByText("You're $120 over this week's budget.")).toBeOnTheScreen();
  });

  it('shows the next payment and opens that card', async () => {
    await renderScreen(<Home />);
    expect(screen.getByText('$610')).toBeOnTheScreen();
    expect(screen.getByText('Gold Card · Due in 3 days')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Next payment'));
    expect(mockPush).toHaveBeenCalledWith('/card/acc-gold');
  });

  it('lists recent purchases and refunds', async () => {
    await renderScreen(<Home />);
    expect(screen.getByText('Sweetgreen')).toBeOnTheScreen();
    expect(screen.getByText('$16.45')).toBeOnTheScreen();
    expect(screen.getByText('+$5.00')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Sweetgreen'));
    expect(mockPush).toHaveBeenCalledWith('/transaction/txn-1');
  });

  it('asks to connect cards before any bank is linked', async () => {
    mockSummary = { ...summary, has_connections: false, upcoming_payments: [] };
    mockTransactions = [];
    await renderScreen(<Home />);
    expect(screen.getByText('No purchases yet.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Connect cards' }));
    expect(mockPush).toHaveBeenCalledWith('/onboarding/connect');
  });

  it('nudges about the most urgent credit and opens it', async () => {
    await renderScreen(<Home />);
    expect(screen.getByText('Otto noticed')).toBeOnTheScreen();
    expect(
      screen.getByText('Your $10 Gold Card dining credit resets in 3 days.'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Show me how' }));
    expect(mockPush).toHaveBeenCalledWith('/credits/p-dining');
  });

  it('dismisses the Otto nudge with Later', async () => {
    await renderScreen(<Home />);
    await fireEvent.press(screen.getByRole('button', { name: 'Later' }));
    expect(screen.queryByText('Otto noticed')).toBeNull();
  });

  it('has no nudge when no credit needs attention', async () => {
    mockBenefits = { ...benefits, needs_attention: [] };
    await renderScreen(<Home />);
    expect(screen.queryByText('Otto noticed')).toBeNull();
  });

  it('shows credits that reset this month', async () => {
    await renderScreen(<Home />);
    expect(screen.getByText('$17')).toBeOnTheScreen();
    expect(screen.getByText('2 expire this month')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Credits to use'));
    expect(mockPush).toHaveBeenCalledWith('/credits');
  });

  it('tells the user when data could not load', async () => {
    mockSummary = undefined;
    mockSummaryError = true;
    await renderScreen(<Home />);
    expect(screen.getByText(/couldn't reach your data/)).toBeOnTheScreen();
  });

  it('shows net worth and opens its screen', async () => {
    await renderScreen(<Home />);
    expect(screen.getByText('Up $120 this week.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Net worth'));
    expect(mockPush).toHaveBeenCalledWith('/net-worth');
  });
});
