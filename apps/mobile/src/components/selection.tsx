import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { CheckIcon } from './icons';
import { Text } from './Text';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export function Checkbox({ checked, size = 26 }: { checked: boolean; size?: number }) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        styles.check,
        {
          width: size,
          height: size,
          backgroundColor: checked ? palette.action : palette.surface,
          borderColor: checked ? palette.action : palette.hairline,
        },
      ]}
    >
      {checked ? <CheckIcon color={palette.actionText} size={size * 0.62} /> : null}
    </View>
  );
}

export function Radio({ checked }: { checked: boolean }) {
  const { palette } = useTheme();
  return (
    <View style={[styles.radio, { borderColor: checked ? palette.action : palette.hairline }]}>
      {checked ? <View style={[styles.radioDot, { backgroundColor: palette.action }]} /> : null}
    </View>
  );
}

type OptionProps = {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  /** Checkbox for pick-many, radio for pick-one. */
  kind?: 'radio' | 'check';
  /** Leading icon tile. */
  leading?: ReactNode;
  /** Put the control on the right instead of the left. */
  controlEnd?: boolean;
};

/** Selectable white row. Selected = indigo outline. */
export function OptionRow({
  title,
  subtitle,
  selected,
  onPress,
  kind = 'radio',
  leading,
  controlEnd,
}: OptionProps) {
  const { palette } = useTheme();
  const control = kind === 'check' ? <Checkbox checked={selected} /> : <Radio checked={selected} />;
  const end = controlEnd ?? leading !== undefined;
  return (
    <Pressable
      accessibilityRole={kind === 'check' ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={title}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={[
        styles.option,
        {
          backgroundColor: palette.surface,
          borderColor: selected ? palette.action : palette.surface,
        },
      ]}
    >
      {!end ? control : null}
      {leading}
      <View style={{ flex: 1 }}>
        <Text variant="row" style={{ fontSize: 17 }} weight="bold">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="body" muted>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {end ? control : null}
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? palette.action : palette.surface,
          borderColor: selected ? palette.action : palette.hairline,
        },
      ]}
    >
      <Text
        variant="row"
        weight="semibold"
        color={selected ? palette.actionText : palette.ink}
        style={{ fontSize: 17 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Static tag, e.g. "Dining · 4x" or a merchant name. */
export function Tag({ label, onSurface }: { label: string; onSurface?: boolean }) {
  const { palette } = useTheme();
  return (
    <View style={[styles.tag, { backgroundColor: onSurface ? palette.raised : palette.surface }]}>
      <Text variant="row" weight="semibold" style={{ fontSize: 15 }}>
        {label}
      </Text>
    </View>
  );
}

export function Toggle({
  value,
  onValueChange,
  label,
  disabled,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <Switch
      accessibilityLabel={label}
      value={value}
      disabled={disabled}
      onValueChange={(v) => {
        void Haptics.selectionAsync();
        onValueChange(v);
      }}
      trackColor={{ true: palette.action, false: palette.hairline }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={palette.hairline}
    />
  );
}

export function ChipWrap({ children }: { children: ReactNode }) {
  return <View style={styles.wrap}>{children}</View>;
}

const styles = StyleSheet.create({
  check: { borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 14, height: 14, borderRadius: 7 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingHorizontal: space.xl,
    paddingVertical: 18,
    borderRadius: radius.card,
    borderWidth: 2,
  },
  chip: {
    paddingHorizontal: 20,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  tag: { paddingHorizontal: 16, height: 36, borderRadius: radius.pill, justifyContent: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
