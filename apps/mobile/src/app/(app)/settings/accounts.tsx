import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { LabelTile } from '@/components/badges';
import { Button } from '@/components/Button';
import { LockIcon, PlusIcon } from '@/components/icons';
import { Footer, StepScreen } from '@/components/layouts';
import { Card } from '@/components/Surface';
import { Text } from '@/components/Text';
import { institutions } from '@/lib/sample';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function ConnectedAccounts() {
  const { palette } = useTheme();
  return (
    <StepScreen
      title="Connected accounts"
      footer={
        <Footer>
          <Button
            variant="secondary"
            icon={PlusIcon}
            title="Connect another account"
            onPress={() => router.push('/onboarding/connect')}
          />
        </Footer>
      }
    >
      <View style={{ gap: space.lg, marginTop: space.lg }}>
        {institutions.map((inst) => {
          const attention = inst.status === 'attention';
          return (
            <Card
              key={inst.id}
              style={
                attention ? { borderWidth: 2, borderColor: palette.tones.alert.track } : undefined
              }
            >
              <View style={styles.head}>
                <LabelTile label={inst.code} tone={inst.tone} size={56} />
                <View style={{ flex: 1 }}>
                  <Text variant="heading" style={{ fontSize: 21 }}>
                    {inst.name}
                  </Text>
                  <View style={styles.status}>
                    {!attention ? (
                      <View style={[styles.dot, { backgroundColor: palette.moneyIn }]} />
                    ) : null}
                    <Text
                      variant="body"
                      weight="bold"
                      color={attention ? palette.alert : palette.moneyIn}
                    >
                      {attention
                        ? `Needs a quick sign-in · ${inst.updated}`
                        : `Up to date · ${inst.updated}`}
                    </Text>
                  </View>
                </View>
                {!attention ? (
                  <Pressable
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={() =>
                      Alert.alert(
                        `Disconnect ${inst.name}?`,
                        "This deletes that bank's data from Otto.",
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Disconnect', style: 'destructive' },
                        ],
                      )
                    }
                  >
                    <Text variant="row" weight="bold" muted>
                      Disconnect
                    </Text>
                  </Pressable>
                ) : null}
              </View>
              <Text variant="body" muted style={{ marginTop: space.md, fontSize: 16 }}>
                {inst.cards.join(', ')}
              </Text>
              {attention ? (
                <Button
                  title={`Sign in to ${inst.name}`}
                  onPress={() => router.push('/onboarding/link')}
                  style={{ marginTop: space.lg }}
                />
              ) : null}
            </Card>
          );
        })}
      </View>
      <View style={styles.note}>
        <LockIcon color={palette.muted} size={16} />
        <Text variant="body" muted style={{ flex: 1 }}>
          Read-only access through Plaid. Disconnecting deletes that bank&apos;s data from Otto.
        </Text>
      </View>
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  note: { flexDirection: 'row', gap: space.sm, marginTop: space.xl, alignItems: 'flex-start' },
});
