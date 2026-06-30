import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Category, Transaction } from '../../../shared/types';
import { useTheme } from '../../../shared/theme';
import { useLanguage } from '../../../shared/localization/LanguageContext';
import { spacing, typography } from '../../../shared/theme/spacing';
import { EmptyState, LoadingScreen, ErrorMessage, FAB } from '../../../shared/components';
import { TransactionItem } from '../components/TransactionItem';
import { useTransactions } from '../hooks/useTransactions';
import { categoryRepository } from '../../../core/repositories/categoryRepository';

export function TransactionsScreen() {
  const { colors } = useTheme();
  const { t, translate } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    transactions,
    isLoading,
    error,
    refresh,
  } = useTransactions();
  const [categories, setCategories] = useState<Record<string, Category>>({});

  useFocusEffect(
    useCallback(() => {
      refresh();
      loadCategories();
    }, [refresh])
  );

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
    navigation.navigate('AddTransaction');
  }, [navigation]);

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
          title={t.transaction.noTransactions}
          description={t.transaction.noTransactionsDescription}
          actionLabel={t.transaction.create}
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
          {t.transaction.title}
        </Text>
        <Text style={[styles.count, { color: colors.textSecondary }]}>
          {translate('transaction.total', { count: transactions.length })}
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
    paddingBottom: 100,
  },
});
