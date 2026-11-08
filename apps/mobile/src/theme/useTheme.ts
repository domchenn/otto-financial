import { useColorScheme } from 'react-native';

import { dark, light, type Palette } from './tokens';

/** Follows the system appearance. Light is the default when the system has no preference. */
export function useTheme(): { palette: Palette; scheme: 'dark' | 'light' } {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { palette: scheme === 'dark' ? dark : light, scheme };
}
