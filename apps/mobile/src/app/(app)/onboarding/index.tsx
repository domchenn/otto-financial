import { useUser } from '@clerk/expo';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Avatar, LabelTile } from '@/components/badges';
import { Button } from '@/components/Button';
import { BackButton, IconButton } from '@/components/IconButton';
import { BellIcon } from '@/components/icons';
import { TabScreen } from '@/components/layouts';
import { Card } from '@/components/Surface';
import { Text } from '@/components/Text';
import { space, type ToneName } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const PREVIEW: { tone: ToneName; title: string; body: string }[] = [
  { tone: 'mint', title: 'Weekly budget', body: "What's left, updated as you tap." },
  { tone: 'lilac', title: 'Points', body: 'Every program, valued in dollars.' },
  { tone: 'butter', title: 'Credits', body: 'Reminders before they expire.' },
  { tone: 'sky', title: 'Payments', body: 'Due dates, never a surprise.' },
];

/** Home before any account is connected. */
export default function HomeEmpty() {
  const { palette } = useTheme();
  const { user } = useUser();
  const firstName = user?.firstName ?? 'there';

  return (
    <TabScreen>
      <View style={styles.header}>
        <View style={styles.who}>
          <BackButton />
          <Avatar letter={firstName.charAt(0).toUpperCase()} />
          <Text variant="row" weight="bold" style={{ fontSize: 20 }}>
            Hi, {firstName}
          </Text>
        </View>
        <IconButton icon={BellIcon} label="Notifications" />
      </View>

      <Text variant="display" style={{ marginTop: space.xxl, fontSize: 40, lineHeight: 46 }}>
        Let&apos;s get your money in one place.
      </Text>
      <Text variant="body" muted style={{ marginTop: space.md, fontSize: 18, lineHeight: 26 }}>
        Connect your cards and Otto will track spending, points and credits for you.
      </Text>

      <Card style={{ marginTop: space.xl }}>
        <View style={styles.stack}>
          {(
            [
              ['AX', 'sky'],
              ['CH', 'mint'],
              ['C1', 'butter'],
              ['+3', 'lilac'],
            ] as const
          ).map(([label, tone], i) => (
            <View
              key={label}
              style={[
                styles.stackItem,
                { marginLeft: i === 0 ? 0 : -10, borderColor: palette.surface },
              ]}
            >
              <LabelTile label={label} tone={tone} size={56} />
            </View>
          ))}
        </View>
        <Text variant="heading" style={{ marginTop: space.lg }}>
          Connect your accounts
        </Text>
        <Text variant="body" muted style={{ marginTop: space.xs, fontSize: 17, lineHeight: 24 }}>
          Amex, Chase, Capital One, Bank of America, Bilt and Schwab. Read-only, secured by Plaid.
        </Text>
        <Button
          title="Connect accounts"
          onPress={() => router.push('/onboarding/connect')}
          style={{ marginTop: space.xl }}
        />
      </Card>

      <Text
        variant="row"
        weight="bold"
        muted
        style={{ marginTop: space.xl, marginBottom: space.md }}
      >
        What you&apos;ll see here
      </Text>
      <View style={styles.grid}>
        {PREVIEW.map((p) => (
          <Card key={p.title} tone={p.tone} style={styles.tile}>
            <Text
              variant="row"
              weight="bold"
              color={palette.tones[p.tone].text}
              style={{ fontSize: 18 }}
            >
              {p.title}
            </Text>
            <Text
              variant="body"
              color={palette.tones[p.tone].text}
              style={{ marginTop: space.xs, fontSize: 16 }}
            >
              {p.body}
            </Text>
          </Card>
        ))}
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  who: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stack: { flexDirection: 'row' },
  stackItem: { borderWidth: 3, borderRadius: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: { flexBasis: '47%', flexGrow: 1, minHeight: 120 },
});
