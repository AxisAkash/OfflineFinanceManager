import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { spacing, typography } from '../../../shared/theme/spacing';
import { EmptyState, LoadingScreen, ErrorMessage } from '../../../shared/components';
import { TransactionItem } from '../components/TransactionItem';
import { useTransactions } from '../hooks/useTransactions';
import { categoryRepository } from '../../../core/repositories/categoryRepository';
import { Category } from '../../../shared/types';

export function TransactionsScreen() {
  const { colors } = useTheme();
  const {
    transactions,
    isLoading,
    error,
    refresh,
  } = useTransactions();
  const [categories, setCategories] = useState<Record<string, Category>>({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const all = await categoryRepository.findAllMapped();
    const map: Record<string, Category> = {};
    all.forEach((cat) => {
      map[cat.id] = cat;
    });
    setCategories(map);
  };

  if (isLoading) {
    return <LoadingScreen type="list" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refresh} />;
  }

  if (transactions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          title="No Transactions"
          description="Start tracking your finances by adding your first transaction"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Transactions
        </Text>
      </View>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            categoryName={categories[item.categoryId]?.name}
            categoryColor={categories[item.categoryId]?.color}
          />
        )}
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
    paddingBottom: spacing.huge,
  },
});
