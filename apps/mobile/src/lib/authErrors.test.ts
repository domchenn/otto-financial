import { describe, expect, it } from '@jest/globals';

import { friendly } from './authErrors';

describe('friendly', () => {
  it('maps a wrong code to plain language', () => {
    expect(friendly({ code: 'form_code_incorrect' })).toMatch(/didn't match/);
  });

  it('reads the code from a Clerk API error list', () => {
    expect(
      friendly({ code: 'api_response_error', errors: [{ code: 'verification_expired' }] }),
    ).toMatch(/expired/);
  });

  it('explains an unknown email without leaking that sign-ups are closed', () => {
    expect(friendly({ code: 'form_identifier_not_found' })).toMatch(/couldn't find/);
  });

  it('maps rate limits', () => {
    expect(friendly({ code: 'too_many_requests' })).toMatch(/Too many tries/);
    expect(friendly({ code: 'rate_limit_exceeded' })).toMatch(/Too many tries/);
  });

  it('falls back to a generic sentence and never shows the raw code', () => {
    const message = friendly({ code: 'form_param_format_invalid' });
    expect(message).toBe('Something went wrong. Try again in a moment.');
    expect(friendly(null)).toBe('Something went wrong. Try again in a moment.');
  });
});
