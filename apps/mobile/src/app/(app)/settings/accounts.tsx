import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { LabelTile } from '@/components/badges';
import { Button } from '@/components/Button';
import { LockIcon, PlusIcon } from '@/components/icons';
import { Footer, StepScreen } from '@/components/layouts';
import { Card } from '@/components/Surface';
import { Text } from '@/components/Text';
import { useConnections, useDisconnect, useLinkBank, usePrepareLink } from '@/lib/api';
import { agoLabel, institutionCode, type Connection } from '@/lib/finance';
import { linkAlerts } from '@/lib/linkAlerts';
import { useRefresh } from '@/lib/useRefresh';
import { space, type ToneName } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const TONES: ToneName[] = ['sky', 'mint', 'lilac', 'butter'];

export default function ConnectedAccounts() {
  const { palette } = useTheme();
  const connections = useConnections();
  const disconnect = useDisconnect();
  const link = useLinkBank();
  usePrepareLink();
  const refresh = useRefresh();

  const confirmDisconnect = (inst: Connection) =>
    Alert.alert(
      `Disconnect ${inst.institution_name ?? 'this bank'}?`,
      "This deletes that bank's data from Otto.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => disconnect.mutate(inst.id),
        },
      ],
    );

  return (
    <StepScreen
      title="Connected accounts"
      refreshControl={refresh}
      footer={
        <Footer>
          <Button
            variant="secondary"
            icon={PlusIcon}
            title="Connect another account"
            loading={link.isPending}
            onPress={() => link.mutate(undefined, linkAlerts)}
          />
        </Footer>
      }
    >
      <View style={{ gap: space.lg, marginTop: space.lg }}>
        {connections.data?.length === 0 ? (
          <Text variant="body" muted>
            No banks connected yet.
          </Text>
        ) : null}
        {connections.isError ? (
          <Text variant="body" color={palette.alert}>
            Otto couldn&apos;t load your banks. Pull down to try again.
          </Text>
        ) : null}
        {(connections.data ?? []).map((inst, i) => {
          const attention = inst.status !== 'ok';
          const updated = agoLabel(inst.last_synced_at);
          return (
            <Card
              key={inst.id}
              style={
                attention ? { borderWidth: 2, borderColor: palette.tones.alert.track } : undefined
              }
            >
              <View style={styles.head}>
                <LabelTile
                  label={institutionCode(inst.institution_name)}
                  tone={TONES[i % TONES.length] ?? 'sky'}
                  size={56}
                />
                <View style={{ flex: 1 }}>
                  <Text variant="heading" style={{ fontSize: 21 }}>
                    {inst.institution_name ?? 'Bank'}
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
                      {attention ? `Needs a quick sign-in · ${updated}` : `Up to date · ${updated}`}
                    </Text>
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={() => confirmDisconnect(inst)}
                >
                  <Text variant="row" weight="bold" muted>
                    Disconnect
                  </Text>
                </Pressable>
              </View>
              <Text variant="body" muted style={{ marginTop: space.md, fontSize: 16 }}>
                {inst.accounts.map((a) => (a.mask ? `${a.name} ·· ${a.mask}` : a.name)).join(', ')}
              </Text>
              {attention ? (
                <Button
                  title={`Sign in to ${inst.institution_name ?? 'your bank'}`}
                  loading={link.isPending}
                  onPress={() => link.mutate(inst.id, linkAlerts)}
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
