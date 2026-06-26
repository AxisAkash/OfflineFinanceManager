import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { spacing, typography, borderRadius } from '../../../shared/theme/spacing';
import { Card, EmptyState, LoadingScreen, ErrorMessage } from '../../../shared/components';
import { budgetRepository } from '../../../core/repositories/budgetRepository';
import { categoryRepository } from '../../../core/repositories/categoryRepository';
import { Budget, Category } from '../../../shared/types';
import { formatCurrency, formatPercentage } from '../../../shared/utils';

export function BudgetScreen() {
  const { colors } = useTheme();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [overview, setOverview] = useState({ totalBudget: 0, totalSpent: 0, remaining: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [activeBudgets, allCategories, budgetOverview] = await Promise.all([
        budgetRepository.findAllActive(),
        categoryRepository.findAllMapped(),
        budgetRepository.getBudgetOverview(),
      ]);
      setBudgets(activeBudgets);
      const catMap: Record<string, Category> = {};
      allCategories.forEach((c) => { catMap[c.id] = c; });
      setCategories(catMap);
      setOverview(budgetOverview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budgets');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen type="list" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadData} />;
  }

  if (budgets.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          title="No Budgets"
          description="Create budgets to track your spending by category"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Budgets
        </Text>
      </View>

      <Card style={styles.overviewCard}>
        <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
          Monthly Budget Overview
        </Text>
        <View style={styles.overviewRow}>
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewValue, { color: colors.text }]}>
              {formatCurrency(overview.totalBudget)}
            </Text>
            <Text style={[styles.overviewSub, { color: colors.textSecondary }]}>
              Budget
            </Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewValue, { color: colors.expense }]}>
              {formatCurrency(overview.totalSpent)}
            </Text>
            <Text style={[styles.overviewSub, { color: colors.textSecondary }]}>
              Spent
            </Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewValue, { color: overview.remaining >= 0 ? colors.income : colors.expense }]}>
              {formatCurrency(overview.remaining)}
            </Text>
            <Text style={[styles.overviewSub, { color: colors.textSecondary }]}>
              Remaining
            </Text>
          </View>
        </View>
      </Card>

      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const category = categories[item.categoryId];
          const percentage = item.amount > 0 ? (item.spent / item.amount) * 100 : 0;
          const isOverBudget = percentage > 100;
          const barColor = isOverBudget ? colors.expense : percentage > 80 ? colors.warning : colors.primary;

          return (
            <View style={[styles.budgetItem, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <View style={styles.budgetHeader}>
                <View style={styles.budgetCategory}>
                  <View style={[styles.categoryDot, { backgroundColor: category?.color || colors.primary }]} />
                  <Text style={[styles.budgetCategoryName, { color: colors.text }]}>
                    {category?.name || 'Unknown'}
                  </Text>
                </View>
                <Text style={[styles.budgetPercentage, { color: isOverBudget ? colors.expense : colors.text }]}>
                  {formatPercentage(percentage, 0)}
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: barColor,
                      width: `${Math.min(percentage, 100)}%` as unknown as number,
                    },
                  ]}
                />
              </View>
              <View style={styles.budgetDetails}>
                <Text style={[styles.budgetSpent, { color: colors.textSecondary }]}>
                  {formatCurrency(item.spent)} spent
                </Text>
                <Text style={[styles.budgetLimit, { color: colors.textSecondary }]}>
                  of {formatCurrency(item.amount)}
                </Text>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
  },
  overviewCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  overviewLabel: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  overviewRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewValue: {
    ...typography.h4,
    fontWeight: '700',
    marginBottom: spacing.xxs,
  },
  overviewSub: {
    ...typography.caption,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
  },
  budgetItem: {
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  budgetCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  budgetCategoryName: {
    ...typography.body,
    fontWeight: '500',
  },
  budgetPercentage: {
    ...typography.body,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetSpent: {
    ...typography.caption,
  },
  budgetLimit: {
    ...typography.caption,
  },
});
