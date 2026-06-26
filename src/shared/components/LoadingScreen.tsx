import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { spacing } from '../theme/spacing';
import { Skeleton } from './Skeleton';

interface LoadingScreenProps {
  type?: 'list' | 'detail' | 'chart';
}

export function LoadingScreen({ type = 'list' }: LoadingScreenProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {type === 'list' && (
        <>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={styles.row}>
              <Skeleton width={40} height={40} borderRadiusValue={20} />
              <View style={styles.rowContent}>
                <Skeleton height={14} width="60%" />
                <View style={styles.spacer} />
                <Skeleton height={12} width="40%" />
              </View>
              <Skeleton height={20} width={60} />
            </View>
          ))}
        </>
      )}
      {type === 'detail' && (
        <View style={styles.detail}>
          <Skeleton height={120} />
          <View style={styles.detailSpacer} />
          <Skeleton height={16} width="50%" />
          <View style={styles.spacer} />
          <Skeleton height={40} width="80%" />
          <View style={styles.detailSpacer} />
          <Skeleton height={14} width="100%" />
          <View style={styles.spacer} />
          <Skeleton height={14} width="90%" />
          <View style={styles.spacer} />
          <Skeleton height={14} width="70%" />
        </View>
      )}
      {type === 'chart' && (
        <>
          <Skeleton height={200} />
          <View style={styles.detailSpacer} />
          <View style={styles.chartRow}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} width={60} height={60} borderRadiusValue={30} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  rowContent: {
    flex: 1,
  },
  spacer: {
    height: 4,
  },
  detail: {
    padding: spacing.lg,
  },
  detailSpacer: {
    height: 24,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
  },
});
