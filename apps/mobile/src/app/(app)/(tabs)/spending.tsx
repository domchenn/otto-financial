import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CategoryIcon } from '@/components/CategoryIcon';
import { TabScreen } from '@/components/layouts';
import { OttoNoticed } from '@/components/otto';
import { ProgressBar } from '@/components/ProgressBar';
import { ListRow, SectionHeader } from '@/components/rows';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Card, Stack } from '@/components/Surface';
import { Text } from '@/components/Text';
import { useBudget, useSpending } from '@/lib/api';
import { periodBudget, remainingLabel, spentShare, type BudgetPeriod } from '@/lib/budget';
import { categoryName, parseDate, spendingInsight } from '@/lib/finance';
import { formatCents } from '@/lib/money';
import { useRefresh } from '@/lib/useRefresh';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const CHART_HEIGHT = 72;

export default function Spending() {
  const { palette } = useTheme();
  const [period, setPeriod] = useState<BudgetPeriod>('week');
  const spending = useSpending(period);
  const budgetQuery = useBudget();
  const refresh = useRefresh();
  // Never show stale or made-up numbers next to an error.
  const data = spending.isError ? undefined : spending.data;
  const budget = budgetQuery.isError ? undefined : budgetQuery.data;
  // The budget's own spend uses the same filters as this screen, so they always agree.
  const limit = budget ? periodBudget(budget, period) : undefined;
  const spent = data?.spent_cents ?? 0;
  const left = limit?.remaining_cents ?? null;
  // One color for every progress bar on this screen: the Home "This week" green.
  const barColor = palette.tones.mint.accent;
  const insight = data ? spendingInsight(data) : null;

  return (
    <TabScreen refreshControl={refresh}>
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
            {data ? formatCents(spent, { cents: true }) : '—'}
          </Text>
          {limit?.limit_cents ? (
            <Text variant="body" muted style={{ fontSize: 20 }}>
              {' '}
              of {formatCents(limit.limit_cents)}
            </Text>
          ) : null}
        </View>
        <View style={{ marginTop: space.md }}>
          <ProgressBar
            value={data && limit ? spentShare(limit) : 0}
            color={barColor}
            track={palette.raised}
            height={10}
          />
        </View>
        <Text
          variant="row"
          weight="bold"
          color={spending.isError || (left !== null && left < 0) ? palette.alert : palette.ink}
          style={{ marginTop: space.md }}
        >
          {spending.isError
            ? "Otto couldn't load your spending. Pull down to try again."
            : !data
              ? ' '
              : limit && limit.limit_cents !== null
                ? remainingLabel(limit)
                : budget?.configured
                  ? `No ${period}ly limit set`
                  : 'No budget set yet'}
        </Text>

        {period === 'week' && data ? <WeekChart days={data.days} /> : null}
      </Card>

      {insight ? (
        <View style={{ marginTop: space.lg }}>
          <OttoNoticed>{insight}</OttoNoticed>
        </View>
      ) : null}

      {data && data.categories.length > 0 ? (
        <>
          <SectionHeader
            title="Categories"
            detail={`${data.categories.length} ${data.categories.length === 1 ? 'category' : 'categories'}`}
          />
          <Card style={{ paddingVertical: space.sm }}>
            <Stack>
              {data.categories.map((c) => (
                <ListRow
                  key={c.category ?? 'none'}
                  leading={<CategoryIcon category={c.category} />}
                  title={categoryName(c.category)}
                  value={formatCents(c.cents, { cents: true })}
                  onPress={() =>
                    router.push({
                      pathname: '/transactions',
                      params: c.category ? { category: c.category } : {},
                    })
                  }
                >
                  <View style={{ marginTop: space.sm }}>
                    <ProgressBar
                      value={spent > 0 ? c.cents / spent : 0}
                      color={barColor}
                      track={palette.raised}
                      height={8}
                    />
                  </View>
                </ListRow>
              ))}
            </Stack>
          </Card>
        </>
      ) : null}
      {data && data.categories.length === 0 ? (
        <Text variant="body" muted style={{ marginTop: space.xl }}>
          No purchases this {period} yet.
        </Text>
      ) : null}
    </TabScreen>
  );
}

/** Mon–Sun bars: soft gray, today in ink, days still to come as a stub. */
function WeekChart({ days }: { days: { date: string; cents: number | null }[] }) {
  const { palette } = useTheme();
  const max = Math.max(1, ...days.map((d) => d.cents ?? 0));
  const todayIndex = days.reduce((last, d, i) => (d.cents !== null ? i : last), -1);
  return (
    <View style={styles.chart} accessibilityLabel="Daily spending this week">
      {days.map((d, i) => {
        const today = i === todayIndex;
        const future = d.cents === null;
        const h = future ? 4 : Math.max(10, (Math.max(d.cents ?? 0, 0) / max) * CHART_HEIGHT);
        return (
          <View key={d.date} style={styles.barCol}>
            <View style={styles.barSlot}>
              <View
                style={{
                  height: h,
                  borderRadius: future ? 2 : 8,
                  backgroundColor: today ? palette.ink : palette.hairline,
                }}
              />
            </View>
            <Text
              center
              variant="caption"
              weight={today ? 'extrabold' : 'semibold'}
              color={today ? palette.ink : palette.muted}
            >
              {DAY_LABELS[(parseDate(d.date).getDay() + 6) % 7]}
            </Text>
          </View>
        );
      })}
    </View>
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
