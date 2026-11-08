import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, TextButton } from '@/components/Button';
import { CheckIcon } from '@/components/icons';
import { Coin, Dot, PointsBubble, Sparkle, Stage } from '@/components/Illustration';
import { Footer, MomentScreen } from '@/components/layouts';
import { Card } from '@/components/Surface';
import { Text } from '@/components/Text';
import { formatCents } from '@/lib/money';
import { creditSummary } from '@/lib/sample';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Success moment after every monthly credit is used. */
export default function CreditsComplete() {
  const { palette } = useTheme();
  const month = creditSummary.readyThisMonthCents;
  const year = creditSummary.usedThisYearCents + month;

  return (
    <MomentScreen
      artHeight={320}
      art={
        <Stage height={320}>
          <Coin size={96} style={{ left: '12%', top: 50 }} rotate={-8} />
          <Coin size={80} style={{ right: '15%', top: 40 }} rotate={10} />
          <Sparkle size={26} color="#D5DBFF" style={{ left: '58%', top: 10 }} />
          <Sparkle size={36} style={{ left: '18%', top: 190 }} />
          <Dot size={16} color={palette.illustration.pink} style={{ left: '10%', top: 170 }} />
          <Dot size={16} color="#E8EAFF" style={{ right: '10%', top: 140 }} />
          <Dot size={14} color={palette.illustration.coin} style={{ left: '46%', top: 280 }} />
          <View
            style={[
              styles.check,
              { backgroundColor: palette.illustration.mint, shadowColor: palette.shadow },
            ]}
          >
            <CheckIcon color={palette.tones.mint.text} size={90} />
          </View>
          <PointsBubble
            label={`+${formatCents(month)}`}
            tone="butter"
            size="sm"
            style={{ right: '16%', top: 220 }}
            rotate={-6}
          />
        </Stage>
      }
      footer={
        <Footer>
          <Button title="See what's next" onPress={() => router.replace('/credits')} />
          <TextButton title="Back to home" onPress={() => router.dismissTo('/')} />
        </Footer>
      }
    >
      <Text variant="display" center>
        Every credit used this month
      </Text>
      <Text
        variant="body"
        muted
        center
        style={{ fontSize: 17, lineHeight: 25, marginTop: space.md }}
      >
        You got {formatCents(month)} back in November. That&apos;s {formatCents(year)} so far this
        year.
      </Text>
      <View style={styles.tiles}>
        <Card tone="butter" style={styles.tile}>
          <Text variant="body" weight="semibold" color={palette.tones.butter.text}>
            Used this year
          </Text>
          <Text
            variant="heading"
            weight="extrabold"
            tabular
            color={palette.tones.butter.text}
            style={{ fontSize: 28 }}
          >
            {formatCents(year)}
          </Text>
        </Card>
        <Card tone="mint" style={styles.tile}>
          <Text variant="body" weight="semibold" color={palette.tones.mint.text}>
            Streak
          </Text>
          <Text
            variant="heading"
            weight="extrabold"
            color={palette.tones.mint.text}
            style={{ fontSize: 28 }}
          >
            3 months
          </Text>
        </Card>
      </View>
    </MomentScreen>
  );
}

const styles = StyleSheet.create({
  check: {
    position: 'absolute',
    left: '50%',
    marginLeft: -95,
    top: 70,
    width: 190,
    height: 190,
    borderRadius: 95,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.2,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
  },
  tiles: { flexDirection: 'row', gap: space.md, marginTop: space.xl },
  tile: { flex: 1, padding: space.xl },
});
