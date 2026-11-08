import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Button } from '@/components/Button';
import { MinusIcon, PlusIcon, type Icon } from '@/components/icons';
import { Footer, StepScreen } from '@/components/layouts';
import { OptionRow } from '@/components/selection';
import { Card } from '@/components/Surface';
import { Text } from '@/components/Text';
import { formatCents } from '@/lib/money';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type Style = 'weekly' | 'monthly' | 'none';
const STEP_CENTS = 2500;

export default function Budget() {
  const { palette } = useTheme();
  const [style, setStyle] = useState<Style>('weekly');
  const [limits, setLimits] = useState({ weekly: 50000, monthly: 200000 });
  const mint = palette.tones.mint;
  const key = style === 'monthly' ? 'monthly' : 'weekly';
  const step = style === 'monthly' ? STEP_CENTS * 4 : STEP_CENTS;
  const bump = (delta: number) =>
    setLimits((l) => ({ ...l, [key]: Math.max(step, l[key] + delta) }));

  return (
    <StepScreen
      step={{ index: 3, total: 5 }}
      heading="How do you like to budget?"
      subheading="This is for everyday spending, not rent or bills."
      footer={
        <Footer>
          <Button title="Continue" onPress={() => router.push('/onboarding/check-in')} />
        </Footer>
      }
    >
      <View style={{ gap: space.md, marginTop: space.xl }}>
        <OptionRow
          title="A weekly limit"
          subtitle="See what is left each week"
          selected={style === 'weekly'}
          onPress={() => setStyle('weekly')}
        />
        <OptionRow
          title="A monthly limit"
          subtitle="One number for the whole month"
          selected={style === 'monthly'}
          onPress={() => setStyle('monthly')}
        />
        <OptionRow
          title="Just show me what I spend"
          subtitle="No limits, just the picture"
          selected={style === 'none'}
          onPress={() => setStyle('none')}
        />
      </View>
      {style !== 'none' ? (
        <Card tone="mint" style={{ marginTop: space.xl }}>
          <Text variant="row" weight="bold" color={mint.text}>
            Your {style === 'weekly' ? 'weekly' : 'monthly'} limit
          </Text>
          <View style={styles.stepper}>
            <Round icon={MinusIcon} label="Decrease" onPress={() => bump(-step)} />
            <Text variant="hero" tabular style={{ fontSize: 52, lineHeight: 60 }}>
              {formatCents(limits[key])}
            </Text>
            <Round icon={PlusIcon} label="Increase" onPress={() => bump(step)} />
          </View>
          <Text variant="body" color={mint.text} center>
            A rough number is fine. Otto will suggest a better one after a few weeks.
          </Text>
        </Card>
      ) : null}
    </StepScreen>
  );
}

function Round({ icon: I, label, onPress }: { icon: Icon; label: string; onPress: () => void }) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.round,
        { backgroundColor: palette.surface, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <I color={palette.tones.mint.text} size={26} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: space.lg,
  },
  round: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
