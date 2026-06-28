import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { spacing, typography, borderRadius } from '../../../shared/theme/spacing';
import { Input, Button } from '../../../shared/components';
import { useTransactions } from '../hooks/useTransactions';
import { categoryRepository } from '../../../core/repositories/categoryRepository';
import { walletRepository } from '../../../core/repositories/walletRepository';
import { transactionRepository } from '../../../core/repositories/transactionRepository';
import { Category, Wallet, Transaction } from '../../../shared/types';
import { validateAmount } from '../../../shared/utils';
import { useWallets } from '../../wallet/hooks/useWallets';

interface AddTransactionScreenProps {
  walletId?: string;
  transactionId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddTransactionScreen({
  walletId: initialWalletId,
  transactionId,
  onSuccess,
  onCancel,
}: AddTransactionScreenProps) {
  const { colors } = useTheme();
  const { createTransaction, updateTransaction, isLoading } = useTransactions();
  const { wallets } = useWallets();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWalletId, setSelectedWalletId] = useState(initialWalletId || '');
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadCategories();
    loadWallets();
    if (transactionId) {
      loadTransaction(transactionId);
    }
  }, [transactionId]);

  const loadCategories = async () => {
    try {
      const all = await categoryRepository.findAllMapped();
      setCategories(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    }
  };

  const loadWallets = async () => {
    try {
      if (!selectedWalletId) {
        const active = await walletRepository.findAllActive();
        if (active.length > 0) {
          setSelectedWalletId(active[0].id);
        }
      }
    } catch (err) {
      // ignore
    }
  };

  const loadTransaction = async (id: string) => {
    try {
      const txn = await transactionRepository.findById<Transaction>(id);
      if (txn) {
        setIsEditing(true);
        setType(txn.type);
        setCategoryId(txn.categoryId);
        setAmount(txn.amount.toString());
        setDescription(txn.description);
        setDate(txn.date);
        setSelectedWalletId(txn.walletId);
        setIsRecurring(txn.isRecurring);
      }
    } catch (err) {
      // ignore
    }
  };

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

    if (!selectedWalletId) {
      setError('Please select a wallet');
      return;
    }

    const transactionData = {
      walletId: selectedWalletId,
      categoryId,
      amount: amountNum,
      type,
      description: description.trim(),
      date,
      isRecurring,
    };

    let success: boolean;
    if (isEditing && transactionId) {
      success = await updateTransaction(transactionId, transactionData);
    } else {
      success = await createTransaction(transactionData);
    }

    if (success) {
      onSuccess?.();
    } else {
      setError(`Failed to ${isEditing ? 'update' : 'save'} transaction`);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {error ? (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      ) : null}

      <View style={[styles.typeToggle, { backgroundColor: colors.surfaceVariant }]}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            type === 'expense' && { backgroundColor: colors.expense },
          ]}
          onPress={() => { setType('expense'); setCategoryId(''); }}
        >
          <Text style={[
            styles.typeText,
            { color: type === 'expense' ? colors.textOnPrimary : colors.text },
          ]}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.typeButton,
            type === 'income' && { backgroundColor: colors.income },
          ]}
          onPress={() => { setType('income'); setCategoryId(''); }}
        >
          <Text style={[
            styles.typeText,
            { color: type === 'income' ? colors.textOnPrimary : colors.text },
          ]}>Income</Text>
        </TouchableOpacity>
      </View>

      <Input
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />

      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="What was this for?"
        maxLength={200}
      />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Input
            label="Date"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />
        </View>
        <View style={styles.halfField}>
          <Input
            label="Time"
            value={time}
            onChangeText={setTime}
            placeholder="HH:MM"
          />
        </View>
      </View>

      <Text style={[styles.fieldLabel, { color: colors.text }]}>Wallet</Text>
      <View style={styles.optionsRow}>
        {wallets.map((wallet) => (
          <TouchableOpacity
            key={wallet.id}
            style={[
              styles.optionChip,
              {
                backgroundColor: selectedWalletId === wallet.id ? wallet.color : colors.surfaceVariant,
                borderColor: selectedWalletId === wallet.id ? wallet.color : colors.border,
              },
            ]}
            onPress={() => setSelectedWalletId(wallet.id)}
          >
            <Text style={[
              styles.optionChipText,
              { color: selectedWalletId === wallet.id ? colors.textOnPrimary : colors.text },
            ]}>{wallet.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.fieldLabel, { color: colors.text }]}>Category</Text>
      <View style={styles.categoryGrid}>
        {filteredCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryItem,
              {
                backgroundColor: categoryId === category.id ? category.color : colors.surfaceVariant,
                borderColor: categoryId === category.id ? category.color : colors.border,
              },
            ]}
            onPress={() => setCategoryId(category.id)}
          >
            <Text style={[
              styles.categoryName,
              { color: categoryId === category.id ? colors.textOnPrimary : colors.text },
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Add notes..."
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[styles.recurringToggle, { backgroundColor: colors.surfaceVariant }]}
        onPress={() => setIsRecurring(!isRecurring)}
      >
        <Text style={[styles.recurringLabel, { color: colors.text }]}>
          Recurring Transaction
        </Text>
        <View style={[
          styles.checkbox,
          { backgroundColor: isRecurring ? colors.primary : colors.border },
        ]}>
          {isRecurring && (
            <Text style={[styles.checkmark, { color: colors.textOnPrimary }]}>
              {'\u2713'}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      <Button
        title={isEditing ? 'Update Transaction' : 'Save Transaction'}
        onPress={handleSubmit}
        loading={isLoading}
        disabled={!amount || !categoryId || !selectedWalletId}
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
  error: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginBottom: spacing.md,
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
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
  },
  fieldLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  optionChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  optionChipText: {
    ...typography.bodySmall,
    fontWeight: '500',
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
  recurringToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
  },
  recurringLabel: {
    ...typography.body,
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '700',
  },
});
