import Constants from 'expo-constants';

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} is not set. Copy .env.example to .env and fill it in.`);
  }
  return value;
}

/**
 * The API base URL. `EXPO_PUBLIC_API_URL=auto` (for local development) means "the machine
 * Metro is running on, port 8000", so the phone follows the Mac across Wi-Fi networks and
 * hotspots without editing .env. Any other value is used as-is (staging, prod).
 */
export function resolveApiUrl(envValue: string | undefined, metroHostUri: string | undefined) {
  const value = required('EXPO_PUBLIC_API_URL', envValue);
  if (value !== 'auto') return value.replace(/\/$/, '');
  const host = metroHostUri?.split(':')[0];
  if (!host) {
    throw new Error('EXPO_PUBLIC_API_URL=auto needs Metro. Start it with `make dev`.');
  }
  return `http://${host}:8000`;
}

// EXPO_PUBLIC_* values are inlined at build time, so they must be read with static keys.
export const config = {
  apiUrl: resolveApiUrl(process.env.EXPO_PUBLIC_API_URL, Constants.expoConfig?.hostUri),
  clerkPublishableKey: required(
    'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  ),
};
