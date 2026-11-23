import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, TextButton } from '@/components/Button';
import { CheckIcon } from '@/components/icons';
import { Coin, Dot, PointsBubble, Sparkle, Stage } from '@/components/Illustration';
import { Footer, MomentScreen } from '@/components/layouts';
import { Text } from '@/components/Text';
import { formatCents } from '@/lib/money';
import { useBenefits } from '@/lib/api';
import { allCredits } from '@/lib/credits';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Success moment after every monthly credit is used. */
export default function CreditsComplete() {
  const { palette } = useTheme();
  const benefits = useBenefits().data;
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  // Credits whose period ends this month, all used by now.
  const month = (benefits ? allCredits(benefits) : [])
    .filter((c) => c.end_date.startsWith(monthKey))
    .reduce((sum, c) => sum + c.amount_cents, 0);
  const monthName = now.toLocaleDateString('en-US', { month: 'long' });

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
              { backgroundColor: palette.tones.butter.bg, shadowColor: palette.shadow },
            ]}
          >
            <CheckIcon color={palette.tones.butter.text} size={90} />
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
        You got {formatCents(month)} back in {monthName}. Porter will line up next month&apos;s
        credits when they reset.
      </Text>
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
