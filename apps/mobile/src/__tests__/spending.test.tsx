import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import Spending from '@/app/(app)/(tabs)/spending';
import type { Budget } from '@/lib/budget';
import type { Spending as SpendingData } from '@/lib/finance';
import { budget, mockResult, periodBudget, renderScreen, weekSpending } from '@/test/fixtures';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }));

let mockData: SpendingData | undefined;
let mockError = false;
const mockPeriods: string[] = [];
let mockBudget: Budget | undefined;
jest.mock('@/lib/api', () => ({
  useBudget: () => mockResult(mockBudget),
  useSpending: (period: string) => {
    mockPeriods.push(period);
    return mockResult(mockData, { isError: mockError });
  },
}));
jest.mock('@/lib/useRefresh', () => ({ useRefresh: () => undefined }));

beforeEach(() => {
  mockData = weekSpending;
  mockBudget = budget;
  mockError = false;
  mockPeriods.length = 0;
  mockPush.mockClear();
});

describe('Spending', () => {
  it('shows real spend against the saved budget', async () => {
    await renderScreen(<Spending />);
    expect(screen.getByText('$120.00')).toBeOnTheScreen();
    expect(screen.getByText(/of \$500/)).toBeOnTheScreen();
    expect(screen.getByText('$380 left')).toBeOnTheScreen();
  });

  it('says how much over budget, without praise', async () => {
    mockData = { ...weekSpending, spent_cents: 62000 };
    mockBudget = {
      ...budget,
      week: periodBudget({ spent_cents: 62000, remaining_cents: -12000 }),
    };
    await renderScreen(<Spending />);
    expect(screen.getByText('$120 over')).toBeOnTheScreen();
    expect(screen.queryByText(/Nicely done/)).toBeNull();
  });

  it('puts a factual insight in the Porter noticed card', async () => {
    await renderScreen(<Spending />);
    expect(screen.getByText('Porter noticed')).toBeOnTheScreen();
    expect(
      screen.getByText('Dining is 68% of your week, almost all on your Gold Card.'),
    ).toBeOnTheScreen();
  });

  it('lists categories by name and opens their purchases', async () => {
    await renderScreen(<Spending />);
    expect(screen.getByText('Dining')).toBeOnTheScreen();
    expect(screen.getByText('Shopping')).toBeOnTheScreen();
    expect(screen.queryByText('DI')).toBeNull();
    await fireEvent.press(screen.getByText('Dining'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/transactions',
      params: { category: 'FOOD_AND_DRINK' },
    });
  });

  it('switches to the month and its own limit', async () => {
    await renderScreen(<Spending />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Month' }));
    expect(mockPeriods.at(-1)).toBe('month');
    expect(screen.getByText(/of \$2,000/)).toBeOnTheScreen();
    expect(screen.getByText('$1,360 left')).toBeOnTheScreen();
  });

  it('shows spend without a limit when no budget is set', async () => {
    const empty = periodBudget({ limit_cents: null, remaining_cents: null });
    mockBudget = { ...budget, configured: false, style: null, week: empty, month: empty };
    await renderScreen(<Spending />);
    expect(screen.getByText('$120.00')).toBeOnTheScreen();
    expect(screen.queryByText(/of \$/)).toBeNull();
    expect(screen.getByText('No budget set yet')).toBeOnTheScreen();
  });

  it('shows a dash and the retry message when loading fails', async () => {
    mockData = undefined;
    mockError = true;
    await renderScreen(<Spending />);
    expect(screen.getByText('—')).toBeOnTheScreen();
    expect(screen.getByText(/couldn't load your spending/)).toBeOnTheScreen();
    expect(screen.queryByText('Porter noticed')).toBeNull();
  });
});
