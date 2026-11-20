import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { CardSwatch } from '@/components/badges';
import { Button } from '@/components/Button';
import { Footer, StepScreen } from '@/components/layouts';
import { ProgressBar } from '@/components/ProgressBar';
import { Card } from '@/components/Surface';
import { Text } from '@/components/Text';
import { useBenefits, useMarkCreditUsed } from '@/lib/api';
import { cadenceLabel, findCredit, isUrgent, isUsed, resetsLabel } from '@/lib/credits';
import { cardArt } from '@/lib/finance';
import { formatCents } from '@/lib/money';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export default function CreditDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette } = useTheme();
  const benefits = useBenefits();
  const mark = useMarkCreditUsed();
  const credit = benefits.data ? findCredit(benefits.data, id) : undefined;

  if (!benefits.data) return <StepScreen title="Credit" />;
  if (!credit) {
    return <StepScreen heading="Credit not found" subheading="It may have reset already." />;
  }

  const butter = palette.tones.butter;
  const art = cardArt({ name: credit.card_name, official_name: null });
  const used = isUsed(credit);
  const amount = (cents: number) => formatCents(cents, { cents: 'auto' });

  const setUsed = (value: boolean) =>
    mark.mutate(
      { periodId: credit.period_id, used: value },
      {
        onSuccess: (next) => {
          if (value && next.expiring_this_month_count === 0) router.replace('/credits/complete');
          else if (value) router.back();
        },
        onError: () => Alert.alert("Couldn't save", 'Check your connection and try again.'),
      },
    );

  return (
    <StepScreen
      footer={
        <Footer>
          {credit.marked_used ? (
            <Button
              variant="secondary"
              title="Not used yet"
              onPress={() => setUsed(false)}
              loading={mark.isPending}
            />
          ) : !used ? (
            <Button title="Mark as used" onPress={() => setUsed(true)} loading={mark.isPending} />
          ) : null}
        </Footer>
      }
    >
      <Card tone="butter" style={{ marginTop: space.lg }}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text variant="row" weight="bold" color={butter.text}>
              {credit.card_name} · {cadenceLabel(credit.cadence)}
            </Text>
            <Text variant="title" color={butter.text} style={{ marginTop: space.xs }}>
              {amount(credit.amount_cents)} {lowerFirst(credit.name)}
            </Text>
          </View>
          <CardSwatch color={art.color} chip={art.chip} width={72} />
        </View>
        <View style={[styles.head, { marginTop: space.lg, alignItems: 'center' }]}>
          <Text variant="row" weight="bold" color={isUrgent(credit) ? palette.alert : butter.text}>
            {used ? (credit.marked_used ? 'Marked used' : 'Used') : resetsLabel(credit)}
          </Text>
          <Text variant="row" weight="bold" tabular color={butter.text}>
            {amount(credit.remaining_cents)} left
          </Text>
        </View>
        <View style={{ marginTop: space.md }}>
          <ProgressBar
            value={credit.amount_cents > 0 ? 1 - credit.remaining_cents / credit.amount_cents : 0}
            color={butter.accent}
            track={butter.track}
          />
        </View>
      </Card>

      <Text variant="heading" style={{ marginTop: space.xl, marginBottom: space.md, fontSize: 20 }}>
        How to use it
      </Text>
      <Card>
        <Text variant="body" muted style={{ fontSize: 17, lineHeight: 24 }}>
          {credit.channel
            ? `Pay with your ${credit.card_name}: ${credit.channel}.`
            : `Pay with your ${credit.card_name} at a qualifying merchant.`}{' '}
          It comes back as a statement credit.
          {credit.enrollment ? ' Enroll in the issuer app first.' : ''}
        </Text>
      </Card>

      <Text variant="body" muted style={{ marginTop: space.lg, fontSize: 14 }}>
        {credit.confirmed
          ? 'The statement credit has posted.'
          : used
            ? 'Otto saw a qualifying purchase. The statement credit usually posts within a few days.'
            : 'Otto marks this as used on its own once it sees a qualifying purchase or the statement credit. You can also mark it yourself.'}
      </Text>
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
});
