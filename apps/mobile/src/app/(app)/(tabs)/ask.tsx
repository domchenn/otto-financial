import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AskInput } from '@/components/AskInput';
import { IconTile } from '@/components/badges';
import { CardIcon, ClockIcon, PlaneIcon, SpendingIcon, type Icon } from '@/components/icons';
import { OttoAvatar } from '@/components/otto';
import { ListRow } from '@/components/rows';
import { Card } from '@/components/Surface';
import { Text } from '@/components/Text';
import type { AskTopic } from '@/lib/ask';
import { screen, space, type ToneName } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const PROMPTS: { topic: AskTopic; title: string; subtitle: string; icon: Icon; tone: ToneName }[] =
  [
    {
      topic: 'dinner',
      title: 'Which card for dinner tonight?',
      subtitle: 'Before you pay',
      icon: CardIcon,
      tone: 'lilac',
    },
    {
      topic: 'week',
      title: 'Summarize my week',
      subtitle: 'Spending, points and credits',
      icon: SpendingIcon,
      tone: 'mint',
    },
    {
      topic: 'japan',
      title: 'How close am I to Japan?',
      subtitle: 'Your trip goal',
      icon: PlaneIcon,
      tone: 'lilac',
    },
    {
      topic: 'credits',
      title: 'What credits expire this month?',
      subtitle: '$65 waiting',
      icon: ClockIcon,
      tone: 'butter',
    },
  ];

export default function Ask() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.ground }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(insets.top + space.lg, 60),
          paddingHorizontal: screen.side,
          paddingBottom: space.xl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <OttoAvatar size={68} />
        <Text variant="display" style={{ marginTop: space.xl, marginBottom: space.xl }}>
          Hi Dom. What do you want to know?
        </Text>
        <View style={{ gap: space.md }}>
          {PROMPTS.map((p) => (
            <Card key={p.topic} padded={false} style={styles.prompt}>
              <ListRow
                leading={<IconTile icon={p.icon} tone={p.tone} size={52} />}
                title={p.title}
                subtitle={p.subtitle}
                onPress={() => router.push({ pathname: '/chat', params: { q: p.topic } })}
              />
            </Card>
          ))}
        </View>
      </ScrollView>
      <View
        style={{
          paddingHorizontal: screen.side,
          paddingBottom: Math.max(insets.bottom, space.lg) + 100,
        }}
      >
        <AskInput
          placeholder="Ask about your money…"
          onSubmit={(text) => router.push({ pathname: '/chat', params: { text } })}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  prompt: { paddingHorizontal: space.xl, paddingVertical: space.sm },
});
