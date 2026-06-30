import React, { useCallback, useRef } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  View,
  Text,
} from 'react-native';
import { useTheme } from '../theme';
import { borderRadius, spacing } from '../theme/spacing';

interface FABProps {
  onPress: () => void;
  icon?: string;
  label?: string;
}

export function FAB({ onPress, icon = '+', label }: FABProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      {label && (
        <View style={[styles.label, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.labelText, { color: colors.text }]}>{label}</Text>
        </View>
      )}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={label || 'Add transaction'}
        accessibilityState={{ expanded: false }}
      >
        <Animated.Text
          style={[
            styles.icon,
            { color: colors.textOnPrimary, transform: [{ rotate: rotation }] },
          ]}
        >
          {icon}
        </Animated.Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  icon: {
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 30,
    marginTop: -1,
  },
  label: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
