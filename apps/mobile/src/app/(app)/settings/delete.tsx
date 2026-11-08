import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { IconTile } from '@/components/badges';
import { Button } from '@/components/Button';
import { TrashIcon } from '@/components/icons';
import { Footer, StepScreen } from '@/components/layouts';
import { Checkbox } from '@/components/selection';
import { Card, Stack } from '@/components/Surface';
import { Text } from '@/components/Text';
import { institutions } from '@/lib/sample';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function DeleteAccount() {
  const { palette } = useTheme();
  const [understood, setUnderstood] = useState(false);
  const points = [
    {
      text: `Your ${institutions.length} banks are disconnected and their data is deleted from Otto.`,
      danger: true,
    },
    { text: 'Your budgets, goals, reminders and Ask Otto history are erased.', danger: true },
    { text: "Your cards and bank accounts themselves aren't affected.", danger: false },
  ];

  return (
    <StepScreen
      footer={
        <Footer>
          <Button
            variant="danger"
            title="Delete my account"
            disabled={!understood}
            onPress={() =>
              Alert.alert(
                'Not yet',
                'Account deletion is wired up with the backend data model in M1.',
              )
            }
          />
          <Button variant="secondary" title="Keep my account" onPress={() => router.back()} />
        </Footer>
      }
    >
      <View style={{ marginTop: space.lg }}>
        <IconTile icon={TrashIcon} tone="alert" size={64} />
      </View>
      <Text variant="display" style={{ marginTop: space.lg }}>
        Delete your Otto account?
      </Text>
      <Text variant="body" muted style={{ fontSize: 17, marginTop: space.sm }}>
        This can&apos;t be undone. Here&apos;s what happens:
      </Text>

      <Card style={{ marginTop: space.xl, paddingVertical: space.sm }}>
        <Stack>
          {points.map((p) => (
            <View key={p.text} style={styles.point}>
              <View
                style={[
                  styles.bullet,
                  { backgroundColor: p.danger ? palette.alert : palette.muted },
                ]}
              />
              <Text variant="body" style={{ flex: 1, fontSize: 17, lineHeight: 24 }}>
                {p.text}
              </Text>
            </View>
          ))}
        </Stack>
      </Card>

      <Card tone="butter" style={{ marginTop: space.lg, paddingVertical: space.lg }}>
        <Text
          variant="body"
          color={palette.tones.butter.text}
          style={{ fontSize: 16, lineHeight: 23 }}
        >
          Have a subscription? Cancel it in your App Store settings first. Deleting your account
          doesn&apos;t stop billing.
        </Text>
      </Card>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: understood }}
        onPress={() => setUnderstood((v) => !v)}
        style={styles.confirm}
      >
        <Checkbox checked={understood} />
        <Text variant="row" weight="bold" style={{ fontSize: 17 }}>
          I understand this is permanent
        </Text>
      </Pressable>
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  point: {
    flexDirection: 'row',
    gap: space.md,
    paddingVertical: space.md,
    alignItems: 'flex-start',
  },
  bullet: { width: 10, height: 10, borderRadius: 5, marginTop: 8 },
  confirm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.xl,
    minHeight: 44,
  },
});
