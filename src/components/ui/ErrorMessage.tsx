import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  text: {
    color: '#c62828',
    fontSize: 14,
  },
}); 