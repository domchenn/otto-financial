import { describe, expect, it, jest } from '@jest/globals';

import { hostOf, resolveApiUrl } from './config';

describe('hostOf', () => {
  it('reads the host from a bundle URL or a host:port pair', () => {
    expect(hostOf('http://172.20.10.2:8081/index.bundle?platform=ios&dev=true')).toBe(
      '172.20.10.2',
    );
    expect(hostOf('192.168.1.20:8081')).toBe('192.168.1.20');
    expect(hostOf(null)).toBeNull();
    expect(hostOf('')).toBeNull();
  });
});

describe('resolveApiUrl', () => {
  it('follows the Metro host in auto mode', () => {
    expect(resolveApiUrl('auto', 'http://172.20.10.2:8081/index.bundle')).toBe(
      'http://172.20.10.2:8000',
    );
    expect(resolveApiUrl('auto', '192.168.1.20:8081')).toBe('http://192.168.1.20:8000');
  });

  it('uses an explicit URL as-is, without a trailing slash', () => {
    expect(resolveApiUrl('https://api.example.com/', '10.0.0.1:8081')).toBe(
      'https://api.example.com',
    );
  });

  // Regression: a bare dev build (no expo-dev-client) has no hostUri, and throwing at
  // import time crashed the app on launch.
  it('falls back to localhost instead of throwing when Metro is unknown', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveApiUrl('auto', null)).toBe('http://localhost:8000');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('still requires the variable to be set', () => {
    expect(() => resolveApiUrl(undefined, null)).toThrow(/EXPO_PUBLIC_API_URL is not set/);
  });
});
