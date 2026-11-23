import { useUser } from '@clerk/expo';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Monogram } from '@/components/badges';
import { IconButton } from '@/components/IconButton';
import { BellIcon } from '@/components/icons';
import { TabScreen } from '@/components/layouts';
import { PorterNoticed } from '@/components/porter';
import { ProgressBar } from '@/components/ProgressBar';
import { ListRow, SectionHeader } from '@/components/rows';
import { StatTile, TileGrid } from '@/components/StatTile';
import { Card, Stack } from '@/components/Surface';
import { Text } from '@/components/Text';
import { TextButton } from '@/components/Button';
import {
  useBenefits,
  useBudget,
  useNetWorth,
  usePoints,
  useSummary,
  useTransactions,
} from '@/lib/api';
import { leadPeriod, periodBudget, spentShare, type Budget, type BudgetPeriod } from '@/lib/budget';
import { noticeSentence } from '@/lib/credits';
import {
  amountLabel,
  categoryName,
  dueLabel,
  merchantName,
  netWorthChangeSentence,
} from '@/lib/finance';
import { formatCents, formatNumber } from '@/lib/money';
import { pointsCaption } from '@/lib/points';
import { useRefresh } from '@/lib/useRefresh';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * The greeting shrinks (to 75%) to stay on one line beside the bell. About 28 characters fit
 * that way on a phone; a longer line gets a second line instead of being cut off.
 */
const ONE_LINE_GREETING_CHARS = 28;

function greetingLines(text: string): 1 | 2 {
  return text.length <= ONE_LINE_GREETING_CHARS ? 1 : 2;
}

const dateLabel = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
});

export default function Home() {
  const { palette } = useTheme();
  const { user } = useUser();
  const firstName = user?.firstName ?? 'there';
  const greetingText = `${greeting()}, ${firstName}`;
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const summary = useSummary();
  const recent = useTransactions({ limit: 3 });
  const refresh = useRefresh();
  const netWorth = useNetWorth().data;
  const credits = useBenefits().data;
  const points = usePoints().data;
  const nudge = credits?.needs_attention[0];
  const budgetQuery = useBudget();
  // Never show stale or made-up numbers next to an error: no data means "—".
  const s = summary.isError ? undefined : summary.data;
  const budget = budgetQuery.isError ? undefined : budgetQuery.data;
  const failed = summary.isError || budgetQuery.isError;
  const lead = leadPeriod(budget);
  const tilePeriod: BudgetPeriod = lead ?? 'week';
  const tile = budget ? periodBudget(budget, tilePeriod) : undefined;
  const next = s?.upcoming_payments[0];
  const connected = summary.data?.has_connections ?? true;

  return (
    <TabScreen refreshControl={refresh}>
      <View style={styles.header}>
        <Pressable
          style={styles.who}
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Avatar letter={firstName.charAt(0).toUpperCase()} />
          <View style={styles.greeting}>
            <Text variant="body" muted numberOfLines={1}>
              {dateLabel.format(new Date())}
            </Text>
            <Text
              variant="row"
              weight="bold"
              style={{ fontSize: 20 }}
              numberOfLines={greetingLines(greetingText)}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {greetingText}
            </Text>
          </View>
        </Pressable>
        <IconButton
          icon={BellIcon}
          label="Notifications"
          badge
          onPress={() => router.push('/settings/notifications')}
        />
      </View>

      <Hero budget={budget} failed={failed} />

      {!connected ? (
        <View style={{ marginTop: space.xl }}>
          <PorterNoticed
            primary={{ title: 'Connect cards', onPress: () => router.push('/onboarding/connect') }}
          >
            Connect your cards and Porter will fill this in with your real balances and purchases.
          </PorterNoticed>
        </View>
      ) : nudge && !nudgeDismissed ? (
        <View style={{ marginTop: space.xl }}>
          <PorterNoticed
            primary={{
              title: 'Show me how',
              onPress: () => router.push(`/credits/${nudge.period_id}`),
            }}
            secondary={{ title: 'Later', onPress: () => setNudgeDismissed(true) }}
          >
            {noticeSentence(nudge)}
          </PorterNoticed>
        </View>
      ) : null}

      <View style={{ marginTop: space.xl }}>
        <TileGrid>
          <StatTile
            tone="mint"
            label={tilePeriod === 'week' ? 'This week' : 'This month'}
            value={tile ? formatCents(tile.spent_cents) : '—'}
            suffix={tile?.limit_cents ? `of ${formatCents(tile.limit_cents)}` : undefined}
            onPress={() => router.push('/spending')}
          >
            {tile?.limit_cents ? (
              <View style={{ marginTop: space.md }}>
                <ProgressBar
                  value={spentShare(tile)}
                  color={palette.tones.mint.accent}
                  track={palette.tones.mint.track}
                />
              </View>
            ) : null}
          </StatTile>
          <StatTile
            tone="lilac"
            label="Points"
            value={points && points.confirmed_count > 0 ? formatNumber(points.total_points) : '—'}
            caption={points ? pointsCaption(points) : ' '}
            onPress={() => router.push('/points')}
          />
          <StatTile
            tone="butter"
            label="Credits to use"
            value={credits ? formatCents(credits.expiring_this_month_cents) : '—'}
            caption={
              credits
                ? credits.expiring_this_month_count === 0
                  ? 'All used this month'
                  : `${credits.expiring_this_month_count} expire this month`
                : ' '
            }
            onPress={() => router.push('/benefits')}
          />
          <StatTile
            tone="sky"
            label="Next payment"
            value={next ? formatCents(next.amount_cents) : '—'}
            caption={
              next ? `${next.name} · ${dueLabel(next.due_date).text}` : s ? 'Nothing due' : ' '
            }
            onPress={() =>
              next ? router.push(`/card/${next.account_id}`) : router.push('/accounts')
            }
          />
        </TileGrid>
      </View>

      {netWorth && connected ? (
        <Card style={{ marginTop: space.lg, paddingVertical: space.xs }}>
          <ListRow
            title="Net worth"
            subtitle={netWorthChangeSentence(netWorth, '1W')}
            value={formatCents(netWorth.net_cents)}
            chevron
            onPress={() => router.push('/net-worth')}
          />
        </Card>
      ) : null}

      <Card style={{ marginTop: space.xl, paddingTop: space.xs }}>
        <SectionHeader
          title="Recent"
          action="See all"
          onAction={() => router.push('/transactions')}
        />
        <Stack>
          {(recent.data ?? []).map((t) => (
            <ListRow
              key={t.id}
              leading={<Monogram label={merchantName(t).charAt(0)} size={48} />}
              title={merchantName(t)}
              subtitle={`${t.account_name} · ${t.pending ? 'Pending' : categoryName(t.category)}`}
              value={amountLabel(t.amount_cents)}
              valueColor={t.amount_cents < 0 ? palette.moneyIn : undefined}
              onPress={() => router.push(`/transaction/${t.id}`)}
            />
          ))}
          {recent.data?.length === 0 ? (
            <Text variant="body" muted style={{ paddingVertical: space.md }}>
              No purchases yet.
            </Text>
          ) : null}
        </Stack>
      </Card>
    </TabScreen>
  );
}

const SINCE: Record<BudgetPeriod, string> = { week: 'since Monday', month: 'since the 1st' };

/** "You have $X left to spend this week." and the line under it, for every budget state. */
function Hero({ budget, failed }: { budget: Budget | undefined; failed: boolean }) {
  const { palette } = useTheme();
  const amount = (cents: number | null) => (
    <Text variant="display" color={palette.link} tabular>
      {cents === null ? '—' : formatCents(cents)}
    </Text>
  );

  if (failed || !budget) {
    return (
      <>
        <Text variant="display" style={styles.hero}>
          You have {amount(null)} left to spend this week.
        </Text>
        <Text variant="body" muted style={styles.heroSub}>
          {failed ? "Porter couldn't reach your data. Pull down to try again." : ' '}
        </Text>
      </>
    );
  }

  const lead = leadPeriod(budget);
  if (lead === null) {
    // Not set up yet, or "just show me what I spend".
    return (
      <>
        <Text variant="display" style={styles.hero}>
          You&apos;ve spent {amount(budget.week.spent_cents)} this week.
        </Text>
        {budget.configured ? (
          <Text variant="body" muted style={styles.heroSub}>
            No limit set. {formatCents(budget.month.spent_cents)} so far this month.
          </Text>
        ) : (
          <View style={styles.heroAction}>
            <TextButton
              title="Set a budget to see what's left"
              onPress={() => router.push('/settings/budget')}
            />
          </View>
        )}
      </>
    );
  }

  const p = periodBudget(budget, lead);
  const left = p.remaining_cents ?? 0;
  const spent = `You've spent ${formatCents(p.spent_cents)} ${SINCE[lead]}.`;
  return (
    <>
      <Text variant="display" style={styles.hero}>
        {left < 0 ? (
          <>
            You&apos;re {amount(-left)} over budget this {lead}.
          </>
        ) : (
          <>
            You have {amount(left)} left to spend this {lead}.
          </>
        )}
      </Text>
      <Text variant="body" muted style={styles.heroSub}>
        {spent}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.md,
  },
  who: { flexDirection: 'row', alignItems: 'center', gap: space.md, flex: 1 },
  // Takes the space left of the bell; the greeting shrinks to fit it.
  greeting: { flex: 1 },
  hero: { marginTop: space.xxl, fontSize: 40, lineHeight: 46 },
  heroSub: { marginTop: space.sm, fontSize: 17 },
  heroAction: { marginTop: space.sm, alignItems: 'flex-start' },
});
