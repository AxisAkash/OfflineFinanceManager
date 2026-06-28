import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Animated, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { spacing, typography, borderRadius } from '../../../shared/theme/spacing';
import { Card, SkeletonList, ErrorMessage, EmptyState, FAB } from '../../../shared/components';
import { TransactionItem } from '../../transaction/components/TransactionItem';
import { transactionRepository } from '../../../core/repositories/transactionRepository';
import { walletRepository } from '../../../core/repositories/walletRepository';
import { budgetRepository } from '../../../core/repositories/budgetRepository';
import { categoryRepository } from '../../../core/repositories/categoryRepository';
import { Transaction, Category, Wallet } from '../../../shared/types';
import { formatCurrency } from '../../../shared/utils';

interface DashboardScreenProps {
  onAddTransaction?: () => void;
}

export function DashboardScreen({ onAddTransaction }: DashboardScreenProps) {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [activeWalletIndex, setActiveWalletIndex] = useState(0);
  const [budgetOverview, setBudgetOverview] = useState({ totalBudget: 0, totalSpent: 0, remaining: 0 });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading, fadeAnim, slideAnim]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const now = new Date();
      const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const [
        balance,
        monthlyTotals,
        recent,
        allCategories,
        budgetOverviewData,
        activeWallets,
      ] = await Promise.all([
        walletRepository.getTotalBalance(),
        transactionRepository.getDateRangeTotals(startOfMonth, endOfMonth),
        transactionRepository.getRecent(5),
        categoryRepository.findAllMapped(),
        budgetRepository.getBudgetOverview(),
        walletRepository.findAllActive(),
      ]);

      setTotalBalance(balance);
      setMonthlyIncome(monthlyTotals.income);
      setMonthlyExpenses(monthlyTotals.expense);
      setRecentTransactions(recent);
      setBudgetOverview(budgetOverviewData);
      setWallets(activeWallets);

      const catMap: Record<string, Category> = {};
      allCategories.forEach((c) => { catMap[c.id] = c; });
      setCategories(catMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SkeletonList count={4} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorMessage message={error} onRetry={loadData} />
      </View>
    );
  }

  const hasData = totalBalance > 0 || monthlyIncome > 0 || monthlyExpenses > 0;

  if (!hasData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon={'\uD83D\uDCB0'}
          title="No transactions yet"
          description="Start tracking your finances by adding your first income or expense"
          actionLabel="Add First Transaction"
          onAction={onAddTransaction}
        />
        <FAB onPress={onAddTransaction || (() => {})} />
      </View>
    );
  }

  const savingsRate = monthlyIncome > 0
    ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
    : 0;

  const netWorth = totalBalance;
  const healthScore = Math.min(100, Math.max(0,
    (savingsRate > 0 ? 30 : 0) +
    (budgetOverview.remaining > 0 ? 25 : 0) +
    (monthlyIncome > monthlyExpenses ? 25 : 0) +
    (wallets.length > 0 ? 20 : 0)
  ));

  const currentWallet = wallets[activeWalletIndex];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => {
              if (wallets.length > 1) {
                setActiveWalletIndex((prev) => (prev + 1) % wallets.length);
              }
            }}
          >
            <Card style={[styles.walletCard, { borderColor: colors.primary + '20' }]}>
              <View style={styles.walletCardHeader}>
                <Text style={[styles.balanceLabel, { color: colors.textTertiary }]}>
                  {currentWallet ? currentWallet.name : 'Total Balance'}
                </Text>
                {wallets.length > 1 && (
                  <Text style={[styles.swipeHint, { color: colors.textTertiary }]}>
                    Tap to switch
                  </Text>
                )}
              </View>
              <Text style={[styles.balanceAmount, { color: colors.text }]}>
                {currentWallet
                  ? formatCurrency(currentWallet.balance, currentWallet.currency)
                  : formatCurrency(totalBalance)
                }
              </Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.income }]}>
                    Income
                  </Text>
                  <Text style={[styles.summaryAmount, { color: colors.income }]}>
                    +{formatCurrency(monthlyIncome)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.expense }]}>
                    Expenses
                  </Text>
                  <Text style={[styles.summaryAmount, { color: colors.expense }]}>
                    -{formatCurrency(monthlyExpenses)}
                  </Text>
                </View>
              </View>

              {wallets.length > 1 && (
                <View style={styles.walletDots}>
                  {wallets.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.walletDot,
                        {
                          backgroundColor: i === activeWalletIndex ? colors.primary : colors.border,
                          width: i === activeWalletIndex ? 20 : 8,
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
            </Card>
          </TouchableOpacity>

          <View style={styles.quickStatsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Net Worth</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatCurrency(netWorth)}
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Savings Rate</Text>
              <Text style={[styles.statValue, { color: savingsRate >= 0 ? colors.income : colors.expense }]}>
                {savingsRate.toFixed(1)}%
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Health</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {healthScore}
              </Text>
            </View>
          </View>

          {budgetOverview.totalBudget > 0 && (
            <Card style={[styles.budgetCard, { borderLeftColor: budgetOverview.remaining >= 0 ? colors.primary : colors.expense }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Budget Overview
              </Text>
              <View style={styles.budgetBarContainer}>
                <View style={[styles.budgetBar, { backgroundColor: colors.surfaceVariant }]}>
                  <View
                    style={[
                      styles.budgetBarFill,
                      {
                        backgroundColor: budgetOverview.remaining >= 0 ? colors.primary : colors.expense,
                        width: `${Math.min((budgetOverview.totalSpent / budgetOverview.totalBudget) * 100, 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.budgetText, { color: colors.textSecondary }]}>
                  {formatCurrency(budgetOverview.totalSpent)} / {formatCurrency(budgetOverview.totalBudget)}
                </Text>
              </View>
            </Card>
          )}

          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Transactions
            </Text>
          </View>
          {recentTransactions.length === 0 ? (
            <Card>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No transactions yet. Start tracking your spending!
              </Text>
            </Card>
          ) : (
            recentTransactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                categoryName={categories[transaction.categoryId]?.name}
                categoryColor={categories[transaction.categoryId]?.color}
              />
            ))
          )}
        </Animated.View>
      </ScrollView>
      <FAB onPress={onAddTransaction || (() => {})} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.huge + 60,
  },
  walletCard: {
    borderWidth: 1,
    borderLeftWidth: 3,
    marginBottom: spacing.md,
  },
  walletCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  balanceLabel: {
    ...typography.bodySmall,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  swipeHint: {
    ...typography.caption,
  },
  balanceAmount: {
    ...typography.number,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    ...typography.caption,
    marginBottom: spacing.xxs,
  },
  summaryAmount: {
    ...typography.h4,
  },
  walletDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  walletDot: {
    height: 8,
    borderRadius: 4,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  statLabel: {
    ...typography.caption,
    marginBottom: spacing.xxs,
  },
  statValue: {
    ...typography.body,
    fontWeight: '700',
  },
  budgetCard: {
    borderLeftWidth: 3,
    marginTop: 0,
    marginBottom: spacing.lg,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
  },
  budgetBarContainer: {
    gap: spacing.sm,
  },
  budgetBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  budgetBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetText: {
    ...typography.caption,
    textAlign: 'right',
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
});
