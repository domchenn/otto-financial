import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { LockIcon } from '@/components/icons';
import { useLinkBank } from '@/lib/api';
import { Footer } from '@/components/layouts';
import { Text } from '@/components/Text';
import { radius, screen, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/**
 * Opens Plaid Link over this backdrop. Plaid shows its own UI; Otto only receives a public
 * token and never sees bank credentials.
 */
export default function PlaidLink() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const link = useLinkBank();
  const started = useRef(false);

  const start = () => {
    link.mutate(undefined, {
      onSuccess: (result) => {
        if (result.status === 'connected') router.replace('/onboarding/analysing');
        else if (result.status === 'failed') router.replace('/onboarding/link-error');
      },
      onError: () => router.replace('/onboarding/link-error'),
    });
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    start();
    // Open Link once on arrival; "Open Plaid" below retries after the user closes it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          {link.isPending ? 'Opening Plaid…' : 'Plaid closed'}
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
      </View>
      <Footer>
        <Button title="Open Plaid" disabled={link.isPending} onPress={start} />
        <Button variant="secondary" title="Not now" onPress={() => router.back()} />
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
});
