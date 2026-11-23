import { router } from 'expo-router';
import { createElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CardSwatch } from '@/components/badges';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { BankIcon, ChevronIcon, PieIcon, PlusIcon, type Icon } from '@/components/icons';
import { TabScreen } from '@/components/layouts';
import { NetWorthBar } from '@/components/NetWorthBar';
import { LiveLabel } from '@/components/porter';
import { Card } from '@/components/Surface';
import { Text } from '@/components/Text';
import {
  useAccounts,
  useBudget,
  useLinkBank,
  useNetWorth,
  usePrepareLink,
  useSummary,
} from '@/lib/api';
import { agoLabel, cardArt, type Account } from '@/lib/finance';
import { accountsInsight } from '@/lib/insights';
import { linkAlerts } from '@/lib/linkAlerts';
import { formatCents } from '@/lib/money';
import { useRefresh } from '@/lib/useRefresh';
import { radius, space, type ToneName } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Accounts (handoff page 3): net worth, Porter's read, cash, investing, then cards. */
export default function Accounts() {
  const { palette } = useTheme();
  const alert = palette.tones.alert;
  const refresh = useRefresh();
  const link = useLinkBank();
  usePrepareLink();
  const s = useSummary().data;
  const accountsQuery = useAccounts();
  const netWorth = useNetWorth().data;
  const budget = useBudget().data;
  const accounts = accountsQuery.data ?? [];
  const cash = accounts.filter((a) => a.kind === 'depository');
  const investing = accounts.filter((a) => a.kind === 'investment');
  const cards = accounts.filter((a) => a.kind === 'credit');
  const broken = s?.attention[0];
  const connect = () => link.mutate(undefined, linkAlerts);
  const insight = accountsInsight({
    accounts,
    budget,
    payments: s?.upcoming_payments ?? [],
    utilizationPct: s?.utilization_pct ?? null,
  });

  return (
    <TabScreen refreshControl={refresh}>
      <View style={styles.header}>
        <Text variant="display">Accounts</Text>
        <IconButton
          icon={PlusIcon}
          label="Connect another account"
          disabled={link.isPending}
          onPress={connect}
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
          />
        </Card>
      ) : null}

      {netWorth ? (
        <View style={styles.netWorth}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Net worth, ${formatCents(netWorth.net_cents)}`}
            onPress={() => router.push('/net-worth')}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text variant="body" muted>
              Net worth
            </Text>
            <Text variant="hero" tabular style={styles.hero}>
              {formatCents(netWorth.net_cents)}
            </Text>
          </Pressable>
          <NetWorthBar netWorth={netWorth} />
        </View>
      ) : null}

      {insight ? (
        <View style={styles.insight}>
          <LiveLabel pulse={false}>Porter</LiveLabel>
          <Text variant="body" style={styles.insightText}>
            {insight}
          </Text>
        </View>
      ) : null}

      {cash.length > 0 ? (
        <Group title="Cash" totalCents={sum(cash)}>
          {cash.map((a) => (
            <AccountRow key={a.id} account={a} />
          ))}
        </Group>
      ) : null}

      {accountsQuery.data ? (
        <Group title="Investing" totalCents={sum(investing)}>
          {investing.map((a) => (
            <AccountRow key={a.id} account={a} />
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={connect}
            disabled={link.isPending}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
          >
            <View style={[styles.tile, styles.dashed, { borderColor: palette.faint }]}>
              <PlusIcon color={palette.muted} size={18} />
            </View>
            <Text variant="row" muted>
              Connect a 401(k), IRA or Roth
            </Text>
          </Pressable>
        </Group>
      ) : null}

      <CardsRow cards={cards} owedCents={s?.card_balance_cents} pct={s?.utilization_pct} />
    </TabScreen>
  );
}

const sum = (accounts: Account[]) => accounts.reduce((s, a) => s + (a.current_cents ?? 0), 0);

function Group({
  title,
  totalCents,
  children,
}: {
  title: string;
  totalCents: number;
  children: ReactNode;
}) {
  const { palette } = useTheme();
  return (
    <View style={styles.group}>
      <View style={[styles.groupHead, { borderBottomColor: palette.hairline }]}>
        <Text variant="row" weight="bold" accessibilityRole="header">
          {title}
        </Text>
        <Text variant="row" weight="semibold" muted tabular>
          {formatCents(totalCents)}
        </Text>
      </View>
      {children}
    </View>
  );
}

/** Each kind of account keeps one tint: savings mint, checking sky, investing lilac. */
function look(a: Account): { icon: Icon; tone: ToneName } {
  if (a.kind === 'investment') return { icon: PieIcon, tone: 'lilac' };
  if (a.subtype === 'checking') return { icon: BankIcon, tone: 'sky' };
  if (a.subtype === 'savings') return { icon: BankIcon, tone: 'mint' };
  return { icon: BankIcon, tone: 'butter' };
}

function AccountRow({ account: a }: { account: Account }) {
  const { palette } = useTheme();
  const { icon, tone } = look(a);
  const t = palette.tones[tone];
  const sub = [a.institution_name, a.mask ? `··${a.mask}` : null].filter(Boolean).join(' ');
  return (
    <View style={[styles.row, { borderBottomColor: palette.hairline }, styles.rowLine]}>
      <View style={[styles.tile, { backgroundColor: t.bg }]}>
        {createElement(icon, { color: t.text, size: 20 })}
      </View>
      <View style={styles.rowMain}>
        <Text variant="row" weight="semibold" numberOfLines={1}>
          {a.name}
        </Text>
        {sub ? (
          <Text variant="caption" muted weight="medium" numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
      <Text variant="row" weight="bold" tabular>
        {formatCents(a.current_cents ?? 0, { cents: true })}
      </Text>
    </View>
  );
}

/** "Credit cards · 6 / $4,131 owed · 18% of limit", opening the card list. */
function CardsRow({
  cards,
  owedCents,
  pct,
}: {
  cards: Account[];
  owedCents: number | undefined;
  pct: number | null | undefined;
}) {
  const { palette } = useTheme();
  const owed = owedCents === undefined ? null : `${formatCents(owedCents)} owed`;
  const sub =
    cards.length === 0
      ? 'No cards connected yet'
      : [owed, pct != null ? `${pct}% of limit` : null].filter(Boolean).join(' · ');
  return (
    <Card
      onPress={() => router.push('/cards')}
      accessibilityLabel={`Credit cards, ${cards.length}. ${sub}`}
      style={styles.cards}
    >
      <View style={styles.stack}>
        {cards.slice(0, 4).map((c, i) => {
          const art = cardArt(c);
          return (
            <View key={c.id} style={{ marginLeft: i === 0 ? 0 : -40, zIndex: i }}>
              <CardSwatch color={art.color} chip={art.chip} width={56} />
            </View>
          );
        })}
      </View>
      <View style={styles.rowMain}>
        <Text variant="row" weight="bold">
          Credit cards · {cards.length}
        </Text>
        <Text variant="caption" muted weight="medium">
          {sub}
        </Text>
      </View>
      <ChevronIcon color={palette.muted} size={20} />
    </Card>
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
  netWorth: { marginTop: space.xl, gap: space.md },
  hero: { marginTop: 2 },
  insight: { marginTop: space.xl, gap: space.sm },
  insightText: { fontSize: 16, lineHeight: 23 },
  group: { marginTop: space.xl },
  groupHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: space.sm,
    borderBottomWidth: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  rowLine: { borderBottomWidth: 1 },
  rowMain: { flex: 1, gap: 2 },
  tile: {
    width: 36,
    height: 36,
    borderRadius: radius.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashed: { borderWidth: 1, borderStyle: 'dashed' },
  cards: {
    marginTop: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.lg,
  },
  stack: { flexDirection: 'row', minWidth: 56 },
});
