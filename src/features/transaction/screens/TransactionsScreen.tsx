import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../shared/theme';
import { spacing, typography } from '../../../shared/theme/spacing';
import { EmptyState, LoadingScreen, ErrorMessage, FAB } from '../../../shared/components';
import { TransactionItem } from '../components/TransactionItem';
import { useTransactions } from '../hooks/useTransactions';
import { categoryRepository } from '../../../core/repositories/categoryRepository';
import { Category, Transaction } from '../../../shared/types';

interface TransactionsScreenProps {
  onAddTransaction?: () => void;
}

export function TransactionsScreen({ onAddTransaction }: TransactionsScreenProps) {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
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

  const loadCategories = useCallback(async () => {
    const all = await categoryRepository.findAllMapped();
    const map: Record<string, Category> = {};
    all.forEach((cat) => {
      map[cat.id] = cat;
    });
    setCategories(map);
  }, []);

  const handleTransactionPress = useCallback((transaction: Transaction) => {
    navigation.navigate('TransactionDetail', { transactionId: transaction.id });
  }, [navigation]);

  const handleAddTransaction = useCallback(() => {
    if (onAddTransaction) {
      onAddTransaction();
    }
  }, [onAddTransaction]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingScreen type="list" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorMessage message={error} onRetry={refresh} />
      </View>
    );
  }

  if (transactions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon={'\uD83D\uDCB3'}
          title="No transactions"
          description="Start tracking your finances by adding your first transaction"
          actionLabel="Create Transaction"
          onAction={handleAddTransaction}
        />
        <FAB onPress={handleAddTransaction} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Transactions
        </Text>
        <Text style={[styles.count, { color: colors.textSecondary }]}>
          {transactions.length} total
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
            onPress={handleTransactionPress}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
      <FAB onPress={handleAddTransaction} />
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
  count: {
    ...typography.bodySmall,
  },
  list: {
    paddingBottom: spacing.huge + 60,
  },
});
