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
import { useTheme } from '../../../shared/theme';
import { spacing, typography, borderRadius } from '../../../shared/theme/spacing';
import { Card, EmptyState, LoadingScreen, ErrorMessage, Button, Input, FAB } from '../../../shared/components';
import { budgetRepository } from '../../../core/repositories/budgetRepository';
import { categoryRepository } from '../../../core/repositories/categoryRepository';
import { transactionRepository } from '../../../core/repositories/transactionRepository';
import { Budget, Category } from '../../../shared/types';
import { formatCurrency, formatPercentage, generateId } from '../../../shared/utils';

interface BudgetScreenProps {
  onCreateBudget?: () => void;
  isCreating?: boolean;
}

export function BudgetScreen({ onCreateBudget, isCreating }: BudgetScreenProps) {
  const { colors } = useTheme();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [overview, setOverview] = useState({ totalBudget: 0, totalSpent: 0, remaining: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newPeriod, setNewPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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
      setError(err instanceof Error ? err.message : 'Failed to load budgets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreateBudget = useCallback(async () => {
    const amountNum = parseFloat(newAmount);
    if (!newCategoryId || !amountNum || amountNum <= 0) {
      Alert.alert('Error', 'Please select a category and enter a valid amount');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date();
      const startDate = now.toISOString();
      let endDate: Date;
      if (newPeriod === 'yearly') {
        endDate = new Date(now.getFullYear() + 1, now.getMonth(), 0);
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
      setShowCreate(false);
      setNewCategoryId('');
      setNewAmount('');
      await loadData();
    } catch (err) {
      Alert.alert('Error', 'Failed to create budget');
    } finally {
      setIsSaving(false);
    }
  }, [newCategoryId, newAmount, newPeriod, loadData]);

  const handleDeleteBudget = useCallback((budget: Budget) => {
    Alert.alert(
      'Delete Budget',
      `Are you sure you want to delete this budget?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await budgetRepository.delete(budget.id);
              await loadData();
            } catch {
              Alert.alert('Error', 'Failed to delete budget');
            }
          },
        },
      ]
    );
  }, [loadData]);

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
          title="No budgets"
          description="Create budgets to track your spending and stay on track"
          actionLabel="Create Budget"
          onAction={() => setShowCreate(true)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showCreate ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>Create Budget</Text>

          <Text style={[styles.fieldLabel, { color: colors.text }]}>Category</Text>
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
            label="Budget Amount"
            value={newAmount}
            onChangeText={setNewAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />

          <Text style={[styles.fieldLabel, { color: colors.text }]}>Period</Text>
          <View style={styles.optionsRow}>
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
                Monthly
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
                Yearly
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.createActions}>
            <Button
              title="Create Budget"
              onPress={handleCreateBudget}
              loading={isSaving}
              disabled={!newCategoryId || !newAmount}
              fullWidth
              size="lg"
            />
            <View style={styles.spacer} />
            <Button
              title="Cancel"
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
              Budgets
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
                Monthly Budget Overview
              </Text>
              <View style={styles.overviewRow}>
                <View style={styles.overviewItem}>
                  <Text style={[styles.overviewValue, { color: colors.text }]}>
                    {formatCurrency(overview.totalBudget)}
                  </Text>
                  <Text style={[styles.overviewSub, { color: colors.textSecondary }]}>
                    Budget
                  </Text>
                </View>
                <View style={styles.overviewItem}>
                  <Text style={[styles.overviewValue, { color: colors.expense }]}>
                    {formatCurrency(overview.totalSpent)}
                  </Text>
                  <Text style={[styles.overviewSub, { color: colors.textSecondary }]}>
                    Spent
                  </Text>
                </View>
                <View style={styles.overviewItem}>
                  <Text style={[styles.overviewValue, { color: overview.remaining >= 0 ? colors.income : colors.expense }]}>
                    {formatCurrency(overview.remaining)}
                  </Text>
                  <Text style={[styles.overviewSub, { color: colors.textSecondary }]}>
                    Remaining
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
                        {formatCurrency(item.spent)} spent
                      </Text>
                      <Text style={[styles.budgetLimit, { color: colors.textSecondary }]}>
                        of {formatCurrency(item.amount)}
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
