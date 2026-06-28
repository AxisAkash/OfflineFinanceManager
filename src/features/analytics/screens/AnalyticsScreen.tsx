import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { spacing, typography } from '../../../shared/theme/spacing';
import { Card, EmptyState, LoadingScreen, ErrorMessage } from '../../../shared/components';
import { transactionRepository } from '../../../core/repositories/transactionRepository';
import { categoryRepository } from '../../../core/repositories/categoryRepository';
import { Category } from '../../../shared/types';
import { formatCurrency, formatPercentage } from '../../../shared/utils';

interface CategoryBreakdown {
  category: Category;
  amount: number;
  percentage: number;
}

export function AnalyticsScreen() {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const now = new Date();
      const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const [monthlyTotals, allCategories] = await Promise.all([
        transactionRepository.getDateRangeTotals(startOfMonth, endOfMonth),
        categoryRepository.findAllMapped(),
      ]);

      setMonthlyIncome(monthlyTotals.income);
      setMonthlyExpenses(monthlyTotals.expense);

      const categoryBreakdownRows = await transactionRepository.getCategoryBreakdown(startOfMonth, endOfMonth);
      const catMap = new Map(allCategories.map((c) => [c.id, c]));
      const breakdown: CategoryBreakdown[] = categoryBreakdownRows
        .filter((r) => catMap.has(r.categoryId))
        .map((r) => {
          const category = catMap.get(r.categoryId)!;
          return {
            category,
            amount: r.amount,
            percentage: monthlyTotals.expense > 0 ? (r.amount / monthlyTotals.expense) * 100 : 0,
          };
        });

      setCategoryBreakdown(breakdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen type="chart" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadAnalytics} />;
  }

  if (monthlyIncome === 0 && monthlyExpenses === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          title="No Analytics Data"
          description="Add transactions to see spending patterns and trends"
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Monthly Overview
      </Text>

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryLabel, { color: colors.income }]}>
            Income
          </Text>
          <Text style={[styles.summaryValue, { color: colors.income }]}>
            {formatCurrency(monthlyIncome)}
          </Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryLabel, { color: colors.expense }]}>
            Expenses
          </Text>
          <Text style={[styles.summaryValue, { color: colors.expense }]}>
            {formatCurrency(monthlyExpenses)}
          </Text>
        </Card>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Spending by Category
      </Text>

      {categoryBreakdown.map((item) => (
        <View
          key={item.category.id}
          style={[styles.categoryRow, { borderBottomColor: colors.divider }]}
        >
          <View style={styles.categoryHeader}>
            <View style={styles.categoryInfo}>
              <View style={[styles.categoryDot, { backgroundColor: item.category.color }]} />
              <Text style={[styles.categoryName, { color: colors.text }]}>
                {item.category.name}
              </Text>
            </View>
            <Text style={[styles.categoryAmount, { color: colors.text }]}>
              {formatCurrency(item.amount)}
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: item.category.color,
                  width: `${item.percentage}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.categoryPercentage, { color: colors.textSecondary }]}>
            {formatPercentage(item.percentage)} of expenses
          </Text>
        </View>
      ))}
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
  title: {
    ...typography.h2,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  summaryCard: {
    flex: 1,
  },
  summaryLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    ...typography.h3,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  categoryRow: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    ...typography.body,
    fontWeight: '500',
  },
  categoryAmount: {
    ...typography.body,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryPercentage: {
    ...typography.caption,
  },
});
