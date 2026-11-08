import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';

/**
 * The user's theme choice. "system" follows the iPhone's setting; "light" and "dark" override
 * it for Otto only (via Appearance.setColorScheme, which useColorScheme/useTheme follow).
 */
export type AppearancePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'otto.appearance';

let current: AppearancePreference = 'system';
const listeners = new Set<() => void>();

export function isAppearancePreference(value: unknown): value is AppearancePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

function apply(preference: AppearancePreference) {
  Appearance.setColorScheme(preference === 'system' ? 'auto' : preference);
}

function publish(preference: AppearancePreference) {
  current = preference;
  apply(preference);
  for (const listener of listeners) listener();
}

/** Restore the saved choice. Call once at startup, before the splash screen hides. */
export async function loadAppearance(): Promise<void> {
  try {
    const saved = await SecureStore.getItemAsync(STORAGE_KEY);
    if (isAppearancePreference(saved)) publish(saved);
  } catch {
    // Storage unavailable: keep following the system.
  }
}

/** Apply a new choice immediately and save it for next launch. */
export function setAppearance(preference: AppearancePreference): void {
  publish(preference);
  SecureStore.setItemAsync(STORAGE_KEY, preference).catch(() => {
    // Not saved; the choice still applies for this session.
  });
}

export function getAppearance(): AppearancePreference {
  return current;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The current choice, re-rendering when it changes. */
export function useAppearance(): AppearancePreference {
  return useSyncExternalStore(subscribe, getAppearance, getAppearance);
}
