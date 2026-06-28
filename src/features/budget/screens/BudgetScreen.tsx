import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../shared/theme';
import { useLanguage } from '../../../shared/localization/LanguageContext';
import { spacing, typography, borderRadius } from '../../../shared/theme/spacing';
import { Card, EmptyState, LoadingScreen, ErrorMessage, Button, Input } from '../../../shared/components';
import { budgetRepository } from '../../../core/repositories/budgetRepository';
import { categoryRepository } from '../../../core/repositories/categoryRepository';
import { Budget, Category } from '../../../shared/types';
import { formatCurrency, formatPercentage, generateId } from '../../../shared/utils';

interface BudgetScreenProps {
  onCreateBudget?: () => void;
  isCreating?: boolean;
}

export function BudgetScreen({ onCreateBudget: _onCreateBudget, isCreating }: BudgetScreenProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [overview, setOverview] = useState({ totalBudget: 0, totalSpent: 0, remaining: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newPeriod, setNewPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    if (isCreating) {
      setShowCreate(true);
      setEditingBudget(null);
    }
  }, [isCreating]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [activeBudgets, allCategories, budgetOverview] = await Promise.all([
        budgetRepository.findAllActive(),
        categoryRepository.findAllMapped(),
        budgetRepository.getBudgetOverview(),
      ]);
      setBudgets(activeBudgets);
      const catMap: Record<string, Category> = {};
      allCategories.forEach((c) => { catMap[c.id] = c; });
      setCategories(catMap);
      setExpenseCategories(allCategories.filter((c) => c.type === 'expense'));
      setOverview(budgetOverview);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.budget.loadFailed);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const handleSaveBudget = useCallback(async () => {
    const amountNum = parseFloat(newAmount);
    if (!newCategoryId || !amountNum || amountNum <= 0) {
      Alert.alert(t.common.error, t.budget.selectCategory);
      return;
    }

    setIsSaving(true);
    try {
      if (editingBudget) {
        await budgetRepository.updateBudget(editingBudget.id, {
          categoryId: newCategoryId,
          amount: amountNum,
          period: newPeriod,
          startDate: editingBudget.startDate,
          endDate: editingBudget.endDate,
        });
      } else {
        const now = new Date();
        const startDate = now.toISOString();
        let endDate: Date;
        if (newPeriod === 'yearly') {
          endDate = new Date(now.getFullYear() + 1, now.getMonth(), 0);
        } else if (newPeriod === 'weekly') {
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
        } else {
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }

        const budget: Budget = {
          id: generateId(),
          categoryId: newCategoryId,
          amount: amountNum,
          spent: 0,
          period: newPeriod,
          startDate,
          endDate: endDate.toISOString(),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };

        await budgetRepository.create(budget);
      }
      setShowCreate(false);
      setEditingBudget(null);
      setNewCategoryId('');
      setNewAmount('');
      await loadData();
    } catch {
      Alert.alert(t.common.error, editingBudget ? t.app.error : t.budget.createFailed);
    } finally {
      setIsSaving(false);
    }
  }, [newCategoryId, newAmount, newPeriod, editingBudget, loadData, t]);

  const handleDeleteBudget = useCallback((budget: Budget) => {
    Alert.alert(
      t.budget.delete,
      t.budget.deleteConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await budgetRepository.delete(budget.id);
              await loadData();
            } catch {
              Alert.alert(t.common.error, t.budget.deleteFailed);
            }
          },
        },
      ]
    );
  }, [loadData, t]);

  if (isLoading) {
    return <LoadingScreen type="list" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadData} />;
  }

  if (budgets.length === 0 && !showCreate) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon={'\uD83D\uDCCA'}
          title={t.budget.noBudgets}
          description={t.budget.noBudgetsDescription}
          actionLabel={t.budget.createFirst}
          onAction={() => setShowCreate(true)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showCreate ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{editingBudget ? t.budget.edit : t.budget.create}</Text>

          <Text style={[styles.fieldLabel, { color: colors.text }]}>{t.budget.category}</Text>
          <View style={styles.categoryGrid}>
            {expenseCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryItem,
                  {
                    backgroundColor: newCategoryId === cat.id ? cat.color : colors.surfaceVariant,
                    borderColor: newCategoryId === cat.id ? cat.color : colors.border,
                  },
                ]}
                onPress={() => setNewCategoryId(cat.id)}
              >
                <Text style={[
                  styles.categoryName,
                  { color: newCategoryId === cat.id ? colors.textOnPrimary : colors.text },
                ]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label={t.budget.amount}
            value={newAmount}
            onChangeText={setNewAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />

          <Text style={[styles.fieldLabel, { color: colors.text }]}>{t.budget.period}</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[
                styles.optionChip,
                {
                  backgroundColor: newPeriod === 'weekly' ? colors.primary : colors.surfaceVariant,
                  borderColor: newPeriod === 'weekly' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setNewPeriod('weekly')}
            >
              <Text style={{ color: newPeriod === 'weekly' ? colors.textOnPrimary : colors.text }}>
                {t.budget.weekly}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionChip,
                {
                  backgroundColor: newPeriod === 'monthly' ? colors.primary : colors.surfaceVariant,
                  borderColor: newPeriod === 'monthly' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setNewPeriod('monthly')}
            >
              <Text style={{ color: newPeriod === 'monthly' ? colors.textOnPrimary : colors.text }}>
                {t.budget.monthly}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionChip,
                {
                  backgroundColor: newPeriod === 'yearly' ? colors.primary : colors.surfaceVariant,
                  borderColor: newPeriod === 'yearly' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setNewPeriod('yearly')}
            >
              <Text style={{ color: newPeriod === 'yearly' ? colors.textOnPrimary : colors.text }}>
                {t.budget.yearly}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.createActions}>
            <Button
              title={editingBudget ? t.budget.edit : t.budget.create}
              onPress={handleSaveBudget}
              loading={isSaving}
              disabled={!newCategoryId || !newAmount}
              fullWidth
              size="lg"
            />
            <View style={styles.spacer} />
            <Button
              title={t.common.cancel}
              onPress={() => { setShowCreate(false); setEditingBudget(null); }}
              variant="ghost"
              fullWidth
            />
          </View>
        </ScrollView>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t.budget.title}
            </Text>
            <TouchableOpacity onPress={() => setShowCreate(true)}>
              <Text style={[styles.addButton, { color: colors.primary }]}>
                + New
              </Text>
            </TouchableOpacity>
          </View>

          {overview.totalBudget > 0 && (
            <Card style={styles.overviewCard}>
              <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
                {t.budget.overview}
              </Text>
              <View style={styles.overviewRow}>
                <View style={styles.overviewItem}>
                  <Text style={[styles.overviewValue, { color: colors.text }]}>
                    {formatCurrency(overview.totalBudget)}
                  </Text>
                  <Text style={[styles.overviewSub, { color: colors.textSecondary }]}>
                    {t.budget.budget}
                  </Text>
                </View>
                <View style={styles.overviewItem}>
                  <Text style={[styles.overviewValue, { color: colors.expense }]}>
                    {formatCurrency(overview.totalSpent)}
                  </Text>
                  <Text style={[styles.overviewSub, { color: colors.textSecondary }]}>
                    {t.budget.spent}
                  </Text>
                </View>
                <View style={styles.overviewItem}>
                  <Text style={[styles.overviewValue, { color: overview.remaining >= 0 ? colors.income : colors.expense }]}>
                    {formatCurrency(overview.remaining)}
                  </Text>
                  <Text style={[styles.overviewSub, { color: colors.textSecondary }]}>
                    {t.budget.remaining}
                  </Text>
                </View>
              </View>
            </Card>
          )}

          <FlatList
            data={budgets}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const category = categories[item.categoryId];
              const percentage = item.amount > 0 ? (item.spent / item.amount) * 100 : 0;
              const isOverBudget = percentage > 100;
              const barColor = isOverBudget ? colors.expense : percentage > 80 ? colors.warning : colors.primary;

              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setEditingBudget(item);
                    setNewCategoryId(item.categoryId);
                    setNewAmount(item.amount.toString());
                    setNewPeriod(item.period);
                    setShowCreate(true);
                  }}
                  onLongPress={() => handleDeleteBudget(item)}
                >
                  <Card style={[styles.budgetItem, { borderLeftColor: barColor }]}>
                    <View style={styles.budgetHeader}>
                      <View style={styles.budgetCategory}>
                        <View style={[styles.categoryDot, { backgroundColor: category?.color || colors.primary }]} />
                        <Text style={[styles.budgetCategoryName, { color: colors.text }]}>
                          {category?.name || 'Unknown'}
                        </Text>
                      </View>
                      <Text style={[styles.budgetPercentage, { color: isOverBudget ? colors.expense : colors.text }]}>
                        {formatPercentage(percentage, 0)}
                      </Text>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: barColor,
                            width: `${Math.min(percentage, 100)}%`,
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.budgetDetails}>
                      <Text style={[styles.budgetSpent, { color: colors.textSecondary }]}>
                        {formatCurrency(item.spent)} {t.budget.spent}
                      </Text>
                      <Text style={[styles.budgetLimit, { color: colors.textSecondary }]}>
                        {t.budget.of} {formatCurrency(item.amount)}
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
  fieldLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  categoryName: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  optionChip: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  createActions: {
    marginTop: spacing.xl,
  },
  spacer: {
    height: spacing.md,
  },
  overviewCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  overviewLabel: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  overviewRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewValue: {
    ...typography.h4,
    fontWeight: '700',
    marginBottom: spacing.xxs,
  },
  overviewSub: {
    ...typography.caption,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
  },
  budgetItem: {
    borderLeftWidth: 3,
    marginBottom: spacing.sm,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  budgetCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  budgetCategoryName: {
    ...typography.body,
    fontWeight: '500',
  },
  budgetPercentage: {
    ...typography.body,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetSpent: {
    ...typography.caption,
  },
  budgetLimit: {
    ...typography.caption,
  },
});
