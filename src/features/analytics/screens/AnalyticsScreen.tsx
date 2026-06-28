import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { spacing, typography, borderRadius } from '../../../shared/theme/spacing';
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

interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function AnalyticsScreen() {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [selectedTrendMonth, setSelectedTrendMonth] = useState<number>(-1);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const startOfMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

      const [monthlyTotals, allCategories, categoryBreakdownRows] = await Promise.all([
        transactionRepository.getDateRangeTotals(startOfMonth, endOfMonth),
        categoryRepository.findAllMapped(),
        transactionRepository.getCategoryBreakdown(startOfMonth, endOfMonth),
      ]);

      setMonthlyIncome(monthlyTotals.income);
      setMonthlyExpenses(monthlyTotals.expense);

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

      const trend: MonthlyTrend[] = [];
      for (let i = 5; i >= 0; i--) {
        const m = new Date(currentYear, currentMonth - i, 1);
        const s = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}-01`;
        const e = new Date(m.getFullYear(), m.getMonth() + 1, 0).toISOString().split('T')[0];
        const totals = await transactionRepository.getDateRangeTotals(s, e);
        trend.push({
          month: `${MONTHS[m.getMonth()]} ${m.getFullYear()}`,
          income: totals.income,
          expense: totals.expense,
        });
      }
      setMonthlyTrend(trend);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
          icon={'\uD83D\uDCCA'}
          title="No financial data"
          description="Add transactions to see spending patterns, trends, and insights"
          actionLabel="Add Sample Data"
          onAction={() => {}}
          secondaryLabel="Add First Transaction"
          onSecondaryAction={() => {}}
        />
      </View>
    );
  }

  const maxTrend = Math.max(
    ...monthlyTrend.map((m) => Math.max(m.income, m.expense, 1)),
    1
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Analytics
      </Text>

      <View style={styles.summaryRow}>
        <Card style={[styles.summaryCard, { borderLeftColor: colors.income, borderLeftWidth: 3 }]}>
          <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Income</Text>
          <Text style={[styles.summaryValue, { color: colors.income }]}>
            {formatCurrency(monthlyIncome)}
          </Text>
        </Card>
        <Card style={[styles.summaryCard, { borderLeftColor: colors.expense, borderLeftWidth: 3 }]}>
          <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Expenses</Text>
          <Text style={[styles.summaryValue, { color: colors.expense }]}>
            {formatCurrency(monthlyExpenses)}
          </Text>
        </Card>
      </View>

      <Card style={styles.netCard}>
        <Text style={[styles.netLabel, { color: colors.textTertiary }]}>Net Income</Text>
        <Text style={[
          styles.netValue,
          { color: monthlyIncome - monthlyExpenses >= 0 ? colors.income : colors.expense },
        ]}>
          {formatCurrency(monthlyIncome - monthlyExpenses)}
        </Text>
      </Card>

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Income vs Expenses (6 months)
        </Text>
        <View style={styles.chartContainer}>
          {monthlyTrend.map((item, idx) => {
            const incomeHeight = (item.income / maxTrend) * 120;
            const expenseHeight = (item.expense / maxTrend) * 120;
            const isSelected = selectedTrendMonth === idx;

            return (
              <TouchableOpacity
                key={idx}
                style={styles.barColumn}
                onPress={() => setSelectedTrendMonth(isSelected ? -1 : idx)}
              >
                <View style={styles.barsWrapper}>
                  <View
                    style={[
                      styles.bar,
                      styles.incomeBar,
                      {
                        height: Math.max(incomeHeight, 4),
                        opacity: isSelected || selectedTrendMonth === -1 ? 1 : 0.4,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      styles.expenseBar,
                      {
                        height: Math.max(expenseHeight, 4),
                        opacity: isSelected || selectedTrendMonth === -1 ? 1 : 0.4,
                      },
                    ]}
                  />
                </View>
                {isSelected && (
                  <Text style={[styles.barTooltip, { color: colors.primary }]}>
                    {'\u25B2'}
                  </Text>
                )}
                <Text
                  style={[
                    styles.barLabel,
                    { color: isSelected ? colors.text : colors.textTertiary },
                  ]}
                  numberOfLines={1}
                >
                  {item.month.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {selectedTrendMonth >= 0 && selectedTrendMonth < monthlyTrend.length && (
          <View style={[styles.tooltip, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.tooltipTitle, { color: colors.text }]}>
              {monthlyTrend[selectedTrendMonth].month}
            </Text>
            <View style={styles.tooltipRow}>
              <View style={[styles.tooltipDot, { backgroundColor: colors.income }]} />
              <Text style={[styles.tooltipText, { color: colors.textSecondary }]}>
                Income: {formatCurrency(monthlyTrend[selectedTrendMonth].income)}
              </Text>
            </View>
            <View style={styles.tooltipRow}>
              <View style={[styles.tooltipDot, { backgroundColor: colors.expense }]} />
              <Text style={[styles.tooltipText, { color: colors.textSecondary }]}>
                Expenses: {formatCurrency(monthlyTrend[selectedTrendMonth].expense)}
              </Text>
            </View>
          </View>
        )}
      </Card>

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

      <View style={styles.bottomSpacer} />
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
    marginBottom: spacing.md,
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
  netCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  netLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  netValue: {
    ...typography.h2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: spacing.xl,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 140,
  },
  barsWrapper: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'flex-end',
    height: 130,
  },
  bar: {
    width: 8,
    borderRadius: 4,
    minHeight: 4,
  },
  incomeBar: {
    backgroundColor: '#4ADE80',
  },
  expenseBar: {
    backgroundColor: '#FB7185',
  },
  barTooltip: {
    fontSize: 8,
    marginBottom: 2,
  },
  barLabel: {
    ...typography.caption,
    fontSize: 9,
    marginTop: 4,
  },
  tooltip: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  tooltipTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  tooltipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tooltipText: {
    ...typography.caption,
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
  bottomSpacer: {
    height: 60,
  },
});
