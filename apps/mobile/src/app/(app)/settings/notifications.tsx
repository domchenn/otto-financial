import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { StepScreen } from '@/components/layouts';
import { GroupLabel, SettingRow, ToggleRow } from '@/components/rows';
import { Radio } from '@/components/selection';
import { Card, Stack } from '@/components/Surface';
import { Text } from '@/components/Text';
import { space } from '@/theme/tokens';

type Cadence = 'daily' | 'matters' | 'weekly';

const CADENCES: { id: Cadence; title: string; subtitle: string }[] = [
  { id: 'daily', title: 'A daily brief', subtitle: 'Every morning at 8 AM' },
  { id: 'matters', title: 'Only when it matters', subtitle: 'The alerts below, nothing else' },
  { id: 'weekly', title: 'A weekly recap', subtitle: 'Sundays, plus urgent alerts' },
];

/** Notification preferences. Local state until push notifications land (M3). */
export default function NotificationSettings() {
  const [cadence, setCadence] = useState<Cadence>('matters');
  const [alerts, setAlerts] = useState({
    payments: true,
    credits: true,
    unusual: true,
    budget: true,
  });
  const set = (key: keyof typeof alerts) => (v: boolean) => setAlerts((s) => ({ ...s, [key]: v }));

  return (
    <StepScreen title="Notifications">
      <GroupLabel>How often Otto checks in</GroupLabel>
      <Card style={styles.group}>
        <Stack>
          {CADENCES.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: cadence === c.id }}
              onPress={() => setCadence(c.id)}
              style={styles.radioRow}
            >
              <View style={{ flex: 1 }}>
                <Text variant="row" weight="bold" style={{ fontSize: 17 }}>
                  {c.title}
                </Text>
                <Text variant="body" muted>
                  {c.subtitle}
                </Text>
              </View>
              <Radio checked={cadence === c.id} />
            </Pressable>
          ))}
        </Stack>
      </Card>

      <GroupLabel>Always tell me about</GroupLabel>
      <Card style={styles.group}>
        <Stack>
          <ToggleRow
            title="Payments coming due"
            subtitle="3 days before each due date"
            value={alerts.payments}
            onValueChange={set('payments')}
          />
          <ToggleRow
            title="Credits about to reset"
            subtitle="Uses your credit reminder settings"
            value={alerts.credits}
            onValueChange={set('credits')}
          />
          <ToggleRow
            title="Unusual charges"
            subtitle="Big or unfamiliar purchases"
            value={alerts.unusual}
            onValueChange={set('unusual')}
          />
          <ToggleRow
            title="Going over budget"
            subtitle="When you pass 90% of your limit"
            value={alerts.budget}
            onValueChange={set('budget')}
          />
        </Stack>
      </Card>

      <Card style={[styles.group, { marginTop: space.lg }]}>
        <SettingRow
          label="Quiet hours"
          value="10 PM – 8 AM"
          onPress={() =>
            Alert.alert('Quiet hours', 'Custom quiet hours arrive with push notifications in M3.')
          }
        />
      </Card>
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  group: { paddingVertical: space.xs },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 72,
    paddingVertical: space.md,
  },
});
