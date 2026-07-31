import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/constants/theme';
import type { AttentionItem } from '@/data/home-data';

type NeedsAttentionSectionProps = {
  count: string;
  items: readonly AttentionItem[];
};

export function NeedsAttentionSection({ count, items }: NeedsAttentionSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Needs attention</Text>
        <Text style={styles.count}>{count}</Text>
      </View>

      <View style={styles.list}>
        {items.map((item) => (
          <View key={item.title} style={styles.item}>
            <View style={styles.rail} />
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.reviewLabel}>Review all actions</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    ...typography.sectionTitle,
  },
  count: {
    color: colors.textSecondary,
    ...typography.caption,
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  item: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  rail: {
    width: spacing.xxs,
    height: 34,
    backgroundColor: colors.textPrimary,
    borderRadius: radii.pill,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
    ...typography.label,
  },
  itemDescription: {
    color: colors.textSecondary,
    ...typography.caption,
    fontWeight: '400',
  },
  statusPill: {
    minHeight: 28,
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  statusText: {
    color: colors.textPrimary,
    ...typography.caption,
  },
  reviewLabel: {
    alignSelf: 'flex-start',
    color: colors.textPrimary,
    marginTop: spacing.sm,
    ...typography.caption,
    fontWeight: '700',
  },
});
