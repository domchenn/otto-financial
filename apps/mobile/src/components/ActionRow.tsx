import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from './Button';
import type { Icon } from './icons';
import { Text } from './Text';
import { radius, space, type ToneName } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/**
 * One "Porter's on it" item (handoff §4.3): tinted icon, bold title, muted reason, then an
 * ink primary and an optional outline secondary. Every insight ends in an action.
 */
export function ActionRow({
  icon,
  tone,
  title,
  reason,
  primary,
  secondary,
}: {
  icon: Icon;
  tone: ToneName;
  title: string;
  reason: string;
  primary: { title: string; onPress: () => void };
  secondary?: { title: string; onPress: () => void };
}) {
  const { palette } = useTheme();
  const t = palette.tones[tone];
  return (
    <View style={[styles.row, { borderTopColor: palette.hairline }]}>
      <View style={[styles.icon, { backgroundColor: t.bg }]}>
        {createElement(icon, { color: t.text, size: 20 })}
      </View>
      <View style={styles.body}>
        <View style={styles.copy}>
          <Text variant="row" weight="bold" style={styles.title}>
            {title}
          </Text>
          <Text variant="small" muted style={styles.reason}>
            {reason}
          </Text>
        </View>
        <View style={styles.actions}>
          <Button small title={primary.title} onPress={primary.onPress} />
          {secondary ? (
            <Button small variant="outline" title={secondary.title} onPress={secondary.onPress} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'flex-start',
    paddingVertical: space.md,
    borderTopWidth: 1,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: space.sm },
  copy: { gap: 2 },
  title: { fontSize: 15, lineHeight: 20 },
  reason: { fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 6 },
});
