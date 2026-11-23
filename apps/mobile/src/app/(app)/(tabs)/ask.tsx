import { useUser } from '@clerk/expo';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AskInput } from '@/components/AskInput';
import { CardIcon, ClockIcon, GiftIcon, SpendingIcon, type Icon } from '@/components/icons';
import { Wordmark } from '@/components/porter';
import { ListRow } from '@/components/rows';
import { Card, Stack } from '@/components/Surface';
import { Text } from '@/components/Text';
import { useSpending } from '@/lib/api';
import { formatCents } from '@/lib/money';
// Credits are sample data until the credits feature lands; the Credits screen uses the same.
import { creditSummary, credits, getCard } from '@/lib/sample';
import { screen, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type Suggestion = { key: string; title: string; subtitle: string; icon: Icon; onPress: () => void };

const ask = (topic: string) => router.push({ pathname: '/chat', params: { q: topic } });
const monthEnd = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
  new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
);

/** Suggestions from the user's own numbers where Porter has them, generic text otherwise. */
function useSuggestions(): Suggestion[] {
  const week = useSpending('week');
  const spent = week.isError ? undefined : week.data?.spent_cents;
  const soonest = credits.find((c) => !c.used && c.group !== 'year');
  const soonestCard = soonest ? getCard(soonest.card) : undefined;

  return [
    soonest
      ? {
          key: 'credit',
          title: `Your ${formatCents(soonest.amountCents)} ${soonest.name.toLowerCase()} ${soonest.resets.toLowerCase()}`,
          subtitle: soonestCard ? `${soonestCard.issuer} ${soonestCard.shortName}` : 'Card credit',
          icon: ClockIcon,
          onPress: () => router.push(`/credits/${soonest.id}`),
        }
      : {
          key: 'credit',
          title: 'Which credits reset soon?',
          subtitle: 'Before they expire',
          icon: ClockIcon,
          onPress: () => ask('credits'),
        },
    {
      key: 'dinner',
      title: 'Which card for dinner tonight?',
      subtitle: 'Before you pay',
      icon: CardIcon,
      onPress: () => ask('dinner'),
    },
    {
      key: 'week',
      title: 'Summarize my week',
      subtitle:
        spent !== undefined
          ? `${formatCents(spent)} spent since Monday`
          : 'Spending, points and credits',
      icon: SpendingIcon,
      onPress: () => ask('week'),
    },
    creditSummary.readyThisMonthCents > 0
      ? {
          key: 'credits',
          title: `${formatCents(creditSummary.readyThisMonthCents)} in credits expire ${monthEnd}`,
          subtitle: `${creditSummary.expiringThisMonth} credits still unused`,
          icon: GiftIcon,
          onPress: () => ask('credits'),
        }
      : {
          key: 'credits',
          title: 'What credits expire this month?',
          subtitle: 'Card credits',
          icon: GiftIcon,
          onPress: () => ask('credits'),
        },
  ];
}

export default function Ask() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const suggestions = useSuggestions();
  // Room for the floating tab bar under the input; the keyboard covers the tab bar when open.
  const closedGap = Math.max(insets.bottom, space.lg) + 100;
  const name = useUser().user?.firstName;

  return (
    <View style={{ flex: 1, backgroundColor: palette.ground }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(insets.top + space.lg, 60),
          paddingHorizontal: screen.side,
          paddingBottom: space.xl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Wordmark size={24} />
        <Text variant="display" style={{ marginTop: space.md, marginBottom: space.xl }}>
          {name ? `Hi ${name}. What do you want to know?` : 'What do you want to know?'}
        </Text>
        <Card style={{ paddingVertical: space.sm }}>
          <Stack>
            {suggestions.map((s) => (
              <ListRow
                key={s.key}
                leading={<s.icon color={palette.ink} size={24} />}
                title={s.title}
                subtitle={s.subtitle}
                titleLines={2}
                chevron
                onPress={s.onPress}
              />
            ))}
          </Stack>
        </Card>
      </ScrollView>
      {/* Moves with the keyboard frame by frame (UI thread), like one piece with it. Open, it
          rests 12pt above the keyboard instead of above the tab bar. */}
      <KeyboardStickyView
        offset={{ closed: 0, opened: closedGap - space.md }}
        style={{ paddingHorizontal: screen.side, paddingBottom: closedGap }}
      >
        <AskInput
          placeholder="Ask about your money…"
          onSubmit={(text) => router.push({ pathname: '/chat', params: { text } })}
        />
      </KeyboardStickyView>
    </View>
  );
}
