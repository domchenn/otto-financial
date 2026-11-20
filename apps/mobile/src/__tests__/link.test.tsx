import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import PlaidLink from '@/app/(app)/onboarding/link';
import type { LinkResult } from '@/lib/api';
import { renderScreen } from '@/test/fixtures';

const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
    back: (...args: unknown[]) => mockBack(...args),
  },
}));

let mockOutcome: LinkResult | Error = { status: 'connected' };
const mockMutate = jest.fn(
  (
    _id: string | undefined,
    handlers: { onSuccess: (r: LinkResult) => void; onError: (e: Error) => void },
  ) => {
    if (mockOutcome instanceof Error) handlers.onError(mockOutcome);
    else handlers.onSuccess(mockOutcome);
  },
);
jest.mock('@/lib/api', () => ({
  useLinkBank: () => ({ mutate: mockMutate, isPending: false }),
}));

beforeEach(() => {
  mockReplace.mockClear();
  mockMutate.mockClear();
});

describe('Plaid Link screen', () => {
  it('opens Link once on arrival and continues to the analysis when connected', async () => {
    mockOutcome = { status: 'connected' };
    await renderScreen(<PlaidLink />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/onboarding/analysing'));
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });

  it('shows the error screen when the bank fails', async () => {
    mockOutcome = { status: 'failed' };
    await renderScreen(<PlaidLink />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/onboarding/link-error'));
  });

  it('shows the error screen when the API is unreachable', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockOutcome = new Error('network');
    await renderScreen(<PlaidLink />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/onboarding/link-error'));
  });

  it('stays put when the user closes Plaid, and can reopen it', async () => {
    mockOutcome = { status: 'exited' };
    await renderScreen(<PlaidLink />);
    expect(mockReplace).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Open Plaid' }));
    expect(mockMutate).toHaveBeenCalledTimes(2);
  });
});
