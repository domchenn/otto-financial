import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { OttoAvatar } from './otto';
import { Text } from './Text';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** A lock-screen style notification card. Floating, so it gets a shadow. */
export function NotificationPreview({
  title,
  body,
  time,
  dimmed,
  style,
}: {
  title: string;
  body: string;
  time?: string;
  dimmed?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          shadowColor: palette.shadow,
          opacity: dimmed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <OttoAvatar size={46} square />
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Text variant="row" weight="bold" style={{ flex: 1 }} numberOfLines={1}>
            {title}
          </Text>
          {time ? (
            <Text variant="caption" weight="medium" muted>
              {time}
            </Text>
          ) : null}
        </View>
        <Text variant="body" muted={dimmed} style={{ fontSize: 16, lineHeight: 22 }}>
          {body}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.lg,
    paddingHorizontal: space.xl,
    borderRadius: radius.card + 4,
    alignItems: 'flex-start',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
