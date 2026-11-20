import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useLinkBank } from './api';
import type { PlaidOutcome } from './plaid';

jest.mock('@clerk/expo', () => ({ useAuth: () => ({ getToken: async () => 'session-token' }) }));

let mockOutcome: PlaidOutcome;
jest.mock('./plaid', () => ({ openPlaidLink: jest.fn(async () => mockOutcome) }));

type Call = { url: string; method: string; body: unknown; auth: string | undefined };
let calls: Call[] = [];

beforeEach(() => {
  calls = [];
  globalThis.fetch = jest.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const headers = (init?.headers ?? {}) as Record<string, string>;
    calls.push({
      url: String(url),
      method: init?.method ?? 'GET',
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
      auth: headers.Authorization,
    });
    const body = String(url).endsWith('/v1/link-token') ? { link_token: 'link-123' } : {};
    return new Response(JSON.stringify(body), { status: 200 });
  }) as typeof fetch;
});

afterEach(() => {
  jest.restoreAllMocks();
});

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

async function link(connectionId?: string) {
  const { result } = await renderHook(() => useLinkBank(), { wrapper });
  let outcome: unknown;
  await act(async () => {
    outcome = await result.current.mutateAsync(connectionId);
  });
  return outcome;
}

describe('useLinkBank', () => {
  it('exchanges the public token with the institution for a new bank', async () => {
    mockOutcome = {
      status: 'success',
      publicToken: 'public-sandbox-1',
      institution: { id: 'ins_10', name: 'American Express' },
    };
    expect(await link()).toEqual({ status: 'connected' });
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      'POST http://localhost:8000/v1/link-token',
      'POST http://localhost:8000/v1/connections',
    ]);
    expect(calls[0]?.body).toEqual({});
    expect(calls[1]?.body).toEqual({
      public_token: 'public-sandbox-1',
      institution_id: 'ins_10',
      institution_name: 'American Express',
    });
    expect(calls[1]?.auth).toBe('Bearer session-token');
  });

  it('re-syncs instead of exchanging in update mode', async () => {
    mockOutcome = { status: 'success', publicToken: 'public-ignored', institution: null };
    await link('conn-1');
    expect(calls[0]?.body).toEqual({ connection_id: 'conn-1' });
    expect(calls[1]?.url).toBe('http://localhost:8000/v1/sync');
  });

  it('does nothing more when the user closes Link', async () => {
    mockOutcome = { status: 'exited' };
    expect(await link()).toEqual({ status: 'exited' });
    expect(calls).toHaveLength(1);
  });
});
