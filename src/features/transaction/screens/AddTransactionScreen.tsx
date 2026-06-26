import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { spacing, typography } from '../../../shared/theme/spacing';
import { TransactionForm, TransactionFormData } from '../components/TransactionForm';
import { useTransactions } from '../hooks/useTransactions';
import { categoryRepository } from '../../../core/repositories/categoryRepository';
import { Category } from '../../../shared/types';

interface AddTransactionScreenProps {
  walletId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddTransactionScreen({
  walletId = 'default',
  onSuccess,
  onCancel,
}: AddTransactionScreenProps) {
  const { colors } = useTheme();
  const { createTransaction, isLoading } = useTransactions();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const all = await categoryRepository.findAllMapped();
      setCategories(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    }
  };

  const handleSubmit = async (data: TransactionFormData): Promise<boolean> => {
    const success = await createTransaction(data);
    if (success) {
      onSuccess?.();
    }
    return success;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={[styles.cancelText, { color: colors.primary }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Add Transaction
        </Text>
        <View style={styles.placeholder} />
      </View>

      {error ? (
        <Text style={[styles.error, { color: colors.error }]}>
          {error}
        </Text>
      ) : null}

      <TransactionForm
        categories={categories}
        walletId={walletId}
        onSubmit={handleSubmit}
        isLoading={isLoading}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h3,
  },
  cancelText: {
    ...typography.button,
  },
  placeholder: {
    width: 60,
  },
  error: {
    ...typography.bodySmall,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
});
