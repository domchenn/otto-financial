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

type Mode = 'expiring' | 'card' | 'used';

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
        : [{ title: 'Used this period', items: credits.filter(isUsed) }].filter(
            (s) => s.items.length > 0,
          );

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
          "Otto couldn't load your credits. Pull down to try again."
        ) : (
          <>
            <Text variant="body" weight="extrabold" style={{ fontSize: 17 }} tabular>
              {formatCents(data?.remaining_cents ?? 0)}
            </Text>{' '}
            left to use ·{' '}
            <Text variant="body" weight="extrabold" style={{ fontSize: 17 }} tabular>
              {formatCents(data?.expiring_this_month_cents ?? 0)}
            </Text>{' '}
            resets this month
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
              ? 'Pick it so Otto can track its credits.'
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
        <Chip label="Used" selected={mode === 'used'} onPress={() => setMode('used')} />
      </View>

      {data && sections.length === 0 ? (
        <Text variant="body" muted style={{ marginTop: space.xl }}>
          {mode === 'used'
            ? 'Nothing used yet this period.'
            : credits.length === 0
              ? 'No credits to track yet. Tell Otto which cards you have.'
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
              {formatCents(
                s.items.reduce(
                  (sum, c) => sum + (mode === 'used' ? c.amount_cents : c.remaining_cents),
                  0,
                ),
              )}
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
    </StepScreen>
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
