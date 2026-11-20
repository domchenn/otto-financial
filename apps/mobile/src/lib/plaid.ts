/**
 * Thin promise wrapper over Plaid Link (react-native-plaid-link-sdk v13). Otto only ever
 * receives a public token; bank credentials stay inside Plaid's own UI.
 */
import { createPlaidLinkSession, type LinkInstitution } from 'react-native-plaid-link-sdk';

export type PlaidOutcome =
  | { status: 'success'; publicToken: string; institution: LinkInstitution | null }
  | { status: 'exited' }
  | { status: 'failed' };

export function openPlaidLink(token: string): Promise<PlaidOutcome> {
  return new Promise((resolve, reject) => {
    createPlaidLinkSession({
      token,
      onSuccess: (success) =>
        resolve({
          status: 'success',
          publicToken: success.publicToken,
          institution: success.metadata.institution ?? null,
        }),
      onExit: (exit) => resolve({ status: exit.error ? 'failed' : 'exited' }),
      onEvent: () => {},
    })
      .then((session) => session.open(true))
      .catch(reject);
  });
}
