import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import Home from '@/app/(app)/(tabs)/index';
import type { Benefits } from '@/lib/credits';
import type { Budget } from '@/lib/budget';
import type { Summary, Transaction } from '@/lib/finance';
import {
  benefits,
  budget,
  periodBudget,
  refund,
  renderScreen,
  mockResult,
  summary,
  sweetgreen,
} from '@/test/fixtures';

jest.mock('@clerk/expo', () => ({ useUser: () => ({ user: { firstName: 'Dominic' } }) }));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }));

let mockSummary: Summary | undefined;
let mockSummaryError = false;
let mockTransactions: Transaction[] | undefined;
let mockBenefits: Benefits | undefined;
let mockBudget: Budget | undefined;
let mockBudgetError = false;
jest.mock('@/lib/api', () => ({
  useSummary: () => mockResult(mockSummary, { isError: mockSummaryError }),
  useTransactions: () => mockResult(mockTransactions),
  useBenefits: () => mockResult(mockBenefits),
  useBudget: () => mockResult(mockBudget, { isError: mockBudgetError }),
  useNetWorth: () =>
    mockResult(jest.requireActual<typeof import('@/test/fixtures')>('@/test/fixtures').netWorth),
}));
jest.mock('@/lib/useRefresh', () => ({ useRefresh: () => undefined }));

beforeEach(() => {
  mockSummary = summary;
  mockSummaryError = false;
  mockTransactions = [sweetgreen, refund];
  mockBenefits = benefits;
  mockBudget = budget;
  mockBudgetError = false;
  mockPush.mockClear();
});

describe('Home', () => {
  it('leads with what is left of the weekly budget', async () => {
    await renderScreen(<Home />);
    // $500 a week, $120 spent.
    expect(screen.getByText('$380')).toBeOnTheScreen();
    expect(screen.getByText(/left to spend this week/)).toBeOnTheScreen();
    expect(screen.getByText("You've spent $120 since Monday.")).toBeOnTheScreen();
    expect(screen.getByText('of $500')).toBeOnTheScreen();
    expect(screen.getByText(/Dominic/)).toBeOnTheScreen();
  });

  it('says plainly when spending is over budget', async () => {
    mockBudget = {
      ...budget,
      week: periodBudget({ spent_cents: 62000, remaining_cents: -12000 }),
    };
    await renderScreen(<Home />);
    expect(screen.getByText('$120')).toBeOnTheScreen();
    expect(screen.getByText(/over budget this week/)).toBeOnTheScreen();
    expect(screen.queryByText(/left to spend/)).toBeNull();
  });

  it('leads with the month for a monthly budget', async () => {
    mockBudget = { ...budget, style: 'monthly' };
    await renderScreen(<Home />);
    expect(screen.getByText('$1,360')).toBeOnTheScreen();
    expect(screen.getByText(/left to spend this month/)).toBeOnTheScreen();
    expect(screen.getByText("You've spent $640 since the 1st.")).toBeOnTheScreen();
    expect(screen.getByText('This month')).toBeOnTheScreen();
  });

  it('asks to set a budget instead of inventing one', async () => {
    const empty = periodBudget({ limit_cents: null, remaining_cents: null });
    mockBudget = { ...budget, configured: false, style: null, week: empty, month: empty };
    await renderScreen(<Home />);
    expect(screen.getByText(/spent/)).toBeOnTheScreen();
    expect(screen.queryByText('of $500')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: "Set a budget to see what's left" }));
    expect(mockPush).toHaveBeenCalledWith('/settings/budget');
  });

  it('just shows spend with no limit', async () => {
    const empty = periodBudget({ limit_cents: null, remaining_cents: null });
    mockBudget = {
      ...budget,
      style: 'none',
      week: empty,
      month: { ...empty, spent_cents: 64000 },
    };
    await renderScreen(<Home />);
    expect(screen.getByText(/You've spent/)).toBeOnTheScreen();
    expect(screen.getByText('No limit set. $640 so far this month.')).toBeOnTheScreen();
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

  // Regression: a failed refresh left old or placeholder numbers next to the error message.
  it('shows dashes, not numbers, when the budget fails to load', async () => {
    mockBudgetError = true;
    await renderScreen(<Home />);
    expect(screen.getByText(/couldn't reach your data/)).toBeOnTheScreen();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2); // headline and This week
    expect(screen.queryByText('$380')).toBeNull();
    expect(screen.queryByText('$120')).toBeNull();
  });

  it('shows net worth and opens its screen', async () => {
    await renderScreen(<Home />);
    expect(screen.getByText('Up $120 this week.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Net worth'));
    expect(mockPush).toHaveBeenCalledWith('/net-worth');
  });
});
