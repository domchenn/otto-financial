import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AskInput } from '@/components/AskInput';
import { PlanStep } from '@/components/PlanStep';
import { LiveLabel } from '@/components/porter';
import { Chip } from '@/components/selection';
import { Text } from '@/components/Text';
import {
  answerFor,
  ASK_QUESTIONS,
  isAskTopic,
  suggestionsFor,
  type AskAnswer,
  type AskContext,
  type AskTopic,
  type FollowUp,
} from '@/lib/ask';
import { getCard } from '@/lib/sample';
import { radius, screen, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type Turn = { id: number; question: string; topic: AskTopic | 'unknown' };

/** Share of the window the sheet takes (the handoff's 660 of 844pt). */
const SHEET_SHARE = 0.78;
/** Drag the handle down this far, or flick it, to close. */
const CLOSE_DRAG = 120;

const CONTEXTS = new Set(['index', 'accounts', 'spending', 'benefits']);

/** A typed question matches a canned topic only when it's that exact question. */
function topicFor(text: string): AskTopic | 'unknown' {
  const match = (Object.keys(ASK_QUESTIONS) as AskTopic[]).find(
    (t) => ASK_QUESTIONS[t].toLowerCase() === text.trim().toLowerCase(),
  );
  return match ?? 'unknown';
}

/**
 * Ask Porter (handoff §4.7): a bottom sheet over the screen it was opened from, which blurs
 * and dims behind it. Tap outside, or drag the handle down, to close. The conversation is
 * question → plain answer → plan steps → Keep going chips, with the field at the bottom.
 */
export default function AskSheet() {
  const { palette, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const params = useLocalSearchParams<{ from?: string; q?: string }>();
  const from = (CONTEXTS.has(params.from ?? '') ? params.from : undefined) as AskContext;
  const sheetHeight = Math.min(height * SHEET_SHARE, height - insets.top - space.lg);

  const [offset] = useState(() => new Animated.Value(sheetHeight));
  const scroller = useRef<ScrollViewInstance>(null);
  const nextId = useRef(1);
  const [turns, setTurns] = useState<Turn[]>(() =>
    isAskTopic(params.q) ? [{ id: 0, question: ASK_QUESTIONS[params.q], topic: params.q }] : [],
  );

  useEffect(() => {
    Animated.spring(offset, {
      toValue: 0,
      damping: 22,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
  }, [offset]);

  // Built once: the drag handler and close share a guard so a double tap can't go back twice.
  const [{ close, drag }] = useState(() => {
    let closing = false;
    const closeSheet = (then?: () => void) => {
      if (closing) return;
      closing = true;
      Animated.timing(offset, {
        toValue: sheetHeight,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        router.back();
        then?.();
      });
    };
    const responder = PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => offset.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > CLOSE_DRAG || g.vy > 1) closeSheet();
        else Animated.spring(offset, { toValue: 0, useNativeDriver: true }).start();
      },
    });
    return { close: closeSheet, drag: responder };
  });

  const ask = (question: string, topic: AskTopic | 'unknown') => {
    const id = nextId.current++;
    setTurns((t) => [...t, { id, question, topic }]);
  };

  const follow = (f: FollowUp) => {
    if (f.topic) ask(ASK_QUESTIONS[f.topic], f.topic);
    else if (f.href) close(() => router.push(f.href as Href));
  };

  const last = turns.at(-1);
  const keepGoing: FollowUp[] = last
    ? answerFor(last.topic).followups
    : suggestionsFor(from).map((t) => ({ label: ASK_QUESTIONS[t], topic: t }));
  const backdrop = offset.interpolate({
    inputRange: [0, sheetHeight],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: backdrop }]}>
        <BlurView
          intensity={24}
          tint={scheme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, styles.dim, { backgroundColor: palette.shadow }]} />
      </Animated.View>
      {/* Outside the fading layer so it's tappable from the first frame. */}
      <Pressable
        style={StyleSheet.absoluteFill}
        accessibilityRole="button"
        accessibilityLabel="Close Ask"
        onPress={() => close()}
      />

      <Animated.View
        accessibilityViewIsModal
        style={[
          styles.sheet,
          {
            height: sheetHeight,
            backgroundColor: palette.ground,
            transform: [{ translateY: offset }],
          },
        ]}
      >
        <View {...drag.panHandlers} style={styles.handleArea}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            accessibilityHint="Or drag down"
            onPress={() => close()}
            hitSlop={16}
          >
            <View style={[styles.handle, { backgroundColor: palette.hairline }]} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={height - sheetHeight}
        >
          <ScrollView
            ref={scroller}
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
          >
            {turns.length === 0 ? (
              <View style={styles.answer}>
                <LiveLabel>Porter</LiveLabel>
                <Text variant="answer">What do you want to know?</Text>
              </View>
            ) : (
              turns.map((t, i) => <TurnView key={t.id} turn={t} live={i === turns.length - 1} />)
            )}

            <View style={styles.keepGoing}>
              <Text variant="caption" muted weight="semibold">
                {turns.length ? 'Keep going' : 'Try asking'}
              </Text>
              <View style={styles.chips}>
                {keepGoing.map((f) => (
                  <Chip key={f.label} label={f.label} selected={false} onPress={() => follow(f)} />
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={{ paddingBottom: Math.max(insets.bottom, space.lg), paddingTop: space.sm }}>
            <AskInput
              placeholder="Ask about your money, cards or trips"
              onSubmit={(text) => ask(text, topicFor(text))}
            />
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

/** One question and Porter's answer: plain text, never a boxed card, then the plan. */
function TurnView({ turn, live }: { turn: Turn; live: boolean }) {
  const { palette } = useTheme();
  const a = answerFor(turn.topic);
  return (
    <View style={styles.turn}>
      <View style={[styles.bubble, { backgroundColor: palette.action }]}>
        <Text variant="body" color={palette.actionText} style={styles.bubbleText}>
          {turn.question}
        </Text>
      </View>
      <View style={styles.answer}>
        <LiveLabel pulse={live}>Porter</LiveLabel>
        <AnswerText answer={a} />
      </View>
      {a.steps?.length ? (
        <View>
          {a.steps.map((s, i) => {
            const card = s.card ? getCard(s.card) : undefined;
            return (
              <PlanStep
                key={s.title}
                index={i + 1}
                title={s.title}
                detail={s.detail}
                done={s.done}
                card={card ? { color: card.color, chip: card.chip } : undefined}
              />
            );
          })}
        </View>
      ) : null}
      {a.basedOn.length ? (
        <Text variant="small" muted>
          Based on {a.basedOn.join(', ')} · sample data
        </Text>
      ) : null}
    </View>
  );
}

function AnswerText({ answer: a }: { answer: AskAnswer }) {
  const { palette } = useTheme();
  const at = a.highlight ? a.answer.indexOf(a.highlight) : -1;
  if (!a.highlight || at < 0) return <Text variant="answer">{a.answer}</Text>;
  return (
    <Text variant="answer">
      {a.answer.slice(0, at)}
      <Text variant="answer" color={palette.link}>
        {a.highlight}
      </Text>
      {a.answer.slice(at + a.highlight.length)}
    </Text>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dim: { opacity: 0.18 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: screen.side,
  },
  handleArea: { alignItems: 'center', paddingTop: space.md, paddingBottom: space.sm },
  handle: { width: 40, height: 5, borderRadius: 3 },
  content: { paddingVertical: space.md, gap: space.xl },
  turn: { gap: space.lg },
  bubble: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    paddingHorizontal: space.lg + 2,
    paddingVertical: space.md,
    borderRadius: radius.card,
  },
  bubbleText: { fontSize: 16, lineHeight: 22 },
  answer: { gap: space.sm },
  keepGoing: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
