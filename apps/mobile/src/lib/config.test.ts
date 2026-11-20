import { describe, expect, it } from '@jest/globals';

import { resolveApiUrl } from './config';

describe('resolveApiUrl', () => {
  it('follows the Metro host in auto mode', () => {
    expect(resolveApiUrl('auto', '172.20.10.2:8081')).toBe('http://172.20.10.2:8000');
    expect(resolveApiUrl('auto', '192.168.1.20:8081')).toBe('http://192.168.1.20:8000');
  });

  it('uses an explicit URL as-is, without a trailing slash', () => {
    expect(resolveApiUrl('https://api.example.com/', '10.0.0.1:8081')).toBe(
      'https://api.example.com',
    );
  });

  it('explains what is missing', () => {
    expect(() => resolveApiUrl('auto', undefined)).toThrow(/needs Metro/);
    expect(() => resolveApiUrl(undefined, undefined)).toThrow(/EXPO_PUBLIC_API_URL is not set/);
  });
});
