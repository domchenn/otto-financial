import type { BottomTabBarProps } from 'expo-router/tabs';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeIcon, SparkleIcon, SpendingIcon, WalletIcon, type Icon } from './icons';
import { Text } from './Text';
import { screen, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const ICONS: Record<string, Icon> = {
  index: HomeIcon,
  wallet: WalletIcon,
  spending: SpendingIcon,
  ask: SparkleIcon,
};

/** Floating white pill nav bar. Ask stays indigo so Otto is always one tap away. */
export function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[styles.wrap, { bottom: Math.max(insets.bottom - 4, space.lg) }]}
      pointerEvents="box-none"
    >
      <View style={[styles.bar, { backgroundColor: palette.surface, shadowColor: palette.shadow }]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const I = ICONS[route.name] ?? HomeIcon;
          const title = descriptors[route.key]?.options?.title ?? route.name;
          const isAsk = route.name === 'ask';
          const color = isAsk ? palette.link : focused ? palette.ink : palette.muted;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={title}
              onPress={() => {
                const event = emitter.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  void Haptics.selectionAsync();
                  navigateToTab(route.key);
                }
              }}
              style={styles.tab}
            >
              <I color={color} size={26} filled={isAsk && focused} />
              <Text
                variant="caption"
                weight={focused || isAsk ? 'bold' : 'semibold'}
                color={color}
                style={styles.label}
              >
                {title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: screen.side - 8, right: screen.side - 8 },
  bar: {
    height: 76,
    borderRadius: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: space.sm,
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, height: 64 },
  label: { fontSize: 13 },
});
