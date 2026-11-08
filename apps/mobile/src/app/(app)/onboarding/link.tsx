import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { LockIcon } from '@/components/icons';
import { Footer } from '@/components/layouts';
import { Text } from '@/components/Text';
import { radius, screen, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/**
 * Placeholder for Plaid Link (M1). The real sheet opens Plaid's own UI; Otto only receives
 * a public token and never sees bank credentials.
 */
export default function PlaidLink() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.surface,
        paddingHorizontal: screen.side,
        paddingBottom: Math.max(insets.bottom, space.lg) + space.lg,
      }}
    >
      <View style={[styles.grabber, { backgroundColor: palette.hairline }]} />
      <View style={[styles.placeholder, { borderColor: palette.hairline }]}>
        <View style={[styles.lock, { backgroundColor: palette.raised }]}>
          <LockIcon color={palette.muted} size={34} />
        </View>
        <Text variant="heading" center style={{ marginTop: space.xl, fontSize: 26 }}>
          Plaid&apos;s secure window opens here
        </Text>
        <Text
          variant="body"
          muted
          center
          style={{ marginTop: space.md, fontSize: 17, lineHeight: 25 }}
        >
          You search for your bank, sign in and choose accounts inside Plaid. Otto receives
          read-only access and never sees the password.
        </Text>
        <View style={[styles.tag, { backgroundColor: palette.raised }]}>
          <Text variant="caption" weight="bold" muted>
            Arrives in M1
          </Text>
        </View>
      </View>
      <Footer>
        <Button
          title="Simulate: connected"
          onPress={() => router.replace('/onboarding/analysing')}
        />
        <Button
          variant="secondary"
          title="Simulate: connection failed"
          onPress={() => router.replace('/onboarding/link-error')}
        />
      </Footer>
    </View>
  );
}

const styles = StyleSheet.create({
  grabber: { width: 64, height: 6, borderRadius: 3, alignSelf: 'center', marginTop: space.md },
  placeholder: {
    flex: 1,
    marginVertical: space.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radius.sheet - 4,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  lock: { width: 96, height: 96, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  tag: { marginTop: space.lg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
});
