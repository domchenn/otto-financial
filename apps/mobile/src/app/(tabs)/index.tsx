import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NeedsAttentionSection } from '@/components/needs-attention-section';
import { NetWorthChart } from '@/components/net-worth-chart';
import { RecentActivitySection } from '@/components/recent-activity-section';
import { SuggestionsSection } from '@/components/suggestions-section';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useHomeData } from '@/hooks/use-home-data';

export default function HomeScreen() {
  const { data: homeData } = useHomeData();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>{homeData.greeting}</Text>

        <View style={styles.askEntry}>
          <Text style={styles.askPrompt}>{homeData.askPrompt}</Text>
          <View style={styles.askPill}>
            <Text style={styles.askPillText}>Ask</Text>
          </View>
        </View>

        <View style={styles.netWorthSection}>
          <View style={styles.netWorthHeader}>
            <View>
              <Text style={styles.netWorthLabel}>{homeData.netWorth.label}</Text>
              <Text style={styles.netWorthValue}>{homeData.netWorth.value}</Text>
              <Text style={styles.netWorthDelta}>{homeData.netWorth.delta}</Text>
            </View>

            <View style={styles.periodPill}>
              <Text style={styles.periodText}>{homeData.netWorth.period}</Text>
            </View>
          </View>

          <View style={styles.netWorthChart}>
            <NetWorthChart />
          </View>
        </View>

        <NeedsAttentionSection
          count={homeData.attentionCount}
          items={homeData.attentionItems}
        />
        <SuggestionsSection suggestions={homeData.suggestions} />
        <RecentActivitySection transactions={homeData.recentActivity} />
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
  netWorthChart: {
    height: 76,
    marginTop: spacing.md,
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
