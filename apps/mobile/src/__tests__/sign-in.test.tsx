import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import SignIn from '@/app/sign-in';
import { renderScreen } from '@/test/fixtures';

jest.mock('@clerk/expo', () => ({
  useSignIn: () => ({ signIn: { emailCode: {} }, fetchStatus: 'idle' }),
}));

type SSOResult = { createdSessionId: string | null; authSessionResult: { type: string } | null };
let mockSSO: () => Promise<SSOResult>;
const mockStartSSOFlow = jest.fn((_params: { strategy: string }) => mockSSO());
jest.mock('@clerk/expo/experimental', () => ({
  useSSO: () => ({ startSSOFlow: mockStartSSOFlow }),
}));

beforeEach(() => {
  mockStartSSOFlow.mockClear();
  mockSSO = async () => ({ createdSessionId: 'sess_1', authSessionResult: { type: 'success' } });
});

describe('Sign in', () => {
  it('offers Apple, Google and email', async () => {
    await renderScreen(<SignIn />);
    expect(screen.getByRole('button', { name: 'Continue with Apple' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Send code' })).toBeOnTheScreen();
  });

  it.each([
    ['Continue with Apple', 'oauth_apple'],
    ['Continue with Google', 'oauth_google'],
  ])('%s starts that provider', async (name, strategy) => {
    await renderScreen(<SignIn />);
    await fireEvent.press(screen.getByRole('button', { name }));
    expect(mockStartSSOFlow).toHaveBeenCalledWith({ strategy });
    expect(screen.queryByText(/isn't linked to Porter/)).toBeNull();
  });

  it('explains when the account is not the Porter account', async () => {
    mockSSO = async () => ({ createdSessionId: null, authSessionResult: { type: 'success' } });
    await renderScreen(<SignIn />);
    await fireEvent.press(screen.getByRole('button', { name: 'Continue with Google' }));
    expect(screen.getByText(/isn't linked to Porter/)).toBeOnTheScreen();
  });

  it('stays quiet when the browser sheet is closed', async () => {
    mockSSO = async () => ({ createdSessionId: null, authSessionResult: { type: 'cancel' } });
    await renderScreen(<SignIn />);
    await fireEvent.press(screen.getByRole('button', { name: 'Continue with Apple' }));
    expect(screen.queryByText(/isn't linked to Porter/)).toBeNull();
    expect(screen.queryByText(/Something went wrong/)).toBeNull();
  });

  it('shows a plain sentence when Clerk fails', async () => {
    mockSSO = async () => {
      throw { errors: [{ code: 'network_error' }] };
    };
    await renderScreen(<SignIn />);
    await fireEvent.press(screen.getByRole('button', { name: 'Continue with Apple' }));
    expect(screen.getByText('Something went wrong. Try again in a moment.')).toBeOnTheScreen();
  });
});
