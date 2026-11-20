import { useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { CardSwatch } from '@/components/badges';
import { StepScreen } from '@/components/layouts';
import { Card, Stack } from '@/components/Surface';
import { Text } from '@/components/Text';
import { useTransaction } from '@/lib/api';
import {
  amountLabel,
  cardArt,
  categoryName,
  dayLabel,
  formatTime,
  merchantName,
} from '@/lib/finance';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function TransactionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette } = useTheme();
  const query = useTransaction(id);
  const t = query.data;

  if (query.isError) return <StepScreen heading="Purchase not found" />;
  if (!t) return <StepScreen />;

  const name = merchantName(t);
  const art = cardArt({ name: t.account_name, official_name: null });
  const when = [dayLabel(t.date), t.authorized_at ? formatTime(t.authorized_at) : null]
    .filter(Boolean)
    .join(', ');

  return (
    <StepScreen>
      <View style={styles.hero}>
        <View style={[styles.logo, { backgroundColor: palette.surface }]}>
          <Text variant="title" muted>
            {name.charAt(0)}
          </Text>
        </View>
        <Text variant="heading" center style={{ marginTop: space.lg }}>
          {name}
        </Text>
        <Text
          variant="hero"
          tabular
          color={t.amount_cents < 0 ? palette.moneyIn : undefined}
          style={{ marginTop: space.xs }}
        >
          {amountLabel(t.amount_cents)}
        </Text>
        <Text variant="row" weight="semibold" muted>
          {when} · {t.pending ? 'Pending' : 'Posted'}
        </Text>
      </View>

      <Card style={styles.details}>
        <Stack>
          <Detail label="Card">
            <View style={styles.inline}>
              <CardSwatch color={art.color} chip={art.chip} width={34} />
              <Text variant="row" weight="bold" style={{ fontSize: 17 }}>
                {t.account_name}
                {t.account_mask ? ` •• ${t.account_mask}` : ''}
              </Text>
            </View>
          </Detail>
          <Detail label="Category">
            <Text variant="row" weight="bold" style={{ fontSize: 17 }}>
              {categoryName(t.category)}
            </Text>
          </Detail>
          {t.merchant_name && t.merchant_name !== t.name ? (
            <Detail label="On your statement">
              <Text variant="body" muted style={{ flexShrink: 1, textAlign: 'right' }}>
                {t.name}
              </Text>
            </Detail>
          ) : null}
        </Stack>
      </Card>
    </StepScreen>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.detail}>
      <Text variant="row" weight="semibold" muted style={{ fontSize: 17 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: space.md },
  logo: {
    width: 84,
    height: 84,
    borderRadius: radius.card + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: { marginTop: space.xl, paddingVertical: space.xs },
  detail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 64,
    gap: space.md,
  },
  inline: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexShrink: 1 },
});
