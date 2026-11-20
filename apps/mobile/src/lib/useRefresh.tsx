import { RefreshControl } from 'react-native';

import { useSync } from './api';
import { useTheme } from '@/theme/useTheme';

/** Pull to refresh: asks the API to sync every bank, then refetches the screen. */
export function useRefresh() {
  const sync = useSync();
  const { palette } = useTheme();
  return (
    <RefreshControl
      refreshing={sync.isPending}
      onRefresh={() => sync.mutate()}
      tintColor={palette.muted}
    />
  );
}
