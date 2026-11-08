import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BackIcon, type Icon } from './icons';
import { useTheme } from '@/theme/useTheme';

/** Round surface button holding a line icon (back, bell, plus, more). */
export function IconButton({
  icon: I,
  label,
  onPress,
  badge,
  size = 52,
  translucent,
  children,
}: {
  icon?: Icon;
  label: string;
  onPress?: () => void;
  badge?: boolean;
  size?: number;
  /** For use on the indigo hero. */
  translucent?: boolean;
  children?: ReactNode;
}) {
  const { palette } = useTheme();
  const fg = translucent ? '#FFFFFF' : palette.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.btn,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: translucent ? 'rgba(255,255,255,0.18)' : palette.surface,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {I ? <I color={fg} size={size * 0.44} /> : children}
      {badge ? (
        <View
          style={[styles.badge, { backgroundColor: palette.alert, borderColor: palette.surface }]}
        />
      ) : null}
    </Pressable>
  );
}

export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export function BackButton({
  onPress,
  translucent,
}: {
  onPress?: () => void;
  translucent?: boolean;
}) {
  return (
    <IconButton
      icon={BackIcon}
      label="Back"
      onPress={onPress ?? goBack}
      translucent={translucent}
    />
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 12,
    right: 13,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
  },
});
