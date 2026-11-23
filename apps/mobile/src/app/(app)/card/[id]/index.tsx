import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Monogram } from '@/components/badges';
import { StepScreen } from '@/components/layouts';
import { ProgressBar } from '@/components/ProgressBar';
import { ListRow, SectionHeader } from '@/components/rows';
import { Card, Stack } from '@/components/Surface';
import { Text } from '@/components/Text';
import { useAccount, useBenefits, useTransactions } from '@/lib/api';
import { isUrgent, resetsLabel, type BenefitCard } from '@/lib/credits';
import {
  agoLabel,
  amountLabel,
  cardArt,
  categoryName,
  dayLabel,
  dueLabel,
  formatShortDate,
  merchantName,
  utilizationLabel,
} from '@/lib/finance';
import { formatCents } from '@/lib/money';
import { useRefresh } from '@/lib/useRefresh';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

function money(cents: number | null): string {
  return cents === null ? '—' : formatCents(cents, { cents: 'auto' });
}

export default function CardDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette } = useTheme();
  const account = useAccount(id);
  const recent = useTransactions({ account_id: id, limit: 5 });
  const benefitCard = useBenefits().data?.cards.find((c) => c.account_id === id);
  const refresh = useRefresh();
  const card = account.data;

  if (account.isError) {
    return <StepScreen heading="Card not found" subheading="This card isn't in your wallet." />;
  }
  if (!card) return <StepScreen title="Card" />;

  const art = cardArt(card);
  const due = dueLabel(card.next_due_date);
  const balance = card.current_cents ?? 0;
  const pct =
    card.limit_cents && card.limit_cents > 0
      ? Math.round((balance * 100) / card.limit_cents)
      : null;
  const util = utilizationLabel(pct);
  const sky = palette.tones.sky;

  return (
    <StepScreen title={card.name} refreshControl={refresh}>
      <View style={[styles.art, { backgroundColor: art.color, shadowColor: palette.shadow }]}>
        <View style={styles.artTop}>
          <View style={[styles.chip, { backgroundColor: art.chip }]} />
          {card.mask ? (
            <Text variant="row" weight="bold" color={art.ink}>
              •• {card.mask}
            </Text>
          ) : null}
        </View>
        <View style={styles.artBottom}>
          <View>
            <Text variant="body" weight="semibold" color={art.ink} style={{ opacity: 0.8 }}>
              Balance
            </Text>
            <Text variant="hero" tabular color={art.ink}>
              {formatCents(balance, { cents: true })}
            </Text>
          </View>
          <Text variant="row" weight="bold" color={art.ink} style={{ opacity: 0.8 }}>
            {card.institution_name ?? ''}
          </Text>
        </View>
      </View>

      <Card tone="sky" style={{ marginTop: space.lg }}>
        <Text variant="row" weight="bold" color={sky.text} style={{ fontSize: 18 }}>
          {card.next_due_date ? due.text : 'No statement due'}
        </Text>
        {card.statement_balance_cents !== null ? (
          <Text variant="body" color={sky.text} style={{ marginTop: space.xs }}>
            Pay {formatCents(card.statement_balance_cents, { cents: 'auto' })} to avoid interest
            {card.minimum_due_cents !== null
              ? `. The minimum is ${formatCents(card.minimum_due_cents, { cents: 'auto' })}.`
              : '.'}
          </Text>
        ) : null}
      </Card>

      <Card style={styles.facts}>
        <Fact label="Statement" value={money(card.statement_balance_cents)} />
        <Fact label="Limit" value={money(card.limit_cents)} />
        <Fact
          label="Last payment"
          value={money(card.last_payment_cents)}
          note={card.last_payment_date ? formatShortDate(card.last_payment_date) : undefined}
        />
      </Card>

      {pct !== null ? (
        <Card style={{ marginTop: space.lg }}>
          <View style={styles.spread}>
            {/* Utilization isn't budget, so no mint: plain text, alert only when high. */}
            <Text
              variant="row"
              weight="bold"
              color={util.tone === 'alert' ? palette.alert : palette.ink}
            >
              {util.text}
            </Text>
            <Text variant="body" muted>
              {formatCents(card.available_cents ?? (card.limit_cents ?? 0) - balance)} available
            </Text>
          </View>
          <View style={{ marginTop: space.md }}>
            <ProgressBar
              value={Math.min(pct / 100, 1)}
              color={util.tone === 'alert' ? palette.alert : palette.ink}
              track={palette.raised}
            />
          </View>
        </Card>
      ) : null}

      {benefitCard ? <CardCredits card={benefitCard} /> : null}

      <Card style={{ marginTop: space.lg, paddingTop: space.xs }}>
        <SectionHeader
          title="Recent"
          action="See all"
          onAction={() => router.push({ pathname: '/transactions', params: { account: card.id } })}
        />
        <Stack>
          {(recent.data ?? []).map((t) => (
            <ListRow
              key={t.id}
              leading={<Monogram label={merchantName(t).charAt(0)} size={44} />}
              title={merchantName(t)}
              subtitle={`${dayLabel(t.date)} · ${t.pending ? 'Pending' : categoryName(t.category)}`}
              value={amountLabel(t.amount_cents)}
              valueColor={t.amount_cents < 0 ? palette.moneyIn : undefined}
              onPress={() => router.push(`/transaction/${t.id}`)}
            />
          ))}
          {recent.data?.length === 0 ? (
            <Text variant="body" muted style={{ paddingVertical: space.md }}>
              No purchases on this card yet.
            </Text>
          ) : null}
        </Stack>
      </Card>

      <Text variant="caption" muted center style={{ marginTop: space.lg }}>
        Balance updated {agoLabel(card.balances_updated_at)}
      </Text>
    </StepScreen>
  );
}

function CardCredits({ card }: { card: BenefitCard }) {
  const { palette } = useTheme();
  const pick = () => router.push(`/card/${card.account_id}/product`);
  const known = card.card_id !== null;
  return (
    <Card style={{ marginTop: space.lg, paddingTop: space.xs }}>
      <SectionHeader
        title="Credits"
        detail={known && card.source === 'guess' ? `Looks like ${card.card_name}` : undefined}
        action={known ? 'Change' : undefined}
        onAction={known ? pick : undefined}
      />
      <Stack>
        {!known ? (
          <ListRow
            title="Which card is this?"
            subtitle="Pick it so Porter can track its credits"
            chevron
            onPress={pick}
          />
        ) : null}
        {card.needs_anniversary_month ? (
          <ListRow
            title="Add your card anniversary"
            subtitle="Some credits reset on the month you opened the card"
            chevron
            onPress={pick}
          />
        ) : null}
        {card.credits.map((c) => (
          <ListRow
            key={c.period_id}
            title={c.name}
            subtitle={c.remaining_cents === 0 ? 'Used' : resetsLabel(c)}
            subtitleColor={isUrgent(c) ? palette.alert : undefined}
            value={formatCents(c.remaining_cents, { cents: 'auto' })}
            onPress={() => router.push(`/credits/${c.period_id}`)}
          />
        ))}
        {known && card.credits.length === 0 && !card.needs_anniversary_month ? (
          <Text variant="body" muted style={{ paddingVertical: space.md }}>
            No credits Porter can track on this card yet.
          </Text>
        ) : null}
      </Stack>
    </Card>
  );
}

function Fact({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text variant="body" muted style={{ fontSize: 14 }}>
        {label}
      </Text>
      <Text variant="row" weight="extrabold" tabular style={{ fontSize: 19 }}>
        {value}
      </Text>
      {note ? (
        <Text variant="caption" muted>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  art: {
    marginTop: space.lg,
    borderRadius: radius.card + 4,
    padding: space.xl,
    height: 210,
    justifyContent: 'space-between',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  artTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  chip: { width: 50, height: 38, borderRadius: 9 },
  artBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  facts: { flexDirection: 'row', gap: space.sm, marginTop: space.lg, paddingVertical: space.lg },
  spread: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
