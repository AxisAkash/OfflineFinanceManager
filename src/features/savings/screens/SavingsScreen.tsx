import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { useLanguage } from '../../../shared/localization/LanguageContext';
import { spacing, typography } from '../../../shared/theme/spacing';
import { Card, EmptyState, LoadingScreen, ErrorMessage, Button, Input } from '../../../shared/components';
import { savingsRepository } from '../../../core/repositories/savingsRepository';
import { SavingsGoal } from '../../../shared/types';
import { formatCurrency, formatDate, generateId } from '../../../shared/utils';

export function SavingsScreen() {
  const { colors } = useTheme();
  const { t, translate } = useLanguage();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await savingsRepository.findAllActive();
      setGoals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load savings goals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    const amountNum = parseFloat(targetAmount);
    if (!name.trim() || !amountNum || amountNum <= 0 || !deadline.trim()) {
      Alert.alert(t.common.error, t.savings.allFieldsRequired);
      return;
    }
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const goal: SavingsGoal = {
        id: generateId(),
        name: name.trim(),
        targetAmount: amountNum,
        currentAmount: 0,
        deadline,
        icon: '\uD83C\uDFAF',
        color: '#FF9800',
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      };
      await savingsRepository.create(goal);
      setShowCreate(false);
      setName('');
      setTargetAmount('');
      setDeadline('');
      await loadGoals();
    } catch {
      Alert.alert(t.common.error, t.savings.createFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (goal: SavingsGoal) => {
    Alert.alert(
      t.savings.delete,
      translate('savings.deleteConfirm', { name: goal.name }),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await savingsRepository.delete(goal.id);
              await loadGoals();
            } catch {
              Alert.alert(t.common.error, t.savings.deleteFailed);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingScreen type="list" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadGoals} />;
  }

  if (goals.length === 0 && !showCreate) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon={'\uD83C\uDFAF'}
          title={t.savings.noGoals}
          description={t.savings.noGoalsDescription}
          actionLabel={t.savings.createFirst}
          onAction={() => setShowCreate(true)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showCreate ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{t.savings.create}</Text>
          <Input
            label={t.savings.name}
            value={name}
            onChangeText={setName}
            placeholder={t.savings.namePlaceholder}
          />
          <Input
            label={t.savings.targetAmount}
            value={targetAmount}
            onChangeText={setTargetAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
          <Input
            label={t.savings.deadline}
            value={deadline}
            onChangeText={setDeadline}
            placeholder={t.savings.deadlinePlaceholder}
          />
          <View style={styles.createActions}>
            <Button
              title={t.savings.create}
              onPress={handleCreate}
              loading={isSaving}
              disabled={!name || !targetAmount || !deadline}
              fullWidth
              size="lg"
            />
            <View style={styles.spacer} />
            <Button
              title={t.common.cancel}
              onPress={() => setShowCreate(false)}
              variant="ghost"
              fullWidth
            />
          </View>
        </ScrollView>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t.savings.title}
            </Text>
            <TouchableOpacity onPress={() => setShowCreate(true)}>
              <Text style={[styles.addButton, { color: colors.primary }]}>
                + New
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={goals}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const percentage = item.targetAmount > 0
                ? (item.currentAmount / item.targetAmount) * 100
                : 0;

              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onLongPress={() => handleDelete(item)}
                >
                  <Card style={styles.goalCard}>
                    <View style={styles.goalHeader}>
                      <View style={[styles.goalIcon, { backgroundColor: item.color + '20' }]}>
                        <Text style={[styles.goalEmoji, { color: item.color }]}>
                          {item.icon}
                        </Text>
                      </View>
                      <View style={styles.goalInfo}>
                        <Text style={[styles.goalName, { color: colors.text }]}>
                          {item.name}
                        </Text>
                        <Text style={[styles.goalDeadline, { color: colors.textSecondary }]}>
                          {translate('savings.due', { date: formatDate(item.deadline) })}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: item.color,
                            width: `${Math.min(percentage, 100)}%`,
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.goalDetails}>
                      <Text style={[styles.goalProgress, { color: colors.text }]}>
                        {formatCurrency(item.currentAmount)}
                      </Text>
                      <Text style={[styles.goalTarget, { color: colors.textSecondary }]}>
                        {t.savings.of} {formatCurrency(item.targetAmount)}
                      </Text>
                      <Text style={[styles.goalPercentage, { color: colors.primary }]}>
                        {percentage.toFixed(1)}%
                      </Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
  },
  addButton: {
    ...typography.button,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  createActions: {
    marginTop: spacing.xl,
  },
  spacer: {
    height: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
  },
  goalCard: {
    marginBottom: spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  goalEmoji: {
    fontSize: 24,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  goalDeadline: {
    ...typography.caption,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  goalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalProgress: {
    ...typography.body,
    fontWeight: '700',
  },
  goalTarget: {
    ...typography.caption,
  },
  goalPercentage: {
    ...typography.body,
    fontWeight: '700',
  },
});
