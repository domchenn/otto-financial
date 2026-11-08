import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { IconTile, LabelTile } from '@/components/badges';
import { Button, TextButton } from '@/components/Button';
import { CloseIcon, EyeIcon, LockIcon, type Icon } from '@/components/icons';
import { Coin } from '@/components/Illustration';
import { Footer, MomentScreen } from '@/components/layouts';
import { Wordmark } from '@/components/otto';
import { Text } from '@/components/Text';
import { space, type ToneName } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const PROMISES: { icon: Icon; tone: ToneName; text: string }[] = [
  { icon: EyeIcon, tone: 'mint', text: 'Read-only. Otto can never move your money.' },
  { icon: LockIcon, tone: 'sky', text: 'Secured by Plaid. We never see your bank password.' },
  { icon: CloseIcon, tone: 'lilac', text: 'Disconnect any account, anytime.' },
];

const BANKS: { label: string; tone: ToneName; x: number; y: number; r: number }[] = [
  { label: 'AX', tone: 'sky', x: 0.2, y: 0.28, r: -6 },
  { label: 'CH', tone: 'mint', x: 0.8, y: 0.28, r: 6 },
  { label: 'C1', tone: 'butter', x: 0.18, y: 0.72, r: 4 },
  { label: 'BA', tone: 'lilac', x: 0.82, y: 0.72, r: -4 },
];

const ART_W = 360;
const ART_H = 330;

export default function Connect() {
  const { palette } = useTheme();
  const cx = ART_W / 2;
  const cy = ART_H * 0.52;

  return (
    <MomentScreen
      onBack={() => router.back()}
      artHeight={ART_H}
      art={
        <View style={styles.artWrap}>
          <View style={{ width: ART_W, height: ART_H }}>
            <Svg width={ART_W} height={ART_H} style={StyleSheet.absoluteFill}>
              {[...BANKS.map((b) => ({ x: b.x * ART_W, y: b.y * ART_H })), { x: cx, y: 46 }].map(
                (p, i) => (
                  <Line
                    key={i}
                    x1={cx}
                    y1={cy}
                    x2={p.x}
                    y2={p.y}
                    stroke="rgba(255,255,255,0.45)"
                    strokeWidth={2.5}
                    strokeDasharray="6 8"
                  />
                ),
              )}
            </Svg>
            <Coin size={70} style={{ left: cx - 35, top: 10 }} />
            {BANKS.map((b) => (
              <View
                key={b.label}
                style={[
                  styles.bank,
                  {
                    left: b.x * ART_W - 40,
                    top: b.y * ART_H - 40,
                    transform: [{ rotate: `${b.r}deg` }],
                  },
                ]}
              >
                <LabelTile label={b.label} tone={b.tone} size={80} />
              </View>
            ))}
            <View
              style={[
                styles.hub,
                {
                  left: cx - 70,
                  top: cy - 70,
                  backgroundColor: palette.surface,
                  shadowColor: palette.shadow,
                },
              ]}
            >
              <Wordmark size={40} color={palette.link} />
            </View>
          </View>
        </View>
      }
      footer={
        <Footer>
          <Button title="Connect securely" onPress={() => router.push('/onboarding/link')} />
          <TextButton
            title="I'll do this later"
            color={palette.muted}
            onPress={() => router.push('/onboarding/notifications')}
          />
        </Footer>
      }
    >
      <Text variant="display">Connect your cards</Text>
      <Text variant="body" muted style={{ fontSize: 17, lineHeight: 25, marginTop: space.sm }}>
        Otto reads your balances and purchases to find credits, points and better card choices.
      </Text>
      <View style={{ gap: space.lg, marginTop: space.xl }}>
        {PROMISES.map((p) => (
          <View key={p.text} style={styles.promise}>
            <IconTile icon={p.icon} tone={p.tone} size={48} />
            <Text variant="row" weight="bold" style={{ flex: 1, fontSize: 17 }}>
              {p.text}
            </Text>
          </View>
        ))}
      </View>
    </MomentScreen>
  );
}

const styles = StyleSheet.create({
  artWrap: { flex: 1, alignItems: 'center' },
  bank: { position: 'absolute' },
  hub: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
  },
  promise: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
});
