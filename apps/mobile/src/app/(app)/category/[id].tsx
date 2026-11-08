import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Monogram, Pill } from '@/components/badges';
import { StepScreen } from '@/components/layouts';
import { Insight } from '@/components/otto';
import { ListRow } from '@/components/rows';
import { Card } from '@/components/Surface';
import { Text } from '@/components/Text';
import { formatCents } from '@/lib/money';
import { categories, getCard, transactions, type Transaction } from '@/lib/sample';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function CategoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const category = categories.find((c) => c.id === id);
  const items = transactions.filter((t) => t.category === id);

  if (!category) return <StepScreen heading="Category not found" />;

  const byCard = new Map<string, number>();
  for (const t of items) byCard.set(t.card, (byCard.get(t.card) ?? 0) + t.cents);
  const split = [...byCard.entries()].sort((a, b) => b[1] - a[1]);
  const total = items.reduce((s, t) => s + t.cents, 0) || 1;
  const days = [...new Set(items.map((t) => t.day))];
  const missed = items.find((t) => t.missed);

  return (
    <StepScreen title={`${category.name} · this week`}>
      <Card style={{ marginTop: space.lg }}>
        <View style={styles.top}>
          <View>
            <Text variant="hero" tabular>
              {formatCents(category.cents, { cents: true })}
            </Text>
            <Text variant="row" weight="semibold" muted>
              {items.length} purchase{items.length === 1 ? '' : 's'}
            </Text>
          </View>
          {category.id === 'dining' ? <Pill tone="mint" label="$14 less than last week" /> : null}
        </View>

        {split.length > 0 ? (
          <>
            <Text variant="row" weight="semibold" muted style={{ marginTop: space.lg }}>
              Which cards you used
            </Text>
            <View style={styles.splitBar}>
              {split.map(([cardId, cents]) => (
                <View
                  key={cardId}
                  style={{
                    flex: cents / total,
                    backgroundColor: getCard(cardId)?.color,
                    height: 12,
                  }}
                />
              ))}
            </View>
            <View style={styles.splitLegend}>
              {split.map(([cardId, cents], i) => {
                const card = getCard(cardId);
                return (
                  <Text key={cardId} variant="body" weight="semibold" muted={i > 0}>
                    {card?.shortName}
                    {i === 0 && cardId === 'gold' ? ' · 4x' : ''} ·{' '}
                    {formatCents(cents, { cents: true })}
                  </Text>
                );
              })}
            </View>
          </>
        ) : null}
      </Card>

      {missed?.missed ? (
        <View style={{ marginTop: space.lg }}>
          <Insight tone="lilac" mark="wordmark">
            Your {missed.merchant} run was on {getCard(missed.card)?.name}. On{' '}
            {getCard(missed.missed.better)?.shortName} it would have earned about{' '}
            {missed.missed.extraPoints} more points.
          </Insight>
        </View>
      ) : null}

      <Card style={{ marginTop: space.lg, paddingVertical: space.md }}>
        {days.map((day) => (
          <View key={day}>
            <Text variant="body" weight="bold" muted style={styles.day}>
              {day}
            </Text>
            {items
              .filter((t) => t.day === day)
              .map((t) => (
                <TxRow key={t.id} t={t} />
              ))}
          </View>
        ))}
        {items.length === 0 ? (
          <Text variant="body" muted>
            No purchases this week.
          </Text>
        ) : null}
      </Card>
    </StepScreen>
  );
}

function TxRow({ t }: { t: Transaction }) {
  const { palette } = useTheme();
  const card = getCard(t.card);
  return (
    <ListRow
      leading={<Monogram label={t.merchant.charAt(0)} size={50} />}
      title={t.merchant}
      subtitle={`${card?.shortName ?? ''} · ${t.multiplier}`}
      value={formatCents(t.cents, { cents: true })}
      valueNote={t.missed ? `${getCard(t.missed.better)?.shortName} earns more` : undefined}
      valueNoteColor={palette.tones.lilac.text}
      onPress={() => router.push(`/transaction/${t.id}`)}
    />
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space.md,
    flexWrap: 'wrap',
  },
  splitBar: {
    flexDirection: 'row',
    gap: 3,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: space.sm,
  },
  splitLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: space.sm,
    gap: space.sm,
  },
  day: { marginTop: space.md, marginBottom: space.xs },
});
