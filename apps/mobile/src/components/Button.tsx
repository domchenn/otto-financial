import * as Haptics from 'expo-haptics';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type { Icon } from './icons';
import { Text } from './Text';
import { radius, size } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'apple' | 'danger';

type Props = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** Small pill used inside cards ("Show me where", "Later"). */
  small?: boolean;
  icon?: Icon;
  iconColor?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Indigo means "do this": one primary per screen. Black/white is reserved for Sign in with
 * Apple. Solid fills only, never a gradient.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  small,
  icon: IconComponent,
  iconColor,
  disabled,
  loading,
  style,
}: Props) {
  const { palette } = useTheme();
  const inactive = disabled || loading;

  const fills: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    primary: inactive
      ? { bg: palette.actionDisabled, fg: palette.actionDisabledText }
      : { bg: palette.action, fg: palette.actionText },
    secondary: { bg: palette.raised, fg: palette.ink },
    outline: { bg: palette.surface, fg: palette.ink, border: palette.hairline },
    apple: { bg: palette.apple, fg: palette.appleText },
    danger: inactive
      ? { bg: palette.tones.alert.track, fg: palette.surface }
      : { bg: palette.alert, fg: palette.surface },
  };
  const fill = fills[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          height: small ? size.smallButton : size.button,
          paddingHorizontal: small ? 18 : 24,
          alignSelf: small ? 'flex-start' : 'stretch',
          backgroundColor: fill.bg,
          borderColor: fill.border ?? fill.bg,
          opacity: pressed
            ? 0.88
            : variant !== 'primary' && variant !== 'danger' && inactive
              ? 0.5
              : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fill.fg} />
      ) : (
        <View style={styles.content}>
          {IconComponent ? <IconComponent color={iconColor ?? fill.fg} size={20} /> : null}
          <Text variant="row" color={fill.fg} weight="bold" style={{ fontSize: small ? 15 : 17 }}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/** Text link: indigo, no fill. */
export function TextButton({
  title,
  onPress,
  color,
  style,
}: {
  title: string;
  onPress: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        { opacity: pressed ? 0.6 : 1, minHeight: size.touch, justifyContent: 'center' },
        style,
      ]}
    >
      <Text variant="row" weight="bold" color={color ?? palette.link} center>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
