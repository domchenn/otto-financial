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
import { formatCents, formatNumber } from '@/lib/money';
import { creditSummary, getCard, nextPayment, points, transactions, week } from '@/lib/sample';
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
  const leftCents = week.limitCents - week.spentCents;
  const recent = transactions.slice(0, 2);

  return (
    <TabScreen>
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
          {formatCents(leftCents)}
        </Text>{' '}
        left to spend this week.
      </Text>
      <Text variant="body" muted style={styles.heroSub}>
        {formatCents(week.underPaceCents)} under your usual pace. Nice.
      </Text>

      {!nudgeDismissed ? (
        <View style={{ marginTop: space.xl }}>
          <OttoNoticed
            primary={{ title: 'Show me where', onPress: () => router.push('/credits/gold-dining') }}
            secondary={{ title: 'Later', onPress: () => setNudgeDismissed(true) }}
          >
            Your $10 Amex Gold dining credit resets in 3 days. Dinner at a Grubhub spot this weekend
            would use it.
          </OttoNoticed>
        </View>
      ) : null}

      <View style={{ marginTop: space.xl }}>
        <TileGrid>
          <StatTile
            tone="mint"
            label="This week"
            value={formatCents(week.spentCents)}
            suffix={`of ${formatCents(week.limitCents)}`}
            onPress={() => router.push('/spending')}
          >
            <View style={{ marginTop: space.md }}>
              <ProgressBar
                value={week.spentCents / week.limitCents}
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
            value={formatCents(creditSummary.readyThisMonthCents)}
            caption={`${creditSummary.expiringThisMonth} expire this month`}
            onPress={() => router.push('/credits')}
          />
          <StatTile
            tone="sky"
            label="Next payment"
            value={formatCents(nextPayment.cents)}
            caption={`${nextPayment.card} · ${nextPayment.due}`}
            onPress={() => router.push('/card/freedom-unlimited')}
          />
        </TileGrid>
      </View>

      <Card style={{ marginTop: space.xl, paddingTop: space.xs }}>
        <SectionHeader title="Recent" action="See all" onAction={() => router.push('/spending')} />
        <Stack>
          {recent.map((t) => {
            const card = getCard(t.card);
            return (
              <ListRow
                key={t.id}
                leading={<Monogram label={t.merchant.charAt(0)} size={48} />}
                title={t.merchant}
                subtitle={`${card?.issuer ?? ''} ${card?.shortName ?? ''} · earned ${t.multiplier}`}
                value={formatCents(t.cents, { cents: true })}
                onPress={() => router.push(`/transaction/${t.id}`)}
              />
            );
          })}
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
