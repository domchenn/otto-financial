import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { CardSwatch } from '@/components/badges';
import { StepScreen } from '@/components/layouts';
import { ListRow } from '@/components/rows';
import { Card, Stack } from '@/components/Surface';
import { Text } from '@/components/Text';
import { useAccounts, useSummary } from '@/lib/api';
import { cardArt, dueLabel, utilizationLabel, utilizationSentence } from '@/lib/finance';
import { formatCents } from '@/lib/money';
import { useRefresh } from '@/lib/useRefresh';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/**
 * Cards, opened from the Credit cards row on Accounts: every card with its balance and due
 * date, and utilization across them. The swipeable wallet replaces this list later.
 */
export default function Cards() {
  const { palette } = useTheme();
  const refresh = useRefresh();
  const accounts = useAccounts();
  const s = useSummary().data;
  const cards = (accounts.data ?? []).filter((a) => a.kind === 'credit');
  const util = utilizationLabel(s?.utilization_pct ?? null);
  const utilization = s ? utilizationSentence(s.utilization_pct, s.card_limit_cents) : null;

  return (
    <StepScreen
      heading="Credit cards"
      subheading={s ? `${formatCents(s.card_balance_cents)} owed across ${cards.length}` : ' '}
      refreshControl={refresh}
    >
      <Card style={styles.list}>
        <Stack>
          {cards.map((card) => {
            const art = cardArt(card);
            const due = dueLabel(card.next_due_date);
            return (
              <ListRow
                key={card.id}
                leading={<CardSwatch color={art.color} chip={art.chip} width={64} />}
                title={card.name}
                subtitle={card.mask ? `•• ${card.mask} · ${due.text}` : due.text}
                subtitleColor={due.soon ? palette.alert : undefined}
                value={formatCents(card.current_cents ?? 0, { cents: true })}
                chevron
                onPress={() => router.push(`/card/${card.id}`)}
              />
            );
          })}
          {accounts.data && cards.length === 0 ? (
            <Text variant="body" muted style={{ paddingVertical: space.md }}>
              No cards connected yet. Connect one from Accounts.
            </Text>
          ) : null}
        </Stack>
      </Card>
      {utilization ? (
        <Text
          variant="caption"
          color={util.tone === 'alert' ? palette.alert : palette.muted}
          style={styles.utilization}
        >
          {utilization}
        </Text>
      ) : null}
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: space.xl, paddingVertical: space.sm },
  utilization: { marginTop: space.sm, marginLeft: space.sm },
});
