import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from './Text';

interface LoadingProps {
  message?: string;
  size?: number;
  color?: string;
}

export function Loading({ message, size = 36, color = "#007AFF" }: LoadingProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
}); 