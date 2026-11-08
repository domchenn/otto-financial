import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, TextButton } from '@/components/Button';
import { Footer, StepScreen } from '@/components/layouts';
import { NotificationPreview } from '@/components/NotificationPreview';
import { Text } from '@/components/Text';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Notification pre-prompt. The system permission request is wired up with push in M3. */
export default function NotificationsPrompt() {
  const { palette } = useTheme();
  const next = () => router.replace('/onboarding/face-id');
  return (
    <StepScreen
      footer={
        <Footer>
          <Button title="Turn on notifications" onPress={next} />
          <TextButton title="Maybe later" color={palette.ink} onPress={next} />
        </Footer>
      }
    >
      <View style={{ marginTop: space.xl }}>
        <NotificationPreview
          title="Credit expiring Tuesday"
          body="Your $10 Gold dining credit resets in 3 days. Want ideas nearby?"
          time="now"
        />
        <NotificationPreview
          title="Payment due Thursday"
          body="Freedom statement: $420. Autopay only covers the minimum."
          time="2h ago"
          dimmed
          style={{ marginTop: space.lg, marginHorizontal: space.lg }}
        />
      </View>
      <Text variant="display" style={{ marginTop: space.xxl + space.lg }}>
        Want a heads-up when it matters?
      </Text>
      <Text variant="body" muted style={{ marginTop: space.md, fontSize: 18, lineHeight: 26 }}>
        Expiring credits, upcoming payments and unusual charges. Never promos, never spam. You can
        fine-tune this anytime.
      </Text>
    </StepScreen>
  );
}
