import React, { useCallback, useRef } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from '../theme';
import { borderRadius } from '../theme/spacing';

interface FABProps {
  onPress: () => void;
  icon?: string;
}

export function FAB({ onPress, icon = '+' }: FABProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
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

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Add transaction"
        accessibilityState={{ expanded: false }}
      >
        <Animated.Text style={styles.icon}>{icon}</Animated.Text>
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
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
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
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 30,
    marginTop: -1,
  },
});
