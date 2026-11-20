import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { CardSwatch, Pill } from '@/components/badges';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { PlusIcon } from '@/components/icons';
import { TabScreen } from '@/components/layouts';
import { ListRow, SectionHeader } from '@/components/rows';
import { Card, Stack } from '@/components/Surface';
import { Text } from '@/components/Text';
import { useAccounts, useLinkBank, useSummary } from '@/lib/api';
import { agoLabel, cardArt, dueLabel, utilizationLabel } from '@/lib/finance';
import { formatCents } from '@/lib/money';
// Credits are sample data until M2.
import { creditSummary } from '@/lib/sample';
import { linkAlerts } from '@/lib/linkAlerts';
import { useRefresh } from '@/lib/useRefresh';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function Wallet() {
  const { palette } = useTheme();
  const alert = palette.tones.alert;
  const summary = useSummary();
  const accounts = useAccounts();
  const refresh = useRefresh();
  const link = useLinkBank();
  const s = summary.data;
  const cards = (accounts.data ?? []).filter((a) => a.kind === 'credit');
  const broken = s?.attention[0];
  const util = utilizationLabel(s?.utilization_pct ?? null);
  const nextDue = s?.upcoming_payments[0];

  return (
    <TabScreen refreshControl={refresh}>
      <View style={styles.header}>
        <Text variant="display">Wallet</Text>
        <IconButton
          icon={PlusIcon}
          label="Connect another account"
          onPress={() => link.mutate(undefined, linkAlerts)}
        />
      </View>

      {broken ? (
        <Card tone="alert" style={styles.banner}>
          <Text variant="body" color={alert.text} style={{ flex: 1, fontSize: 16, lineHeight: 22 }}>
            <Text variant="body" weight="bold" color={alert.text} style={{ fontSize: 16 }}>
              {broken.institution_name ?? 'A bank'} needs a quick sign-in.
            </Text>{' '}
            Balances were last updated {agoLabel(broken.last_synced_at)}.
          </Text>
          <Button
            small
            variant="outline"
            title="Fix"
            onPress={() => router.push('/settings/accounts')}
            style={styles.fix}
          />
        </Card>
      ) : null}

      <Card style={{ marginTop: space.lg }}>
        <Text variant="body" muted>
          Total card balances
        </Text>
        <Text variant="hero" tabular style={{ marginTop: space.xs }}>
          {s ? formatCents(s.card_balance_cents, { cents: true }) : '…'}
        </Text>
        {s && s.card_count > 0 ? (
          <View style={styles.pills}>
            <Pill tone={util.tone} label={util.text} />
            {nextDue ? (
              <Pill tone="sky" label={`Next ${dueLabel(nextDue.due_date).text.toLowerCase()}`} />
            ) : null}
          </View>
        ) : null}
      </Card>

      <SectionHeader
        title="Credit cards"
        detail={`${cards.length} ${cards.length === 1 ? 'card' : 'cards'}`}
      />
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
              No cards connected yet. Tap + to connect one.
            </Text>
          ) : null}
        </Stack>
      </Card>

      <Card
        style={{ marginTop: space.lg }}
        onPress={() => router.push('/credits')}
        accessibilityLabel="Credits"
      >
        <View style={styles.creditsRow}>
          <View style={{ flex: 1 }}>
            <Text variant="row" weight="bold" style={{ fontSize: 17 }}>
              Card credits
            </Text>
            <Text variant="body" muted>
              {formatCents(creditSummary.readyThisMonthCents)} ready to use this month
            </Text>
          </View>
          <Text variant="row" weight="bold" color={palette.link}>
            See all
          </Text>
        </View>
      </Card>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.xl,
    paddingVertical: space.lg,
  },
  fix: { borderWidth: 0 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.lg },
  list: { paddingVertical: space.sm },
  creditsRow: { flexDirection: 'row', alignItems: 'center' },
});
