import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'destructive';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  style,
  textStyle,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[size],
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#007AFF' : '#fff'} />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`${variant}Text`],
            styles[`${size}Text`],
            disabled && styles.disabledText,
            textStyle,
          ]}
          weight="semibold"
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontSize: 16,
  },
  // Variants
  primary: {
    backgroundColor: '#007AFF',
  },
  primaryText: {
    color: '#fff',
  },
  secondary: {
    backgroundColor: '#F5F5F5',
  },
  secondaryText: {
    color: '#007AFF',
  },
  destructive: {
    backgroundColor: '#dc3545',
  },
  destructiveText: {
    color: '#fff',
  },
  // Sizes
  small: {
    height: 32,
    paddingHorizontal: 12,
  },
  smallText: {
    fontSize: 14,
  },
  medium: {
    height: 44,
    paddingHorizontal: 16,
  },
  mediumText: {
    fontSize: 16,
  },
  large: {
    height: 54,
    paddingHorizontal: 20,
  },
  largeText: {
    fontSize: 18,
  },
  // States
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.8,
  },
}); 