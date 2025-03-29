import React from 'react';
import { View, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import { Text } from './ui';
import { useEffect, useRef } from 'react';

export function LoadingScreen() {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.animationContainer}>
        <Animated.View
          style={[
            styles.circle,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        />
      </View>
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  animationContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#007AFF',
    borderTopColor: 'transparent',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
});
