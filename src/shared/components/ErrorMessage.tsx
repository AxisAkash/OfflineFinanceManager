import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { spacing, typography } from '../theme/spacing';
import { Button } from './Button';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorMessage({
  message,
  onRetry,
  retryLabel = 'Try Again',
}: ErrorMessageProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.error + '10' }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.error + '20' }]}>
        <Text style={[styles.icon, { color: colors.error }]}>!</Text>
      </View>
      <Text style={[styles.message, { color: colors.error }]}>{message}</Text>
      {onRetry && (
        <Button
          title={retryLabel}
          onPress={onRetry}
          variant="outline"
          size="sm"
          style={styles.retryButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    borderRadius: 12,
    margin: spacing.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  icon: {
    fontSize: 32,
    fontWeight: '700',
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    minWidth: 140,
  },
});
