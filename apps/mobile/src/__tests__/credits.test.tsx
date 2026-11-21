import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import CardProductPicker from '@/app/(app)/card/[id]/product';
import CreditDetail from '@/app/(app)/credits/[id]';
import Credits from '@/app/(app)/credits/index';
import type { Benefits, CardProduct } from '@/lib/credits';
import { benefits, creditPeriod, mockResult, renderScreen } from '@/test/fixtures';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockParams: { id: string } = { id: 'p-dining' };
jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    back: () => mockBack(),
    replace: (...args: unknown[]) => mockReplace(...args),
  },
  useLocalSearchParams: () => mockParams,
}));

let mockBenefits: Benefits | undefined;
type MutateOptions<T> = { onSuccess?: (data: T) => void; onError?: () => void };
const mockMark = jest.fn<(body: unknown, options?: MutateOptions<Benefits>) => void>();
const mockAssign = jest.fn<(body: unknown, options?: MutateOptions<Benefits>) => void>();
const products: CardProduct[] = [
  { id: 'amex-gold', issuer: 'American Express', name: 'Gold Card', needs_anniversary: false },
  {
    id: 'chase-sapphire-reserve',
    issuer: 'Chase',
    name: 'Sapphire Reserve',
    needs_anniversary: true,
  },
];
jest.mock('@/lib/api', () => ({
  useBenefits: () => mockResult(mockBenefits),
  useCardProducts: () => mockResult(products),
  useMarkCreditUsed: () => ({ mutate: mockMark, isPending: false }),
  useAssignCard: () => ({ mutate: mockAssign, isPending: false }),
}));
jest.mock('@/lib/useRefresh', () => ({ useRefresh: () => undefined }));

beforeEach(() => {
  mockBenefits = benefits;
  mockParams = { id: 'p-dining' };
  for (const fn of [mockPush, mockBack, mockReplace, mockMark, mockAssign]) fn.mockClear();
});

describe('Credits', () => {
  it('groups unused credits by how soon they reset', async () => {
    await renderScreen(<Credits />);
    expect(screen.getByText('This week')).toBeOnTheScreen();
    expect(screen.getByText('Dining credit')).toBeOnTheScreen();
    expect(screen.getByText('Later')).toBeOnTheScreen();
    expect(screen.getByText('Resy credit')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Dining credit'));
    expect(mockPush).toHaveBeenCalledWith('/credits/p-dining');
  });

  it('asks which card an unknown account is', async () => {
    await renderScreen(<Credits />);
    await fireEvent.press(screen.getByText('Which card is Plaid Credit Card •• 3333?'));
    expect(mockPush).toHaveBeenCalledWith('/card/acc-plaid/product');
  });

  it('shows what was used and missed this year', async () => {
    await renderScreen(<Credits />);
    expect(
      screen.getByText('$17 used this year · $10 missed · $67 left to use now'),
    ).toBeOnTheScreen();
  });

  it('lists this year by month with used and missed credits', async () => {
    await renderScreen(<Credits />);
    await fireEvent.press(screen.getByRole('button', { name: 'This year' }));
    expect(screen.getByText('October')).toBeOnTheScreen();
    expect(screen.getByText('$17 used')).toBeOnTheScreen();
    expect(screen.getByText('September')).toBeOnTheScreen();
    expect(screen.getByText('$0 used · $10 missed')).toBeOnTheScreen();
    expect(screen.getByText('Gold Card · Missed')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Gold Card · Missed'));
    expect(mockPush).toHaveBeenCalledWith('/credits/p-dining-sep');
  });
});

describe('Credit detail', () => {
  it('shows what is left and when it resets', async () => {
    await renderScreen(<CreditDetail />);
    expect(screen.getByText('$10 dining credit')).toBeOnTheScreen();
    expect(screen.getByText('Resets in 3 days')).toBeOnTheScreen();
    expect(screen.getByText('$10 left')).toBeOnTheScreen();
  });

  it('marks a credit used and goes back', async () => {
    await renderScreen(<CreditDetail />);
    await fireEvent.press(screen.getByRole('button', { name: 'Mark as used' }));
    expect(mockMark).toHaveBeenCalledWith({ periodId: 'p-dining', used: true }, expect.anything());
    mockMark.mock.calls[0]![1]!.onSuccess!(benefits);
    expect(mockBack).toHaveBeenCalled();
  });

  it('celebrates when the last credit of the month is used', async () => {
    await renderScreen(<CreditDetail />);
    await fireEvent.press(screen.getByRole('button', { name: 'Mark as used' }));
    mockMark.mock.calls[0]![1]!.onSuccess!({ ...benefits, expiring_this_month_count: 0 });
    expect(mockReplace).toHaveBeenCalledWith('/credits/complete');
  });

  it('can undo a credit marked by hand', async () => {
    const used = creditPeriod({ remaining_cents: 0, marked_used: true });
    mockBenefits = { ...benefits, cards: [{ ...benefits.cards[0]!, credits: [used] }] };
    await renderScreen(<CreditDetail />);
    await fireEvent.press(screen.getByRole('button', { name: 'Not used yet' }));
    expect(mockMark).toHaveBeenCalledWith({ periodId: 'p-dining', used: false }, expect.anything());
  });
});

describe('Past credit', () => {
  it('opens from history, says when it ended and can still be marked used', async () => {
    mockParams = { id: 'p-dining-sep' };
    await renderScreen(<CreditDetail />);
    expect(screen.getByText('Ended Sep 30')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Mark as used' }));
    expect(mockMark).toHaveBeenCalledWith(
      { periodId: 'p-dining-sep', used: true },
      expect.anything(),
    );
  });
});

describe('Card picker', () => {
  beforeEach(() => {
    mockParams = { id: 'acc-plaid' };
  });

  it('saves the picked card', async () => {
    await renderScreen(<CardProductPicker />);
    await fireEvent.press(screen.getByRole('radio', { name: 'Gold Card' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(mockAssign).toHaveBeenCalledWith(
      { accountId: 'acc-plaid', cardId: 'amex-gold', anniversaryMonth: null },
      expect.anything(),
    );
  });

  it('asks for the anniversary month when the card needs one', async () => {
    await renderScreen(<CardProductPicker />);
    expect(screen.queryByText('Card anniversary month')).toBeNull();
    await fireEvent.press(screen.getByRole('radio', { name: 'Sapphire Reserve' }));
    expect(screen.getByText('Card anniversary month')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Mar' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(mockAssign).toHaveBeenCalledWith(
      { accountId: 'acc-plaid', cardId: 'chase-sapphire-reserve', anniversaryMonth: 3 },
      expect.anything(),
    );
  });

  it("lists the account's own bank first", async () => {
    await renderScreen(<CardProductPicker />);
    // acc-plaid is at First Platypus Bank, so the catalog order stays as is.
    const radios = screen.getAllByRole('radio').map((r) => r.props.accessibilityLabel);
    expect(radios.slice(0, 2)).toEqual(['Gold Card', 'Sapphire Reserve']);
  });

  it('puts Chase cards first for a Chase account', async () => {
    mockParams = { id: 'acc-chase' };
    mockBenefits = {
      ...benefits,
      cards: [
        ...benefits.cards,
        {
          ...benefits.cards[1]!,
          account_id: 'acc-chase',
          account_name: 'CREDIT CARD',
          institution_name: 'Chase',
        },
      ],
    };
    await renderScreen(<CardProductPicker />);
    const radios = screen.getAllByRole('radio').map((r) => r.props.accessibilityLabel);
    expect(radios[0]).toBe('Sapphire Reserve');
  });
});
