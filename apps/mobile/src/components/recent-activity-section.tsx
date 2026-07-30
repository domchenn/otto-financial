import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/constants/theme';

const transactions = [
  {
    initials: 'DL',
    merchant: 'Delta Air Lines',
    details: 'Travel · Amex Platinum',
    amount: '$241.30',
    status: '5x eligible',
    positive: false,
  },
  {
    initials: 'RS',
    merchant: 'Raku Sake',
    details: 'Dining · Sapphire Preferred',
    amount: '$68.40',
    status: 'better card available',
    positive: false,
  },
  {
    initials: 'UB',
    merchant: 'Uber statement credit',
    details: 'Benefit posted',
    amount: '+$6.00',
    status: 'matched',
    positive: true,
  },
] as const;

export function RecentActivitySection() {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.heading}>Recent activity</Text>
        <Text style={styles.seeAll}>See all</Text>
      </View>

      <View style={styles.list}>
        {transactions.map((transaction) => (
          <View key={transaction.merchant} style={styles.row}>
            <View style={styles.initialsBox}>
              <Text style={styles.initials}>{transaction.initials}</Text>
            </View>

            <View style={styles.details}>
              <Text style={styles.merchant}>{transaction.merchant}</Text>
              <Text style={styles.metadata}>{transaction.details}</Text>
            </View>

            <View style={styles.amountGroup}>
              <Text style={[styles.amount, transaction.positive && styles.positiveAmount]}>
                {transaction.amount}
              </Text>
              <Text style={styles.status}>{transaction.status}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingBottom: spacing.xxl,
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
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  initialsBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.medium,
  },
  initials: {
    color: colors.textPrimary,
    ...typography.caption,
    fontWeight: '700',
  },
  details: {
    flex: 1,
  },
  merchant: {
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
    ...typography.label,
    fontWeight: '700',
  },
  metadata: {
    color: colors.textSecondary,
    ...typography.caption,
    fontWeight: '400',
  },
  amountGroup: {
    alignItems: 'flex-end',
  },
  amount: {
    color: colors.textPrimary,
    ...typography.label,
    fontWeight: '700',
  },
  positiveAmount: {
    color: colors.success,
  },
  status: {
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    ...typography.caption,
    fontSize: 10,
    fontWeight: '400',
  },
});
