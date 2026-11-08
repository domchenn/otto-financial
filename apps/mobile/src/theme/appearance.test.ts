import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Appearance } from 'react-native';

import { getAppearance, isAppearancePreference, loadAppearance, setAppearance } from './appearance';

const store = new Map<string, string>();
const mockGet = jest.fn(async (key: string) => store.get(key) ?? null);
const mockSet = jest.fn(async (key: string, value: string) => {
  store.set(key, value);
});

jest.mock('expo-secure-store', () => ({
  getItemAsync: (key: string) => mockGet(key),
  setItemAsync: (key: string, value: string) => mockSet(key, value),
}));

const setColorScheme = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});

beforeEach(() => {
  setAppearance('system');
  store.clear();
  jest.clearAllMocks();
});

describe('appearance preference', () => {
  it('overrides the app theme and saves the choice', async () => {
    setAppearance('dark');
    expect(getAppearance()).toBe('dark');
    expect(setColorScheme).toHaveBeenCalledWith('dark');
    await Promise.resolve();
    expect(store.get('otto.appearance')).toBe('dark');
  });

  it('maps "system" to the auto override so the iPhone setting wins', () => {
    setAppearance('light');
    setAppearance('system');
    expect(setColorScheme).toHaveBeenLastCalledWith('auto');
  });

  it('restores the saved choice at launch', async () => {
    store.set('otto.appearance', 'light');
    await loadAppearance();
    expect(getAppearance()).toBe('light');
    expect(setColorScheme).toHaveBeenCalledWith('light');
  });

  it('ignores a corrupt saved value and keeps following the system', async () => {
    store.set('otto.appearance', 'sepia');
    await loadAppearance();
    expect(getAppearance()).toBe('system');
    expect(setColorScheme).not.toHaveBeenCalled();
  });

  it('keeps working when storage fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('keychain locked'));
    await expect(loadAppearance()).resolves.toBeUndefined();
    mockSet.mockRejectedValueOnce(new Error('keychain locked'));
    expect(() => setAppearance('dark')).not.toThrow();
    expect(getAppearance()).toBe('dark');
  });

  it('validates preference values', () => {
    expect(isAppearancePreference('dark')).toBe(true);
    expect(isAppearancePreference('auto')).toBe(false);
    expect(isAppearancePreference(null)).toBe(false);
  });
});
