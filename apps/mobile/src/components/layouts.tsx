import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from './IconButton';
import { Text } from './Text';
import { radius, screen, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const TAB_BAR_ROOM = 120;

function useInsets() {
  const insets = useSafeAreaInsets();
  return {
    top: Math.max(insets.top + space.sm, screen.top - 8),
    bottom: Math.max(insets.bottom, space.lg) + space.lg,
  };
}

/** A tab root: scrolling content on the ground, with room for the floating tab bar. */
export function TabScreen({ children }: { children: ReactNode }) {
  const { palette } = useTheme();
  const pad = useInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.ground }}
      contentContainerStyle={{
        paddingTop: pad.top,
        paddingBottom: pad.bottom + TAB_BAR_ROOM,
        paddingHorizontal: screen.side,
      }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

/** Buttons pinned to the bottom of a screen. The first should be the one primary. */
export function Footer({ children }: { children: ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
}

type StepHeaderProps = {
  onBack?: () => void;
  /** Show the indigo progress segments. */
  step?: { index: number; total: number };
  /** Right side: a text action ("Skip") or nothing. Defaults to "n of total" when stepped. */
  trailing?: { title: string; onPress: () => void };
  /** Centered title for detail screens. */
  title?: string;
  right?: ReactNode;
  hideBack?: boolean;
};

export function StepHeader({ onBack, step, trailing, title, right, hideBack }: StepHeaderProps) {
  const { palette } = useTheme();
  return (
    <View style={styles.header}>
      {hideBack ? <View style={styles.headerSide} /> : <BackButton onPress={onBack} />}
      {step ? (
        <View style={styles.segments}>
          {Array.from({ length: step.total }, (_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                { backgroundColor: i <= step.index ? palette.action : palette.hairline },
              ]}
            />
          ))}
        </View>
      ) : title ? (
        <Text variant="row" weight="bold" center style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {trailing ? (
        <Pressable onPress={trailing.onPress} hitSlop={12} accessibilityRole="button">
          <Text variant="row" weight="bold" muted>
            {trailing.title}
          </Text>
        </Pressable>
      ) : step ? (
        <Text variant="row" weight="bold" muted tabular>
          {step.index + 1} of {step.total}
        </Text>
      ) : (
        (right ?? <View style={styles.headerSide} />)
      )}
    </View>
  );
}

type StepScreenProps = StepHeaderProps & {
  /** Large title + one line of help. */
  heading?: string;
  subheading?: ReactNode;
  eyebrow?: string;
  children?: ReactNode;
  footer?: ReactNode;
  /** Wrap in a keyboard-avoiding view (forms). */
  keyboard?: boolean;
  scroll?: boolean;
  hideHeader?: boolean;
};

/**
 * Template B, "Step": off-white ground, step header, title + one line of help, content,
 * one primary button pinned to the bottom. For questions, forms, details and settings.
 */
export function StepScreen({
  heading,
  subheading,
  eyebrow,
  children,
  footer,
  keyboard,
  scroll = true,
  hideHeader,
  ...header
}: StepScreenProps) {
  const { palette } = useTheme();
  const pad = useInsets();
  const content = (
    <>
      {!hideHeader ? <StepHeader {...header} /> : null}
      {eyebrow ? (
        <Text variant="row" weight="bold" muted style={{ marginTop: space.xl }}>
          {eyebrow}
        </Text>
      ) : null}
      {heading ? (
        <Text variant="display" style={{ marginTop: eyebrow ? space.xs : space.xl }}>
          {heading}
        </Text>
      ) : null}
      {subheading ? (
        typeof subheading === 'string' ? (
          <Text variant="body" muted style={styles.sub}>
            {subheading}
          </Text>
        ) : (
          subheading
        )
      ) : null}
      {children}
    </>
  );
  const body = (
    <View style={{ flex: 1, backgroundColor: palette.ground, paddingTop: pad.top }}>
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: screen.side, paddingBottom: space.xl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: screen.side }}>{content}</View>
      )}
      {footer ? (
        <View style={{ paddingHorizontal: screen.side, paddingBottom: pad.bottom }}>{footer}</View>
      ) : null}
    </View>
  );
  if (!keyboard) return body;
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {body}
    </KeyboardAvoidingView>
  );
}

/**
 * Template A, "Moment": illustration on top, a sheet with 32px rounded corners sliding over
 * it. For welcome, sign-in, big reveals and success screens.
 */
export function MomentScreen({
  art,
  artHeight,
  onIndigo = true,
  onBack,
  children,
  footer,
}: {
  art: ReactNode;
  artHeight: number;
  /** Indigo hero (true) or the off-white ground (false). */
  onIndigo?: boolean;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { palette } = useTheme();
  const pad = useInsets();
  return (
    <View style={{ flex: 1, backgroundColor: onIndigo ? palette.hero : palette.ground }}>
      <View style={{ height: artHeight + pad.top, paddingTop: pad.top }}>
        {art}
        {onBack ? (
          <View style={[styles.momentBack, { top: pad.top }]}>
            <BackButton onPress={onBack} translucent={onIndigo} />
          </View>
        ) : null}
      </View>
      <View style={[styles.sheet, { backgroundColor: palette.surface, paddingBottom: pad.bottom }]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: screen.side,
            paddingTop: space.xxl,
            paddingBottom: space.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
        {footer ? <View style={{ paddingHorizontal: screen.side }}>{footer}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { gap: space.md, paddingTop: space.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.lg, minHeight: 52 },
  headerSide: { width: 52 },
  headerTitle: { flex: 1, fontSize: 18 },
  segments: { flex: 1, flexDirection: 'row', gap: 8 },
  segment: { flex: 1, height: 6, borderRadius: 3 },
  sub: { fontSize: 17, lineHeight: 24, marginTop: space.sm },
  sheet: {
    flex: 1,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    marginTop: -space.xxl,
  },
  momentBack: { position: 'absolute', left: screen.side },
});
