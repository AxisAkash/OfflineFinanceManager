import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../theme';
import { spacing, borderRadius, typography } from '../theme/spacing';
import { ColorScheme } from '../theme/colors';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const { colors } = useTheme();

  const buttonStyles: ViewStyle[] = [
    styles.base,
    styles[`size_${size}` as keyof typeof styles] as ViewStyle,
    fullWidth ? styles.fullWidth : {},
    disabled ? styles.disabled : {},
    { backgroundColor: getBackgroundColor(variant, colors) },
    variant === 'outline' ? { borderColor: colors.primary, borderWidth: 2 } : {},
  ];

  if (style) {
    buttonStyles.push(style);
  }

  const textColor = getTextColor(variant, colors);

  const textStyles: TextStyle[] = [
    styles.text,
    styles[`textSize_${size}` as keyof typeof styles] as TextStyle,
    { color: textColor },
  ];

  if (textStyle) {
    textStyles.push(textStyle);
  }

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function getBackgroundColor(variant: ButtonVariant, colors: ColorScheme): string {
  switch (variant) {
    case 'primary':
      return colors.primary;
    case 'secondary':
      return colors.surfaceVariant;
    case 'outline':
      return colors.transparent;
    case 'ghost':
      return colors.transparent;
    case 'danger':
      return colors.error;
    default:
      return colors.primary;
  }
}

function getTextColor(variant: ButtonVariant, colors: ColorScheme): string {
  switch (variant) {
    case 'primary':
      return colors.textOnPrimary;
    case 'secondary':
      return colors.text;
    case 'outline':
      return colors.primary;
    case 'ghost':
      return colors.primary;
    case 'danger':
      return colors.textOnPrimary;
    default:
      return colors.textOnPrimary;
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  size_sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  size_md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  size_lg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  text: {
    ...typography.button,
  },
  textSize_sm: {
    ...typography.bodySmall,
    fontWeight: '600' as const,
  },
  textSize_md: {
    ...typography.button,
  },
  textSize_lg: {
    ...typography.button,
    fontSize: 18,
  },
});
