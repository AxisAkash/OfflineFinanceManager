import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { spacing, typography, borderRadius } from '../../../shared/theme/spacing';
import { Input, Button } from '../../../shared/components';
import { useLanguage } from '../../../shared/localization/LanguageContext';
import { useTransactions } from '../hooks/useTransactions';
import { categoryRepository } from '../../../core/repositories/categoryRepository';
import { walletRepository } from '../../../core/repositories/walletRepository';
import { transactionRepository } from '../../../core/repositories/transactionRepository';
import { Category, Wallet, Transaction } from '../../../shared/types';
import { validateAmount, generateId } from '../../../shared/utils';
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
  onCancel: _onCancel,
}: AddTransactionScreenProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
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
    if (!initialWalletId) {
      loadWallets();
    }
    if (transactionId) {
      loadTransaction(transactionId);
    }
  }, [transactionId]);

  useEffect(() => {
    if (initialWalletId) {
      setSelectedWalletId(initialWalletId);
    }
  }, [initialWalletId]);

  const loadCategories = async () => {
    try {
      const all = await categoryRepository.findAllMapped();
      setCategories(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.app.error);
    }
  };

  const loadWallets = async () => {
    try {
      const active = await walletRepository.findAllActive();
      if (active.length > 0) {
        setSelectedWalletId(active[0].id);
      } else {
        const now = new Date().toISOString();
        const defaultWallet: Wallet = {
          id: generateId(),
          name: 'Main Wallet',
          balance: 0,
          currency: 'USD',
          icon: 'wallet',
          color: '#4CAF50',
          isArchived: false,
          createdAt: now,
          updatedAt: now,
        };
        await walletRepository.create(defaultWallet);
        setSelectedWalletId(defaultWallet.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.app.error);
    }
  };

  const loadTransaction = async (id: string) => {
    try {
      const txn = await transactionRepository.findByIdTransformed(id);
      if (txn) {
        setIsEditing(true);
        setType(txn.type);
        setCategoryId(txn.categoryId);
        setAmount(txn.amount.toString());
        setDescription(txn.description);
        setDate(txn.date);
        setSelectedWalletId(txn.walletId);
        setTime(txn.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setNotes(txn.notes || '');
        setIsRecurring(txn.isRecurring);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.app.error);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async () => {
    setError(null);

    const amountNum = parseFloat(amount);
    const validation = validateAmount(amountNum, t);
    if (!validation.isValid) {
      setError(validation.error || t.transaction.invalidAmount);
      return;
    }

    if (!categoryId) {
      setError(t.transaction.selectCategory);
      return;
    }

    if (!selectedWalletId) {
      setError(t.transaction.selectWallet);
      return;
    }

    const transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
      walletId: selectedWalletId,
      categoryId,
      amount: amountNum,
      type,
      description: description.trim(),
      date,
      isRecurring,
      notes: notes.trim() || undefined,
      time: time || undefined,
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
      setError(isEditing ? t.transaction.updateFailed : t.transaction.saveFailed);
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
          ]}>{t.transaction.expense}</Text>
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
          ]}>{t.transaction.income}</Text>
        </TouchableOpacity>
      </View>

      <Input
        label={t.transaction.amount}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />

      <Input
        label={t.transaction.description}
        value={description}
        onChangeText={setDescription}
        placeholder={t.transaction.descriptionPlaceholder}
        maxLength={200}
      />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Input
            label={t.transaction.date}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />
        </View>
        <View style={styles.halfField}>
          <Input
            label={t.transaction.time}
            value={time}
            onChangeText={setTime}
            placeholder="HH:MM"
          />
        </View>
      </View>

      <Text style={[styles.fieldLabel, { color: colors.text }]}>{t.transaction.wallet}</Text>
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

      <Text style={[styles.fieldLabel, { color: colors.text }]}>{t.transaction.category}</Text>
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
        label={t.transaction.notes}
        value={notes}
        onChangeText={setNotes}
        placeholder={t.transaction.notesPlaceholder}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[styles.recurringToggle, { backgroundColor: colors.surfaceVariant }]}
        onPress={() => setIsRecurring(!isRecurring)}
      >
        <Text style={[styles.recurringLabel, { color: colors.text }]}>
          {t.transaction.recurring}
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
        title={isEditing ? t.transaction.update : t.transaction.save}
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
