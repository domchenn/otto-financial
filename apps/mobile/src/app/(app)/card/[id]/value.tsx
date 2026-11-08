import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Footer, StepScreen } from '@/components/layouts';
import { OttoBubble } from '@/components/otto';
import { Card, Stack } from '@/components/Surface';
import { Text } from '@/components/Text';
import { formatCents, formatNumber } from '@/lib/money';
import { goldValue, points } from '@/lib/sample';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** "Is the Gold Card worth its fee?" Sample figures cover the last 12 months. */
export default function CardValue() {
  const { palette } = useTheme();
  const v = goldValue;
  const got = v.creditsUsedCents + v.extraPointsCents;
  const net = got - v.feeCents;

  return (
    <StepScreen
      eyebrow="Is the Gold Card worth its fee?"
      subheading={
        <Text variant="display" style={{ marginTop: space.xs }}>
          Yes, by about{' '}
          <Text variant="display" color={palette.moneyIn} tabular>
            {formatCents(net)}
          </Text>{' '}
          this year.
        </Text>
      }
      footer={
        <Footer>
          <Button title="Got it" onPress={() => router.back()} />
        </Footer>
      }
    >
      <Card style={{ marginTop: space.xl, paddingVertical: space.sm }}>
        <Stack>
          <Line
            label="Credits you used"
            note="Dining, Uber Cash, Resy"
            value={formatCents(v.creditsUsedCents)}
          />
          <Line
            label="Extra points vs. your next-best card"
            note={`${formatNumber(v.extraPoints)} pts at about ${points.centsPerPoint}¢ each`}
            value={formatCents(v.extraPointsCents)}
          />
          <Line label="Value you got" value={formatCents(got)} />
          <Line label="Annual fee" value={formatCents(-v.feeCents)} valueColor={palette.alert} />
          <Line
            label="You came out ahead"
            value={formatCents(net, { sign: true })}
            valueColor={palette.moneyIn}
            big
          />
        </Stack>
      </Card>

      <View style={{ marginTop: space.xl }}>
        <OttoBubble>
          Use the {formatCents(v.resyLeftCents)} Resy credit before Dec 31 and you&apos;ll come out{' '}
          {formatCents(net + v.resyLeftCents)} ahead.
        </OttoBubble>
      </View>

      <Text variant="body" muted style={{ marginTop: space.lg, fontSize: 14 }}>
        Based on the last 12 months. Points are valued at about {points.centsPerPoint}¢ for travel;
        you can change this in settings.
      </Text>
    </StepScreen>
  );
}

function Line({
  label,
  note,
  value,
  valueColor,
  big,
}: {
  label: string;
  note?: string;
  value: string;
  valueColor?: string;
  big?: boolean;
}) {
  return (
    <View style={styles.line}>
      <View style={{ flex: 1 }}>
        <Text variant="row" weight="bold" style={{ fontSize: big ? 19 : 17 }}>
          {label}
        </Text>
        {note ? (
          <Text variant="body" muted style={{ fontSize: 14 }}>
            {note}
          </Text>
        ) : null}
      </View>
      <Text
        variant="row"
        weight="extrabold"
        tabular
        color={valueColor}
        style={{ fontSize: big ? 24 : 18 }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.lg },
});
