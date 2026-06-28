import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../../shared/theme';
import { spacing, typography, borderRadius } from '../../../shared/theme/spacing';
import { Card, Button, LoadingScreen } from '../../../shared/components';
import { transactionRepository } from '../../../core/repositories/transactionRepository';
import { categoryRepository } from '../../../core/repositories/categoryRepository';
import { walletRepository } from '../../../core/repositories/walletRepository';
import { formatCurrency, formatDate } from '../../../shared/utils';

export function ReportsScreen() {
  const { colors } = useTheme();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCSV = useCallback(async () => {
    setIsGenerating(true);
    try {
      const transactions = await transactionRepository.getRecent(1000);
      const allCategories = await categoryRepository.findAllMapped();
      const catMap = new Map(allCategories.map((c) => [c.id, c.name]));

      let csv = 'Date,Type,Category,Description,Amount\n';
      transactions.forEach((t) => {
        const date = formatDate(t.date);
        const catName = catMap.get(t.categoryId) || 'Unknown';
        csv += `${date},${t.type},${catName},"${t.description || ''}",${t.amount}\n`;
      });

      Alert.alert(
        'CSV Generated',
        `${transactions.length} transactions exported.\n\nCopy the data or use Share to save.`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateMonthlySummary = useCallback(async () => {
    setIsGenerating(true);
    try {
      const now = new Date();
      const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const totals = await transactionRepository.getDateRangeTotals(startOfMonth, endOfMonth);
      const balance = await walletRepository.getTotalBalance();

      Alert.alert(
        'Monthly Summary',
        `Period: ${formatDate(startOfMonth)} - ${formatDate(endOfMonth)}\n\n` +
        `Income: ${formatCurrency(totals.income)}\n` +
        `Expenses: ${formatCurrency(totals.expense)}\n` +
        `Net: ${formatCurrency(totals.income - totals.expense)}\n` +
        `Total Balance: ${formatCurrency(balance)}`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to generate summary');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateCategoryReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      const now = new Date();
      const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const allCategories = await categoryRepository.findAllMapped();
      const breakdown = await transactionRepository.getCategoryBreakdown(startOfMonth, endOfMonth);
      const catMap = new Map(allCategories.map((c) => [c.id, c]));

      let report = 'Category Breakdown (This Month)\n\n';
      breakdown.forEach((b) => {
        const cat = catMap.get(b.categoryId);
        report += `${cat?.name || 'Unknown'}: ${formatCurrency(b.amount)}\n`;
      });

      Alert.alert(
        'Category Report',
        report || 'No expense data this month',
        [{ text: 'OK' }]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const reportTypes = [
    {
      title: 'Monthly Summary',
      description: 'Income, expenses, and net for current month',
      icon: '\uD83D\uDCC5',
      onPress: generateMonthlySummary,
    },
    {
      title: 'Category Report',
      description: 'Spending breakdown by category',
      icon: '\uD83D\uDCCA',
      onPress: generateCategoryReport,
    },
    {
      title: 'Export CSV',
      description: 'Download all transactions as CSV',
      icon: '\uD83D\uDCC4',
      onPress: generateCSV,
    },
    {
      title: 'Annual Summary',
      description: 'Year-to-date financial overview',
      icon: '\uD83D\uDCC8',
      onPress: async () => {
        setIsGenerating(true);
        try {
          const now = new Date();
          const totals = await transactionRepository.getYearlyTotals(now.getFullYear());
          Alert.alert(
            `Annual Summary ${now.getFullYear()}`,
            `Income: ${formatCurrency(totals.income)}\n` +
            `Expenses: ${formatCurrency(totals.expense)}\n` +
            `Net: ${formatCurrency(totals.income - totals.expense)}`,
            [{ text: 'OK' }]
          );
        } catch {
          Alert.alert('Error', 'Failed to generate annual summary');
        } finally {
          setIsGenerating(false);
        }
      },
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>Reports</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Generate financial reports and summaries
      </Text>

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
