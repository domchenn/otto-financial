import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, TextButton } from '@/components/Button';
import { FaceIdIcon } from '@/components/icons';
import { Footer, StepScreen } from '@/components/layouts';
import { Text } from '@/components/Text';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Face ID is already enforced by BiometricGate; this step just explains it in onboarding. */
export default function FaceIdPrompt() {
  const { palette } = useTheme();
  const finish = () => router.dismissTo('/');
  return (
    <StepScreen
      footer={
        <Footer>
          <Button title="Turn on Face ID" onPress={finish} />
          <TextButton title="Not now" color={palette.ink} onPress={finish} />
        </Footer>
      }
    >
      <View style={styles.center}>
        <View style={[styles.tile, { backgroundColor: palette.tones.indigo.bg }]}>
          <FaceIdIcon color={palette.link} size={100} />
        </View>
        <Text variant="display" center style={{ marginTop: space.xxl }}>
          Keep Otto private
        </Text>
        <Text
          variant="body"
          muted
          center
          style={{ marginTop: space.md, fontSize: 18, lineHeight: 26 }}
        >
          Use Face ID to open the app, so your balances stay yours even if someone borrows your
          phone.
        </Text>
      </View>
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', marginTop: 120 },
  tile: {
    width: 170,
    height: 170,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
