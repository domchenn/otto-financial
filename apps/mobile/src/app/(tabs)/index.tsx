import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii, spacing, typography } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Good evening, Dominic</Text>

        <View style={styles.askEntry}>
          <Text style={styles.askPrompt}>Ask about your money</Text>
          <View style={styles.askPill}>
            <Text style={styles.askPillText}>Ask</Text>
          </View>
        </View>

        <View style={styles.netWorthSection}>
          <View style={styles.netWorthHeader}>
            <View>
              <Text style={styles.netWorthLabel}>Net worth</Text>
              <Text style={styles.netWorthValue}>$128,406</Text>
              <Text style={styles.netWorthDelta}>+$3,182 this month</Text>
            </View>

            <View style={styles.periodPill}>
              <Text style={styles.periodText}>6 months</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  greeting: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    ...typography.label,
  },
  askEntry: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.control,
    paddingHorizontal: spacing.md,
  },
  askPrompt: {
    flex: 1,
    color: colors.textSecondary,
    ...typography.body,
    fontWeight: '600',
  },
  askPill: {
    justifyContent: 'center',
    minHeight: 32,
    backgroundColor: colors.background,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  askPillText: {
    color: colors.textPrimary,
    ...typography.caption,
  },
  netWorthSection: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  netWorthHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  netWorthLabel: {
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
    ...typography.label,
  },
  netWorthValue: {
    color: colors.textPrimary,
    ...typography.display,
  },
  netWorthDelta: {
    color: colors.success,
    marginTop: spacing.xs,
    ...typography.caption,
  },
  periodPill: {
    justifyContent: 'center',
    minHeight: 32,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
  },
  periodText: {
    color: colors.textPrimary,
    ...typography.caption,
  },
});
