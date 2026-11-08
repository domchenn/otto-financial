import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Coin, Dot, PointsBubble, Sparkle } from '@/components/Illustration';
import { Footer, MomentScreen } from '@/components/layouts';
import { Card } from '@/components/Surface';
import { Text } from '@/components/Text';
import { formatCents, formatCompact, formatNumber } from '@/lib/money';
import { creditSummary, nextPayment, points, week } from '@/lib/sample';
import { screen, space, type ToneName } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** The big reveal after the first sync. */
export default function Reveal() {
  const { palette } = useTheme();
  const rows: { tone: ToneName; title: string; sub: string; value: string }[] = [
    {
      tone: 'butter',
      title: `${creditSummary.expiringThisMonth} credits expire this month`,
      sub: "Dining, Uber Cash, streaming, Walmart+, Dunkin'",
      value: formatCents(creditSummary.readyThisMonthCents),
    },
    {
      tone: 'lilac',
      title: `Points across ${points.programs} programs`,
      sub: `About ${formatCents(points.travelValueCents)} toward travel`,
      value: formatNumber(points.total),
    },
    {
      tone: 'sky',
      title: `${nextPayment.card} payment due`,
      sub: `${nextPayment.due} · autopay covers the minimum only`,
      value: formatCents(nextPayment.cents),
    },
    {
      tone: 'mint',
      title: 'Left this week',
      sub: `${formatCents(week.spentCents)} of your ${formatCents(week.limitCents)} spent`,
      value: formatCents(week.limitCents - week.spentCents),
    },
  ];

  return (
    <MomentScreen
      artHeight={250}
      art={
        <View style={{ flex: 1, paddingHorizontal: screen.side, justifyContent: 'center' }}>
          <Text variant="row" weight="bold" color="#C9CEFF">
            Otto found
          </Text>
          <Text
            variant="hero"
            color="#FFFFFF"
            tabular
            style={{ fontSize: 72, lineHeight: 80, letterSpacing: -3 }}
          >
            {formatCents(creditSummary.readyThisMonthCents)}
          </Text>
          <Text variant="row" weight="bold" color="#FFFFFF" style={{ fontSize: 19 }}>
            in credits you can use right now
          </Text>
          <Coin size={92} style={{ right: '12%', top: 10 }} rotate={8} />
          <Sparkle size={30} style={{ right: '36%', top: -12 }} />
          <Dot size={14} color={palette.illustration.mint} style={{ right: '6%', top: 90 }} />
          <PointsBubble
            label={`${formatCompact(points.total)} pts`}
            size="sm"
            style={{ right: '6%', top: 140 }}
            rotate={-4}
          />
        </View>
      }
      footer={
        <Footer>
          <Button title="Let's go" onPress={() => router.replace('/onboarding/notifications')} />
        </Footer>
      }
    >
      <Text variant="title">Here&apos;s your money at a glance, Dom</Text>
      <View style={{ gap: space.md, marginTop: space.xl }}>
        {rows.map((r) => {
          const t = palette.tones[r.tone];
          return (
            <Card key={r.title} tone={r.tone} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text variant="row" weight="bold" color={t.text} style={{ fontSize: 18 }}>
                  {r.title}
                </Text>
                <Text variant="body" color={t.text}>
                  {r.sub}
                </Text>
              </View>
              <Text variant="heading" weight="extrabold" tabular color={t.text}>
                {r.value}
              </Text>
            </Card>
          );
        })}
      </View>
    </MomentScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.lg },
});
