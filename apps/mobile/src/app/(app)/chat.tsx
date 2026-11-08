import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AskInput } from '@/components/AskInput';
import { CardSwatch } from '@/components/badges';
import { CheckIcon } from '@/components/icons';
import { StepHeader } from '@/components/layouts';
import { Insight, OttoAvatar, Wordmark } from '@/components/otto';
import { ProgressBar } from '@/components/ProgressBar';
import { ListRow } from '@/components/rows';
import { Chip } from '@/components/selection';
import { Card, Stack } from '@/components/Surface';
import { Text } from '@/components/Text';
import { ASK_QUESTIONS, isAskTopic, type AskTopic } from '@/lib/ask';
import { formatCents, formatNumber } from '@/lib/money';
import { categories, credits, getCard, points, trip, week } from '@/lib/sample';
import { radius, screen, space, type ToneName } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type Message =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'otto'; topic: AskTopic | 'unknown' };
type FollowUp = { label: string; topic?: AskTopic; href?: string };

const FOLLOW_UPS: Record<AskTopic | 'unknown', FollowUp[]> = {
  dinner: [
    { label: 'Summarize my week', topic: 'week' },
    { label: 'Credits expiring soon', topic: 'credits' },
  ],
  week: [
    { label: 'See spending', href: '/spending' },
    { label: 'Which card for dinner?', topic: 'dinner' },
  ],
  japan: [
    { label: 'Bonus progress', href: '/card/gold' },
    { label: 'Summarize my week', topic: 'week' },
  ],
  credits: [
    { label: 'See all credits', href: '/credits' },
    { label: 'Summarize my week', topic: 'week' },
  ],
  unknown: [
    { label: 'Summarize my week', topic: 'week' },
    { label: 'How close am I to Japan?', topic: 'japan' },
  ],
};

export default function Chat() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string; text?: string }>();
  const scroller = useRef<ScrollViewInstance>(null);
  const nextId = useRef(2);

  const [messages, setMessages] = useState<Message[]>(() => {
    if (isAskTopic(params.q)) {
      return [
        { id: 0, role: 'user', text: ASK_QUESTIONS[params.q] },
        { id: 1, role: 'otto', topic: params.q },
      ];
    }
    if (params.text) {
      return [
        { id: 0, role: 'user', text: params.text },
        { id: 1, role: 'otto', topic: 'unknown' },
      ];
    }
    return [];
  });

  const ask = (text: string, topic: AskTopic | 'unknown') => {
    const id = nextId.current;
    nextId.current += 2;
    setMessages((m) => [...m, { id, role: 'user', text }, { id: id + 1, role: 'otto', topic }]);
  };

  const last = messages.at(-1);
  const followUps = last?.role === 'otto' ? FOLLOW_UPS[last.topic] : FOLLOW_UPS.unknown;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.ground }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={{ paddingTop: Math.max(insets.top + space.sm, 52), paddingHorizontal: screen.side }}
      >
        <StepHeader right={<View style={{ width: 52 }} />} />
        <View style={styles.titleOverlay} pointerEvents="none">
          <Wordmark size={24} />
        </View>
      </View>
      <ScrollView
        ref={scroller}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: screen.side,
          paddingVertical: space.lg,
          gap: space.lg,
        }}
        onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((m) =>
          m.role === 'user' ? (
            <View key={m.id} style={[styles.userBubble, { backgroundColor: palette.action }]}>
              <Text variant="body" color={palette.actionText} style={{ fontSize: 18 }}>
                {m.text}
              </Text>
            </View>
          ) : (
            <View key={m.id} style={{ gap: space.md }}>
              <View style={styles.ottoHead}>
                <OttoAvatar size={32} />
                <Text variant="row" weight="semibold" muted>
                  Otto
                </Text>
              </View>
              <Reply topic={m.topic} />
            </View>
          ),
        )}
      </ScrollView>
      <View
        style={{
          paddingHorizontal: screen.side,
          paddingBottom: Math.max(insets.bottom, space.lg),
          gap: space.md,
        }}
      >
        <View style={styles.chips}>
          {followUps.map((f) => (
            <Chip
              key={f.label}
              label={f.label}
              selected={false}
              onPress={() => {
                if (f.href) router.push(f.href as never);
                else if (f.topic)
                  ask(f.topic === 'dinner' ? ASK_QUESTIONS.dinner : f.label, f.topic);
              }}
            />
          ))}
        </View>
        <AskInput placeholder="Ask a follow-up…" onSubmit={(text) => ask(text, 'unknown')} />
      </View>
    </KeyboardAvoidingView>
  );
}

function Para({ children }: { children: ReactNode }) {
  return (
    <Text variant="body" style={{ fontSize: 18, lineHeight: 27 }}>
      {children}
    </Text>
  );
}

function B({ children }: { children: ReactNode }) {
  return (
    <Text variant="body" weight="extrabold" style={{ fontSize: 18 }}>
      {children}
    </Text>
  );
}

function Reply({ topic }: { topic: AskTopic | 'unknown' }) {
  switch (topic) {
    case 'dinner':
      return <DinnerReply />;
    case 'week':
      return <WeekReply />;
    case 'japan':
      return <JapanReply />;
    case 'credits':
      return <CreditsReply />;
    default:
      return (
        <Para>
          I can only answer a few questions for now, using sample data. The full Ask Otto arrives in
          M6. Try one of the suggestions below.
        </Para>
      );
  }
}

function DinnerReply() {
  const { palette } = useTheme();
  const rows = [
    { name: 'Amex Gold', pts: 240, best: true },
    { name: 'Freedom Unlimited', pts: 90 },
    { name: 'Bilt', pts: 180 },
  ].sort((a, b) => b.pts - a.pts);
  return (
    <>
      <Para>
        Use your <B>Amex Gold</B>. It earns 4x on dining, so this dinner gets you about 240 points,
        worth roughly $4.80.
      </Para>
      <Card style={styles.answerCard}>
        <Stack>
          {rows.map((r) => (
            <View key={r.name} style={styles.compareRow}>
              <Text
                variant="row"
                weight={r.best ? 'bold' : 'medium'}
                color={r.best ? palette.ink : palette.muted}
              >
                {r.name}
              </Text>
              <Text
                variant="row"
                weight={r.best ? 'bold' : 'medium'}
                tabular
                color={r.best ? palette.moneyIn : palette.muted}
              >
                {r.pts} pts
              </Text>
            </View>
          ))}
        </Stack>
      </Card>
    </>
  );
}

function MiniTile({
  tone,
  label,
  value,
  caption,
}: {
  tone: ToneName;
  label: string;
  value: string;
  caption: string;
}) {
  const { palette } = useTheme();
  const t = palette.tones[tone];
  return (
    <Card tone={tone} style={styles.miniTile}>
      <Text variant="caption" weight="bold" color={t.text}>
        {label}
      </Text>
      <Text
        variant="heading"
        weight="extrabold"
        tabular
        color={palette.ink}
        style={{ marginTop: 2 }}
      >
        {value}
      </Text>
      <Text variant="caption" weight="medium" color={t.text}>
        {caption}
      </Text>
    </Card>
  );
}

function WeekReply() {
  const { palette } = useTheme();
  const groceries = categories.find((c) => c.id === 'groceries');
  const marks: { icon: ReactNode; tone: ToneName; label: string; text: string }[] = [
    {
      icon: <CheckIcon color={palette.tones.mint.accent} size={14} />,
      tone: 'mint',
      label: 'Best move:',
      text: `groceries on Gold, 4x on ${formatCents(groceries?.cents ?? 0, { cents: true })}`,
    },
    {
      icon: (
        <Text weight="extrabold" color={palette.tones.lilac.text}>
          !
        </Text>
      ),
      tone: 'lilac',
      label: 'Missed:',
      text: 'Chipotle on Freedom Unlimited, about 33 points',
    },
    {
      icon: (
        <Text weight="extrabold" color={palette.tones.butter.text}>
          $
        </Text>
      ),
      tone: 'butter',
      label: 'Coming up:',
      text: '$10 dining credit resets Sunday',
    },
  ];
  return (
    <>
      <Para>
        Solid week, Dom. You stayed <B>{formatCents(week.underPaceCents)} under</B> your usual pace
        and used the right card on 5 of 6 dinners.
      </Para>
      <View style={styles.miniRow}>
        <MiniTile
          tone="mint"
          label="Spent"
          value={formatCents(week.spentCents)}
          caption={`of ${formatCents(week.limitCents)}`}
        />
        <MiniTile
          tone="lilac"
          label="Earned"
          value={`${week.pointsEarned} pts`}
          caption={`≈ ${formatCents(week.pointsEarned * points.centsPerPoint, { cents: true })}`}
        />
        <MiniTile
          tone="butter"
          label="Credits used"
          value={formatCents(week.creditsUsedCents)}
          caption="Uber Cash"
        />
      </View>
      <Card style={styles.answerCard}>
        <Stack>
          {marks.map((m) => (
            <View key={m.label} style={styles.markRow}>
              <View style={[styles.mark, { backgroundColor: palette.tones[m.tone].bg }]}>
                {m.icon}
              </View>
              <Text variant="body" style={{ flex: 1, fontSize: 16 }}>
                <Text variant="body" weight="extrabold" style={{ fontSize: 16 }}>
                  {m.label}
                </Text>{' '}
                {m.text}
              </Text>
            </View>
          ))}
        </Stack>
      </Card>
    </>
  );
}

function JapanReply() {
  const { palette } = useTheme();
  const businessPct = points.total / trip.businessPoints;
  const toGo = trip.businessPoints - points.total;
  return (
    <>
      <Para>
        Closer than you think. You already have enough for <B>economy</B>, and you&apos;re about{' '}
        <B>three-quarters</B> of the way to <B>business class</B>.
      </Para>
      <Card style={{ gap: space.md }}>
        <View style={styles.compareRow}>
          <Text variant="row" weight="bold" muted>
            Round trip to Tokyo · {trip.when}
          </Text>
          <Text variant="row" weight="extrabold" tabular>
            {formatNumber(points.total)} pts
          </Text>
        </View>
        <View style={styles.compareRow}>
          <Text variant="row" weight="bold" style={{ fontSize: 18 }}>
            Economy
          </Text>
          <Text variant="row" weight="bold" color={palette.moneyIn}>
            Ready to book
          </Text>
        </View>
        <ProgressBar value={1} color={palette.illustration.mint} track={palette.tones.mint.track} />
        <Text variant="body" muted>
          About {Math.round(trip.economyPoints / 1000)}k points
        </Text>
        <View style={[styles.compareRow, { marginTop: space.sm }]}>
          <Text variant="row" weight="bold" style={{ fontSize: 18 }}>
            Business
          </Text>
          <Text variant="row" weight="bold" color={palette.tones.lilac.text}>
            {Math.round(businessPct * 100)}%
          </Text>
        </View>
        <ProgressBar
          value={businessPct}
          color={palette.tones.lilac.accent}
          track={palette.tones.lilac.track}
        />
        <Text variant="body" muted>
          About {Math.round(trip.businessPoints / 1000)}k points · ~{Math.round(toGo / 1000)}k to
          go, around 5 months at your pace
        </Text>
      </Card>
      <Insight tone="lilac" mark="none">
        Finishing your Gold sign-up bonus would get you most of the way there in one shot.
      </Insight>
      <Text variant="caption" weight="medium" muted>
        Estimates. Award prices change by date, airline and seat availability.
      </Text>
    </>
  );
}

function CreditsReply() {
  const expiring = credits.filter((c) => c.group !== 'year');
  const total = expiring.reduce((s, c) => s + c.amountCents, 0);
  return (
    <>
      <Para>
        You have <B>{formatCents(total)}</B> in credits that reset this month. The dining credit is
        the urgent one: it resets in 3 days.
      </Para>
      <Card style={styles.answerCard}>
        <Stack>
          {expiring.map((c) => {
            const card = getCard(c.card);
            return (
              <ListRow
                key={c.id}
                leading={
                  card ? <CardSwatch color={card.color} chip={card.chip} width={40} /> : undefined
                }
                title={c.name}
                subtitle={`${card?.shortName ?? ''} · ${c.resets}`}
                value={formatCents(c.amountCents)}
                onPress={() => router.push(`/credits/${c.id}`)}
              />
            );
          })}
        </Stack>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  titleOverlay: { position: 'absolute', left: 0, right: 0, bottom: 10, alignItems: 'center' },
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
    borderRadius: 26,
    borderBottomRightRadius: 6,
  },
  ottoHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  answerCard: { paddingVertical: space.sm },
  compareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space.sm,
  },
  miniRow: { flexDirection: 'row', gap: space.sm },
  miniTile: { flex: 1, padding: space.lg, borderRadius: radius.card },
  markRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  mark: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
