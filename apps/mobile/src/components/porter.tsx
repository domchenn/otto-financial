import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';

import { Button } from './Button';
import { Card } from './Surface';
import { Text } from './Text';
import { fonts, radius, space, type ToneName } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** The porter wordmark: Plus Jakarta Sans ExtraBold, always lowercase, −3.5% tracking (−0.7 at 20). */
export function Wordmark({ size = 22, color }: { size?: number; color?: string }) {
  const { palette } = useTheme();
  return (
    <Text
      accessibilityLabel="Porter"
      style={{
        fontFamily: fonts.extrabold,
        fontSize: size,
        lineHeight: size * 1.15,
        letterSpacing: -size * 0.035,
        color: color ?? palette.ink,
      }}
    >
      porter
    </Text>
  );
}

/** The app-icon mark: a white lowercase p on sage, as a circle or rounded square. */
export function PorterAvatar({ size = 40, square }: { size?: number; square?: boolean }) {
  const { palette } = useTheme();
  return (
    <View
      accessibilityLabel="Porter"
      style={[
        styles.center,
        {
          width: size,
          height: size,
          borderRadius: square ? size * 0.24 : size / 2,
          backgroundColor: palette.accent,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: fonts.extrabold,
          fontSize: size * 0.56,
          lineHeight: size * 0.7,
          color: palette.onAccent,
        }}
      >
        p
      </Text>
    </View>
  );
}

/**
 * The sage dot that marks live AI content (the handoff uses it instead of a sparkle).
 * It pulses gently unless the user has Reduce Motion on.
 */
export function LiveDot({ size = 8, pulse = true }: { size?: number; pulse?: boolean }) {
  const { palette } = useTheme();
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!pulse) return;
    let loop: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced || cancelled) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.35, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [opacity, pulse]);

  return (
    <Animated.View
      importantForAccessibility="no"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: palette.accent,
        opacity,
      }}
    />
  );
}

/** "● TODAY" / "● PORTER": the live dot and a sage caps label. Pass sentence case. */
export function LiveLabel({ children, pulse }: { children: string; pulse?: boolean }) {
  const { palette } = useTheme();
  return (
    <View style={styles.liveLabel}>
      <LiveDot pulse={pulse} />
      <Text variant="label" color={palette.link} accessibilityRole="header">
        {children}
      </Text>
    </View>
  );
}

/** One friendly line from Porter after an answer. */
export function PorterBubble({ children }: { children: ReactNode }) {
  const { palette } = useTheme();
  return (
    <View style={styles.bubbleRow}>
      <PorterAvatar size={40} />
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

/** Proactive nudge card: "● PORTER NOTICED" + a sentence + small actions. */
export function PorterNoticed({
  children,
  primary,
  secondary,
}: {
  children: string;
  primary?: { title: string; onPress: () => void };
  secondary?: { title: string; onPress: () => void };
}) {
  return (
    <Card>
      <LiveLabel pulse={false}>Porter noticed</LiveLabel>
      <Text variant="body" style={styles.noticedBody}>
        {children}
      </Text>
      {primary || secondary ? (
        <View style={styles.actions}>
          {primary ? <Button small title={primary.title} onPress={primary.onPress} /> : null}
          {secondary ? (
            <Button small variant="outline" title={secondary.title} onPress={secondary.onPress} />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

/** Tinted insight banner (live dot or wordmark + one sentence). */
export function Insight({
  children,
  tone = 'sage',
  mark = 'dot',
}: {
  children: ReactNode;
  tone?: ToneName;
  mark?: 'dot' | 'wordmark' | 'none';
}) {
  const { palette } = useTheme();
  const t = palette.tones[tone];
  return (
    <Card tone={tone} style={styles.insight}>
      {mark === 'dot' ? (
        <View style={styles.insightDot}>
          <LiveDot pulse={false} />
        </View>
      ) : null}
      {mark === 'wordmark' ? <Wordmark size={18} color={t.text} /> : null}
      <Text variant="body" color={t.text} style={styles.insightText}>
        {children}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  liveLabel: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
  bubble: {
    flex: 1,
    borderRadius: radius.card,
    borderBottomLeftRadius: 6,
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
  },
  bubbleText: { fontSize: 17, lineHeight: 25 },
  noticedBody: { fontSize: 17, lineHeight: 24, marginTop: space.md },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
  insight: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'flex-start',
    paddingVertical: space.lg,
  },
  insightDot: { paddingTop: 8 },
  insightText: { flex: 1, fontSize: 17, lineHeight: 25 },
});
