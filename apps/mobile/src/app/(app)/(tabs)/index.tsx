import { useUser } from '@clerk/expo';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Monogram } from '@/components/badges';
import { IconButton } from '@/components/IconButton';
import { BellIcon } from '@/components/icons';
import { TabScreen } from '@/components/layouts';
import { OttoNoticed } from '@/components/otto';
import { ProgressBar } from '@/components/ProgressBar';
import { ListRow, SectionHeader } from '@/components/rows';
import { StatTile, TileGrid } from '@/components/StatTile';
import { Card, Stack } from '@/components/Surface';
import { Text } from '@/components/Text';
import { useBenefits, useNetWorth, useSummary, useTransactions } from '@/lib/api';
import { noticeSentence } from '@/lib/credits';
import {
  amountLabel,
  categoryName,
  dueLabel,
  merchantName,
  netWorthChangeSentence,
} from '@/lib/finance';
import { formatCents, formatNumber } from '@/lib/money';
// Budgets and points are still sample data until their milestones land.
import { points, week } from '@/lib/sample';
import { useRefresh } from '@/lib/useRefresh';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
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
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const summary = useSummary();
  const recent = useTransactions({ limit: 3 });
  const refresh = useRefresh();
  const netWorth = useNetWorth().data;
  const credits = useBenefits().data;
  const nudge = credits?.needs_attention[0];
  const s = summary.data;
  const spentCents = s?.week_spent_cents ?? 0;
  const leftCents = week.limitCents - spentCents;
  const next = s?.upcoming_payments[0];
  const connected = s?.has_connections ?? true;

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
          <View>
            <Text variant="body" muted>
              {dateLabel.format(new Date())}
            </Text>
            <Text variant="row" weight="bold" style={{ fontSize: 20 }}>
              {greeting()}, {firstName}
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

      <Text variant="display" style={styles.hero}>
        You have{' '}
        <Text variant="display" color={palette.link} tabular>
          {s ? formatCents(Math.max(leftCents, 0)) : '…'}
        </Text>{' '}
        left to spend this week.
      </Text>
      <Text variant="body" muted style={styles.heroSub}>
        {summary.isError
          ? "Otto couldn't reach your data. Pull down to try again."
          : leftCents < 0
            ? `You're ${formatCents(-leftCents)} over this week's budget.`
            : `You've spent ${formatCents(spentCents)} since Monday.`}
      </Text>

      {!connected ? (
        <View style={{ marginTop: space.xl }}>
          <OttoNoticed
            primary={{ title: 'Connect cards', onPress: () => router.push('/onboarding/connect') }}
          >
            Connect your cards and Otto will fill this in with your real balances and purchases.
          </OttoNoticed>
        </View>
      ) : nudge && !nudgeDismissed ? (
        <View style={{ marginTop: space.xl }}>
          <OttoNoticed
            primary={{
              title: 'Show me how',
              onPress: () => router.push(`/credits/${nudge.period_id}`),
            }}
            secondary={{ title: 'Later', onPress: () => setNudgeDismissed(true) }}
          >
            {noticeSentence(nudge)}
          </OttoNoticed>
        </View>
      ) : null}

      <View style={{ marginTop: space.xl }}>
        <TileGrid>
          <StatTile
            tone="mint"
            label="This week"
            value={formatCents(spentCents)}
            suffix={`of ${formatCents(week.limitCents)}`}
            onPress={() => router.push('/spending')}
          >
            <View style={{ marginTop: space.md }}>
              <ProgressBar
                value={Math.min(spentCents / week.limitCents, 1)}
                color={palette.tones.mint.accent}
                track={palette.tones.mint.track}
              />
            </View>
          </StatTile>
          <StatTile
            tone="lilac"
            label="Points"
            value={formatNumber(points.total)}
            caption={`≈ ${formatCents(points.travelValueCents)} in travel`}
            onPress={() => router.push({ pathname: '/chat', params: { q: 'japan' } })}
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
            onPress={() => router.push('/credits')}
          />
          <StatTile
            tone="sky"
            label="Next payment"
            value={next ? formatCents(next.amount_cents) : '—'}
            caption={next ? `${next.name} · ${dueLabel(next.due_date).text}` : 'Nothing due'}
            onPress={() =>
              next ? router.push(`/card/${next.account_id}`) : router.push('/wallet')
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

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  who: { flexDirection: 'row', alignItems: 'center', gap: space.md, flex: 1 },
  hero: { marginTop: space.xxl, fontSize: 40, lineHeight: 46 },
  heroSub: { marginTop: space.sm, fontSize: 17 },
});
