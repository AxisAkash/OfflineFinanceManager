import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../../shared/theme';
import { useLanguage } from '../../../shared/localization/LanguageContext';
import { spacing, typography, borderRadius } from '../../../shared/theme/spacing';
import { Card, LoadingScreen } from '../../../shared/components';
import { transactionRepository } from '../../../core/repositories/transactionRepository';
import { categoryRepository } from '../../../core/repositories/categoryRepository';
import { walletRepository } from '../../../core/repositories/walletRepository';
import { formatCurrency, formatDate, getMonthName } from '../../../shared/utils';

interface MonthlyTotals {
  month: number;
  income: number;
  expense: number;
}

export function ReportsScreen() {
  const { colors } = useTheme();
  const { t, translate, language } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotals[]>([]);
  const [currentMonth, setCurrentMonth] = useState<{ income: number; expense: number }>({ income: 0, expense: 0 });
  const [categoryBreakdown, setCategoryBreakdown] = useState<{ name: string; amount: number; color: string }[]>([]);
  const [balance, setBalance] = useState(0);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const startOfMonth = `${y}-${m}-01`;
      const endOfMonth = new Date(y, now.getMonth() + 1, 0).toISOString().split('T')[0];

      const [totals, monthly, breakdown, allCategories, bal] = await Promise.all([
        transactionRepository.getDateRangeTotals(startOfMonth, endOfMonth),
        transactionRepository.getMonthlyTotals(y),
        transactionRepository.getCategoryBreakdown(startOfMonth, endOfMonth),
        categoryRepository.findAllMapped(),
        walletRepository.getTotalBalance(),
      ]);

      setCurrentMonth(totals);
      setMonthlyTotals(monthly);
      setYear(y);
      setBalance(bal);

      const catMap = new Map(allCategories.map((c) => [c.id, c]));
      const catColors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#E7E9ED', '#7BC8A4', '#C9CBCF', '#F67019',
      ];
      const topBreakdown = breakdown.slice(0, 10).map((b, i) => ({
        name: catMap.get(b.categoryId)?.name || t.common.unknown,
        amount: b.amount,
        color: catMap.get(b.categoryId)?.color || catColors[i % catColors.length],
      }));
      setCategoryBreakdown(topBreakdown);
    } catch {
      // Silently handle - charts just won't show
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const generateCSV = useCallback(async () => {
    setIsGenerating(true);
    try {
      const transactions = await transactionRepository.getRecent(1000);
      const allCategories = await categoryRepository.findAllMapped();
      const catMap = new Map(allCategories.map((c) => [c.id, c.name]));

      let csv = 'Date,Type,Category,Description,Amount\n';
      transactions.forEach((txn) => {
        const date = formatDate(txn.date);
        const catName = catMap.get(txn.categoryId) || t.common.unknown;
        csv += `${date},${txn.type},${catName},"${txn.description || ''}",${txn.amount}\n`;
      });

      const file = new File(Paths.cache, 'finance_export.csv');
      file.write(csv);

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/csv',
          dialogTitle: t.reports.csvGenerated,
        });
      } else {
        Alert.alert(t.reports.csvGenerated, translate('reports.csvExported', { count: transactions.length }));
      }
    } catch {
      Alert.alert(t.common.error, t.reports.generateFailed);
    } finally {
      setIsGenerating(false);
    }
  }, [t, translate]);

  const generateMonthlySummary = useCallback(async () => {
    setIsGenerating(true);
    try {
      const now = new Date();
      const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const totals = await transactionRepository.getDateRangeTotals(startOfMonth, endOfMonth);

      Alert.alert(
        t.reports.monthlySummary,
        `${t.reports.period}: ${formatDate(startOfMonth)} - ${formatDate(endOfMonth)}\n\n` +
        `${t.analytics.income}: ${formatCurrency(totals.income)}\n` +
        `${t.analytics.expenses}: ${formatCurrency(totals.expense)}\n` +
        `${t.analytics.netIncome}: ${formatCurrency(totals.income - totals.expense)}\n` +
        `${t.dashboard.totalBalance}: ${formatCurrency(balance)}`,
        [{ text: t.app.ok }]
      );
    } catch {
      Alert.alert(t.common.error, t.reports.generateFailed);
    } finally {
      setIsGenerating(false);
    }
  }, [t, balance]);

  const generateCategoryReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      const now = new Date();
      const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const allCategories = await categoryRepository.findAllMapped();
      const breakdown = await transactionRepository.getCategoryBreakdown(startOfMonth, endOfMonth);
      const catMap = new Map(allCategories.map((c) => [c.id, c]));

      let report = `${t.reports.categoryReport} (${t.reports.period}: ${formatDate(startOfMonth)} - ${formatDate(endOfMonth)})\n\n`;
      breakdown.forEach((b) => {
        const cat = catMap.get(b.categoryId);
        report += `${cat?.name || t.common.unknown}: ${formatCurrency(b.amount)}\n`;
      });

      Alert.alert(
        t.reports.categoryReport,
        report || `${t.reports.categoryReport}: ${translate('analytics.ofExpenses', { count: 0 })}`,
        [{ text: t.app.ok }]
      );
    } catch {
      Alert.alert(t.common.error, t.reports.generateFailed);
    } finally {
      setIsGenerating(false);
    }
  }, [t, translate]);

  const maxExpense = Math.max(...monthlyTotals.map(m => m.expense), 1);
  const maxIncome = Math.max(...monthlyTotals.map(m => m.income), 1);
  const currentMonthIdx = new Date().getMonth();

  const reportTypes = [
    {
      title: t.reports.monthlySummary,
      description: t.reports.monthlySummaryDesc,
      icon: '\uD83D\uDCC5',
      onPress: generateMonthlySummary,
    },
    {
      title: t.reports.categoryReport,
      description: t.reports.categoryReportDesc,
      icon: '\uD83D\uDCCA',
      onPress: generateCategoryReport,
    },
    {
      title: t.reports.exportCSV,
      description: t.reports.exportCSVDesc,
      icon: '\uD83D\uDCC4',
      onPress: generateCSV,
    },
    {
      title: t.reports.annualSummary,
      description: t.reports.annualSummaryDesc,
      icon: '\uD83D\uDCC8',
      onPress: async () => {
        setIsGenerating(true);
        try {
          const totals = await transactionRepository.getYearlyTotals(year);
          Alert.alert(
            `${t.reports.annualSummary} ${year}`,
            `${t.analytics.income}: ${formatCurrency(totals.income)}\n` +
            `${t.analytics.expenses}: ${formatCurrency(totals.expense)}\n` +
            `${t.analytics.netIncome}: ${formatCurrency(totals.income - totals.expense)}`,
            [{ text: t.app.ok }]
          );
        } catch {
          Alert.alert(t.common.error, t.reports.generateFailed);
        } finally {
          setIsGenerating(false);
        }
      },
    },
  ];

  if (isLoading) {
    return <LoadingScreen type="list" />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>{t.reports.title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t.reports.description}
      </Text>

      {/* Monthly Overview Card */}
      <Card style={styles.chartCard}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          {t.analytics.income} & {t.analytics.expenses}
        </Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t.analytics.income}</Text>
            <Text style={[styles.summaryValue, { color: colors.income }]}>{formatCurrency(currentMonth.income)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t.analytics.expenses}</Text>
            <Text style={[styles.summaryValue, { color: colors.expense }]}>{formatCurrency(currentMonth.expense)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t.dashboard.totalBalance}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(balance)}</Text>
          </View>
        </View>
        {/* Income/Expense comparison bar */}
        {currentMonth.income + currentMonth.expense > 0 && (
          <View style={styles.comparisonBar}>
            <View
              style={[
                styles.comparisonIncome,
                { flex: currentMonth.income || 0.01, backgroundColor: colors.income },
              ]}
            />
            <View
              style={[
                styles.comparisonExpense,
                { flex: currentMonth.expense || 0.01, backgroundColor: colors.expense },
              ]}
            />
          </View>
        )}
      </Card>

      {/* Yearly Bar Chart */}
      {monthlyTotals.length > 0 && (
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>{year} {t.reports.monthlyComparison}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.barChartScroll}>
            <View style={styles.barChartContainer}>
              {monthlyTotals.slice(0, currentMonthIdx + 1).map((m) => (
                <View key={m.month} style={styles.barColumn}>
                  <View style={styles.barGroup}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max((m.income / maxIncome) * 100, 2),
                          backgroundColor: colors.income,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max((m.expense / maxExpense) * 100, 2),
                          backgroundColor: colors.expense,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                    {getMonthName(m.month - 1, language)}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t.analytics.income}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t.analytics.expenses}</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            {t.reports.expenseByCategory}
          </Text>
          {categoryBreakdown.map((cat) => {
            const pct = currentMonth.expense > 0 ? (cat.amount / currentMonth.expense) * 100 : 0;
            return (
              <View key={cat.name} style={styles.categoryRow}>
                <View style={styles.categoryHeader}>
                  <Text style={[styles.categoryName, { color: colors.text }]}>{cat.name}</Text>
                  <Text style={[styles.categoryAmount, { color: colors.textSecondary }]}>
                    {formatCurrency(cat.amount)}
                  </Text>
                </View>
                <View style={[styles.categoryBarBg, { backgroundColor: colors.surfaceVariant }]}>
                  <View
                    style={[
                      styles.categoryBarFill,
                      { width: `${Math.min(pct, 100)}%`, backgroundColor: cat.color },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </Card>
      )}

      {/* Report Type Buttons */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.reports.export}</Text>
      {reportTypes.map((report, idx) => (
        <TouchableOpacity
          key={idx}
          style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={report.onPress}
          disabled={isGenerating}
          activeOpacity={0.7}
        >
          <Text style={styles.reportIcon}>{report.icon}</Text>
          <View style={styles.reportInfo}>
            <Text style={[styles.reportTitle, { color: colors.text }]}>
              {report.title}
            </Text>
            <Text style={[styles.reportDescription, { color: colors.textSecondary }]}>
              {report.description}
            </Text>
          </View>
          <Text style={[styles.reportArrow, { color: colors.textTertiary }]}>{'\u2192'}</Text>
        </TouchableOpacity>
      ))}

      {isGenerating && (
        <View style={styles.loadingOverlay}>
          <LoadingScreen type="list" />
        </View>
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
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  chartCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  chartTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.caption,
    marginBottom: spacing.xxs,
  },
  summaryValue: {
    ...typography.h4,
    fontWeight: '700',
  },
  comparisonBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  comparisonIncome: {
    height: '100%',
  },
  comparisonExpense: {
    height: '100%',
  },
  barChartScroll: {
    marginBottom: spacing.sm,
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    height: 140,
    paddingTop: spacing.md,
  },
  barColumn: {
    alignItems: 'center',
    width: 32,
  },
  barGroup: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'flex-end',
    flex: 1,
  },
  bar: {
    width: 12,
    borderRadius: 3,
    minHeight: 2,
  },
  barLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...typography.caption,
  },
  categoryRow: {
    marginBottom: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  categoryName: {
    ...typography.caption,
  },
  categoryAmount: {
    ...typography.caption,
    fontWeight: '600',
  },
  categoryBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  reportIcon: {
    fontSize: 28,
    marginRight: spacing.lg,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  reportDescription: {
    ...typography.caption,
  },
  reportArrow: {
    fontSize: 20,
    marginLeft: spacing.md,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
