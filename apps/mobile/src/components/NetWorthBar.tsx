import { StyleSheet, View } from 'react-native';

import { Text } from './Text';
import type { NetWorth } from '@/lib/finance';
import { formatCents } from '@/lib/money';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/**
 * What net worth is made of (handoff page 3): cash (sage), investing (sky) and what's owed on
 * cards and loans (grays), as one proportional bar with a legend. Proportions only; no axes.
 * The legend always names cash, investing and cards, so "Investing $0" is visible too.
 */
export function NetWorthBar({ netWorth, legend = true }: { netWorth: NetWorth; legend?: boolean }) {
  const { palette } = useTheme();
  const parts = [
    { label: 'Cash', cents: netWorth.cash_cents, color: palette.accent, always: true },
    {
      label: 'Investing',
      cents: netWorth.investments_cents,
      color: palette.tones.sky.accent,
      always: true,
    },
    { label: 'Cards', cents: netWorth.cards_cents, color: palette.faint, owed: true, always: true },
    { label: 'Loans', cents: netWorth.loans_cents, color: palette.raised, owed: true },
  ];
  const inBar = parts.filter((p) => p.cents > 0);
  const total = inBar.reduce((sum, p) => sum + p.cents, 0);
  if (total === 0) return null;

  return (
    <View>
      <View style={styles.bar} accessible={false}>
        {inBar.map((p) => (
          <View key={p.label} style={{ flex: p.cents / total, backgroundColor: p.color }} />
        ))}
      </View>
      {legend ? (
        <View style={styles.legend}>
          {parts
            .filter((p) => p.always || p.cents > 0)
            .map((p) => (
              <View key={p.label} style={styles.item}>
                <View style={[styles.dot, { backgroundColor: p.color }]} />
                <Text variant="caption" muted weight="medium">
                  {p.label}
                </Text>
                <Text variant="caption" muted weight="medium" tabular>
                  {formatCents(p.owed && p.cents > 0 ? -p.cents : p.cents)}
                </Text>
              </View>
            ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', height: 8, borderRadius: radius.pill, overflow: 'hidden', gap: 3 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.lg, rowGap: 6, marginTop: 10 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 4.5 },
});
