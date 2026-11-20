import { describe, expect, it, jest } from '@jest/globals';
import { Alert } from 'react-native';

import { ApiError } from './api';
import { linkAlerts, linkErrorMessage } from './linkAlerts';

jest.mock('@clerk/expo', () => ({ useAuth: () => ({ getToken: async () => null }) }));
jest.mock('./plaid', () => ({ openPlaidLink: jest.fn() }));

describe('linkErrorMessage', () => {
  it.each([
    [401, /sign-in expired/],
    [403, /isn't allowed/],
    [502, /Plaid didn't accept/],
    [503, /isn't set up for Plaid/],
    [500, /had a problem \(500\)/],
  ])('explains %i', (status, message) => {
    expect(linkErrorMessage(new ApiError(status, 'x'))).toMatch(message);
  });

  it('explains an unreachable server', () => {
    expect(linkErrorMessage(new TypeError('Network request failed'))).toMatch(/can't reach/);
  });

  it('falls back to a generic sentence', () => {
    expect(linkErrorMessage(new Error('boom'))).toMatch(/Something went wrong/);
  });
});

describe('linkAlerts', () => {
  it('alerts on errors and failed links, but not when the user closes Plaid', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    linkAlerts.onError(new ApiError(403, 'x'));
    expect(alert).toHaveBeenLastCalledWith("Couldn't connect", expect.stringMatching(/allowed/));
    linkAlerts.onSuccess({ status: 'failed' });
    expect(alert).toHaveBeenCalledTimes(2);
    linkAlerts.onSuccess({ status: 'exited' });
    linkAlerts.onSuccess({ status: 'connected' });
    expect(alert).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledTimes(1);
    alert.mockRestore();
    warn.mockRestore();
  });
});
