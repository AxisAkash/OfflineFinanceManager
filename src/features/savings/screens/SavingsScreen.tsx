import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { useLanguage } from '../../../shared/localization/LanguageContext';
import { spacing, typography } from '../../../shared/theme/spacing';
import { Card, EmptyState, LoadingScreen, ErrorMessage, Button, Input, Snackbar } from '../../../shared/components';
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
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [contributingGoal, setContributingGoal] = useState<SavingsGoal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [isContributing, setIsContributing] = useState(false);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'success' });

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
      setError(err instanceof Error ? err.message : t.savings.loadFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const amountNum = parseFloat(targetAmount);
    if (!name.trim() || !amountNum || amountNum <= 0 || !deadline.trim()) {
      Alert.alert(t.common.error, t.savings.allFieldsRequired);
      return;
    }
    setIsSaving(true);
    try {
      if (editingGoal) {
        await savingsRepository.updateGoal(editingGoal.id, {
          name: name.trim(),
          targetAmount: amountNum,
          deadline,
        });
      } else {
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
      }
      setShowCreate(false);
      setEditingGoal(null);
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
              setSnackbar({ visible: true, message: t.common.deletedToast, type: 'success' });
            } catch {
              Alert.alert(t.common.error, t.savings.deleteFailed);
            }
          },
        },
      ]
    );
  };

  const handleContribute = async () => {
    const amountNum = parseFloat(contributionAmount);
    if (!contributingGoal || !amountNum || amountNum <= 0) {
      Alert.alert(t.common.error, t.savings.enterAmount);
      return;
    }
    setIsContributing(true);
    try {
      await savingsRepository.updateProgress(contributingGoal.id, amountNum);
      setContributingGoal(null);
      setContributionAmount('');
      await loadGoals();
      setSnackbar({ visible: true, message: t.savings.contributed, type: 'success' });
    } catch {
      Alert.alert(t.common.error, t.savings.contributeFailed);
    } finally {
      setIsContributing(false);
    }
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
          <Text style={[styles.title, { color: colors.text }]}>{editingGoal ? t.budget.edit : t.savings.create}</Text>
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
              title={editingGoal ? t.savings.edit : t.savings.create}
              onPress={handleSave}
              loading={isSaving}
              disabled={!name || !targetAmount || !deadline}
              fullWidth
              size="lg"
            />
            <View style={styles.spacer} />
            <Button
              title={t.common.cancel}
              onPress={() => { setShowCreate(false); setEditingGoal(null); }}
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
                  onPress={() => setContributingGoal(item)}
                  onLongPress={() => handleDelete(item)}
                >
                  <Card style={styles.goalCard}>
                    <View style={styles.goalHeader}>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingGoal(item);
                          setName(item.name);
                          setTargetAmount(item.targetAmount.toString());
                          setDeadline(item.deadline);
                          setShowCreate(true);
                        }}
                      >
                        <View style={[styles.goalIcon, { backgroundColor: item.color + '20' }]}>
                          <Text style={[styles.goalEmoji, { color: item.color }]}>
                            {item.icon}
                          </Text>
                        </View>
                      </TouchableOpacity>
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
      <Modal visible={contributingGoal !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {translate('savings.contribute', { name: contributingGoal?.name ?? '' })}
            </Text>
            <Input
              label={t.savings.currentAmount}
              value={contributionAmount}
              onChangeText={setContributionAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
            <View style={styles.createActions}>
              <Button
                title={t.savings.contribute}
                onPress={handleContribute}
                loading={isContributing}
                disabled={!contributionAmount}
                fullWidth
                size="lg"
              />
              <View style={styles.spacer} />
              <Button
                title={t.common.cancel}
                onPress={() => { setContributingGoal(null); setContributionAmount(''); }}
                variant="ghost"
                fullWidth
              />
            </View>
          </View>
        </View>
      </Modal>
      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={() => setSnackbar(prev => ({ ...prev, visible: false }))}
      />
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: spacing.xl,
  },
  modalTitle: {
    ...typography.h3,
    marginBottom: spacing.lg,
  },
});
