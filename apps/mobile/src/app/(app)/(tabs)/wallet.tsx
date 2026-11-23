import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { CardSwatch, Monogram } from '@/components/badges';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { PlusIcon } from '@/components/icons';
import { TabScreen } from '@/components/layouts';
import { ListRow, SectionHeader } from '@/components/rows';
import { Card, Stack } from '@/components/Surface';
import { NetWorthBar } from '@/components/NetWorthBar';
import { Text } from '@/components/Text';
import {
  useAccounts,
  useBenefits,
  useLinkBank,
  useNetWorth,
  usePrepareLink,
  useSummary,
} from '@/lib/api';
import {
  agoLabel,
  cardArt,
  dueLabel,
  accountCountLabel,
  netWorthChangeSentence,
  utilizationLabel,
  utilizationSentence,
} from '@/lib/finance';
import { formatCents } from '@/lib/money';
import { allCredits, type Benefits } from '@/lib/credits';
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
  usePrepareLink();
  const s = summary.data;
  const netWorth = useNetWorth().data;
  const credits = useBenefits().data;
  const cards = (accounts.data ?? []).filter((a) => a.kind === 'credit');
  const assets = (accounts.data ?? []).filter(
    (a) => a.kind === 'depository' || a.kind === 'investment',
  );
  const broken = s?.attention[0];
  const util = utilizationLabel(s?.utilization_pct ?? null);
  const utilization = s ? utilizationSentence(s.utilization_pct, s.card_limit_cents) : null;

  return (
    <TabScreen refreshControl={refresh}>
      <View style={styles.header}>
        <Text variant="display">Wallet</Text>
        <IconButton
          icon={PlusIcon}
          label="Connect another account"
          disabled={link.isPending}
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

      {netWorth && (netWorth.tracking_since || netWorth.net_cents !== 0) ? (
        <Card
          style={{ marginTop: space.lg }}
          onPress={() => router.push('/net-worth')}
          accessibilityLabel="Net worth"
        >
          <Text variant="body" muted>
            Net worth
          </Text>
          <Text variant="hero" tabular style={{ marginTop: space.xs }}>
            {formatCents(netWorth.net_cents)}
          </Text>
          <Text variant="body" muted style={{ marginBottom: space.md }}>
            {netWorthChangeSentence(netWorth, '1W')}
          </Text>
          <NetWorthBar netWorth={netWorth} />
          <Text variant="caption" muted style={{ marginTop: space.md }}>
            {accountCountLabel(assets.length, cards.length)}
          </Text>
        </Card>
      ) : null}

      {assets.length > 0 ? (
        <>
          <SectionHeader
            title="Cash & investments"
            detail={formatCents(assets.reduce((sum, a) => sum + (a.current_cents ?? 0), 0))}
          />
          <Card style={styles.list}>
            <Stack>
              {assets.map((a) => (
                <ListRow
                  key={a.id}
                  leading={<Monogram label={a.name.charAt(0)} size={44} />}
                  title={a.name}
                  subtitle={[a.institution_name, a.mask ? `•• ${a.mask}` : null]
                    .filter(Boolean)
                    .join(' · ')}
                  value={formatCents(a.current_cents ?? 0, { cents: true })}
                />
              ))}
            </Stack>
          </Card>
        </>
      ) : null}

      <SectionHeader
        title="Credit cards"
        detail={s ? formatCents(-s.card_balance_cents) : undefined}
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
      {utilization ? (
        <Text
          variant="caption"
          color={util.tone === 'alert' ? palette.alert : palette.muted}
          style={styles.utilization}
        >
          {utilization}
        </Text>
      ) : null}

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
              {creditsLine(credits)}
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

function creditsLine(benefits: Benefits | undefined): string {
  if (!benefits) return ' ';
  if (allCredits(benefits).length === 0) return 'Tell Porter which cards you have';
  if (benefits.remaining_cents === 0) return 'Every credit used for now';
  return `${formatCents(benefits.remaining_cents)} left to use`;
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
  utilization: { marginTop: space.sm, marginLeft: space.sm },
  list: { paddingVertical: space.sm },
  creditsRow: { flexDirection: 'row', alignItems: 'center' },
});
