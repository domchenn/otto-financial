import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { IconTile } from '@/components/badges';
import { IconButton } from '@/components/IconButton';
import { CheckIcon, MoreIcon, SpendingIcon } from '@/components/icons';
import { StepScreen } from '@/components/layouts';
import { ProgressBar } from '@/components/ProgressBar';
import { ListRow } from '@/components/rows';
import { Tag } from '@/components/selection';
import { Card, Stack } from '@/components/Surface';
import { Text } from '@/components/Text';
import { formatCents, formatNumber } from '@/lib/money';
import { credits, getCard, goldValue } from '@/lib/sample';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function CardDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette } = useTheme();
  const card = getCard(id);

  if (!card) {
    return <StepScreen heading="Card not found" subheading="This card isn't in your wallet." />;
  }

  const cardCredits = credits.filter((c) => c.card === card.id && c.group !== 'year').slice(0, 1);
  const annual = credits.filter((c) => c.card === card.id && c.group === 'year').slice(0, 1);
  const lilac = palette.tones.lilac;
  const butter = palette.tones.butter;
  const bonus = card.signupBonus;
  const net = goldValue.creditsUsedCents + goldValue.extraPointsCents - goldValue.feeCents;

  return (
    <StepScreen
      title={card.name}
      right={
        <IconButton
          icon={MoreIcon}
          label="More"
          onPress={() =>
            Alert.alert(card.name, 'Card options arrive with connected accounts in M1.')
          }
        />
      }
    >
      <View style={[styles.art, { backgroundColor: card.color, shadowColor: palette.shadow }]}>
        <View style={styles.artTop}>
          <View style={[styles.chip, { backgroundColor: card.chip }]} />
          <Text variant="row" weight="bold" color={card.ink}>
            •• {card.last4}
          </Text>
        </View>
        <View style={styles.artBottom}>
          <View>
            <Text variant="body" weight="semibold" color={card.ink} style={{ opacity: 0.8 }}>
              Balance
            </Text>
            <Text variant="hero" tabular color={card.ink}>
              {formatCents(card.balanceCents, { cents: true })}
            </Text>
          </View>
          <Text variant="heading" weight="extrabold" color={card.ink}>
            {card.shortName}
          </Text>
        </View>
      </View>

      <Card style={styles.facts}>
        <Fact label="Statement due" value={card.dueSoon ? 'Nov 12' : card.due} />
        {card.pointsThisMonth !== undefined ? (
          <Fact label="Points this month" value={formatNumber(card.pointsThisMonth)} />
        ) : null}
        {card.annualFeeCents !== undefined ? (
          <Fact label="Annual fee" value={formatCents(card.annualFeeCents)} />
        ) : null}
      </Card>

      {card.bestFor ? (
        <View style={styles.bestFor}>
          <Text variant="row" weight="semibold" muted>
            Best for
          </Text>
          {card.bestFor.map((b) => (
            <Tag key={b} label={b} />
          ))}
        </View>
      ) : null}

      {bonus ? (
        <Card tone="lilac" style={{ marginTop: space.lg }}>
          <View style={styles.spread}>
            <Text variant="row" weight="bold" color={lilac.text} style={{ fontSize: 18 }}>
              Sign-up bonus
            </Text>
            <Text variant="row" weight="bold" color={palette.moneyIn}>
              On pace
            </Text>
          </View>
          <View style={styles.amountRow}>
            <Text
              variant="heading"
              weight="extrabold"
              tabular
              color={lilac.text}
              style={{ fontSize: 28 }}
            >
              {formatCents(bonus.spentCents)}
            </Text>
            <Text variant="row" weight="semibold" color={lilac.text}>
              {' '}
              of {formatCents(bonus.targetCents)} spent
            </Text>
          </View>
          <View style={{ marginVertical: space.md }}>
            <ProgressBar
              value={bonus.spentCents / bonus.targetCents}
              color={lilac.accent}
              track={lilac.track}
              height={10}
            />
          </View>
          <Text variant="body" color={lilac.text}>
            {bonus.daysLeft} days left · about {formatCents(bonus.perDayCents)} a day gets you there
          </Text>
        </Card>
      ) : null}

      {cardCredits.length + annual.length > 0 ? (
        <Card tone="butter" style={{ marginTop: space.lg, paddingVertical: space.sm }}>
          <Stack>
            {[...cardCredits, ...annual].map((c) => (
              <ListRow
                key={c.id}
                title={c.name}
                subtitle={
                  c.group === 'year'
                    ? `${formatCents(c.amountCents)} left · ${c.resets.toLowerCase()}`
                    : c.resets
                }
                subtitleColor={c.urgent ? palette.alert : butter.text}
                value={formatCents(c.amountCents)}
                valueColor={butter.text}
                onPress={() => router.push(`/credits/${c.id}`)}
              />
            ))}
            {card.id === 'gold' ? (
              <ListRow
                title="Uber Cash"
                subtitle="Used this month"
                subtitleColor={palette.moneyIn}
                trailing={<CheckIcon color={palette.moneyIn} size={24} />}
              />
            ) : null}
          </Stack>
        </Card>
      ) : null}

      {card.id === 'gold' ? (
        <Card style={{ marginTop: space.lg, paddingVertical: space.sm }}>
          <ListRow
            leading={<IconTile icon={SpendingIcon} tone="mint" size={52} />}
            title={`Worth the ${formatCents(goldValue.feeCents)} fee?`}
            subtitle={`Yes, by about ${formatCents(net)} this year`}
            subtitleColor={palette.moneyIn}
            chevron
            onPress={() => router.push(`/card/${card.id}/value`)}
          />
        </Card>
      ) : null}
    </StepScreen>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text variant="body" muted style={{ fontSize: 14 }}>
        {label}
      </Text>
      <Text variant="row" weight="extrabold" tabular style={{ fontSize: 19 }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  art: {
    marginTop: space.lg,
    borderRadius: radius.card + 4,
    padding: space.xl,
    height: 210,
    justifyContent: 'space-between',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  artTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  chip: { width: 50, height: 38, borderRadius: 9 },
  artBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  facts: { flexDirection: 'row', gap: space.sm, marginTop: space.lg, paddingVertical: space.lg },
  bestFor: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.lg,
  },
  spread: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginTop: space.sm,
  },
});
