import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import ConfirmPoints from '@/app/(app)/points/[id]';
import PointsScreen from '@/app/(app)/points/index';
import type { Points } from '@/lib/points';
import { mockResult, points, renderScreen } from '@/test/fixtures';

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockParams: { id: string } = { id: 'chase-ur' };
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: () => mockBack() },
  useLocalSearchParams: () => mockParams,
}));

let mockPoints: Points | undefined;
type MutateOptions = { onSuccess?: () => void; onError?: () => void };
const mockConfirm = jest.fn<(body: unknown, options?: MutateOptions) => void>();
jest.mock('@/lib/api', () => ({
  usePoints: () => mockResult(mockPoints),
  useConfirmPoints: () => ({ mutate: mockConfirm, isPending: false }),
}));
jest.mock('@/lib/useRefresh', () => ({ useRefresh: () => undefined }));

beforeEach(() => {
  mockPoints = points;
  mockParams = { id: 'chase-ur' };
  for (const fn of [mockPush, mockBack, mockConfirm]) fn.mockClear();
});

describe('Points', () => {
  it('shows the total, then each program with its estimate', async () => {
    await renderScreen(<PointsScreen />);
    expect(screen.getAllByText('122,220')).toHaveLength(2); // total and MR
    expect(screen.getByText('Membership Rewards')).toBeOnTheScreen();
    expect(screen.getByText('Confirmed today · +2,220 since')).toBeOnTheScreen();
  });

  it('asks for a balance for programs without one', async () => {
    await renderScreen(<PointsScreen />);
    expect(screen.getByText('Sapphire Preferred, Freedom Unlimited')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Add balance'));
    expect(mockPush).toHaveBeenCalledWith('/points/chase-ur');
  });

  it('shows a dash and how it works before any balance is added', async () => {
    mockPoints = {
      ...points,
      total_points: 0,
      confirmed_count: 0,
      programs: points.programs.slice(1),
    };
    await renderScreen(<PointsScreen />);
    expect(screen.getByText('—')).toBeOnTheScreen();
    expect(screen.getByText(/Banks don’t share points balances yet/)).toBeOnTheScreen();
  });

  it('explains when no linked card earns points', async () => {
    mockPoints = { total_points: 0, confirmed_count: 0, programs: [] };
    await renderScreen(<PointsScreen />);
    expect(screen.getByText(/None of your linked cards earn points/)).toBeOnTheScreen();
  });
});

describe('Add your points balance', () => {
  it('saves the number typed, commas and all', async () => {
    await renderScreen(<ConfirmPoints />);
    expect(screen.getByText('Add your current UR balance')).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByPlaceholderText('0'), '45,300');
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(mockConfirm).toHaveBeenCalledWith(
      { programId: 'chase-ur', points: 45300 },
      expect.anything(),
    );
    mockConfirm.mock.calls[0]?.[1]?.onSuccess?.();
    expect(mockBack).toHaveBeenCalled();
  });

  it("won't save something that isn't a number", async () => {
    await renderScreen(<ConfirmPoints />);
    await fireEvent.changeText(screen.getByPlaceholderText('0'), '12.5');
    expect(screen.getByText('Enter a whole number of points')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(mockConfirm).not.toHaveBeenCalled();
  });

  it('shows the last balance entered and the estimate now', async () => {
    mockParams = { id: 'amex-mr' };
    await renderScreen(<ConfirmPoints />);
    expect(
      screen.getByText(/You entered 120,000 on .*Porter estimates 122,220 now\./),
    ).toBeOnTheScreen();
  });
});
