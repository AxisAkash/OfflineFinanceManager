import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { spacing, typography } from '../../../shared/theme/spacing';
import { Card, SkeletonList } from '../../../shared/components';
import { TransactionItem } from '../../transaction/components/TransactionItem';
import { transactionRepository } from '../../../core/repositories/transactionRepository';
import { walletRepository } from '../../../core/repositories/walletRepository';
import { budgetRepository } from '../../../core/repositories/budgetRepository';
import { categoryRepository } from '../../../core/repositories/categoryRepository';
import { Transaction, Category } from '../../../shared/types';
import { formatCurrency } from '../../../shared/utils';

export function DashboardScreen() {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [budgetOverview, setBudgetOverview] = useState({ totalBudget: 0, totalSpent: 0, remaining: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const now = new Date();
      const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const [
        balance,
        monthlyTotals,
        recent,
        allCategories,
        budgetOverviewData,
      ] = await Promise.all([
        walletRepository.getTotalBalance(),
        transactionRepository.getDateRangeTotals(startOfMonth, endOfMonth),
        transactionRepository.getRecent(5),
        categoryRepository.findAllMapped(),
        budgetRepository.getBudgetOverview(),
      ]);

      setTotalBalance(balance);
      setMonthlyIncome(monthlyTotals.income);
      setMonthlyExpenses(monthlyTotals.expense);
      setRecentTransactions(recent);
      setBudgetOverview(budgetOverviewData);

      const catMap: Record<string, Category> = {};
      allCategories.forEach((c) => { catMap[c.id] = c; });
      setCategories(catMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SkeletonList count={4} />
      </View>
    );
  }

  const savingsRate = monthlyIncome > 0
    ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
    : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={loadData} />
      }
    >
      <Card>
        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
          Total Balance
        </Text>
        <Text style={[styles.balanceAmount, { color: colors.text }]}>
          {formatCurrency(totalBalance)}
        </Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.income }]}>
              Income
            </Text>
            <Text style={[styles.summaryAmount, { color: colors.income }]}>
              +{formatCurrency(monthlyIncome)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.expense }]}>
              Expenses
            </Text>
            <Text style={[styles.summaryAmount, { color: colors.expense }]}>
              -{formatCurrency(monthlyExpenses)}
            </Text>
          </View>
        </View>
        {monthlyIncome > 0 && (
          <View style={[styles.savingsRateRow, { borderTopColor: colors.divider }]}>
            <Text style={[styles.savingsRateLabel, { color: colors.textSecondary }]}>
              Savings Rate
            </Text>
            <Text style={[styles.savingsRateValue, { color: savingsRate >= 0 ? colors.income : colors.expense }]}>
              {savingsRate.toFixed(1)}%
            </Text>
          </View>
        )}
      </Card>

      {budgetOverview.totalBudget > 0 && (
        <Card style={styles.budgetCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Budget Overview
          </Text>
          <View style={styles.budgetBarContainer}>
            <View style={[styles.budgetBar, { backgroundColor: colors.surfaceVariant }]}>
              <View
                style={[
                  styles.budgetBarFill,
                  {
                    backgroundColor: budgetOverview.remaining >= 0 ? colors.primary : colors.expense,
                    width: `${Math.min((budgetOverview.totalSpent / budgetOverview.totalBudget) * 100, 100)}%` as unknown as number,
                  },
                ]}
              />
            </View>
            <Text style={[styles.budgetText, { color: colors.textSecondary }]}>
              {formatCurrency(budgetOverview.totalSpent)} / {formatCurrency(budgetOverview.totalBudget)}
            </Text>
          </View>
        </Card>
      )}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Recent Transactions
      </Text>
      {recentTransactions.length === 0 ? (
        <Card>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No transactions yet. Start tracking your spending!
          </Text>
        </Card>
      ) : (
        recentTransactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            categoryName={categories[transaction.categoryId]?.name}
            categoryColor={categories[transaction.categoryId]?.color}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
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
  savingsRateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  savingsRateLabel: {
    ...typography.bodySmall,
  },
  savingsRateValue: {
    ...typography.h4,
  },
  budgetCard: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  budgetBarContainer: {
    gap: spacing.sm,
  },
  budgetBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  budgetBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetText: {
    ...typography.caption,
    textAlign: 'right',
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
});
