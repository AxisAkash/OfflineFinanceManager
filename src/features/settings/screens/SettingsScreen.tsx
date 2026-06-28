import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { spacing, typography } from '../../../shared/theme/spacing';
import { Card, Button } from '../../../shared/components';
import { getStorageUsage, getBackupInfo } from '../../../core/storage';
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
          onPress={() => Alert.alert('Backup', 'Backup feature coming soon')}
          variant="secondary"
          fullWidth
        />
        <View style={styles.spacer} />
        <Button
          title="Restore Data"
          onPress={() => Alert.alert('Restore', 'Restore feature coming soon')}
          variant="outline"
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
