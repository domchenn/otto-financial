import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/constants/theme';
import type { Suggestion } from '@/data/home-data';

type SuggestionsSectionProps = {
  suggestions: readonly Suggestion[];
};

export function SuggestionsSection({ suggestions }: SuggestionsSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.heading}>Suggestions</Text>
        <Text style={styles.seeAll}>See all</Text>
      </View>

      <View style={styles.list}>
        {suggestions.map((suggestion) => (
          <View key={suggestion.title} style={styles.item}>
            <View style={styles.itemContent}>
              <Text style={styles.category}>{suggestion.category}</Text>
              <Text style={styles.title}>{suggestion.title}</Text>
              <Text style={styles.description}>{suggestion.description}</Text>
            </View>

            <View style={styles.itemSide}>
              <Text
                style={[
                  styles.value,
                  suggestion.tone === 'success' && styles.successValue,
                  suggestion.tone === 'danger' && styles.dangerValue,
                ]}>
                {suggestion.value}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  heading: {
    color: colors.textPrimary,
    ...typography.sectionTitle,
  },
  seeAll: {
    color: colors.textPrimary,
    ...typography.caption,
    fontWeight: '700',
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  item: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  itemContent: {
    flex: 1,
  },
  category: {
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
    ...typography.body,
    fontWeight: '700',
  },
  description: {
    color: colors.textSecondary,
    ...typography.caption,
    fontWeight: '400',
  },
  itemSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    color: colors.textPrimary,
    ...typography.label,
    fontWeight: '700',
  },
  successValue: {
    color: colors.success,
  },
  dangerValue: {
    color: colors.danger,
  },
  chevron: {
    color: colors.textSecondary,
    fontSize: 20,
    lineHeight: 22,
  },
});
