import { useAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { config } from './config';
import type { BudgetPeriod } from './budget';
import type { Benefits, CardProduct } from './credits';
import type { Account, Connection, NetWorth, Spending, Summary, Transaction } from './finance';
import { preparePlaidLink, type PlaidOutcome, type PreparedLink } from './plaid';

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
  netWorth: ['net-worth'] as const,
  spending: (period: BudgetPeriod) => ['spending', period] as const,
  accounts: ['accounts'] as const,
  account: (id: string) => ['accounts', id] as const,
  connections: ['connections'] as const,
  transactions: (params: TransactionParams = {}) => ['transactions', params] as const,
  transaction: (id: string) => ['transaction', id] as const,
  benefits: ['benefits'] as const,
  cardProducts: ['card-products'] as const,
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

/** Discretionary spend for this week or month. Home and Spending both read this. */
export function useSpending(period: BudgetPeriod) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.spending(period),
    queryFn: () => api<Spending>(`/v1/spending?period=${period}`),
  });
}

export function useNetWorth() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.netWorth, queryFn: () => api<NetWorth>('/v1/net-worth') });
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
        [
          'summary',
          'net-worth',
          'spending',
          'accounts',
          'connections',
          'transactions',
          'transaction',
          'benefits',
        ].map((key) => client.invalidateQueries({ queryKey: [key] })),
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

const preparedLinkKey = ['plaid-link'] as const;
// Link tokens last four hours; refresh well before that.
const PREPARED_LINK_MS = 30 * 60_000;

function useFetchPreparedLink() {
  const api = useApi();
  return useCallback(
    async (connectionId?: string): Promise<PreparedLink> => {
      const { link_token } = await api<{ link_token: string }>('/v1/link-token', {
        method: 'POST',
        body: JSON.stringify(connectionId ? { connection_id: connectionId } : {}),
      });
      return preparePlaidLink(link_token);
    },
    [api],
  );
}

/**
 * Load Plaid Link in the background so tapping "connect" opens it instantly. Call it on any
 * screen with a connect button. Failures stay quiet here; the tap surfaces them.
 */
export function usePrepareLink() {
  const fetchPreparedLink = useFetchPreparedLink();
  useQuery({
    queryKey: preparedLinkKey,
    queryFn: () => fetchPreparedLink(),
    staleTime: PREPARED_LINK_MS,
    gcTime: PREPARED_LINK_MS,
    retry: false,
  });
}

/**
 * Open Plaid Link and finish the connection. With a connectionId, Link opens in update mode
 * to fix an expired login, and the result is a fresh sync of that bank.
 */
export function useLinkBank() {
  const api = useApi();
  const client = useQueryClient();
  const fetchPreparedLink = useFetchPreparedLink();
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: async (connectionId?: string): Promise<LinkResult> => {
      let outcome: PlaidOutcome;
      try {
        const link = connectionId
          ? await fetchPreparedLink(connectionId)
          : await client.fetchQuery({
              queryKey: preparedLinkKey,
              queryFn: () => fetchPreparedLink(),
              staleTime: PREPARED_LINK_MS,
            });
        outcome = await link.open();
      } finally {
        // A session is single-use, and preparing another replaces it: always start fresh.
        client.removeQueries({ queryKey: preparedLinkKey });
      }
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

// --- benefits ------------------------------------------------------------------------------

export function useBenefits() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.benefits, queryFn: () => api<Benefits>('/v1/benefits') });
}

export function useCardProducts() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.cardProducts,
    queryFn: () => api<CardProduct[]>('/v1/card-products'),
    staleTime: Infinity, // the catalog only changes with a deploy
  });
}

/** Both benefit mutations return the refreshed benefits, so the cache is set directly. */
function useSetBenefits() {
  const client = useQueryClient();
  return useCallback((data: Benefits) => client.setQueryData(queryKeys.benefits, data), [client]);
}

export function useAssignCard() {
  const api = useApi();
  const setBenefits = useSetBenefits();
  return useMutation({
    mutationFn: (body: {
      accountId: string;
      cardId: string | null;
      anniversaryMonth: number | null;
    }) =>
      api<Benefits>(`/v1/accounts/${body.accountId}/card`, {
        method: 'PUT',
        body: JSON.stringify({ card_id: body.cardId, anniversary_month: body.anniversaryMonth }),
      }),
    onSuccess: setBenefits,
  });
}

export function useMarkCreditUsed() {
  const api = useApi();
  const setBenefits = useSetBenefits();
  return useMutation({
    mutationFn: (body: { periodId: string; used: boolean }) =>
      api<Benefits>(`/v1/benefit-periods/${body.periodId}/used`, {
        method: 'POST',
        body: JSON.stringify({ used: body.used }),
      }),
    onSuccess: setBenefits,
  });
}
