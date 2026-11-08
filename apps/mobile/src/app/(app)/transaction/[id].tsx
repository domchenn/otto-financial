import { Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';

import { CardSwatch } from '@/components/badges';
import { TextButton } from '@/components/Button';
import { CheckIcon, SparkleIcon } from '@/components/icons';
import { StepScreen } from '@/components/layouts';
import { SettingRow, ToggleRow } from '@/components/rows';
import { Card, Stack } from '@/components/Surface';
import { Text } from '@/components/Text';
import { formatCents } from '@/lib/money';
import { categories, getCard, getTransaction, points } from '@/lib/sample';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function TransactionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette } = useTheme();
  const t = getTransaction(id);
  const [excluded, setExcluded] = useState(false);

  if (!t) return <StepScreen heading="Purchase not found" />;
  const card = getCard(t.card);
  const better = t.missed ? getCard(t.missed.better) : undefined;
  const category = categories.find((c) => c.id === t.category);
  const bonus = getCard('gold')?.signupBonus;
  const tone = t.missed ? palette.tones.lilac : palette.tones.mint;

  return (
    <StepScreen
      footer={
        <TextButton
          title="Something look wrong?"
          onPress={() =>
            Alert.alert('Thanks', 'Reporting a problem arrives with real transactions in M1.')
          }
        />
      }
    >
      <View style={styles.hero}>
        <View style={[styles.logo, { backgroundColor: palette.surface }]}>
          <Text variant="title" muted>
            {t.merchant.charAt(0)}
          </Text>
        </View>
        <Text variant="heading" style={{ marginTop: space.lg }}>
          {t.merchant}
        </Text>
        <Text variant="hero" tabular style={{ marginTop: space.xs }}>
          {formatCents(t.cents, { cents: true })}
        </Text>
        <Text variant="row" weight="semibold" muted>
          {t.day}, {t.time} · Posted
        </Text>
      </View>

      <Card tone={t.missed ? 'lilac' : 'mint'} style={styles.verdict}>
        <View style={[styles.verdictIcon, { backgroundColor: tone.accent }]}>
          {t.missed ? (
            <SparkleIcon color="#FFFFFF" size={20} filled />
          ) : (
            <CheckIcon color="#FFFFFF" size={22} />
          )}
        </View>
        <Text variant="body" color={tone.text} style={{ flex: 1, fontSize: 17, lineHeight: 24 }}>
          {t.missed && better ? (
            <>
              <Text variant="body" weight="extrabold" color={tone.text} style={{ fontSize: 17 }}>
                {better.shortName} earns more here.
              </Text>{' '}
              It would have earned about {t.missed.extraPoints} more points.
            </>
          ) : (
            <>
              <Text variant="body" weight="extrabold" color={tone.text} style={{ fontSize: 17 }}>
                Right card.
              </Text>{' '}
              {card?.shortName} earns {t.multiplier} at{' '}
              {category?.name.toLowerCase() ?? 'this merchant'}, the most of any card you have.
            </>
          )}
        </Text>
      </Card>

      <Card style={styles.details}>
        <Stack>
          <Detail label="Card">
            <View style={styles.inline}>
              {card ? <CardSwatch color={card.color} chip={card.color} width={34} /> : null}
              <Text variant="row" weight="bold" style={{ fontSize: 17 }}>
                {card?.shortName} •• {card?.last4}
              </Text>
            </View>
          </Detail>
          <Detail label="Points earned">
            <Text variant="row" weight="bold" tabular style={{ fontSize: 17 }}>
              {t.points} pts{' '}
              <Text variant="row" weight="medium" muted>
                ≈ {formatCents(t.points * points.centsPerPoint, { cents: true })}
              </Text>
            </Text>
          </Detail>
          {t.card === 'gold' && bonus ? (
            <Detail label="Sign-up bonus">
              <Text variant="row" weight="bold" tabular style={{ fontSize: 17 }}>
                {formatCents(bonus.spentCents + t.cents)} of {formatCents(bonus.targetCents)}
              </Text>
            </Detail>
          ) : null}
          <SettingRow
            label="Category"
            value={category?.name}
            valueColor={palette.ink}
            onPress={() =>
              Alert.alert('Change category', 'Recategorizing arrives with real transactions in M1.')
            }
          />
        </Stack>
      </Card>

      <Card style={{ marginTop: space.lg, paddingVertical: space.xs }}>
        <ToggleRow
          title="Leave out of my budget"
          subtitle="For things like a group dinner you'll get paid back for"
          value={excluded}
          onValueChange={setExcluded}
        />
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
  verdict: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    marginTop: space.xl,
    paddingVertical: space.lg,
  },
  verdictIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: { marginTop: space.lg, paddingVertical: space.xs },
  detail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 64,
    gap: space.md,
  },
  inline: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
