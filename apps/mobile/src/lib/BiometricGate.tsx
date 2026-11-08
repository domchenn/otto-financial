import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, AppState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { FaceIdIcon } from '@/components/icons';
import { Wordmark } from '@/components/otto';
import { Text } from '@/components/Text';
import { screen, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const RELOCK_AFTER_MS = 5 * 60 * 1000;

async function promptUnlock(): Promise<'unlocked' | 'failed' | 'cancelled'> {
  // Without enrolled biometrics (e.g. the simulator) iOS falls back to the device passcode.
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock Otto',
    cancelLabel: 'Cancel',
  });
  if (result.success) return 'unlocked';
  return result.error === 'user_cancel' || result.error === 'app_cancel' ? 'cancelled' : 'failed';
}

/**
 * Locks the app behind Face ID on launch and after 5 minutes in the background, and covers
 * the screen whenever the app is inactive so balances never show in the app switcher.
 */
export function BiometricGate({ children }: { children: ReactNode }) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const [unlocked, setUnlocked] = useState(false);
  const [obscured, setObscured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const backgroundedAt = useRef<number | null>(null);

  const authenticate = useCallback(
    () =>
      promptUnlock().then((outcome) => {
        setUnlocked(outcome === 'unlocked');
        setError(outcome === 'failed' ? 'Face ID didn’t recognise you. Try again.' : null);
      }),
    [],
  );

  useEffect(() => {
    void authenticate();
  }, [authenticate]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setObscured(false);
        const away = backgroundedAt.current;
        backgroundedAt.current = null;
        if (away !== null && Date.now() - away > RELOCK_AFTER_MS) {
          setUnlocked(false);
          void authenticate();
        }
      } else {
        setObscured(true);
        backgroundedAt.current ??= Date.now();
      }
    });
    return () => subscription.remove();
  }, [authenticate]);

  if (!unlocked) {
    return (
      <View
        style={[
          styles.lock,
          {
            backgroundColor: palette.ground,
            paddingBottom: Math.max(insets.bottom, space.lg) + space.lg,
          },
        ]}
      >
        <View style={styles.lockContent}>
          <View style={[styles.tile, { backgroundColor: palette.tones.indigo.bg }]}>
            <FaceIdIcon color={palette.link} size={76} />
          </View>
          <Text variant="display" center style={{ marginTop: space.xxl }}>
            Otto is locked
          </Text>
          <Text
            variant="body"
            muted
            center
            style={{ marginTop: space.md, fontSize: 17, lineHeight: 25 }}
          >
            {error ?? 'Your balances stay private until you unlock.'}
          </Text>
        </View>
        <Button title="Unlock with Face ID" onPress={() => void authenticate()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {children}
      {obscured ? (
        <View style={[StyleSheet.absoluteFill, styles.cover, { backgroundColor: palette.ground }]}>
          <Wordmark size={44} color={palette.link} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lock: { flex: 1, paddingHorizontal: screen.side },
  lockContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tile: {
    width: 140,
    height: 140,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cover: { alignItems: 'center', justifyContent: 'center' },
});
