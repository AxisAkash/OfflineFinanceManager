import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../../shared/theme';
import { spacing, typography, borderRadius } from '../../../shared/theme/spacing';
import { Input, Button } from '../../../shared/components';
import { Category } from '../../../shared/types';
import { validateAmount } from '../../../shared/utils';

interface TransactionFormProps {
  categories: Category[];
  walletId: string;
  onSubmit: (data: TransactionFormData) => Promise<boolean>;
  isLoading?: boolean;
}

export interface TransactionFormData {
  walletId: string;
  categoryId: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  date: string;
  isRecurring: boolean;
  recurringId?: string;
}

export function TransactionForm({
  categories,
  walletId,
  onSubmit,
  isLoading = false,
}: TransactionFormProps) {
  const { colors } = useTheme();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async () => {
    setError(null);

    const amountNum = parseFloat(amount);
    const validation = validateAmount(amountNum);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid amount');
      return;
    }

    if (!categoryId) {
      setError('Please select a category');
      return;
    }

    const success = await onSubmit({
      walletId,
      categoryId,
      amount: amountNum,
      type,
      description: description.trim(),
      date,
      isRecurring: false,
    });

    if (!success) {
      setError('Failed to save transaction');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.typeToggle, { backgroundColor: colors.surfaceVariant }]}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            type === 'expense' && { backgroundColor: colors.expense },
          ]}
          onPress={() => setType('expense')}
        >
          <Text
            style={[
              styles.typeText,
              { color: type === 'expense' ? colors.textOnPrimary : colors.text },
            ]}
          >
            Expense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.typeButton,
            type === 'income' && { backgroundColor: colors.income },
          ]}
          onPress={() => setType('income')}
        >
          <Text
            style={[
              styles.typeText,
              { color: type === 'income' ? colors.textOnPrimary : colors.text },
            ]}
          >
            Income
          </Text>
        </TouchableOpacity>
      </View>

      <Input
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0.00"
        error={error || undefined}
      />

      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="What was this for?"
        maxLength={200}
      />

      <Input
        label="Date"
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
      />

      <Text style={[styles.categoryLabel, { color: colors.text }]}>
        Category
      </Text>
      <View style={styles.categoryGrid}>
        {filteredCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryItem,
              {
                backgroundColor: categoryId === category.id
                  ? category.color
                  : colors.surfaceVariant,
                borderColor: categoryId === category.id
                  ? category.color
                  : colors.border,
              },
            ]}
            onPress={() => setCategoryId(category.id)}
          >
            <Text
              style={[
                styles.categoryName,
                {
                  color: categoryId === category.id
                    ? colors.textOnPrimary
                    : colors.text,
                },
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title="Save Transaction"
        onPress={handleSubmit}
        loading={isLoading}
        disabled={!amount || !categoryId}
        fullWidth
        size="lg"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  typeToggle: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.xl,
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  typeText: {
    ...typography.button,
  },
  categoryLabel: {
    ...typography.label,
    marginBottom: spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
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
});
