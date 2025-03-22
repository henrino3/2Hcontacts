import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption';
type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: string;
  children: React.ReactNode;
}

export function Text({ variant = 'body', weight = 'normal', color, style, children, ...props }: TextProps) {
  return (
    <RNText
      style={[
        styles.base,
        styles[variant],
        styles[weight],
        color && { color },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    color: '#000',
  },
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: 'bold',
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  normal: {
    fontWeight: 'normal',
  },
  medium: {
    fontWeight: '500',
  },
  semibold: {
    fontWeight: '600',
  },
  bold: {
    fontWeight: 'bold',
  },
}); 