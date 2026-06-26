import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { spacing, typography } from '../../../shared/theme/spacing';
import { Card, SkeletonCard } from '../../../shared/components';

interface DashboardScreenProps {
  totalBalance?: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  isLoading?: boolean;
}

export function DashboardScreen({
  totalBalance = 0,
  monthlyIncome = 0,
  monthlyExpenses = 0,
  isLoading = false,
}: DashboardScreenProps) {
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Card style={styles.balanceCard}>
        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
          Total Balance
        </Text>
        <Text style={[styles.balanceAmount, { color: colors.text }]}>
          ${totalBalance.toFixed(2)}
        </Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.income }]}>
              Income
            </Text>
            <Text style={[styles.summaryAmount, { color: colors.income }]}>
              +${monthlyIncome.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.expense }]}>
              Expenses
            </Text>
            <Text style={[styles.summaryAmount, { color: colors.expense }]}>
              -${monthlyExpenses.toFixed(2)}
            </Text>
          </View>
        </View>
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Recent Transactions
      </Text>
      <Card>
        <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
          No transactions yet
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  balanceCard: {
    marginBottom: spacing.xl,
  },
  balanceLabel: {
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    ...typography.number,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    ...typography.caption,
    marginBottom: spacing.xxs,
  },
  summaryAmount: {
    ...typography.h4,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  placeholder: {
    ...typography.body,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
});
