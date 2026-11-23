import { Alert } from 'react-native';

import { ApiError, type LinkResult } from './api';

/** A plain sentence for why connecting a bank failed. Never a raw status code. */
export function linkErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return 'Your sign-in expired. Sign out and back in, then try again.';
      case 403:
        return "This account isn't allowed on Porter's server. Sign in with your Porter account.";
      case 502:
        return "Plaid didn't accept the request. Try again in a moment.";
      case 503:
        return "Porter's server isn't set up for Plaid yet. Add the Plaid keys and restart it.";
      default:
        return `Porter's server had a problem (${error.status}). Try again in a moment.`;
    }
  }
  if (error instanceof TypeError) {
    return "Porter can't reach its server. Check that it's running and your phone is on the same network.";
  }
  return 'Something went wrong opening Plaid. Try again in a moment.';
}

/** Handlers for useLinkBank().mutate that tell the user when connecting didn't work. */
export const linkAlerts = {
  onSuccess: (result: LinkResult) => {
    if (result.status === 'failed') {
      Alert.alert("That didn't connect", 'Nothing was changed. Give it another try in a moment.');
    }
  },
  onError: (error: unknown) => {
    // Shows in the Metro terminal, so the real cause is visible while developing.
    console.warn('Connecting a bank failed:', error);
    Alert.alert("Couldn't connect", linkErrorMessage(error));
  },
};
