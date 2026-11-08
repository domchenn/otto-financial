import { Stack } from 'expo-router';

import { useTheme } from '@/theme/useTheme';

/** Everything behind sign-in: the tabs plus pushed detail screens and the onboarding flow. */
export default function AppLayout() {
  const { palette } = useTheme();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.ground } }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="card/[id]/value" options={{ presentation: 'modal' }} />
      <Stack.Screen name="credits/complete" options={{ animation: 'fade' }} />
      <Stack.Screen name="settings/delete" options={{ presentation: 'modal' }} />
      <Stack.Screen name="onboarding/link" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
