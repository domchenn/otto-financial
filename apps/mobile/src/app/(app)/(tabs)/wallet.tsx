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
import { formatCents } from '@/lib/money';
import { cards, wallet } from '@/lib/sample';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function Wallet() {
  const { palette } = useTheme();
  const alert = palette.tones.alert;
  return (
    <TabScreen>
      <View style={styles.header}>
        <Text variant="display">Wallet</Text>
        <IconButton
          icon={PlusIcon}
          label="Connect another account"
          onPress={() => router.push('/onboarding/connect')}
        />
      </View>

      <Card tone="alert" style={styles.banner}>
        <Text variant="body" color={alert.text} style={{ flex: 1, fontSize: 16, lineHeight: 22 }}>
          <Text variant="body" weight="bold" color={alert.text} style={{ fontSize: 16 }}>
            Chase needs a quick sign-in.
          </Text>{' '}
          Balances were last updated 3 days ago.
        </Text>
        <Button
          small
          variant="outline"
          title="Fix"
          onPress={() => router.push('/settings/accounts')}
          style={styles.fix}
        />
      </Card>

      <Card style={{ marginTop: space.lg }}>
        <Text variant="body" muted>
          Total card balances
        </Text>
        <Text variant="hero" tabular style={{ marginTop: space.xs }}>
          {formatCents(wallet.totalBalanceCents, { cents: true })}
        </Text>
        <View style={styles.pills}>
          <Pill tone="mint" label={`${wallet.utilizationPct}% utilization · healthy`} />
          <Pill tone="sky" label={`Next due ${wallet.nextDue}`} />
        </View>
      </Card>

      <SectionHeader title="Credit cards" detail={`${cards.length} cards`} />
      <Card style={styles.list}>
        <Stack>
          {cards.map((card) => (
            <ListRow
              key={card.id}
              leading={<CardSwatch color={card.color} chip={card.chip} width={64} />}
              title={card.name}
              subtitle={`•• ${card.last4} · ${card.dueSoon ? card.due : `Due ${card.due}`}`}
              subtitleColor={card.dueSoon ? palette.alert : undefined}
              value={formatCents(card.balanceCents, { cents: true })}
              chevron
              onPress={() => router.push(`/card/${card.id}`)}
            />
          ))}
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
              $65 ready to use this month
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
