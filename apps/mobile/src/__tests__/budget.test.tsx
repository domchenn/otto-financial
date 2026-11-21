import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import OnboardingBudget from '@/app/(app)/onboarding/budget';
import BudgetSettings from '@/app/(app)/settings/budget';
import type { Budget, BudgetDraft } from '@/lib/budget';
import { budget, mockResult, renderScreen } from '@/test/fixtures';

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: () => mockBack() },
}));

let mockBudget: Budget | undefined;
type Options = { onSuccess?: () => void; onError?: () => void };
const mockSave = jest.fn<(draft: BudgetDraft, options?: Options) => void>();
jest.mock('@/lib/api', () => ({
  useBudget: () => mockResult(mockBudget),
  useSaveBudget: () => ({ mutate: mockSave, isPending: false }),
}));

beforeEach(() => {
  mockBudget = budget;
  for (const fn of [mockPush, mockBack, mockSave]) fn.mockClear();
});

function saved(): BudgetDraft {
  const call = mockSave.mock.calls.at(-1);
  if (!call) throw new Error('budget was not saved');
  return call[0];
}

describe('Budget settings', () => {
  it('starts from the saved budget', async () => {
    await renderScreen(<BudgetSettings />);
    expect(screen.getByRole('radio', { name: 'A weekly limit' })).toBeChecked();
    expect(screen.getByText('$500')).toBeOnTheScreen();
  });

  it('raises the limit and leaves a category out, then saves and goes back', async () => {
    await renderScreen(<BudgetSettings />);
    await fireEvent.press(screen.getByRole('button', { name: 'Increase' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Travel' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(saved()).toEqual({
      style: 'weekly',
      weeklyCents: 52500,
      monthlyCents: 200000,
      excluded: ['TRAVEL'],
    });
    mockSave.mock.calls.at(-1)?.[1]?.onSuccess?.();
    expect(mockBack).toHaveBeenCalled();
  });

  it('switches to a monthly limit and keeps the weekly one', async () => {
    await renderScreen(<BudgetSettings />);
    await fireEvent.press(screen.getByRole('radio', { name: 'A monthly limit' }));
    expect(screen.getByText('Your monthly limit')).toBeOnTheScreen();
    expect(screen.getByText('$2,000')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(saved()).toMatchObject({ style: 'monthly', weeklyCents: 50000, monthlyCents: 200000 });
  });

  it('hides the limit for "just show me what I spend"', async () => {
    await renderScreen(<BudgetSettings />);
    await fireEvent.press(screen.getByRole('radio', { name: 'Just show me what I spend' }));
    expect(screen.queryByText('Your weekly limit')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(saved().style).toBe('none');
  });
});

describe('Onboarding budget', () => {
  it('saves the choice and moves on', async () => {
    mockBudget = { ...budget, configured: false, style: null };
    await renderScreen(<OnboardingBudget />);
    // No category list during onboarding: that lives in Settings.
    expect(screen.queryByText("Don't count")).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(saved().style).toBe('weekly');
    mockSave.mock.calls.at(-1)?.[1]?.onSuccess?.();
    expect(mockPush).toHaveBeenCalledWith('/onboarding/check-in');
  });
});
