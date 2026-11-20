import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import Spending from '@/app/(app)/(tabs)/spending';
import type { Spending as SpendingData } from '@/lib/finance';
import { mockResult, renderScreen, weekSpending } from '@/test/fixtures';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }));

let mockData: SpendingData | undefined;
let mockError = false;
const mockPeriods: string[] = [];
jest.mock('@/lib/api', () => ({
  useSpending: (period: string) => {
    mockPeriods.push(period);
    return mockResult(mockData, { isError: mockError });
  },
}));
jest.mock('@/lib/useRefresh', () => ({ useRefresh: () => undefined }));

beforeEach(() => {
  mockData = weekSpending;
  mockError = false;
  mockPeriods.length = 0;
  mockPush.mockClear();
});

describe('Spending', () => {
  it('shows real spend against the budget', async () => {
    await renderScreen(<Spending />);
    expect(screen.getByText('$120.00')).toBeOnTheScreen();
    expect(screen.getByText(/of \$500/)).toBeOnTheScreen();
    expect(screen.getByText('$380 left')).toBeOnTheScreen();
  });

  it('says how much over budget, without praise', async () => {
    mockData = { ...weekSpending, spent_cents: 62000 };
    await renderScreen(<Spending />);
    expect(screen.getByText('$120 over')).toBeOnTheScreen();
    expect(screen.queryByText(/Nicely done/)).toBeNull();
  });

  it('puts a factual insight in the Otto noticed card', async () => {
    await renderScreen(<Spending />);
    expect(screen.getByText('Otto noticed')).toBeOnTheScreen();
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

  it('switches to the month', async () => {
    await renderScreen(<Spending />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Month' }));
    expect(mockPeriods.at(-1)).toBe('month');
  });

  it('shows a dash and the retry message when loading fails', async () => {
    mockData = undefined;
    mockError = true;
    await renderScreen(<Spending />);
    expect(screen.getByText('—')).toBeOnTheScreen();
    expect(screen.getByText(/couldn't load your spending/)).toBeOnTheScreen();
    expect(screen.queryByText('Otto noticed')).toBeNull();
  });
});
