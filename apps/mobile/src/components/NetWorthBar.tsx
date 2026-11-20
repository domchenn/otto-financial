import { StyleSheet, View } from 'react-native';

import { Text } from './Text';
import type { NetWorth } from '@/lib/finance';
import { formatCents } from '@/lib/money';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/**
 * What net worth is made of: cash and investments (money in) against cards and loans, as one
 * proportional bar with a legend. Proportions only; no axes.
 */
export function NetWorthBar({ netWorth, legend = true }: { netWorth: NetWorth; legend?: boolean }) {
  const { palette } = useTheme();
  const parts = [
    { label: 'Cash', cents: netWorth.cash_cents, color: palette.moneyIn },
    { label: 'Investments', cents: netWorth.investments_cents, color: palette.moneyIn, soft: true },
    { label: 'Cards', cents: netWorth.cards_cents, color: palette.faint },
    { label: 'Loans', cents: netWorth.loans_cents, color: palette.hairline },
  ].filter((p) => p.cents > 0);
  const total = parts.reduce((sum, p) => sum + p.cents, 0);
  if (total === 0) return null;

  return (
    <View>
      <View style={[styles.bar, { backgroundColor: palette.raised }]} accessible={false}>
        {parts.map((p) => (
          <View
            key={p.label}
            style={{ flex: p.cents / total, backgroundColor: p.color, opacity: p.soft ? 0.55 : 1 }}
          />
        ))}
      </View>
      {legend ? (
        <View style={styles.legend}>
          {parts.map((p) => (
            <View key={p.label} style={styles.item}>
              <View
                style={[styles.dot, { backgroundColor: p.color, opacity: p.soft ? 0.55 : 1 }]}
              />
              <Text variant="caption" muted>
                {p.label}
              </Text>
              <Text variant="caption" weight="bold" tabular>
                {p.label === 'Cards' || p.label === 'Loans'
                  ? formatCents(-p.cents)
                  : formatCents(p.cents)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', height: 12, borderRadius: radius.pill, overflow: 'hidden', gap: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.md },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
