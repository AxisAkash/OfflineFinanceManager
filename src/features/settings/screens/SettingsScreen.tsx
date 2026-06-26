import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { spacing, typography } from '../../../shared/theme/spacing';
import { Card, Button } from '../../../shared/components';

interface SettingsScreenProps {
  onNavigateSavings?: () => void;
  onNavigateDebt?: () => void;
  onNavigateRecurring?: () => void;
  onNavigateReports?: () => void;
  onBackup?: () => void;
  onRestore?: () => void;
  onExport?: () => void;
}

export function SettingsScreen({
  onNavigateSavings,
  onNavigateDebt,
  onNavigateRecurring,
  onNavigateReports,
  onBackup,
  onRestore,
  onExport,
}: SettingsScreenProps) {
  const { colors, isDark, setMode, mode } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Features
      </Text>
      <Card style={styles.section}>
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

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Appearance
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

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Data Management
      </Text>
      <Card style={styles.section}>
        <Button
          title="Backup Data"
          onPress={() => onBackup?.()}
          variant="secondary"
          fullWidth
        />
        <View style={styles.spacer} />
        <Button
          title="Restore Data"
          onPress={() => onRestore?.()}
          variant="outline"
          fullWidth
        />
        <View style={styles.spacer} />
        <Button
          title="Export Data"
          onPress={() => onExport?.()}
          variant="ghost"
          fullWidth
        />
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        About
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
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  section: {
    marginBottom: spacing.md,
  },
  spacer: {
    height: spacing.md,
  },
  aboutText: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
});
