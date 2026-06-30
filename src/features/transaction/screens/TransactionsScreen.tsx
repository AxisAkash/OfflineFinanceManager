import React, { useState, useCallback } from 'react';
import { Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Category, Transaction } from '../../../shared/types';
import { useTheme } from '../../../shared/theme';
import { useLanguage } from '../../../shared/localization/LanguageContext';
import { typography } from '../../../shared/theme/spacing';
import { EmptyState, LoadingScreen, ErrorMessage, FAB, ScreenHeader } from '../../../shared/components';
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
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title={t.transaction.title} />
        <LoadingScreen type="list" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title={t.transaction.title} />
        <ErrorMessage message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  if (transactions.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title={t.transaction.title} />
        <EmptyState
          icon={'\uD83D\uDCB3'}
          title={t.transaction.noTransactions}
          description={t.transaction.noTransactionsDescription}
          actionLabel={t.transaction.create}
          onAction={handleAddTransaction}
        />
        <FAB onPress={handleAddTransaction} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={t.transaction.title}
        rightAction={
          <Text style={[styles.count, { color: colors.textSecondary }]}>
            {translate('transaction.total', { count: transactions.length })}
          </Text>
        }
      />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  count: {
    ...typography.bodySmall,
  },
  list: {
    paddingBottom: 100,
  },
});
