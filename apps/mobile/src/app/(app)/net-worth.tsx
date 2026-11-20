import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { CardSwatch, Monogram } from '@/components/badges';
import { StepScreen } from '@/components/layouts';
import { NetWorthBar } from '@/components/NetWorthBar';
import { ListRow, SectionHeader } from '@/components/rows';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Chip } from '@/components/selection';
import { Card, Stack } from '@/components/Surface';
import { Text } from '@/components/Text';
import { useAccounts, useNetWorth } from '@/lib/api';
import {
  accountsInView,
  availableViews,
  cardArt,
  isOwed,
  netWorthChangeSentence,
  viewTotal,
  type Account,
  type AccountView,
  type NetWorthPeriod,
} from '@/lib/finance';
import { formatCents } from '@/lib/money';
import { useRefresh } from '@/lib/useRefresh';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const PERIODS: { value: NetWorthPeriod; label: string }[] = [
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '1Y', label: '1Y' },
  { value: 'All', label: 'All' },
];

/** Sections for the Net worth view; other views list their accounts directly. */
const SECTIONS: { title: string; view: AccountView }[] = [
  { title: 'Checking', view: 'checking' },
  { title: 'Savings', view: 'savings' },
  { title: 'Investments', view: 'investments' },
  { title: 'Credit cards', view: 'cards' },
];

function viewCaption(accounts: Account[], view: AccountView): string {
  const list = accountsInView(accounts, view);
  const count = `${list.length} ${list.length === 1 ? 'account' : 'accounts'}`;
  if (view === 'cards') return `Owed across ${count.replace('account', 'card')}.`;
  const assets = accounts
    .filter((a) => a.kind === 'depository' || a.kind === 'investment')
    .reduce((sum, a) => sum + (a.current_cents ?? 0), 0);
  const share = assets > 0 ? Math.round((viewTotal(accounts, view) * 100) / assets) : 0;
  return `${count} · ${share}% of what you have.`;
}

export default function NetWorthScreen() {
  const { palette } = useTheme();
  const netWorth = useNetWorth();
  const accounts = useAccounts();
  const refresh = useRefresh();
  const [view, setView] = useState<AccountView>('networth');
  const [period, setPeriod] = useState<NetWorthPeriod>('1W');
  const n = netWorth.data;
  const all = accounts.data ?? [];
  const views = availableViews(all);
  const isNetWorth = view === 'networth';

  const total = isNetWorth ? n?.net_cents : accounts.data ? viewTotal(all, view) : undefined;

  return (
    <StepScreen title="Net worth" refreshControl={refresh}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.views}
        style={{ marginTop: space.lg }}
      >
        {views.map((v) => (
          <Chip
            key={v.view}
            label={v.label}
            selected={view === v.view}
            onPress={() => setView(v.view)}
          />
        ))}
      </ScrollView>

      <Text variant="hero" tabular style={{ marginTop: space.lg }}>
        {total === undefined ? '…' : formatCents(total)}
      </Text>
      <Text variant="body" muted style={styles.sentence}>
        {isNetWorth ? (n ? netWorthChangeSentence(n, period) : '') : viewCaption(all, view)}
      </Text>
      {netWorth.isError || accounts.isError ? (
        <Text variant="body" color={palette.alert} style={styles.sentence}>
          Otto couldn&apos;t load your accounts. Pull down to try again.
        </Text>
      ) : null}

      {isNetWorth && n ? (
        <>
          <View style={{ marginTop: space.lg }}>
            <SegmentedControl
              label="Period"
              options={PERIODS}
              value={period}
              onChange={setPeriod}
              stretch
            />
          </View>
          <Card style={{ marginTop: space.lg }}>
            <NetWorthBar netWorth={n} />
          </Card>
        </>
      ) : null}

      {isNetWorth ? (
        SECTIONS.map(({ title, view: section }) => {
          const list = accountsInView(all, section);
          if (list.length === 0) return null;
          const sum = viewTotal(all, section);
          return (
            <View key={section}>
              <SectionHeader title={title} detail={formatCents(section === 'cards' ? -sum : sum)} />
              <AccountList accounts={list} />
            </View>
          );
        })
      ) : (
        <View style={{ marginTop: space.lg }}>
          <AccountList accounts={accountsInView(all, view)} />
        </View>
      )}
    </StepScreen>
  );
}

function AccountList({ accounts }: { accounts: Account[] }) {
  return (
    <Card style={{ paddingVertical: space.sm }}>
      <Stack>
        {accounts.map((a) => {
          const art = cardArt(a);
          const cents = a.current_cents ?? 0;
          const card = a.kind === 'credit';
          return (
            <ListRow
              key={a.id}
              leading={
                card ? (
                  <CardSwatch color={art.color} chip={art.chip} width={52} />
                ) : (
                  <Monogram label={a.name.charAt(0)} size={44} />
                )
              }
              title={a.name}
              subtitle={[a.institution_name, a.mask ? `•• ${a.mask}` : null]
                .filter(Boolean)
                .join(' · ')}
              value={formatCents(isOwed(a) ? -cents : cents, { cents: true })}
              chevron={card}
              onPress={card ? () => router.push(`/card/${a.id}`) : undefined}
            />
          );
        })}
      </Stack>
    </Card>
  );
}

const styles = StyleSheet.create({
  views: { gap: space.sm },
  sentence: { marginTop: space.xs, fontSize: 17 },
});
