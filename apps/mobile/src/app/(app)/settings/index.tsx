import { useAuth, useUser } from '@clerk/expo';
import { router } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/badges';
import { TextButton } from '@/components/Button';
import { StepScreen } from '@/components/layouts';
import { GroupLabel, SettingRow, ToggleRow } from '@/components/rows';
import { Card, Stack } from '@/components/Surface';
import { Text } from '@/components/Text';
import { useMe } from '@/lib/api';
import { formatCents } from '@/lib/money';
import { institutions, points, trip, week } from '@/lib/sample';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function Settings() {
  const { palette } = useTheme();
  const { user } = useUser();
  const { signOut } = useAuth();
  const me = useMe();
  const name = user?.fullName ?? user?.firstName ?? 'You';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const attention = institutions.filter((i) => i.status === 'attention').length;

  const confirmSignOut = () =>
    Alert.alert('Sign out of Otto?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);

  return (
    <StepScreen title="Settings">
      <Card style={[styles.profile, { marginTop: space.lg }]}>
        <Avatar letter={name.charAt(0).toUpperCase()} size={72} />
        <View style={{ flex: 1 }}>
          <Text variant="heading" style={{ fontSize: 21 }}>
            {name}
          </Text>
          <Text variant="body" muted numberOfLines={1}>
            {email} · Signed in with email
          </Text>
        </View>
      </Card>

      <GroupLabel>Your money</GroupLabel>
      <Card style={styles.group}>
        <Stack>
          <SettingRow
            label="Connected accounts"
            value={attention > 0 ? `${attention} needs attention` : 'All up to date'}
            valueColor={attention > 0 ? palette.alert : undefined}
            onPress={() => router.push('/settings/accounts')}
          />
          <SettingRow
            label="Weekly budget"
            value={formatCents(week.limitCents)}
            onPress={() => router.push('/onboarding/budget')}
          />
          <SettingRow
            label="Trip goal"
            value={`${trip.destination} · spring`}
            onPress={() => router.push('/onboarding/trip')}
          />
        </Stack>
      </Card>

      <GroupLabel>Otto</GroupLabel>
      <Card style={styles.group}>
        <Stack>
          <SettingRow
            label="Notifications"
            value="When it matters"
            onPress={() => router.push('/settings/notifications')}
          />
          <SettingRow
            label="Credit reminders"
            value="3 days before"
            onPress={() => router.push('/credits/reminders')}
          />
          <SettingRow
            label="Point values"
            value={`${points.centsPerPoint}¢ for travel`}
            onPress={() =>
              Alert.alert(
                'Point values',
                'Custom point values arrive with the points engine in M2.',
              )
            }
          />
        </Stack>
      </Card>

      <GroupLabel>Privacy & security</GroupLabel>
      <Card style={styles.group}>
        <Stack>
          <ToggleRow
            title="Unlock with Face ID"
            subtitle="Always on for now"
            value
            onValueChange={() => {}}
            disabled
          />
          <ToggleRow
            title="Hide balances on open"
            subtitle="Coming soon"
            value={false}
            onValueChange={() => {}}
            disabled
          />
        </Stack>
      </Card>

      <GroupLabel>Previews</GroupLabel>
      <Card style={styles.group}>
        <Stack>
          <SettingRow label="Onboarding" onPress={() => router.push('/onboarding/goals')} />
          <SettingRow label="Home before connecting" onPress={() => router.push('/onboarding')} />
          <SettingRow
            label="Bank connection error"
            onPress={() => router.push('/onboarding/link-error')}
          />
          <SettingRow label="Every credit used" onPress={() => router.push('/credits/complete')} />
        </Stack>
      </Card>

      <View style={styles.actions}>
        <TextButton title="Sign out" onPress={confirmSignOut} />
        <TextButton
          title="Delete account"
          color={palette.alert}
          onPress={() => router.push('/settings/delete')}
        />
      </View>

      <View style={styles.status}>
        <View
          style={[
            styles.dot,
            {
              backgroundColor: me.isSuccess
                ? palette.moneyIn
                : me.isError
                  ? palette.alert
                  : palette.faint,
            },
          ]}
        />
        <Text variant="caption" weight="medium" muted>
          {me.isSuccess
            ? 'Connected to the Otto API'
            : me.isError
              ? 'Can’t reach the Otto API'
              : 'Connecting to the Otto API…'}
        </Text>
      </View>
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  group: { paddingVertical: space.xs },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: space.xxl, marginTop: space.xl },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    marginTop: space.md,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
