import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChevronIcon } from './icons';
import { Toggle } from './selection';
import { Text } from './Text';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type ListRowProps = {
  title: string;
  subtitle?: string;
  subtitleColor?: string;
  leading?: ReactNode;
  value?: string;
  valueColor?: string;
  /** Small line under the value ("Gold earns more"). */
  valueNote?: string;
  valueNoteColor?: string;
  trailing?: ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  /** Extra content under the title (e.g. a category bar). */
  children?: ReactNode;
};

/** Leading art, title + subtitle, amount on the right. */
export function ListRow({
  title,
  subtitle,
  subtitleColor,
  leading,
  value,
  valueColor,
  valueNote,
  valueNoteColor,
  trailing,
  chevron,
  onPress,
  children,
}: ListRowProps) {
  const { palette } = useTheme();
  const body = (
    <View style={styles.row}>
      {leading}
      <View style={styles.main}>
        <View style={styles.titleLine}>
          <Text variant="row" weight="bold" style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {children && value ? (
            <Text variant="row" weight="bold" tabular style={styles.title}>
              {value}
            </Text>
          ) : null}
        </View>
        {subtitle ? (
          <Text variant="body" color={subtitleColor ?? palette.muted} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {children}
      </View>
      {value && !children ? (
        <View style={styles.valueCol}>
          <Text variant="row" weight="bold" tabular color={valueColor} style={styles.title}>
            {value}
          </Text>
          {valueNote ? (
            <Text variant="caption" weight="bold" color={valueNoteColor ?? palette.muted}>
              {valueNote}
            </Text>
          ) : null}
        </View>
      ) : null}
      {trailing}
      {chevron ? <ChevronIcon color={palette.faint} size={18} /> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, value].filter(Boolean).join(', ')}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      {body}
    </Pressable>
  );
}

/** Settings row: label on the left, value + chevron on the right. */
export function SettingRow({
  label,
  value,
  valueColor,
  onPress,
}: {
  label: string;
  value?: string;
  valueColor?: string;
  onPress?: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.setting, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Text variant="row" weight="semibold" style={styles.settingLabel}>
        {label}
      </Text>
      {value ? (
        <Text variant="body" weight="semibold" color={valueColor ?? palette.muted}>
          {value}
        </Text>
      ) : null}
      {onPress ? <ChevronIcon color={palette.faint} size={18} /> : null}
    </Pressable>
  );
}

export function ToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
  disabled,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.setting}>
      <View style={{ flex: 1 }}>
        <Text variant="row" weight="bold" style={{ fontSize: 17 }}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="body" muted>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Toggle value={value} onValueChange={onValueChange} label={title} disabled={disabled} />
    </View>
  );
}

/** "Recent ............ See all" */
export function SectionHeader({
  title,
  detail,
  action,
  onAction,
}: {
  title: string;
  detail?: string;
  action?: string;
  onAction?: () => void;
}) {
  const { palette } = useTheme();
  return (
    <View style={styles.section}>
      <Text variant="heading" style={{ fontSize: 20 }}>
        {title}
      </Text>
      {detail ? (
        <Text variant="body" weight="semibold" muted tabular>
          {detail}
        </Text>
      ) : null}
      {action ? (
        <Pressable onPress={onAction} hitSlop={12} accessibilityRole="button">
          <Text variant="row" weight="bold" color={palette.link}>
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Muted group label above a settings card ("Your money"). */
export function GroupLabel({ children }: { children: string }) {
  return (
    <Text variant="body" weight="bold" muted style={styles.group}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingVertical: space.md },
  main: { flex: 1, gap: 2 },
  titleLine: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  title: { fontSize: 17 },
  valueCol: { alignItems: 'flex-end' },
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 64,
    paddingVertical: space.md,
  },
  settingLabel: { flex: 1, fontSize: 17 },
  section: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: space.xl,
    marginBottom: space.md,
  },
  group: { marginTop: space.xl, marginBottom: space.sm, marginLeft: 2 },
});
