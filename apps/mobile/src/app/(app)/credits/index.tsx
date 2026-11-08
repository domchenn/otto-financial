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
import { formatCents } from '@/lib/money';
import {
  cards,
  credits,
  creditSummary,
  getCard,
  usedCredits,
  type Credit,
  type CreditGroup,
} from '@/lib/sample';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type View_ = 'expiring' | 'card' | 'used';

const GROUP_LABELS: Record<CreditGroup, string> = {
  week: 'This week',
  month: 'This month',
  year: 'By Dec 31',
};

export default function Credits() {
  const { palette } = useTheme();
  const [view, setView] = useState<View_>('expiring');

  const sections: { title: string; items: Credit[] }[] =
    view === 'expiring'
      ? (['week', 'month', 'year'] as const).map((g) => ({
          title: GROUP_LABELS[g],
          items: credits.filter((c) => c.group === g),
        }))
      : cards
          .map((card) => ({ title: card.name, items: credits.filter((c) => c.card === card.id) }))
          .filter((s) => s.items.length > 0);

  return (
    <StepScreen
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
        <Text variant="body" weight="extrabold" style={{ fontSize: 17 }} tabular>
          {formatCents(creditSummary.readyThisMonthCents)}
        </Text>{' '}
        ready to use this month ·{' '}
        <Text variant="body" weight="extrabold" style={{ fontSize: 17 }} tabular>
          {formatCents(creditSummary.usedThisYearCents)}
        </Text>{' '}
        used this year
      </Text>

      <View style={styles.chips}>
        <Chip
          label="Expiring soon"
          selected={view === 'expiring'}
          onPress={() => setView('expiring')}
        />
        <Chip label="By card" selected={view === 'card'} onPress={() => setView('card')} />
        <Chip label="Used" selected={view === 'used'} onPress={() => setView('used')} />
      </View>

      {view === 'used' ? (
        <Card style={styles.list}>
          <Stack>
            {usedCredits.map((u) => (
              <ListRow
                key={u.name + u.when}
                leading={<Swatch cardId={u.card} />}
                title={u.name}
                subtitle={`${getCard(u.card)?.shortName ?? ''} · ${u.when}`}
                value={formatCents(u.amountCents)}
                valueColor={palette.moneyIn}
              />
            ))}
          </Stack>
        </Card>
      ) : (
        sections.map((s) => (
          <View key={s.title}>
            <View style={styles.groupHead}>
              <Text variant="row" weight="bold" style={{ fontSize: 18 }}>
                {s.title}
              </Text>
              <Text variant="body" weight="semibold" muted tabular>
                {formatCents(s.items.reduce((sum, c) => sum + c.amountCents, 0))}
              </Text>
            </View>
            <Card style={styles.list}>
              <Stack>
                {s.items.map((c) => (
                  <ListRow
                    key={c.id}
                    leading={<Swatch cardId={c.card} />}
                    title={c.name}
                    subtitle={`${getCard(c.card)?.shortName ?? ''} · ${c.resets}`}
                    subtitleColor={c.urgent ? palette.alert : undefined}
                    value={formatCents(c.amountCents)}
                    onPress={() => router.push(`/credits/${c.id}`)}
                  />
                ))}
              </Stack>
            </Card>
          </View>
        ))
      )}
    </StepScreen>
  );
}

function Swatch({ cardId }: { cardId: string }) {
  const { palette } = useTheme();
  const card = getCard(cardId);
  return (
    <View style={[styles.swatchTile, { backgroundColor: palette.tones.butter.bg }]}>
      <CardSwatch color={card?.color ?? palette.raised} chip={card?.color} width={32} />
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
