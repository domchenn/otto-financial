import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Monogram } from '@/components/badges';
import { TabScreen } from '@/components/layouts';
import { Insight } from '@/components/otto';
import { ProgressBar } from '@/components/ProgressBar';
import { ListRow, SectionHeader } from '@/components/rows';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Card, Stack } from '@/components/Surface';
import { Text } from '@/components/Text';
import { formatCents } from '@/lib/money';
import { categories, week } from '@/lib/sample';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const CHART_HEIGHT = 120;

/** Sample month figures until the spend pipeline lands. */
const month = { spentCents: 81240, limitCents: 214000, underPaceCents: 23500 };

export default function Spending() {
  const { palette } = useTheme();
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const data = period === 'week' ? week : month;
  const left = data.limitCents - data.spentCents;
  const maxDay = Math.max(...week.days.map((d) => d ?? 0));
  const mint = palette.tones.mint;

  return (
    <TabScreen>
      <View style={styles.header}>
        <Text variant="display">Spending</Text>
        <SegmentedControl
          label="Period"
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
          ]}
        />
      </View>

      <Card style={{ marginTop: space.xl }}>
        <Text variant="body" muted>
          Spent this {period}
        </Text>
        <View style={styles.amountRow}>
          <Text variant="hero" tabular>
            {formatCents(data.spentCents, { cents: true })}
          </Text>
          <Text variant="body" muted style={{ fontSize: 20 }}>
            {' '}
            of {formatCents(data.limitCents)}
          </Text>
        </View>
        <View style={{ marginTop: space.md }}>
          <ProgressBar
            value={data.spentCents / data.limitCents}
            color={mint.accent}
            track={mint.track}
            height={10}
          />
        </View>
        <Text variant="row" weight="bold" color={palette.moneyIn} style={{ marginTop: space.md }}>
          {formatCents(left)} left · {formatCents(data.underPaceCents)} under your usual pace
        </Text>

        {period === 'week' ? (
          <View style={styles.chart} accessibilityLabel="Daily spending this week">
            {week.days.map((cents, i) => {
              const today = i === week.todayIndex;
              const h = cents === null ? 4 : Math.max(16, (cents / maxDay) * CHART_HEIGHT);
              return (
                <View key={i} style={styles.barCol}>
                  <View style={styles.barSlot}>
                    <View
                      style={{
                        height: h,
                        borderRadius: cents === null ? 2 : 10,
                        backgroundColor:
                          cents === null
                            ? palette.raised
                            : today
                              ? palette.action
                              : palette.illustration.mint,
                      }}
                    />
                  </View>
                  <Text
                    center
                    variant="caption"
                    weight={today ? 'extrabold' : 'semibold'}
                    color={today ? palette.ink : palette.muted}
                  >
                    {DAY_LABELS[i]}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </Card>

      <View style={{ marginTop: space.lg }}>
        <Insight>
          Dining is 44% of your week, and almost all of it went on your Gold card at 4x. Nicely
          done.
        </Insight>
      </View>

      <SectionHeader title="Categories" detail={`${categories.length} categories`} />
      <Card style={{ paddingVertical: space.sm }}>
        <Stack>
          {categories.map((c) => (
            <ListRow
              key={c.id}
              leading={<Monogram label={c.short} size={52} />}
              title={c.name}
              value={formatCents(c.cents, { cents: true })}
              onPress={() => router.push(`/category/${c.id}`)}
            >
              <View style={{ marginTop: space.sm }}>
                <ProgressBar
                  value={c.cents / week.spentCents}
                  color={palette.action}
                  track={palette.raised}
                  height={8}
                />
              </View>
            </ListRow>
          ))}
        </Stack>
      </Card>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginTop: space.xs,
  },
  chart: { flexDirection: 'row', gap: space.sm, marginTop: space.xl },
  barCol: { flex: 1, alignItems: 'stretch', gap: space.sm },
  barSlot: { height: CHART_HEIGHT, justifyContent: 'flex-end' },
});
