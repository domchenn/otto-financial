import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CardSwatch, Monogram } from '@/components/badges';
import { StepScreen } from '@/components/layouts';
import { NetWorthBar } from '@/components/NetWorthBar';
import { ListRow, SectionHeader } from '@/components/rows';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Card, Stack } from '@/components/Surface';
import { Text } from '@/components/Text';
import { useAccounts, useNetWorth } from '@/lib/api';
import {
  accountsInView,
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

/** The accounts behind net worth, grouped by kind. */
const SECTIONS: { title: string; view: AccountView }[] = [
  { title: 'Checking', view: 'checking' },
  { title: 'Savings', view: 'savings' },
  { title: 'Investments', view: 'investments' },
  { title: 'Credit cards', view: 'cards' },
];

export default function NetWorthScreen() {
  const { palette } = useTheme();
  const netWorth = useNetWorth();
  const accounts = useAccounts();
  const refresh = useRefresh();
  const [period, setPeriod] = useState<NetWorthPeriod>('1W');
  const n = netWorth.data;
  const all = accounts.data ?? [];

  return (
    <StepScreen title="Net worth" refreshControl={refresh}>
      <Text variant="hero" tabular style={{ marginTop: space.xl }}>
        {n ? formatCents(n.net_cents) : '…'}
      </Text>
      {n ? (
        <Text variant="body" muted style={styles.sentence}>
          {netWorthChangeSentence(n, period)}
        </Text>
      ) : null}
      {netWorth.isError || accounts.isError ? (
        <Text variant="body" color={palette.alert} style={styles.sentence}>
          Otto couldn&apos;t load your accounts. Pull down to try again.
        </Text>
      ) : null}

      {n ? (
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

      {SECTIONS.map(({ title, view }) => {
        const list = accountsInView(all, view);
        if (list.length === 0) return null;
        const sum = viewTotal(all, view);
        return (
          <View key={view}>
            <SectionHeader title={title} detail={formatCents(view === 'cards' ? -sum : sum)} />
            <AccountList accounts={list} />
          </View>
        );
      })}
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
  sentence: { marginTop: space.xs, fontSize: 17 },
});
