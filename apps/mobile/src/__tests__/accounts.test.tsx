import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import ConnectedAccounts from '@/app/(app)/settings/accounts';
import type { Connection } from '@/lib/finance';
import { amex, chaseBroken, mockMutation, renderScreen, mockResult } from '@/test/fixtures';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));

let mockConnections: Connection[] = [];
const mockDisconnect = mockMutation();
const mockLink = mockMutation();
jest.mock('@/lib/api', () => ({
  useConnections: () => mockResult(mockConnections),
  useDisconnect: () => mockDisconnect,
  useLinkBank: () => mockLink,
}));
jest.mock('@/lib/useRefresh', () => ({ useRefresh: () => undefined }));

beforeEach(() => {
  mockConnections = [amex, chaseBroken];
  mockDisconnect.mutate.mockClear();
  mockLink.mutate.mockClear();
});

describe('Connected accounts', () => {
  it('lists each bank with its status and accounts', async () => {
    await renderScreen(<ConnectedAccounts />);
    expect(screen.getByText(amex.institution_name!)).toBeOnTheScreen();
    expect(screen.getByText(/Up to date/)).toBeOnTheScreen();
    expect(screen.getByText('Gold Card ·· 1007')).toBeOnTheScreen();
    expect(screen.getByText('Needs a quick sign-in · 3 days ago')).toBeOnTheScreen();
  });

  it('opens Link in update mode to fix a broken bank', async () => {
    await renderScreen(<ConnectedAccounts />);
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in to Chase' }));
    expect(mockLink.mutate).toHaveBeenCalledWith(chaseBroken.id, expect.anything());
  });

  it('confirms before disconnecting', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await renderScreen(<ConnectedAccounts />);
    await fireEvent.press(screen.getAllByRole('button', { name: 'Disconnect' })[0]!);
    expect(mockDisconnect.mutate).not.toHaveBeenCalled();
    const buttons = alert.mock.calls[0]?.[2] ?? [];
    buttons.find((b) => b.text === 'Disconnect')?.onPress?.();
    expect(mockDisconnect.mutate).toHaveBeenCalledWith(amex.id);
  });

  it('connects another bank', async () => {
    await renderScreen(<ConnectedAccounts />);
    await fireEvent.press(screen.getByRole('button', { name: 'Connect another account' }));
    expect(mockLink.mutate).toHaveBeenCalledWith(undefined, expect.anything());
  });
});
