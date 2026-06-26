import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { spacing, typography } from '../../../shared/theme/spacing';
import { Card, EmptyState, LoadingScreen, ErrorMessage } from '../../../shared/components';
import { debtRepository } from '../../../core/repositories/debtRepository';
import { Debt } from '../../../shared/types';
import { formatCurrency, formatDate, formatPercentage } from '../../../shared/utils';

export function DebtScreen() {
  const { colors } = useTheme();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await debtRepository.findAllActive();
      setDebts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load debts');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen type="list" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadDebts} />;
  }

  if (debts.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          title="No Debts"
          description="Track your debts and payments in one place"
        />
      </View>
    );
  }

  const totalRemaining = debts.reduce((sum, d) => sum + d.remainingAmount, 0);
  const totalOwed = debts.reduce((sum, d) => sum + d.totalAmount, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Debts
        </Text>
      </View>

      <Card style={styles.overviewCard}>
        <View style={styles.overviewRow}>
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
              Total Owed
            </Text>
            <Text style={[styles.overviewValue, { color: colors.expense }]}>
              {formatCurrency(totalOwed)}
            </Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
              Remaining
            </Text>
            <Text style={[styles.overviewValue, { color: colors.text }]}>
              {formatCurrency(totalRemaining)}
            </Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
              Paid
            </Text>
            <Text style={[styles.overviewValue, { color: colors.income }]}>
              {formatCurrency(totalOwed - totalRemaining)}
            </Text>
          </View>
        </View>
      </Card>

      <FlatList
        data={debts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const paidPercentage = item.totalAmount > 0
            ? ((item.totalAmount - item.remainingAmount) / item.totalAmount) * 100
            : 0;

          return (
            <Card style={styles.debtCard}>
              <View style={styles.debtHeader}>
                <Text style={[styles.debtName, { color: colors.text }]}>
                  {item.name}
                </Text>
                {item.lender ? (
                  <Text style={[styles.debtLender, { color: colors.textSecondary }]}>
                    {item.lender}
                  </Text>
                ) : null}
              </View>
              <View style={styles.debtAmounts}>
                <View style={styles.debtAmountItem}>
                  <Text style={[styles.debtAmountLabel, { color: colors.textSecondary }]}>
                    Remaining
                  </Text>
                  <Text style={[styles.debtAmountValue, { color: colors.expense }]}>
                    {formatCurrency(item.remainingAmount)}
                  </Text>
                </View>
                <View style={styles.debtAmountItem}>
                  <Text style={[styles.debtAmountLabel, { color: colors.textSecondary }]}>
                    Total
                  </Text>
                  <Text style={[styles.debtAmountValue, { color: colors.text }]}>
                    {formatCurrency(item.totalAmount)}
                  </Text>
                </View>
                <View style={styles.debtAmountItem}>
                  <Text style={[styles.debtAmountLabel, { color: colors.textSecondary }]}>
                    Interest
                  </Text>
                  <Text style={[styles.debtAmountValue, { color: colors.warning }]}>
                    {formatPercentage(item.interestRate)}%
                  </Text>
                </View>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${Math.min(paidPercentage, 100)}%` as unknown as number,
                    },
                  ]}
                />
              </View>
              <View style={styles.debtFooter}>
                <Text style={[styles.debtDue, { color: colors.textSecondary }]}>
                  Due {formatDate(item.dueDate)}
                </Text>
                <Text style={[styles.debtMinPayment, { color: colors.textSecondary }]}>
                  Min: {formatCurrency(item.minimumPayment)}/mo
                </Text>
              </View>
            </Card>
          );
        }}
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
  overviewCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  overviewRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  overviewValue: {
    ...typography.h4,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
  },
  debtCard: {
    marginBottom: spacing.md,
  },
  debtHeader: {
    marginBottom: spacing.md,
  },
  debtName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  debtLender: {
    ...typography.caption,
  },
  debtAmounts: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  debtAmountItem: {
    flex: 1,
  },
  debtAmountLabel: {
    ...typography.caption,
    marginBottom: spacing.xxs,
  },
  debtAmountValue: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  debtFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  debtDue: {
    ...typography.caption,
  },
  debtMinPayment: {
    ...typography.caption,
  },
});
