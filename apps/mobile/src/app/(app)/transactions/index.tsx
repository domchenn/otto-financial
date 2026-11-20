import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Monogram } from '@/components/badges';
import { Field } from '@/components/Field';
import { StepScreen } from '@/components/layouts';
import { ListRow } from '@/components/rows';
import { Chip } from '@/components/selection';
import { Card, Stack } from '@/components/Surface';
import { Text } from '@/components/Text';
import { useAccounts, useTransactions } from '@/lib/api';
import { amountLabel, categoryName, groupByDay, merchantName } from '@/lib/finance';
import { useRefresh } from '@/lib/useRefresh';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export default function Transactions() {
  const params = useLocalSearchParams<{ account?: string; category?: string }>();
  const { palette } = useTheme();
  const [query, setQuery] = useState('');
  const [accountId, setAccountId] = useState<string | undefined>(params.account);
  const q = useDebounced(query.trim());
  const accounts = useAccounts();
  const transactions = useTransactions({
    account_id: accountId,
    category: params.category,
    q: q || undefined,
    limit: 200,
  });
  const refresh = useRefresh();
  const groups = useMemo(() => groupByDay(transactions.data ?? []), [transactions.data]);
  const cards = (accounts.data ?? []).filter((a) => a.kind === 'credit' || a.kind === 'depository');

  return (
    <StepScreen
      title={params.category ? categoryName(params.category) : 'Transactions'}
      refreshControl={refresh}
    >
      <View style={{ marginTop: space.lg }}>
        <Field
          placeholder="Search merchants"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          clearButtonMode="while-editing"
          accessibilityLabel="Search merchants"
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <Chip label="All" selected={!accountId} onPress={() => setAccountId(undefined)} />
        {cards.map((a) => (
          <Chip
            key={a.id}
            label={a.mask ? `${a.name} ·· ${a.mask}` : a.name}
            selected={accountId === a.id}
            onPress={() => setAccountId(a.id)}
          />
        ))}
      </ScrollView>

      {transactions.isError ? (
        <Text variant="body" color={palette.alert} style={{ marginTop: space.lg }}>
          Otto couldn&apos;t load your purchases. Pull down to try again.
        </Text>
      ) : null}
      {transactions.data?.length === 0 ? (
        <Text variant="body" muted style={{ marginTop: space.xl }}>
          {q ? `Nothing matches "${q}".` : 'No purchases yet.'}
        </Text>
      ) : null}

      {groups.map((g) => (
        <View key={g.key} style={{ marginTop: space.lg }}>
          <Text variant="row" weight="bold" muted style={{ marginBottom: space.sm }}>
            {g.day}
          </Text>
          <Card style={{ paddingVertical: space.xs }}>
            <Stack>
              {g.items.map((t) => (
                <ListRow
                  key={t.id}
                  leading={<Monogram label={merchantName(t).charAt(0)} size={44} />}
                  title={merchantName(t)}
                  subtitle={`${t.account_name} · ${t.pending ? 'Pending' : categoryName(t.category)}`}
                  value={amountLabel(t.amount_cents)}
                  valueColor={t.amount_cents < 0 ? palette.moneyIn : undefined}
                  onPress={() => router.push(`/transaction/${t.id}`)}
                />
              ))}
            </Stack>
          </Card>
        </View>
      ))}
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  chips: { gap: space.sm, paddingVertical: space.md },
});
