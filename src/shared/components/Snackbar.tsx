import React, { useEffect, useRef, useCallback } from 'react';
import { Animated, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../theme';
import { spacing, borderRadius, typography } from '../theme/spacing';

interface SnackbarProps {
  visible: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  duration?: number;
  type?: 'success' | 'error' | 'info' | 'warning';
}

export function Snackbar({
  visible,
  message,
  actionLabel,
  onAction,
  onDismiss,
  duration = 3000,
  type = 'info',
}: SnackbarProps) {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(100)).current;

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return '#16A34A';
      case 'error': return '#DC2626';
      case 'warning': return '#F59E0B';
      default: return colors.text;
    }
  };

  const getTextColor = () => {
    return type === 'warning' ? '#0F172A' : '#FFFFFF';
  };

  const hide = useCallback(() => {
    Animated.timing(translateY, {
      toValue: 100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onDismiss());
  }, [translateY, onDismiss]);

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(hide, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, translateY, hide]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          transform: [{ translateY }],
          bottom: Platform.OS === 'ios' ? 100 : 80,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.message, { color: getTextColor() }]} numberOfLines={2}>
        {message}
      </Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          style={styles.action}
          onPress={() => {
            onAction();
            hide();
          }}
        >
          <Text style={[styles.actionText, { color: getTextColor() }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9999,
  },
  message: {
    ...typography.bodySmall,
    fontWeight: '500',
    flex: 1,
  },
  action: {
    marginLeft: spacing.lg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  actionText: {
    ...typography.button,
    fontSize: 14,
    fontWeight: '700',
  },
});
