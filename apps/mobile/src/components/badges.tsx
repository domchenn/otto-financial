import { StyleSheet, View } from 'react-native';

import type { Icon } from './icons';
import { Text } from './Text';
import { radius, type ToneName } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Rounded square with a pastel fill and a line icon in the pastel's dark shade. */
export function IconTile({
  icon: I,
  tone,
  size = 56,
}: {
  icon: Icon;
  tone: ToneName;
  size?: number;
}) {
  const { palette } = useTheme();
  const t = palette.tones[tone];
  return (
    <View
      style={[
        styles.center,
        { width: size, height: size, borderRadius: size * 0.28, backgroundColor: t.bg },
      ]}
    >
      <I color={t.text} size={size * 0.46} />
    </View>
  );
}

/** Rounded square holding a short label ("AM", "7d", "AX"). */
export function LabelTile({
  label,
  tone,
  size = 56,
}: {
  label: string;
  tone: ToneName;
  size?: number;
}) {
  const { palette } = useTheme();
  const t = palette.tones[tone];
  return (
    <View
      style={[
        styles.center,
        { width: size, height: size, borderRadius: size * 0.28, backgroundColor: t.bg },
      ]}
    >
      <Text variant="row" weight="extrabold" color={t.text} style={{ fontSize: size * 0.32 }}>
        {label}
      </Text>
    </View>
  );
}

/** Merchant or category monogram on the raised surface. */
export function Monogram({ label, size = 56 }: { label: string; size?: number }) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        styles.center,
        { width: size, height: size, borderRadius: radius.input, backgroundColor: palette.raised },
      ]}
    >
      <Text variant="row" weight="bold" muted style={{ fontSize: size * 0.34 }}>
        {label}
      </Text>
    </View>
  );
}

/** Card art keeps its real colors in both themes. */
export function CardSwatch({
  color,
  chip = '#F5D27A',
  width = 72,
}: {
  color: string;
  chip?: string;
  width?: number;
}) {
  const { palette, scheme } = useTheme();
  const height = width * 0.62;
  return (
    <View
      style={{
        width,
        height,
        borderRadius: width * 0.12,
        backgroundColor: color,
        borderWidth: scheme === 'dark' ? 1 : 0,
        borderColor: palette.hairline,
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: width * 0.11,
          top: height * 0.16,
          width: width * 0.24,
          height: height * 0.28,
          borderRadius: 4,
          backgroundColor: chip,
        }}
      />
    </View>
  );
}

export function Avatar({ letter, size = 56 }: { letter: string; size?: number }) {
  const { palette } = useTheme();
  const t = palette.tones.indigo;
  return (
    <View
      style={[
        styles.center,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: t.bg },
      ]}
    >
      <Text variant="heading" weight="bold" color={t.text} style={{ fontSize: size * 0.42 }}>
        {letter}
      </Text>
    </View>
  );
}

/** Small rounded pill with pastel fill, e.g. "8% utilization · healthy". */
export function Pill({ label, tone }: { label: string; tone: ToneName }) {
  const { palette } = useTheme();
  const t = palette.tones[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      <Text variant="caption" weight="bold" color={t.text} style={{ fontSize: 14 }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  pill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, alignSelf: 'flex-start' },
});
