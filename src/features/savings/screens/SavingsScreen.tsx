import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { spacing, typography } from '../../../shared/theme/spacing';
import { Card, EmptyState, LoadingScreen, ErrorMessage } from '../../../shared/components';
import { savingsRepository } from '../../../core/repositories/savingsRepository';
import { SavingsGoal } from '../../../shared/types';
import { formatCurrency, formatDate } from '../../../shared/utils';

export function SavingsScreen() {
  const { colors } = useTheme();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await savingsRepository.findAllActive();
      setGoals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load savings goals');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen type="list" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadGoals} />;
  }

  if (goals.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          title="No Savings Goals"
          description="Create goals to track your savings progress"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Savings Goals
        </Text>
      </View>
      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const percentage = item.targetAmount > 0
            ? (item.currentAmount / item.targetAmount) * 100
            : 0;

          return (
            <Card style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <View style={[styles.goalIcon, { backgroundColor: item.color + '20' }]}>
                  <Text style={[styles.goalEmoji, { color: item.color }]}>
                    {item.icon}
                  </Text>
                </View>
                <View style={styles.goalInfo}>
                  <Text style={[styles.goalName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.goalDeadline, { color: colors.textSecondary }]}>
                    Due {formatDate(item.deadline)}
                  </Text>
                </View>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: item.color,
                      width: `${Math.min(percentage, 100)}%` as unknown as number,
                    },
                  ]}
                />
              </View>
              <View style={styles.goalDetails}>
                <Text style={[styles.goalProgress, { color: colors.text }]}>
                  {formatCurrency(item.currentAmount)}
                </Text>
                <Text style={[styles.goalTarget, { color: colors.textSecondary }]}>
                  of {formatCurrency(item.targetAmount)}
                </Text>
                <Text style={[styles.goalPercentage, { color: colors.primary }]}>
                  {percentage.toFixed(1)}%
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
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
  },
  goalCard: {
    marginBottom: spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  goalEmoji: {
    fontSize: 24,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  goalDeadline: {
    ...typography.caption,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  goalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalProgress: {
    ...typography.body,
    fontWeight: '700',
  },
  goalTarget: {
    ...typography.caption,
  },
  goalPercentage: {
    ...typography.body,
    fontWeight: '700',
  },
});
