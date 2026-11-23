import type { BottomTabBarProps } from 'expo-router/tabs';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AskIcon, BankIcon, HomeIcon, SpendingIcon, TicketIcon, type Icon } from './icons';
import { Text } from './Text';
import { useTheme } from '@/theme/useTheme';

const ICONS: Record<string, Icon> = {
  index: HomeIcon,
  accounts: BankIcon,
  spending: SpendingIcon,
  benefits: TicketIcon,
};

/** The route drawn as the raised sage button in the middle of the bar. */
export const ASK_ROUTE = 'ask';

const BAR_HEIGHT = 68;
const ASK_SIZE = 54;
const ASK_RING = 5;

/**
 * Floating bottom bar: Home · Accounts · [Ask] · Spending · Benefits. Ask is a 54pt sage
 * circle raised above the bar with a ring in the bar's color. Only the active tab is ink.
 */
export function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const { palette, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const barColor = scheme === 'dark' ? palette.surface : palette.ground;

  return (
    <View
      style={[styles.wrap, { bottom: Math.max(insets.bottom - 8, 12) }]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.bar,
          { backgroundColor: barColor, borderColor: palette.hairline, shadowColor: palette.shadow },
        ]}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const title = descriptors[route.key]?.options?.title ?? route.name;
          const onPress = () => {
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              void Haptics.selectionAsync();
              navigateToTab(route.key);
            }
          };

          if (route.name === ASK_ROUTE) {
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={title}
                onPress={onPress}
                style={styles.tab}
              >
                <View
                  style={[
                    styles.ask,
                    {
                      backgroundColor: palette.accent,
                      borderColor: barColor,
                      shadowColor: palette.shadow,
                    },
                  ]}
                >
                  <AskIcon color={palette.onAccent} size={28} />
                </View>
                <Text variant="caption" weight="bold" style={styles.askLabel}>
                  {title}
                </Text>
              </Pressable>
            );
          }

          const I = ICONS[route.name] ?? HomeIcon;
          const color = focused ? palette.ink : palette.muted;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={title}
              onPress={onPress}
              style={styles.tab}
            >
              <I color={color} size={24} />
              <Text
                variant="caption"
                weight={focused ? 'bold' : 'semibold'}
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
  wrap: { position: 'absolute', left: 12, right: 12 },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth * 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, height: BAR_HEIGHT },
  label: { fontSize: 12 },
  ask: {
    position: 'absolute',
    top: -(ASK_SIZE / 2) - ASK_RING + 6,
    width: ASK_SIZE + ASK_RING * 2,
    height: ASK_SIZE + ASK_RING * 2,
    borderRadius: (ASK_SIZE + ASK_RING * 2) / 2,
    borderWidth: ASK_RING,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  askLabel: { fontSize: 12, marginTop: 27 },
});
