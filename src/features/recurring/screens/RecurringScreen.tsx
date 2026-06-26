import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { spacing, typography, borderRadius } from '../../../shared/theme/spacing';
import { EmptyState, LoadingScreen, ErrorMessage } from '../../../shared/components';
import { recurringRepository } from '../../../core/repositories/recurringRepository';
import { categoryRepository } from '../../../core/repositories/categoryRepository';
import { RecurringTransaction, Category } from '../../../shared/types';
import { formatCurrency, formatDate } from '../../../shared/utils';

export function RecurringScreen() {
  const { colors } = useTheme();
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [items, allCategories] = await Promise.all([
        recurringRepository.findAllActive(),
        categoryRepository.findAllMapped(),
      ]);
      setRecurring(items);
      const catMap: Record<string, Category> = {};
      allCategories.forEach((c) => { catMap[c.id] = c; });
      setCategories(catMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recurring transactions');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen type="list" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadData} />;
  }

  if (recurring.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          title="No Recurring Transactions"
          description="Set up recurring bills and income for automatic tracking"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Recurring
        </Text>
      </View>
      <FlatList
        data={recurring}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const category = categories[item.categoryId];

          return (
            <View
              style={[styles.recurringItem, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
            >
              <View style={styles.recurringHeader}>
                <View style={[styles.typeIndicator, {
                  backgroundColor: item.type === 'income' ? colors.income : colors.expense,
                }]} />
                <View style={styles.recurringInfo}>
                  <Text style={[styles.recurringDescription, { color: colors.text }]}>
                    {item.description || category?.name || 'Untitled'}
                  </Text>
                  <Text style={[styles.recurringCategory, { color: colors.textSecondary }]}>
                    {category?.name || 'Unknown'} · {item.frequency}
                  </Text>
                </View>
                <Text style={[styles.recurringAmount, {
                  color: item.type === 'income' ? colors.income : colors.expense,
                }]}>
                  {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                </Text>
              </View>
              <View style={styles.recurringFooter}>
                <Text style={[styles.recurringNext, { color: colors.textSecondary }]}>
                  Next: {formatDate(item.nextDate)}
                </Text>
                {item.endDate && (
                  <Text style={[styles.recurringEnd, { color: colors.textTertiary }]}>
                    Until {formatDate(item.endDate)}
                  </Text>
                )}
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
  },
  recurringItem: {
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  recurringHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  typeIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  recurringInfo: {
    flex: 1,
  },
  recurringDescription: {
    ...typography.body,
    fontWeight: '500',
    marginBottom: 2,
  },
  recurringCategory: {
    ...typography.caption,
  },
  recurringAmount: {
    ...typography.body,
    fontWeight: '700',
  },
  recurringFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: spacing.lg,
  },
  recurringNext: {
    ...typography.caption,
  },
  recurringEnd: {
    ...typography.caption,
  },
});
