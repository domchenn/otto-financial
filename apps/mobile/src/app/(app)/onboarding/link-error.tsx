import { router } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { IconTile } from '@/components/badges';
import { Button, TextButton } from '@/components/Button';
import { CheckIcon, UnlinkIcon } from '@/components/icons';
import { Footer, StepScreen } from '@/components/layouts';
import { Card } from '@/components/Surface';
import { Text } from '@/components/Text';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function LinkError() {
  const { palette } = useTheme();
  return (
    <StepScreen
      footer={
        <Footer>
          <Button title="Try Chase again" onPress={() => router.replace('/onboarding/link')} />
          <Button
            variant="secondary"
            title="Continue without Chase"
            onPress={() => router.replace('/onboarding/analysing')}
          />
          <TextButton
            title="Get help"
            onPress={() => Alert.alert('Get help', 'Support links arrive with Plaid in M1.')}
          />
        </Footer>
      }
    >
      <View style={styles.center}>
        <IconTile icon={UnlinkIcon} tone="alert" size={150} />
        <Text variant="display" center style={{ marginTop: space.xl }}>
          We couldn&apos;t reach Chase
        </Text>
        <Text
          variant="body"
          muted
          center
          style={{ marginTop: space.md, fontSize: 17, lineHeight: 25 }}
        >
          This usually happens when the bank is busy. Nothing was changed and your info is safe.
          Give it another try in a moment.
        </Text>
      </View>
      <Card style={styles.ok}>
        <View style={[styles.okDot, { backgroundColor: palette.moneyIn }]}>
          <CheckIcon color="#FFFFFF" size={18} />
        </View>
        <Text variant="body" style={{ flex: 1, fontSize: 17, lineHeight: 24 }} muted>
          Amex and Bilt connected fine. Only Chase needs another try.
        </Text>
      </Card>
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', marginTop: space.xxl * 2 },
  ok: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    marginTop: space.xl,
    paddingVertical: space.lg,
  },
  okDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
