import { Pressable, StyleSheet, View } from 'react-native';

import { LiveLabel } from './porter';
import { Text } from './Text';
import type { DailyBrief } from '@/lib/brief';
import { radius, size, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Fits the label row plus exactly three lines of 16/22 text. */
export const SUMMARY_SLOT_HEIGHT = 122;

const timeLabel = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

/**
 * The daily brief on Home (handoff §4.1). Fixed height that never changes: the text clamps
 * to three lines, and "Read all" appears when there's more. A skeleton shows while loading.
 */
export function SummarySlot({
  brief,
  loading,
  updatedAt,
  onReadAll,
}: {
  brief?: DailyBrief;
  loading?: boolean;
  updatedAt?: Date;
  onReadAll?: () => void;
}) {
  const { palette } = useTheme();
  const hasMore = Boolean(brief?.detail) && onReadAll;

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel="Today's summary"
      style={[styles.slot, { backgroundColor: palette.surface }]}
    >
      <View style={styles.head}>
        <LiveLabel>Today</LiveLabel>
        <View style={styles.headRight}>
          {updatedAt && !loading ? (
            <Text variant="small" muted>
              {timeLabel.format(updatedAt).toLowerCase()}
            </Text>
          ) : null}
          {hasMore ? (
            <Pressable
              accessibilityRole="button"
              onPress={onReadAll}
              hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }}
              style={styles.readAll}
            >
              <Text variant="small" weight="bold" color={palette.link}>
                Read all
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      {loading || !brief ? (
        <View accessibilityLabel="Loading today's summary" style={styles.skeleton}>
          {[1, 0.92, 0.6].map((w, i) => (
            <View
              key={i}
              style={[styles.bar, { width: `${w * 100}%`, backgroundColor: palette.raised }]}
            />
          ))}
        </View>
      ) : (
        <Text variant="body" numberOfLines={3} style={styles.text}>
          {brief.summary}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    height: SUMMARY_SLOT_HEIGHT,
    borderRadius: radius.card,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: space.sm,
    overflow: 'hidden',
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 16 },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  readAll: { minHeight: 16, justifyContent: 'center', minWidth: size.touch / 2 },
  text: { fontSize: 16, lineHeight: 22, letterSpacing: -0.2 },
  skeleton: { gap: 10, paddingTop: 4 },
  bar: { height: 12, borderRadius: 6 },
});
