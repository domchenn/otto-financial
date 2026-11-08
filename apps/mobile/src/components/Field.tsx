import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from './Text';
import { radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Labeled text input. Indigo outline on focus, alert outline + message on error. */
export function Field({
  label,
  hint,
  error,
  style,
  ...input
}: TextInputProps & { label?: string; hint?: string; error?: string | null }) {
  const { palette } = useTheme();
  const [focused, setFocused] = useState(false);
  const border = error ? palette.alert : focused ? palette.action : palette.hairline;
  return (
    <View style={{ flex: 1 }}>
      {label ? (
        <Text variant="row" weight="bold" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={palette.faint}
        {...input}
        onFocus={(e) => {
          setFocused(true);
          input.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          input.onBlur?.(e);
        }}
        style={[
          styles.input,
          typeScale.body,
          {
            color: palette.ink,
            backgroundColor: error ? palette.tones.alert.bg : palette.surface,
            borderColor: border,
            fontSize: 18,
          },
          style,
        ]}
      />
      {error ? (
        <Text variant="body" color={palette.alert} style={styles.hint}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="body" muted style={styles.hint}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: space.sm },
  input: { height: 60, borderRadius: radius.input, borderWidth: 2, paddingHorizontal: space.xl },
  hint: { marginTop: space.sm },
});
