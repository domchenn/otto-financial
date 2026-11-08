import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { CheckIcon, SparkleIcon } from './icons';
import { Text } from './Text';
import { fonts, type ToneName } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/**
 * Illustration kit: coin, card, points bubble, check tile, sparkle, dot.
 * Scattered and slightly rotated. Pass absolute positions through `style`.
 */
type Placed = { style?: StyleProp<ViewStyle>; rotate?: number };

function place(style: StyleProp<ViewStyle>, rotate = 0): StyleProp<ViewStyle> {
  return [styles.abs, { transform: [{ rotate: `${rotate}deg` }] }, style];
}

export function Coin({ size = 96, style, rotate }: Placed & { size?: number }) {
  const { palette } = useTheme();
  const c = palette.illustration;
  return (
    <View style={place(style, rotate)}>
      <View
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.coinShade }}
      >
        <View
          style={[
            styles.center,
            { width: size, height: size * 0.94, borderRadius: size / 2, backgroundColor: c.coin },
          ]}
        >
          <Text style={{ fontFamily: fonts.extrabold, fontSize: size * 0.44, color: c.coinInk }}>
            $
          </Text>
        </View>
      </View>
    </View>
  );
}

export function MiniCard({ width = 160, style, rotate = -12 }: Placed & { width?: number }) {
  const { palette } = useTheme();
  const c = palette.illustration;
  const height = width * 0.62;
  return (
    <View style={place(style, rotate)}>
      <View style={{ width, height, borderRadius: width * 0.1, backgroundColor: c.card }}>
        <View
          style={{
            position: 'absolute',
            left: width * 0.14,
            top: height * 0.2,
            width: width * 0.2,
            height: height * 0.24,
            borderRadius: 6,
            backgroundColor: c.cardChip,
          }}
        />
      </View>
    </View>
  );
}

export function PointsBubble({
  label,
  tone = 'lilac',
  style,
  rotate = 6,
  size = 'md',
}: Placed & { label: string; tone?: ToneName; size?: 'sm' | 'md' }) {
  const { palette } = useTheme();
  const t = palette.tones[tone];
  return (
    <View
      style={[
        place(style, rotate),
        {
          backgroundColor: t.bg,
          paddingHorizontal: size === 'sm' ? 14 : 20,
          paddingVertical: size === 'sm' ? 8 : 12,
          borderRadius: 18,
        },
      ]}
    >
      <Text weight="extrabold" color={t.text} style={{ fontSize: size === 'sm' ? 15 : 19 }}>
        {label}
      </Text>
    </View>
  );
}

export function CheckTile({ size = 80, style, rotate = -8 }: Placed & { size?: number }) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        place(style, rotate),
        styles.center,
        {
          width: size,
          height: size,
          borderRadius: size * 0.24,
          backgroundColor: palette.tones.sky.bg,
        },
      ]}
    >
      <CheckIcon color={palette.link} size={size * 0.42} />
    </View>
  );
}

export function Sparkle({ size = 36, color, style }: Placed & { size?: number; color?: string }) {
  const { palette } = useTheme();
  return (
    <View style={place(style)}>
      <SparkleIcon color={color ?? palette.illustration.sparkle} size={size} filled />
    </View>
  );
}

export function Dot({ size = 14, color, style }: Placed & { size?: number; color: string }) {
  return (
    <View
      style={[
        place(style),
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}
    />
  );
}

/** A fixed-height stage the kit pieces are positioned inside. */
export function Stage({ height, children }: { height: number; children: ReactNode }) {
  return <View style={{ height, width: '100%' }}>{children}</View>;
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
