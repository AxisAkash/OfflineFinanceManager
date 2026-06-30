import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../../../shared/theme';
import { useLanguage } from '../../../shared/localization/LanguageContext';
import { spacing, typography } from '../../../shared/theme/spacing';
import { Card, Button, LoadingScreen, ErrorMessage } from '../../../shared/components';
import { transactionRepository } from '../../../core/repositories/transactionRepository';
import { categoryRepository } from '../../../core/repositories/categoryRepository';
import { walletRepository } from '../../../core/repositories/walletRepository';
import { Transaction, Category, Wallet } from '../../../shared/types';
import { formatCurrency, formatDate } from '../../../shared/utils';

interface TransactionDetailScreenProps {
  transactionId: string;
  onClose: () => void;
  onEdit: () => void;
}

export function TransactionDetailScreen({
  transactionId,
  onClose,
  onEdit,
}: TransactionDetailScreenProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDetail();
  }, [transactionId]);

  const loadDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const txn = await transactionRepository.findByIdTransformed(transactionId);
      if (!txn) {
        setError(t.transaction.notFound);
        return;
      }
      setTransaction(txn);

      const [allCats, allWallets] = await Promise.all([
        categoryRepository.findAllMapped(),
        walletRepository.findAllIncludingArchived(),
      ]);
      const foundCat = allCats.find((c) => c.id === txn.categoryId);
      const foundWal = allWallets.find((w) => w.id === txn.walletId);
      if (foundCat) setCategory(foundCat);
      if (foundWal) setWallet(foundWal);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.app.error);
    } finally {
      setIsLoading(false);
    }
  }, [transactionId, t]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      t.transaction.delete,
      t.transaction.deleteConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              if (transaction) {
                await transactionRepository.deleteTransaction(transaction.id);
              }
              onClose();
            } catch {
              Alert.alert(t.common.error, t.transaction.deleteFailed);
            }
          },
        },
      ]
    );
  }, [transaction, onClose, t]);

  if (isLoading) {
    return <LoadingScreen type="detail" />;
  }

  if (error || !transaction) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorMessage message={error || t.transaction.notFound} onRetry={loadDetail} />
      </View>
    );
  }

  const isIncome = transaction.type === 'income';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Card style={styles.amountCard}>
        <Text style={[styles.amountLabel, { color: colors.textTertiary }]}>
          {isIncome ? t.transaction.income : t.transaction.expense}
        </Text>
        <Text
          style={[
            styles.amount,
            { color: isIncome ? colors.income : colors.expense },
          ]}
        >
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
        </Text>
      </Card>

      <Card style={styles.detailCard}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            {t.transaction.description}
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {transaction.description || category?.name || t.common.noData}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            {t.transaction.category}
          </Text>
          <View style={styles.categoryBadge}>
            <View style={[styles.categoryDot, { backgroundColor: category?.color || colors.primary }]} />
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {category?.name || t.common.unknown}
            </Text>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            {t.transaction.date}
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {formatDate(transaction.date)}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            {t.transaction.wallet}
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {wallet?.name || t.common.unknown}
          </Text>
        </View>
        {transaction.isRecurring && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                {t.transaction.recurring}
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {t.common.yes}
              </Text>
            </View>
          </>
        )}
      </Card>

      <View style={styles.actions}>
        <Button
          title={t.transaction.edit}
          onPress={onEdit}
          variant="secondary"
          fullWidth
          size="lg"
        />
        <View style={styles.actionSpacer} />
        <Button
          title={t.transaction.delete}
          onPress={handleDelete}
          variant="danger"
          fullWidth
          size="lg"
        />
      </View>
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
  amountCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginBottom: spacing.lg,
  },
  amountLabel: {
    ...typography.bodySmall,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  amount: {
    ...typography.number,
  },
  detailCard: {
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  detailLabel: {
    ...typography.bodySmall,
  },
  detailValue: {
    ...typography.body,
    fontWeight: '500',
    flexShrink: 0,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  actions: {
    marginTop: spacing.lg,
  },
  actionSpacer: {
    height: spacing.md,
  },
});
