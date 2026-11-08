import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from './Surface';
import { Text } from './Text';
import { space, type ToneName } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type Props = {
  tone: ToneName;
  label: string;
  value: string;
  /** Small text after the value, e.g. "of $500". */
  suffix?: string;
  caption?: string;
  children?: ReactNode;
  onPress?: () => void;
};

/** Pastel stat tile. Text on a pastel uses its paired dark shade, never black or grey. */
export function StatTile({ tone, label, value, suffix, caption, children, onPress }: Props) {
  const { palette } = useTheme();
  const t = palette.tones[tone];
  return (
    <Card
      tone={tone}
      onPress={onPress}
      accessibilityLabel={`${label}: ${value}`}
      style={styles.tile}
    >
      <Text variant="caption" color={t.text} style={styles.label}>
        {label}
      </Text>
      <View style={styles.valueRow}>
        <Text variant="heading" tabular color={palette.ink} weight="extrabold" style={styles.value}>
          {value}
        </Text>
        {suffix ? (
          <Text variant="body" color={t.text}>
            {' '}
            {suffix}
          </Text>
        ) : null}
      </View>
      {caption ? (
        <Text variant="body" color={t.text} style={styles.caption}>
          {caption}
        </Text>
      ) : null}
      {children}
    </Card>
  );
}

export function TileGrid({ children }: { children: ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  tile: { flexBasis: '47%', flexGrow: 1, padding: space.xl, minHeight: 128 },
  label: { fontSize: 15 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: space.md, flexWrap: 'wrap' },
  value: { fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  caption: { marginTop: space.xs, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
});
