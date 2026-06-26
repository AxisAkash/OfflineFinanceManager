import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { spacing, typography, borderRadius } from '../../../shared/theme/spacing';
import { Transaction } from '../../../shared/types';
import { formatCurrency, formatDate } from '../../../shared/utils';

interface TransactionItemProps {
  transaction: Transaction;
  categoryName?: string;
  categoryColor?: string;
  onPress?: (transaction: Transaction) => void;
}

export function TransactionItem({
  transaction,
  categoryName,
  categoryColor,
  onPress,
}: TransactionItemProps) {
  const { colors } = useTheme();
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? colors.income : colors.expense;
  const amountPrefix = isIncome ? '+' : '-';

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
      onPress={() => onPress?.(transaction)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${transaction.description || 'Transaction'}, ${formatCurrency(transaction.amount)}`}
    >
      <View style={[styles.categoryIcon, { backgroundColor: categoryColor || colors.primaryLight }]}>
        <Text style={styles.categoryIconText}>
          {(categoryName || '?').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.details}>
        <Text style={[styles.description, { color: colors.text }]} numberOfLines={1}>
          {transaction.description || categoryName || 'Untitled'}
        </Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {formatDate(transaction.date)}
        </Text>
      </View>
      <View style={styles.amount}>
        <Text style={[styles.amountText, { color: amountColor }]}>
          {amountPrefix}{formatCurrency(transaction.amount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  categoryIconText: {
    ...typography.label,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  details: {
    flex: 1,
  },
  description: {
    ...typography.body,
    fontWeight: '500',
    marginBottom: 2,
  },
  date: {
    ...typography.caption,
  },
  amount: {
    marginLeft: spacing.md,
  },
  amountText: {
    ...typography.body,
    fontWeight: '700',
  },
});
