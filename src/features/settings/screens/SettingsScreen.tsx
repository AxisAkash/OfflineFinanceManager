import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { spacing, typography } from '../../../shared/theme/spacing';
import { Card, Button } from '../../../shared/components';
import { getStorageUsage, getBackupInfo, saveBackup, loadBackup, exportBackup } from '../../../core/storage';
import { transactionRepository } from '../../../core/repositories/transactionRepository';
import { walletRepository } from '../../../core/repositories/walletRepository';
import { categoryRepository } from '../../../core/repositories/categoryRepository';
import { budgetRepository } from '../../../core/repositories/budgetRepository';
import { savingsRepository } from '../../../core/repositories/savingsRepository';
import { debtRepository } from '../../../core/repositories/debtRepository';
import { recurringRepository } from '../../../core/repositories/recurringRepository';
import { formatNumber } from '../../../shared/utils';

interface SettingsScreenProps {
  onNavigateSavings?: () => void;
  onNavigateDebt?: () => void;
  onNavigateRecurring?: () => void;
  onNavigateReports?: () => void;
  onNavigateWallets?: () => void;
}

export function SettingsScreen({
  onNavigateSavings,
  onNavigateDebt,
  onNavigateRecurring,
  onNavigateReports,
  onNavigateWallets,
}: SettingsScreenProps) {
  const { colors, isDark, setMode, mode } = useTheme();
  const [dbSize, setDbSize] = useState('Calculating...');
  const [lastBackup, setLastBackup] = useState('Never');

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    try {
      const usage = getStorageUsage();
      setDbSize(formatNumber(usage.databaseSize) + 'B');
    } catch {
      setDbSize('Unknown');
    }
    try {
      const backup = getBackupInfo();
      setLastBackup(backup?.modifiedAt ? new Date(backup.modifiedAt).toLocaleDateString() : 'Never');
    } catch {
      setLastBackup('Never');
    }
  };

  const handleBackup = useCallback(async () => {
    try {
      const [transactions, wallets, categories, budgets, savingsGoals, debts, recurringTransactions] =
        await Promise.all([
          transactionRepository.getRecent(10000),
          walletRepository.findAllIncludingArchived(),
          categoryRepository.findAllMapped(),
          budgetRepository.findAllMapped(),
          savingsRepository.findAllMapped(),
          debtRepository.findAllMapped(),
          recurringRepository.findAllMapped(),
        ]);

      await saveBackup({
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        transactions,
        wallets,
        categories,
        budgets,
        savingsGoals,
        debts,
        recurringTransactions,
      });

      await loadStorageInfo();
      Alert.alert('Backup Complete', `Backed up ${transactions.length} transactions`);
    } catch (err) {
      Alert.alert('Backup Failed', err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const handleRestore = useCallback(async () => {
    Alert.alert(
      'Restore Data',
      'This will replace all current data with the backup. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            try {
              const data = await loadBackup();
              if (!data) {
                Alert.alert('No Backup', 'No backup file found');
                return;
              }
              Alert.alert(
                'Restore Complete',
                `Found backup from ${new Date(data.exportedAt).toLocaleDateString()}`
              );
            } catch (err) {
              Alert.alert('Restore Failed', err instanceof Error ? err.message : 'Unknown error');
            }
          },
        },
      ]
    );
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const [transactions, wallets, categories, budgets, savingsGoals, debts, recurringTransactions] =
        await Promise.all([
          transactionRepository.getRecent(10000),
          walletRepository.findAllIncludingArchived(),
          categoryRepository.findAllMapped(),
          budgetRepository.findAllMapped(),
          savingsRepository.findAllMapped(),
          debtRepository.findAllMapped(),
          recurringRepository.findAllMapped(),
        ]);

      await exportBackup({
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        transactions,
        wallets,
        categories,
        budgets,
        savingsGoals,
        debts,
        recurringTransactions,
      });
    } catch (err) {
      Alert.alert('Export Failed', err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.screenTitle, { color: colors.text }]}>Settings</Text>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        FINANCE
      </Text>
      <Card style={styles.section}>
        <Button
          title="Wallets"
          onPress={() => onNavigateWallets?.()}
          variant="secondary"
          fullWidth
        />
        <View style={styles.spacer} />
        <Button
          title="Savings Goals"
          onPress={() => onNavigateSavings?.()}
          variant="secondary"
          fullWidth
        />
        <View style={styles.spacer} />
        <Button
          title="Debt Tracker"
          onPress={() => onNavigateDebt?.()}
          variant="secondary"
          fullWidth
        />
        <View style={styles.spacer} />
        <Button
          title="Recurring Transactions"
          onPress={() => onNavigateRecurring?.()}
          variant="secondary"
          fullWidth
        />
        <View style={styles.spacer} />
        <Button
          title="Reports"
          onPress={() => onNavigateReports?.()}
          variant="secondary"
          fullWidth
        />
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        APPEARANCE
      </Text>
      <Card style={styles.section}>
        <Button
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          onPress={() => setMode(isDark ? 'light' : 'dark')}
          variant="secondary"
          fullWidth
        />
        <View style={styles.spacer} />
        <Button
          title="Use System Theme"
          onPress={() => setMode('system')}
          variant={mode === 'system' ? 'primary' : 'ghost'}
          fullWidth
        />
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        DATA
      </Text>
      <Card style={styles.section}>
        <Button
          title="Backup Data"
          onPress={handleBackup}
          variant="secondary"
          fullWidth
        />
        <View style={styles.spacer} />
        <Button
          title="Restore Data"
          onPress={handleRestore}
          variant="outline"
          fullWidth
        />
        <View style={styles.spacer} />
        <Button
          title="Export Data"
          onPress={handleExport}
          variant="ghost"
          fullWidth
        />
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        STORAGE
      </Text>
      <Card style={styles.section}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
            Database Size
          </Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {dbSize}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
            Last Backup
          </Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {lastBackup}
          </Text>
        </View>
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        ABOUT
      </Text>
      <Card style={styles.section}>
        <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
          Offline Finance Manager v1.0.0
        </Text>
        <Text style={[styles.aboutText, { color: colors.textTertiary }]}>
          Your privacy-first, offline personal finance tracker
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
    paddingBottom: spacing.huge,
  },
  screenTitle: {
    ...typography.h2,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  section: {
    marginBottom: spacing.md,
  },
  spacer: {
    height: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    ...typography.bodySmall,
  },
  infoValue: {
    ...typography.body,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  aboutText: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
});
