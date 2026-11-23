import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import Home from '@/app/(app)/(tabs)/index';
import type { Benefits } from '@/lib/credits';
import type { Budget } from '@/lib/budget';
import type { Account, Summary } from '@/lib/finance';
import {
  benefits,
  budget,
  checking,
  gold,
  renderScreen,
  mockResult,
  summary,
} from '@/test/fixtures';
import { light } from '@/theme/tokens';

jest.mock('@clerk/expo', () => ({ useUser: () => ({ user: { firstName: 'Dominic' } }) }));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 0 } }));

let mockSummary: Summary | undefined;
let mockSummaryError = false;
let mockBenefits: Benefits | undefined;
let mockBudget: Budget | undefined;
let mockBudgetError = false;
let mockAccounts: Account[] | undefined;
jest.mock('@/lib/api', () => ({
  useSummary: () => mockResult(mockSummary, { isError: mockSummaryError }),
  useBenefits: () => mockResult(mockBenefits),
  useBudget: () => mockResult(mockBudget, { isError: mockBudgetError }),
  useAccounts: () => mockResult(mockAccounts),
}));
jest.mock('@/lib/useRefresh', () => ({ useRefresh: () => undefined }));

const savings: Account = {
  ...checking,
  id: 'acc-savings',
  name: 'High-yield savings',
  subtype: 'savings',
  current_cents: 1_000_000,
};

beforeEach(() => {
  mockSummary = summary;
  mockSummaryError = false;
  mockBenefits = benefits;
  mockBudget = budget;
  mockBudgetError = false;
  mockAccounts = [gold, checking];
  mockPush.mockClear();
});

describe('Home', () => {
  it('shows the wordmark and opens Settings from the avatar', async () => {
    await renderScreen(<Home />);
    expect(screen.getByLabelText('Porter')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Settings' }));
    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('leads with the daily brief built from real numbers', async () => {
    await renderScreen(<Home />);
    expect(screen.getByRole('header', { name: 'Today' })).toBeOnTheScreen();
    // $2,000 monthly plan with $640 spent; $10 dining credit with 3 days left; $610 due.
    expect(
      screen.getByText(
        /^\$1,360 left in \w+'s plan\. Your \$10 Dining credit expires in 3 days\. \$610 due on Gold Card/,
      ),
    ).toBeOnTheScreen();
  });

  it('shows a skeleton while the brief loads', async () => {
    mockSummary = undefined;
    await renderScreen(<Home />);
    expect(screen.getByLabelText("Loading today's summary")).toBeOnTheScreen();
  });

  it('says so in the brief when data could not load', async () => {
    mockSummary = undefined;
    mockSummaryError = true;
    await renderScreen(<Home />);
    expect(screen.getByText(/couldn't reach your data/)).toBeOnTheScreen();
  });

  it('opens the full brief with Read all when it runs long', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockSummary = {
      ...summary,
      upcoming_payments: [
        { ...summary.upcoming_payments[0]!, name: 'Platinum Card from American Express' },
      ],
    };
    mockBenefits = {
      ...benefits,
      needs_attention: [
        { ...benefits.needs_attention[0]!, name: 'Fine Hotels and Resorts property credit' },
      ],
    };
    await renderScreen(<Home />);
    await fireEvent.press(screen.getByRole('button', { name: 'Read all' }));
    expect(alert).toHaveBeenCalledWith('Today', expect.stringContaining('Platinum Card'));
    alert.mockRestore();
  });

  it('shows net worth, the month against the plan and the next payment', async () => {
    await renderScreen(<Home />);
    expect(screen.getByText('$4,315')).toBeOnTheScreen();
    expect(screen.getByText('2 accounts')).toBeOnTheScreen();
    expect(screen.getByText('$640')).toBeOnTheScreen();
    expect(screen.getByText('$1,360 left')).toBeOnTheScreen();
    expect(screen.getByText('$610')).toBeOnTheScreen();
    expect(screen.getByText('Covered ✓')).toHaveStyle({ color: light.link });
  });

  it('flags a month over plan in terracotta', async () => {
    mockBudget = {
      ...budget,
      month: { ...budget.month, spent_cents: 253_600, remaining_cents: -53_600 },
    };
    await renderScreen(<Home />);
    expect(screen.getByText('$536 over plan')).toHaveStyle({ color: light.alert });
  });

  it('opens Accounts from net worth and the card from its payment', async () => {
    await renderScreen(<Home />);
    await fireEvent.press(screen.getByRole('button', { name: /^Net worth/ }));
    expect(mockPush).toHaveBeenCalledWith('/accounts');
    await fireEvent.press(screen.getByRole('button', { name: /^Due .*\$610/ }));
    expect(mockPush).toHaveBeenCalledWith('/card/acc-gold');
  });

  // Regression: a failed refresh left old or placeholder numbers next to the error message.
  it('shows dashes, not numbers, when the budget fails to load', async () => {
    mockBudgetError = true;
    await renderScreen(<Home />);
    expect(screen.getByText(/couldn't reach your data/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Spent · \w+, —$/ })).toBeOnTheScreen();
    expect(screen.queryByText('$640')).toBeNull();
  });

  it('lists what Porter is on, up to two, and opens the credit', async () => {
    await renderScreen(<Home />);
    expect(screen.getByRole('header', { name: "Porter's on it" })).toBeOnTheScreen();
    expect(screen.getByText('2 to review')).toBeOnTheScreen();
    expect(screen.getByText('Use your $10 Dining credit')).toBeOnTheScreen();
    expect(screen.getByText("Use your $7 Dunkin' credit")).toBeOnTheScreen();
    await fireEvent.press(screen.getAllByRole('button', { name: 'Show me how' })[0]!);
    expect(mockPush).toHaveBeenCalledWith('/credits/p-dining');
  });

  it('puts an item off with Not now', async () => {
    await renderScreen(<Home />);
    await fireEvent.press(screen.getAllByRole('button', { name: 'Not now' })[0]!);
    expect(screen.queryByText('Use your $10 Dining credit')).toBeNull();
    expect(screen.getByText('1 to review')).toBeOnTheScreen();
  });

  it('suggests moving idle checking into savings first', async () => {
    // $4,000 in checking, a $2,000 monthly plan and $610 due: $1,390 idle, rounded to $1,300.
    mockAccounts = [gold, { ...checking, current_cents: 400_000 }, savings];
    await renderScreen(<Home />);
    expect(screen.getByText('Move $1,300 of idle checking into savings')).toBeOnTheScreen();
    expect(screen.queryByText("Use your $7 Dunkin' credit")).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Show me' }));
    expect(mockPush).toHaveBeenCalledWith('/accounts');
  });

  it('is calm when nothing needs the user', async () => {
    mockBenefits = { ...benefits, needs_attention: [] };
    await renderScreen(<Home />);
    expect(screen.getByText('Nothing needs you right now.')).toBeOnTheScreen();
  });

  it('asks to connect cards before any bank is linked', async () => {
    mockSummary = { ...summary, has_connections: false, upcoming_payments: [] };
    await renderScreen(<Home />);
    await fireEvent.press(screen.getByRole('button', { name: 'Connect cards' }));
    expect(mockPush).toHaveBeenCalledWith('/onboarding/connect');
  });

  it('shows credits to use before they expire, soonest first', async () => {
    await renderScreen(<Home />);
    expect(screen.getByText('Use before they expire')).toBeOnTheScreen();
    const cards = screen.getAllByLabelText(/on Gold Card\. Expires/);
    expect(cards.map((c) => c.props.accessibilityLabel)).toEqual([
      'Dining credit, $10 on Gold Card. Expires in 3 days.',
      "Dunkin' credit, $7 on Gold Card. Expires in 3 days.",
      'Resy credit, $50 on Gold Card. Expires in 34 days.',
    ]);
    await fireEvent.press(screen.getByRole('button', { name: 'How to use it: Resy credit' }));
    expect(mockPush).toHaveBeenCalledWith('/credits/p-resy');
  });

  it('totals the expiring credits and opens Benefits', async () => {
    await renderScreen(<Home />);
    await fireEvent.press(screen.getByRole('button', { name: '$67 total, see all benefits' }));
    expect(mockPush).toHaveBeenCalledWith('/benefits');
  });
});
