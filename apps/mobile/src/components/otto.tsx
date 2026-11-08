import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from './Button';
import { SparkleIcon } from './icons';
import { Card } from './Surface';
import { Text } from './Text';
import { fonts, radius, space, type ToneName } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** The otto wordmark: Plus Jakarta Sans ExtraBold, always lowercase, −6% tracking. */
export function Wordmark({ size = 22, color }: { size?: number; color?: string }) {
  const { palette } = useTheme();
  return (
    <Text
      accessibilityLabel="Otto"
      style={{
        fontFamily: fonts.extrabold,
        fontSize: size,
        lineHeight: size * 1.15,
        letterSpacing: -size * 0.06,
        color: color ?? palette.ink,
      }}
    >
      otto
    </Text>
  );
}

/** Indigo circle (or rounded square) holding the white wordmark. */
export function OttoAvatar({ size = 40, square }: { size?: number; square?: boolean }) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        styles.center,
        {
          width: size,
          height: size,
          borderRadius: square ? size * 0.24 : size / 2,
          backgroundColor: palette.action,
        },
      ]}
    >
      <Wordmark size={size * 0.34} color={palette.actionText} />
    </View>
  );
}

/** One friendly line from Otto after an answer. */
export function OttoBubble({ children }: { children: ReactNode }) {
  const { palette } = useTheme();
  return (
    <View style={styles.bubbleRow}>
      <OttoAvatar size={40} />
      <View style={[styles.bubble, { backgroundColor: palette.surface }]}>
        {typeof children === 'string' ? (
          <Text variant="body" style={styles.bubbleText}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

/** Proactive nudge card: "Otto noticed" + a sentence + small actions. */
export function OttoNoticed({
  children,
  primary,
  secondary,
}: {
  children: string;
  primary?: { title: string; onPress: () => void };
  secondary?: { title: string; onPress: () => void };
}) {
  const { palette } = useTheme();
  return (
    <Card>
      <View style={styles.noticedHead}>
        <SparkleIcon color={palette.link} size={18} />
        <Text variant="row" weight="bold" color={palette.link}>
          Otto noticed
        </Text>
      </View>
      <Text variant="body" style={styles.noticedBody}>
        {children}
      </Text>
      {primary || secondary ? (
        <View style={styles.actions}>
          {primary ? <Button small title={primary.title} onPress={primary.onPress} /> : null}
          {secondary ? (
            <Button small variant="secondary" title={secondary.title} onPress={secondary.onPress} />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

/** Tinted insight banner (sparkle or wordmark + one sentence). */
export function Insight({
  children,
  tone = 'indigo',
  mark = 'sparkle',
}: {
  children: ReactNode;
  tone?: ToneName;
  mark?: 'sparkle' | 'wordmark' | 'none';
}) {
  const { palette } = useTheme();
  const t = palette.tones[tone];
  return (
    <Card tone={tone} style={styles.insight}>
      {mark === 'sparkle' ? <SparkleIcon color={t.text} size={18} /> : null}
      {mark === 'wordmark' ? <Wordmark size={18} color={t.text} /> : null}
      <Text variant="body" color={t.text} style={styles.insightText}>
        {children}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
  bubble: {
    flex: 1,
    borderRadius: radius.card,
    borderBottomLeftRadius: 6,
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
  },
  bubbleText: { fontSize: 17, lineHeight: 25 },
  noticedHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  noticedBody: { fontSize: 18, lineHeight: 26, marginTop: space.md },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
  insight: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'flex-start',
    paddingVertical: space.lg,
  },
  insightText: { flex: 1, fontSize: 17, lineHeight: 25 },
});
