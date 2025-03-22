import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AuthService from '../services/auth';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await AuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
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