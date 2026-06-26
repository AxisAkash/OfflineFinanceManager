import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { useTheme } from '../theme';
import { borderRadius } from '../theme/spacing';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadiusValue?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadiusValue = borderRadius.md,
  style,
}: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: borderRadiusValue,
          backgroundColor: colors.skeleton,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: colors.skeletonHighlight,
            opacity,
          },
        ]}
      />
    </View>
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      <Skeleton height={16} width="40%" />
      <View style={styles.spacer} />
      <Skeleton height={32} width="60%" />
      <View style={styles.spacer} />
      <Skeleton height={14} width="80%" />
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} style={styles.listItem} />
      ))}
    </View>
  );
}

export function SkeletonChart({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.chart, style]}>
      <Skeleton height={200} borderRadiusValue={borderRadius.lg} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  spacer: {
    height: 12,
  },
  list: {
    gap: 12,
  },
  listItem: {
    marginBottom: 8,
  },
  chart: {
    marginVertical: 16,
  },
});
