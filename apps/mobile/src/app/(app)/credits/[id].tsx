import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { CardSwatch } from '@/components/badges';
import { Button } from '@/components/Button';
import { Footer, StepScreen } from '@/components/layouts';
import { OttoBubble } from '@/components/otto';
import { ProgressBar } from '@/components/ProgressBar';
import { ChipWrap, Tag } from '@/components/selection';
import { Card } from '@/components/Surface';
import { Text } from '@/components/Text';
import { formatCents } from '@/lib/money';
import { getCard, getCredit } from '@/lib/sample';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function CreditDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette } = useTheme();
  const credit = getCredit(id);
  const card = credit ? getCard(credit.card) : undefined;

  if (!credit || !card) {
    return <StepScreen heading="Credit not found" subheading="It may have reset already." />;
  }
  const butter = palette.tones.butter;

  return (
    <StepScreen
      footer={
        <Footer>
          <Button title="Mark as used" onPress={() => router.replace('/credits/complete')} />
          <Button
            variant="secondary"
            title="Remind me tomorrow"
            onPress={() => {
              Alert.alert('Reminder set', 'Otto will nudge you tomorrow morning.');
              router.back();
            }}
          />
        </Footer>
      }
    >
      <Card tone="butter" style={{ marginTop: space.lg }}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text variant="row" weight="bold" color={butter.text}>
              {card.name} · {credit.cadence}
            </Text>
            <Text variant="title" color={butter.text} style={{ marginTop: space.xs }}>
              {formatCents(credit.amountCents)}{' '}
              {credit.name.charAt(0).toLowerCase() + credit.name.slice(1)}
            </Text>
          </View>
          <CardSwatch color={card.color} chip={card.color} width={72} />
        </View>
        <View style={[styles.head, { marginTop: space.lg, alignItems: 'center' }]}>
          <Text variant="row" weight="bold" color={credit.urgent ? palette.alert : butter.text}>
            {credit.resets}
          </Text>
          <Text variant="row" weight="bold" color={butter.text}>
            {credit.resetDate}
          </Text>
        </View>
        <View style={{ marginTop: space.md }}>
          <ProgressBar value={credit.elapsed} color={butter.accent} track={butter.track} />
        </View>
      </Card>

      <Text variant="heading" style={{ marginTop: space.xl, marginBottom: space.md, fontSize: 20 }}>
        How to use it
      </Text>
      <Card>
        <Text variant="body" muted style={{ fontSize: 17, lineHeight: 24 }}>
          Pay with your {card.name} at any of these. The {formatCents(credit.amountCents)} comes
          back as a statement credit.
        </Text>
        <View style={{ marginTop: space.lg }}>
          <ChipWrap>
            {(credit.merchants ?? []).map((m) => (
              <Tag key={m} label={m} onSurface />
            ))}
          </ChipWrap>
        </View>
      </Card>

      {credit.tip ? (
        <View style={{ marginTop: space.xl }}>
          <OttoBubble>{credit.tip}</OttoBubble>
        </View>
      ) : null}

      <Text variant="body" muted style={{ marginTop: space.lg, fontSize: 14 }}>
        Otto marks this as used on its own once the statement credit posts. You can also mark it
        yourself.
      </Text>
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
});
