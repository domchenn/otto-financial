import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { useTheme } from '@/theme/useTheme';

export type Stat = {
  label: string;
  value: string;
  sub?: string;
  /** warn = terracotta (over plan), accent = sage (covered), muted otherwise. */
  subTone?: 'warn' | 'accent' | 'muted';
  onPress?: () => void;
};

/** Three numbers side by side, split by hairlines (handoff §4.2). */
export function StatRow({ stats }: { stats: Stat[] }) {
  const { palette } = useTheme();
  const subColor = { warn: palette.alert, accent: palette.link, muted: palette.muted };

  return (
    <View style={styles.row}>
      {stats.map((s, i) => {
        const body = (
          <>
            <Text variant="small" muted numberOfLines={1}>
              {s.label}
            </Text>
            <Text
              variant="row"
              weight="bold"
              tabular
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              style={styles.value}
            >
              {s.value}
            </Text>
            <Text
              variant="small"
              weight="semibold"
              color={subColor[s.subTone ?? 'muted']}
              numberOfLines={1}
              style={styles.sub}
            >
              {s.sub ?? ' '}
            </Text>
          </>
        );
        const cell = [
          styles.cell,
          i > 0 && [styles.divided, { borderLeftColor: palette.hairline }],
        ];
        return s.onPress ? (
          <Pressable
            key={s.label}
            accessibilityRole="button"
            accessibilityLabel={`${s.label}, ${s.value}${s.sub ? `, ${s.sub}` : ''}`}
            onPress={s.onPress}
            style={({ pressed }) => [cell, { opacity: pressed ? 0.6 : 1 }]}
          >
            {body}
          </Pressable>
        ) : (
          <View key={s.label} style={cell}>
            {body}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  // Matches the design's 14pt column gap: padding before each hairline and after it.
  cell: { flex: 1, gap: 3, minHeight: 44, paddingRight: 10 },
  divided: { borderLeftWidth: 1, paddingLeft: 14 },
  value: { fontSize: 19, lineHeight: 24, letterSpacing: -0.6 },
  sub: { fontSize: 11, lineHeight: 14 },
});
