import React, { useState, useCallback } from 'react';
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
import { LoadingScreen } from '../../../shared/components';
import { transactionRepository } from '../../../core/repositories/transactionRepository';
import { categoryRepository } from '../../../core/repositories/categoryRepository';
import { walletRepository } from '../../../core/repositories/walletRepository';
import { formatCurrency, formatDate } from '../../../shared/utils';

export function ReportsScreen() {
  const { colors } = useTheme();
  const { t, translate } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);

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
      const balance = await walletRepository.getTotalBalance();

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
  }, [t]);

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
          const now = new Date();
          const totals = await transactionRepository.getYearlyTotals(now.getFullYear());
          Alert.alert(
            `${t.reports.annualSummary} ${now.getFullYear()}`,
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
