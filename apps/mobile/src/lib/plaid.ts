/**
 * Thin promise wrapper over Plaid Link (react-native-plaid-link-sdk v13). Otto only ever
 * receives a public token; bank credentials stay inside Plaid's own UI.
 *
 * Creating a session is slow (the SDK loads Plaid's whole flow before it resolves); opening
 * one is instant. So screens prepare a session ahead of time and taps only open it.
 */
import { createPlaidLinkSession, type LinkInstitution } from 'react-native-plaid-link-sdk';

export type PlaidOutcome =
  | { status: 'success'; publicToken: string; institution: LinkInstitution | null }
  | { status: 'exited' }
  | { status: 'failed' };

export type PreparedLink = { open: () => Promise<PlaidOutcome> };

/**
 * Load Link for a token without showing it. Only one session exists at a time: preparing a
 * new one replaces the previous, so use each prepared link once.
 */
export async function preparePlaidLink(token: string): Promise<PreparedLink> {
  let settle: ((outcome: PlaidOutcome) => void) | null = null;
  const finish = (outcome: PlaidOutcome) => {
    settle?.(outcome);
    settle = null;
  };
  const session = await createPlaidLinkSession({
    token,
    onSuccess: (success) =>
      finish({
        status: 'success',
        publicToken: success.publicToken,
        institution: success.metadata.institution ?? null,
      }),
    onExit: (exit) => finish({ status: exit.error ? 'failed' : 'exited' }),
    onEvent: () => {},
  });
  return {
    open: () =>
      new Promise<PlaidOutcome>((resolve, reject) => {
        settle = resolve;
        session.open(true).catch(reject);
      }),
  };
}
