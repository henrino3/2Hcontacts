import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from '../components/ui';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { MainNavigator } from './MainNavigator';
import { useAuth } from '../hooks/useAuth';

const Stack = createNativeStackNavigator();

// Temporary Home Screen component
function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to HContacts</Text>
    </View>
  );
}

export function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size={36} color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // Main App Stack
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Main app navigator
function MainNavigator() {
  const MainStack = createNativeStackNavigator();
  
  return (
    <MainStack.Navigator>
      <MainStack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'HContacts'
        }}
      />
    </MainStack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
  },
});

export default AppNavigator; 