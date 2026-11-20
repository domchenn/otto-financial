import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CardSwatch, Monogram } from '@/components/badges';
import { StepScreen } from '@/components/layouts';
import { NetWorthBar } from '@/components/NetWorthBar';
import { ListRow, SectionHeader } from '@/components/rows';
import { Chip } from '@/components/selection';
import { Card, Stack } from '@/components/Surface';
import { Text } from '@/components/Text';
import { useAccounts, useNetWorth } from '@/lib/api';
import { cardArt, netWorthChangeSentence, type Account, type NetWorthPeriod } from '@/lib/finance';
import { formatCents } from '@/lib/money';
import { useRefresh } from '@/lib/useRefresh';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const PERIODS: NetWorthPeriod[] = ['1W', '1M', '3M', '1Y', 'All'];

const SECTIONS: { title: string; kind: Account['kind']; owed?: boolean }[] = [
  { title: 'Cash', kind: 'depository' },
  { title: 'Investments', kind: 'investment' },
  { title: 'Credit cards', kind: 'credit', owed: true },
  { title: 'Loans', kind: 'loan', owed: true },
];

export default function NetWorthScreen() {
  const { palette } = useTheme();
  const netWorth = useNetWorth();
  const accounts = useAccounts();
  const refresh = useRefresh();
  const [period, setPeriod] = useState<NetWorthPeriod>('1W');
  const n = netWorth.data;

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
      {netWorth.isError ? (
        <Text variant="body" color={palette.alert} style={styles.sentence}>
          Otto couldn&apos;t load your net worth. Pull down to try again.
        </Text>
      ) : null}

      <View style={styles.chips}>
        {PERIODS.map((p) => (
          <Chip key={p} label={p} selected={period === p} onPress={() => setPeriod(p)} />
        ))}
      </View>

      {n ? (
        <Card style={{ marginTop: space.lg }}>
          <NetWorthBar netWorth={n} />
        </Card>
      ) : null}

      {SECTIONS.map(({ title, kind, owed }) => {
        const list = (accounts.data ?? []).filter((a) => a.kind === kind);
        if (list.length === 0) return null;
        const total = list.reduce((sum, a) => sum + (a.current_cents ?? 0), 0);
        return (
          <View key={kind}>
            <SectionHeader title={title} detail={formatCents(owed ? -total : total)} />
            <Card style={{ paddingVertical: space.sm }}>
              <Stack>
                {list.map((a) => {
                  const art = cardArt(a);
                  return (
                    <ListRow
                      key={a.id}
                      leading={
                        kind === 'credit' ? (
                          <CardSwatch color={art.color} chip={art.chip} width={52} />
                        ) : (
                          <Monogram label={a.name.charAt(0)} size={44} />
                        )
                      }
                      title={a.name}
                      subtitle={[a.institution_name, a.mask ? `•• ${a.mask}` : null]
                        .filter(Boolean)
                        .join(' · ')}
                      value={formatCents(owed ? -(a.current_cents ?? 0) : (a.current_cents ?? 0), {
                        cents: true,
                      })}
                      chevron={kind === 'credit'}
                      onPress={kind === 'credit' ? () => router.push(`/card/${a.id}`) : undefined}
                    />
                  );
                })}
              </Stack>
            </Card>
          </View>
        );
      })}
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  sentence: { marginTop: space.xs, fontSize: 17 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.lg },
});
