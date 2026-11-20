import Constants from 'expo-constants';
import { TurboModuleRegistry } from 'react-native';

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} is not set. Copy .env.example to .env and fill it in.`);
  }
  return value;
}

/** "172.20.10.2" from "http://172.20.10.2:8081/index.bundle?…" or "172.20.10.2:8081". */
export function hostOf(url: string | null | undefined): string | null {
  if (!url) return null;
  const host = url.replace(/^[a-z]+:\/\//i, '').split(/[:/?#]/)[0];
  return host || null;
}

/** Where Metro served this bundle from. Only meaningful in development. */
function metroUrl(): string | null {
  const sourceCode = TurboModuleRegistry.get<{
    getConstants: () => { scriptURL?: string | null };
  }>('SourceCode');
  return sourceCode?.getConstants().scriptURL ?? Constants.expoConfig?.hostUri ?? null;
}

/**
 * The API base URL. `EXPO_PUBLIC_API_URL=auto` (for local development) means "the machine
 * Metro is running on, port 8000", so the phone follows the Mac across Wi-Fi networks and
 * hotspots without editing .env. Any other value is used as-is (staging, prod).
 */
export function resolveApiUrl(envValue: string | undefined, metro: string | null): string {
  const value = required('EXPO_PUBLIC_API_URL', envValue);
  if (value !== 'auto') return value.replace(/\/$/, '');
  const host = hostOf(metro);
  if (!host) {
    // Never crash at startup over this; requests will fail with a clear network error.
    console.warn('EXPO_PUBLIC_API_URL=auto but the Metro host is unknown; using localhost.');
    return 'http://localhost:8000';
  }
  return `http://${host}:8000`;
}

// EXPO_PUBLIC_* values are inlined at build time, so they must be read with static keys.
export const config = {
  apiUrl: resolveApiUrl(process.env.EXPO_PUBLIC_API_URL, metroUrl()),
  clerkPublishableKey: required(
    'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  ),
};
