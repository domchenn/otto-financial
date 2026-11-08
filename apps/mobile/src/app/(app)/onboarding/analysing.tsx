import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Button } from '@/components/Button';
import { CheckIcon } from '@/components/icons';
import { Footer, StepScreen } from '@/components/layouts';
import { Wordmark } from '@/components/otto';
import { Card, Stack } from '@/components/Surface';
import { Text } from '@/components/Text';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const STEPS = [
  'Found 6 cards from Amex, Chase and Bilt',
  'Read 12 months of purchases',
  'Checking your card credits and perks',
  'Matching your spending to the best card',
];

const RING = 220;
const STROKE = 22;

/** Simulated first sync. The real one is driven by the sync job status (M1). */
export default function Analysing() {
  const { palette } = useTheme();
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (done >= STEPS.length) return;
    const t = setTimeout(() => setDone((d) => d + 1), 900);
    return () => clearTimeout(t);
  }, [done]);

  const r = (RING - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const progress = Math.min(1, (done + 0.5) / STEPS.length);

  return (
    <StepScreen
      hideHeader
      footer={
        <Footer>
          <Button
            title="See what Otto found"
            disabled={done < STEPS.length}
            onPress={() => router.replace('/onboarding/reveal')}
          />
        </Footer>
      }
    >
      <View style={styles.ring}>
        <Svg width={RING} height={RING} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx={RING / 2}
            cy={RING / 2}
            r={r}
            stroke={palette.tones.indigo.bg}
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={RING / 2}
            cy={RING / 2}
            r={r}
            stroke={palette.action}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c * progress} ${c}`}
          />
        </Svg>
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.center}>
            <Wordmark size={40} color={palette.link} />
          </View>
        </View>
      </View>
      <Text variant="display" center style={{ marginTop: space.xl }}>
        {done < STEPS.length ? 'Getting to know your money…' : 'All set.'}
      </Text>
      <Text variant="body" muted center style={{ marginTop: space.sm, fontSize: 17 }}>
        This usually takes under a minute.
      </Text>
      <Card style={{ marginTop: space.xl, paddingVertical: space.sm }}>
        <Stack>
          {STEPS.map((s, i) => {
            const state = i < done ? 'done' : i === done ? 'active' : 'todo';
            return (
              <View key={s} style={styles.step}>
                {state === 'done' ? (
                  <View style={[styles.dot, { backgroundColor: palette.moneyIn }]}>
                    <CheckIcon color="#FFFFFF" size={18} />
                  </View>
                ) : state === 'active' ? (
                  <View style={styles.dot}>
                    <ActivityIndicator color={palette.action} />
                  </View>
                ) : (
                  <View style={[styles.dot, styles.todo, { borderColor: palette.hairline }]} />
                )}
                <Text
                  variant="row"
                  weight="bold"
                  color={state === 'todo' ? palette.faint : palette.ink}
                  style={{ flex: 1, fontSize: 17 }}
                >
                  {s}
                </Text>
              </View>
            );
          })}
        </Stack>
      </Card>
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  ring: { width: RING, height: RING, alignSelf: 'center', marginTop: space.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingVertical: space.lg },
  dot: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  todo: { borderWidth: 2.5 },
});
