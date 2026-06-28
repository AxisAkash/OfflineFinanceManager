import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { useLanguage } from '../../../shared/localization/LanguageContext';
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
import { useAuth } from '../../authentication/hooks/useAuth';
import { isBiometricEnabled, setBiometricEnabled } from '../../../core/encryption';
import { getBiometricInfo } from '../../authentication/services/authService';

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
  const { t, translate } = useLanguage();
  const { logout, lock } = useAuth();
  const [dbSize, setDbSize] = useState(t.settings.calculating);
  const [lastBackup, setLastBackup] = useState(t.settings.never);
  const [biometricOn, setBiometricOn] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    loadStorageInfo();
    loadSecurityInfo();
  }, []);

  const loadStorageInfo = async () => {
    try {
      const usage = getStorageUsage();
      setDbSize(formatNumber(usage.databaseSize) + 'B');
    } catch {
      setDbSize(t.settings.unknown);
    }
    try {
      const backup = getBackupInfo();
      setLastBackup(backup?.modifiedAt ? new Date(backup.modifiedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : t.settings.never);
    } catch {
      setLastBackup(t.settings.never);
    }
  };

  const loadSecurityInfo = async () => {
    const enabled = await isBiometricEnabled();
    setBiometricOn(enabled);
    const info = await getBiometricInfo();
    setBiometricAvailable(info.isAvailable && info.isEnrolled);
  };

  const handleBiometricToggle = async (value: boolean) => {
    try {
      await setBiometricEnabled(value);
      setBiometricOn(value);
    } catch {
      Alert.alert(t.common.error, t.app.error);
    }
  };

  const handleChangePin = () => {
    Alert.alert(
      t.settings.changePin,
      t.auth.changePinDescription,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.confirm,
          onPress: () => {
            Alert.alert(
              t.settings.changePin,
              t.settings.changePinPlaceholder,
              [{ text: t.app.ok }]
            );
          },
        },
      ]
    );
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
      Alert.alert(t.settings.backupComplete, translate('settings.backupCompleteMsg', { count: transactions.length }));
    } catch (err) {
      Alert.alert(t.settings.backupFailed, err instanceof Error ? err.message : t.settings.unknown);
    }
  }, [t, translate]);

  const handleRestore = useCallback(async () => {
    Alert.alert(
      t.settings.restoreData,
      t.settings.restoreConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.confirm,
          style: 'destructive',
          onPress: async () => {
            try {
              const data = await loadBackup();
              if (!data) {
                Alert.alert(t.settings.restoreNoBackup, t.settings.restoreNoBackupMsg);
                return;
              }
              const db = await (await import('../../../core/database/connection')).getDatabase();
              await db.execAsync('BEGIN TRANSACTION');
              try {
                await db.execAsync('DELETE FROM transactions');
                await db.execAsync('DELETE FROM wallets');
                await db.execAsync('DELETE FROM categories');
                await db.execAsync('DELETE FROM budgets');
                await db.execAsync('DELETE FROM savings_goals');
                await db.execAsync('DELETE FROM debts');
                await db.execAsync('DELETE FROM recurring_transactions');

                for (const wallet of data.wallets) {
                  await db.runAsync(
                    `INSERT OR REPLACE INTO wallets (id, name, balance, currency, icon, color, is_archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [wallet.id, wallet.name, wallet.balance, wallet.currency, wallet.icon, wallet.color, wallet.isArchived ? 1 : 0, wallet.createdAt, wallet.updatedAt]
                  );
                }
                for (const cat of data.categories) {
                  await db.runAsync(
                    `INSERT OR REPLACE INTO categories (id, name, icon, color, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [cat.id, cat.name, cat.icon, cat.color, cat.type, new Date().toISOString(), new Date().toISOString()]
                  );
                }
                for (const txn of data.transactions) {
                  await db.runAsync(
                    `INSERT OR REPLACE INTO transactions (id, wallet_id, category_id, amount, type, description, date, is_recurring, notes, time, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [txn.id, txn.walletId, txn.categoryId, txn.amount, txn.type, txn.description, txn.date, txn.isRecurring ? 1 : 0, txn.notes || '', txn.time || '', txn.createdAt, txn.updatedAt]
                  );
                }
                for (const budget of data.budgets) {
                  await db.runAsync(
                    `INSERT OR REPLACE INTO budgets (id, category_id, amount, spent, period, start_date, end_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [budget.id, budget.categoryId, budget.amount, budget.spent, budget.period, budget.startDate, budget.endDate, budget.createdAt, budget.updatedAt]
                  );
                }
                for (const goal of data.savingsGoals) {
                  await db.runAsync(
                    `INSERT OR REPLACE INTO savings_goals (id, name, target_amount, current_amount, deadline, icon, color, is_completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [goal.id, goal.name, goal.targetAmount, goal.currentAmount, goal.deadline, goal.icon, goal.color, goal.isCompleted ? 1 : 0, goal.createdAt, goal.updatedAt]
                  );
                }
                for (const debt of data.debts) {
                  await db.runAsync(
                    `INSERT OR REPLACE INTO debts (id, name, total_amount, remaining_amount, interest_rate, minimum_payment, due_date, lender, is_paid, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [debt.id, debt.name, debt.totalAmount, debt.remainingAmount, debt.interestRate, debt.minimumPayment, debt.dueDate, debt.lender, debt.isPaid ? 1 : 0, debt.createdAt, debt.updatedAt]
                  );
                }
                for (const recurring of data.recurringTransactions) {
                  await db.runAsync(
                    `INSERT OR REPLACE INTO recurring_transactions (id, wallet_id, category_id, amount, type, description, frequency, interval, next_date, end_date, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [recurring.id, recurring.walletId, recurring.categoryId, recurring.amount, recurring.type, recurring.description, recurring.frequency, recurring.interval, recurring.nextDate, recurring.endDate || null, recurring.isActive ? 1 : 0, recurring.createdAt, recurring.updatedAt]
                  );
                }
                await db.execAsync('COMMIT');
                await loadStorageInfo();
                Alert.alert(t.settings.restoreComplete, translate('settings.restoreFound', { date: new Date(data.exportedAt).toLocaleDateString() }));
              } catch (err) {
                await db.execAsync('ROLLBACK');
                throw err;
              }
            } catch (err) {
              Alert.alert(t.settings.restoreFailed, err instanceof Error ? err.message : t.settings.unknown);
            }
          },
        },
      ]
    );
  }, [t, translate]);

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
      Alert.alert(t.settings.exportFailed, err instanceof Error ? err.message : t.settings.unknown);
    }
  }, [t]);

  const handleLogout = () => {
    Alert.alert(
      t.settings.logout,
      t.auth.logoutConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.settings.logout,
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch {
              Alert.alert(t.common.error, t.auth.logoutFailed);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.screenTitle, { color: colors.text }]}>{t.settings.title}</Text>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {t.settings.security}
      </Text>
      <Card style={styles.section}>
        <Button
          title={t.settings.changePin}
          onPress={handleChangePin}
          variant="secondary"
          fullWidth
        />
        {biometricAvailable && (
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>
              {t.settings.biometricLogin}
            </Text>
            <Switch
              value={biometricOn}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={biometricOn ? colors.primaryDark : colors.textTertiary}
            />
          </View>
        )}
        <View style={styles.spacer} />
        <Button
          title={t.settings.lockNow}
          onPress={lock}
          variant="outline"
          fullWidth
        />
        <View style={styles.spacer} />
        <Button
          title={t.settings.logout}
          onPress={handleLogout}
          variant="danger"
          fullWidth
        />
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {t.settings.finance}
      </Text>
      <Card style={styles.section}>
        <Button
          title={t.settings.wallets}
          onPress={() => onNavigateWallets?.()}
          variant="secondary"
          fullWidth
        />
        <View style={styles.spacer} />
        <Button
          title={t.settings.savingsGoals}
          onPress={() => onNavigateSavings?.()}
          variant="secondary"
          fullWidth
        />
        <View style={styles.spacer} />
        <Button
          title={t.settings.debtTracker}
          onPress={() => onNavigateDebt?.()}
          variant="secondary"
          fullWidth
        />
        <View style={styles.spacer} />
        <Button
          title={t.settings.recurringTransactions}
          onPress={() => onNavigateRecurring?.()}
          variant="secondary"
          fullWidth
        />
        <View style={styles.spacer} />
        <Button
          title={t.settings.reports}
          onPress={() => onNavigateReports?.()}
          variant="secondary"
          fullWidth
        />
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {t.settings.appearance}
      </Text>
      <Card style={styles.section}>
        <Button
          title={isDark ? t.settings.lightMode : t.settings.darkMode}
          onPress={() => setMode(isDark ? 'light' : 'dark')}
          variant="secondary"
          fullWidth
        />
        <View style={styles.spacer} />
        <Button
          title={t.settings.useSystemTheme}
          onPress={() => setMode('system')}
          variant={mode === 'system' ? 'primary' : 'ghost'}
          fullWidth
        />
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {t.settings.data}
      </Text>
      <Card style={styles.section}>
        <Button
          title={t.settings.backupData}
          onPress={handleBackup}
          variant="secondary"
          fullWidth
        />
        <View style={styles.spacer} />
        <Button
          title={t.settings.restoreData}
          onPress={handleRestore}
          variant="outline"
          fullWidth
        />
        <View style={styles.spacer} />
        <Button
          title={t.settings.exportData}
          onPress={handleExport}
          variant="ghost"
          fullWidth
        />
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {t.settings.storage}
      </Text>
      <Card style={styles.section}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
            {t.settings.databaseSize}
          </Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {dbSize}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
            {t.settings.lastBackup}
          </Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {lastBackup}
          </Text>
        </View>
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {t.settings.about}
      </Text>
      <Card style={styles.section}>
        <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
          {t.settings.version}
        </Text>
        <Text style={[styles.aboutText, { color: colors.textTertiary }]}>
          {t.settings.aboutText}
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
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'transparent',
  },
  aboutText: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  switchLabel: {
    ...typography.body,
    fontWeight: '500',
  },
});
