import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CardSwatch } from '@/components/badges';
import { IconButton } from '@/components/IconButton';
import { BellIcon } from '@/components/icons';
import { StepScreen } from '@/components/layouts';
import { ListRow } from '@/components/rows';
import { Chip } from '@/components/selection';
import { Card, Stack } from '@/components/Surface';
import { Text } from '@/components/Text';
import { useBenefits } from '@/lib/api';
import {
  allCredits,
  expiringSections,
  historyByMonth,
  historyLabel,
  isUrgent,
  isUsed,
  resetsLabel,
  type CreditPeriod,
  type CreditSection,
} from '@/lib/credits';
import { cardArt } from '@/lib/finance';
import { formatCents } from '@/lib/money';
import { useRefresh } from '@/lib/useRefresh';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type Mode = 'expiring' | 'card' | 'year';

export default function Credits() {
  const [mode, setMode] = useState<Mode>('expiring');
  const benefits = useBenefits();
  const refresh = useRefresh();
  const data = benefits.data;
  const credits = data ? allCredits(data) : [];
  const unplaced = data?.cards.filter((c) => c.card_id === null || c.needs_anniversary_month) ?? [];

  const sections: CreditSection[] =
    mode === 'expiring'
      ? expiringSections(credits)
      : mode === 'card'
        ? (data?.cards ?? [])
            .filter((c) => c.credits.length > 0)
            .map((c) => ({
              title: `${c.card_name ?? c.account_name}${c.account_mask ? ` •• ${c.account_mask}` : ''}`,
              items: c.credits,
            }))
        : [];
  const months = data && mode === 'year' ? historyByMonth(data.history, todayIso()) : [];

  return (
    <StepScreen
      refreshControl={refresh}
      right={
        <IconButton
          icon={BellIcon}
          label="Credit reminders"
          onPress={() => router.push('/credits/reminders')}
        />
      }
    >
      <Text variant="display" style={{ marginTop: space.lg }}>
        Credits
      </Text>
      <Text variant="body" muted style={{ fontSize: 17, marginTop: space.xs }}>
        {benefits.isError ? (
          "Porter couldn't load your credits. Pull down to try again."
        ) : (
          <>
            <Text variant="body" weight="extrabold" style={{ fontSize: 17 }} tabular>
              {formatCents(data?.used_this_year_cents ?? 0)}
            </Text>{' '}
            used this year ·{' '}
            <Text variant="body" weight="extrabold" style={{ fontSize: 17 }} tabular>
              {formatCents(data?.missed_this_year_cents ?? 0)}
            </Text>{' '}
            missed ·{' '}
            <Text variant="body" weight="extrabold" style={{ fontSize: 17 }} tabular>
              {formatCents(data?.remaining_cents ?? 0)}
            </Text>{' '}
            left to use now
          </>
        )}
      </Text>

      {unplaced.map((c) => (
        <Card
          key={c.account_id}
          style={{ marginTop: space.lg }}
          onPress={() => router.push(`/card/${c.account_id}/product`)}
          accessibilityLabel={`Set up ${c.account_name}`}
        >
          <Text variant="row" weight="bold" style={{ fontSize: 17 }}>
            {c.card_id === null
              ? `Which card is ${c.account_name}${c.account_mask ? ` •• ${c.account_mask}` : ''}?`
              : `Add the anniversary month for ${c.card_name}`}
          </Text>
          <Text variant="body" muted>
            {c.card_id === null
              ? 'Pick it so Porter can track its credits.'
              : 'Some of its credits reset on the month you opened it.'}
          </Text>
        </Card>
      ))}

      <View style={styles.chips}>
        <Chip
          label="Expiring soon"
          selected={mode === 'expiring'}
          onPress={() => setMode('expiring')}
        />
        <Chip label="By card" selected={mode === 'card'} onPress={() => setMode('card')} />
        <Chip label="This year" selected={mode === 'year'} onPress={() => setMode('year')} />
      </View>

      {data && (mode === 'year' ? months.length === 0 : sections.length === 0) ? (
        <Text variant="body" muted style={{ marginTop: space.xl }}>
          {mode === 'year'
            ? 'Nothing used or missed yet this year.'
            : credits.length === 0
              ? 'No credits to track yet. Tell Porter which cards you have.'
              : 'Every credit is used for now.'}
        </Text>
      ) : null}

      {sections.map((s) => (
        <View key={s.title}>
          <View style={styles.groupHead}>
            <Text variant="row" weight="bold" style={{ fontSize: 18 }}>
              {s.title}
            </Text>
            <Text variant="body" weight="semibold" muted tabular>
              {formatCents(s.items.reduce((sum, c) => sum + c.remaining_cents, 0))}
            </Text>
          </View>
          <Card style={styles.list}>
            <Stack>
              {s.items.map((c) => (
                <CreditRow key={c.period_id} credit={c} />
              ))}
            </Stack>
          </Card>
        </View>
      ))}

      {months.map((m) => (
        <View key={m.key}>
          <View style={styles.groupHead}>
            <Text variant="row" weight="bold" style={{ fontSize: 18 }}>
              {m.title}
            </Text>
            <Text variant="body" weight="semibold" muted tabular>
              {formatCents(m.usedCents)} used
              {m.missedCents > 0 ? ` · ${formatCents(m.missedCents)} missed` : ''}
            </Text>
          </View>
          <Card style={styles.list}>
            <Stack>
              {m.items.map((c) => (
                <HistoryRow key={c.period_id} credit={c} />
              ))}
            </Stack>
          </Card>
        </View>
      ))}
    </StepScreen>
  );
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function HistoryRow({ credit: c }: { credit: CreditPeriod }) {
  const { palette } = useTheme();
  const missedOnly = c.used_value_cents === 0;
  return (
    <ListRow
      leading={<Swatch name={c.card_name} />}
      title={c.name}
      subtitle={`${c.card_name} · ${historyLabel(c)}`}
      value={formatCents(missedOnly ? c.missed_cents : c.used_value_cents, { cents: 'auto' })}
      valueColor={missedOnly ? palette.muted : palette.moneyIn}
      onPress={() => router.push(`/credits/${c.period_id}`)}
    />
  );
}

function CreditRow({ credit: c }: { credit: CreditPeriod }) {
  const { palette } = useTheme();
  const used = isUsed(c);
  return (
    <ListRow
      leading={<Swatch name={c.card_name} />}
      title={c.name}
      subtitle={`${c.card_name} · ${used ? (c.marked_used ? 'Marked used' : 'Used') : resetsLabel(c)}`}
      subtitleColor={isUrgent(c) ? palette.alert : undefined}
      value={formatCents(used ? c.amount_cents : c.remaining_cents, { cents: 'auto' })}
      valueColor={used ? palette.moneyIn : undefined}
      onPress={() => router.push(`/credits/${c.period_id}`)}
    />
  );
}

function Swatch({ name }: { name: string }) {
  const { palette } = useTheme();
  const art = cardArt({ name, official_name: null });
  return (
    <View style={[styles.swatchTile, { backgroundColor: palette.tones.butter.bg }]}>
      <CardSwatch color={art.color} chip={art.chip} width={32} />
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xl },
  groupHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.xl,
    marginBottom: space.sm,
  },
  list: { paddingVertical: space.xs },
  swatchTile: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
