import { useAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { config } from './config';
import type { Account, Connection, Summary, Transaction } from './finance';
import { openPlaidLink } from './plaid';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Returns a fetcher that attaches the current Clerk session token. */
export function useApi() {
  const { getToken } = useAuth();
  return useCallback(
    async <T>(path: string, init?: RequestInit): Promise<T> => {
      const token = await getToken();
      const response = await fetch(`${config.apiUrl}${path}`, {
        ...init,
        headers: {
          Accept: 'application/json',
          ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...init?.headers,
        },
      });
      if (!response.ok) {
        throw new ApiError(response.status, `${init?.method ?? 'GET'} ${path} failed`);
      }
      if (response.status === 204) return null as T;
      return (await response.json()) as T;
    },
    [getToken],
  );
}

export type Me = { id: string; clerk_user_id: string; timezone: string };

export function useMe() {
  const api = useApi();
  return useQuery({ queryKey: ['me'], queryFn: () => api<Me>('/v1/me') });
}

// --- accounts ------------------------------------------------------------------------------

export const queryKeys = {
  summary: ['summary'] as const,
  accounts: ['accounts'] as const,
  account: (id: string) => ['accounts', id] as const,
  connections: ['connections'] as const,
  transactions: (params: TransactionParams = {}) => ['transactions', params] as const,
  transaction: (id: string) => ['transaction', id] as const,
};

export type TransactionParams = {
  account_id?: string;
  category?: string;
  q?: string;
  limit?: number;
};

function toQuery(params: TransactionParams): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

export function useSummary() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.summary, queryFn: () => api<Summary>('/v1/summary') });
}

export function useAccounts() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.accounts, queryFn: () => api<Account[]>('/v1/accounts') });
}

export function useAccount(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.account(id),
    queryFn: () => api<Account>(`/v1/accounts/${id}`),
  });
}

export function useConnections() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.connections,
    queryFn: () => api<Connection[]>('/v1/connections'),
  });
}

export function useTransactions(params: TransactionParams = {}) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.transactions(params),
    queryFn: () => api<Transaction[]>(`/v1/transactions${toQuery(params)}`),
  });
}

export function useTransaction(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.transaction(id),
    queryFn: () => api<Transaction>(`/v1/transactions/${id}`),
  });
}

/** Refetch everything that comes from bank data. */
function useInvalidateMoney() {
  const client = useQueryClient();
  return useCallback(
    () =>
      Promise.all(
        ['summary', 'accounts', 'connections', 'transactions', 'transaction'].map((key) =>
          client.invalidateQueries({ queryKey: [key] }),
        ),
      ),
    [client],
  );
}

/** Pull fresh balances and transactions from every bank, then refetch the screens. */
export function useSync() {
  const api = useApi();
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: () => api<Connection[]>('/v1/sync', { method: 'POST' }),
    onSettled: invalidate,
  });
}

export function useDisconnect() {
  const api = useApi();
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: (connectionId: string) =>
      api<null>(`/v1/connections/${connectionId}`, { method: 'DELETE' }),
    onSettled: invalidate,
  });
}

export type LinkResult = { status: 'connected' } | { status: 'exited' } | { status: 'failed' };

/**
 * Open Plaid Link and finish the connection. With a connectionId, Link opens in update mode
 * to fix an expired login, and the result is a fresh sync of that bank.
 */
export function useLinkBank() {
  const api = useApi();
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: async (connectionId?: string): Promise<LinkResult> => {
      const { link_token } = await api<{ link_token: string }>('/v1/link-token', {
        method: 'POST',
        body: JSON.stringify(connectionId ? { connection_id: connectionId } : {}),
      });
      const outcome = await openPlaidLink(link_token);
      if (outcome.status !== 'success') return { status: outcome.status };
      if (connectionId) {
        await api('/v1/sync', { method: 'POST' });
      } else {
        await api('/v1/connections', {
          method: 'POST',
          body: JSON.stringify({
            public_token: outcome.publicToken,
            institution_id: outcome.institution?.id ?? null,
            institution_name: outcome.institution?.name ?? null,
          }),
        });
      }
      return { status: 'connected' };
    },
    onSettled: invalidate,
  });
}
