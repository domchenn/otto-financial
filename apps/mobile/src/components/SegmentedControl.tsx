import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from './Text';
import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type Option<T extends string> = { value: T; label: string };

/** Pill-shaped segmented control on the raised surface; the selected segment is white. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  stretch,
  style,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessibility label for the whole control. */
  label: string;
  /** Fill the available width with equal segments. */
  stretch?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { palette } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={label}
      style={[styles.track, { backgroundColor: palette.raised }, stretch && styles.stretch, style]}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityLabel={o.label}
            accessibilityState={{ selected: on }}
            onPress={() => {
              if (on) return;
              void Haptics.selectionAsync();
              onChange(o.value);
            }}
            style={[
              styles.segment,
              stretch && styles.segmentStretch,
              on && { backgroundColor: palette.surface },
            ]}
          >
            <Text
              variant="row"
              weight={on ? 'bold' : 'semibold'}
              color={on ? palette.ink : palette.muted}
              center
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: radius.pill, padding: 5, alignSelf: 'flex-start' },
  stretch: { alignSelf: 'stretch' },
  segment: {
    paddingHorizontal: 20,
    height: 42,
    borderRadius: radius.pill,
    justifyContent: 'center',
  },
  segmentStretch: { flex: 1, paddingHorizontal: 8 },
});
