import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, space, type ToneName } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type Props = {
  children: ReactNode;
  /** A pastel role instead of a white card. Each pastel always means the same thing. */
  tone?: ToneName;
  padded?: boolean;
  /** Only floating things (nav bar, sheets, notification previews) get a shadow. */
  floating?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** White card on the off-white ground (or a pastel tile). Depth without shadows. */
export function Card({
  children,
  tone,
  padded = true,
  floating,
  onPress,
  accessibilityLabel,
  style,
}: Props) {
  const { palette } = useTheme();
  const base = [
    styles.card,
    { backgroundColor: tone ? palette.tones[tone].bg : palette.surface },
    padded && styles.padded,
    floating && [styles.floating, { shadowColor: palette.shadow }],
    style,
  ];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, { opacity: pressed ? 0.85 : 1 }]}
    >
      {children}
    </Pressable>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const { palette } = useTheme();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth * 2,
        backgroundColor: palette.hairline,
        marginLeft: inset,
        opacity: 0.7,
      }}
    />
  );
}

/** Rows separated by hairlines. */
export function Stack({ children, inset }: { children: ReactNode[]; inset?: number }) {
  const items = children.filter(Boolean);
  return (
    <>
      {items.map((child, i) => (
        <View key={i}>
          {i > 0 ? <Divider inset={inset} /> : null}
          {child}
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, overflow: 'visible' },
  padded: { padding: space.xl },
  floating: {
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});
