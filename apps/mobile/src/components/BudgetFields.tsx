import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { MinusIcon, PlusIcon, type Icon } from '@/components/icons';
import { Chip, OptionRow } from '@/components/selection';
import { Card } from '@/components/Surface';
import { Text } from '@/components/Text';
import type { BudgetDraft } from '@/lib/budget';
import { categoryName } from '@/lib/finance';
import { formatCents } from '@/lib/money';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const STEP_CENTS = 2500;

type Props = {
  value: BudgetDraft;
  onChange: (next: BudgetDraft) => void;
  /** Categories the user may leave out; shows the "Don't count" chips when given. */
  excludable?: string[];
};

/** Budget style, the limit stepper and (in Settings) categories to leave out. */
export function BudgetFields({ value, onChange, excludable }: Props) {
  const { palette } = useTheme();
  const mint = palette.tones.mint;
  const monthly = value.style === 'monthly';
  const cents = monthly ? value.monthlyCents : value.weeklyCents;
  const step = monthly ? STEP_CENTS * 4 : STEP_CENTS;

  const bump = (delta: number) => {
    const next = Math.max(step, cents + delta);
    onChange(monthly ? { ...value, monthlyCents: next } : { ...value, weeklyCents: next });
  };
  const toggle = (category: string) =>
    onChange({
      ...value,
      excluded: value.excluded.includes(category)
        ? value.excluded.filter((c) => c !== category)
        : [...value.excluded, category],
    });

  return (
    <>
      <View style={{ gap: space.md, marginTop: space.xl }}>
        <OptionRow
          title="A weekly limit"
          subtitle="See what is left each week"
          selected={value.style === 'weekly'}
          onPress={() => onChange({ ...value, style: 'weekly' })}
        />
        <OptionRow
          title="A monthly limit"
          subtitle="One number for the whole month"
          selected={value.style === 'monthly'}
          onPress={() => onChange({ ...value, style: 'monthly' })}
        />
        <OptionRow
          title="Just show me what I spend"
          subtitle="No limits, just the picture"
          selected={value.style === 'none'}
          onPress={() => onChange({ ...value, style: 'none' })}
        />
      </View>

      {value.style !== 'none' ? (
        <Card tone="mint" style={{ marginTop: space.xl }}>
          <Text variant="row" weight="bold" color={mint.text}>
            Your {monthly ? 'monthly' : 'weekly'} limit
          </Text>
          <View style={styles.stepper}>
            <Round icon={MinusIcon} label="Decrease" onPress={() => bump(-step)} />
            <Text variant="hero" tabular style={{ fontSize: 52, lineHeight: 60 }}>
              {formatCents(cents)}
            </Text>
            <Round icon={PlusIcon} label="Increase" onPress={() => bump(step)} />
          </View>
          <Text variant="body" color={mint.text} center>
            A rough number is fine. Porter will suggest a better one after a few weeks.
          </Text>
        </Card>
      ) : null}

      {excludable && excludable.length > 0 ? (
        <View style={{ marginTop: space.xl }}>
          <Text variant="row" weight="bold" style={{ fontSize: 18 }}>
            Don&apos;t count
          </Text>
          <Text variant="body" muted style={{ marginTop: space.xs }}>
            Rent, card payments and transfers never count. Pick anything else to leave out.
          </Text>
          <View style={styles.chips}>
            {excludable.map((c) => (
              <Chip
                key={c}
                label={categoryName(c)}
                selected={value.excluded.includes(c)}
                onPress={() => toggle(c)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </>
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
});
