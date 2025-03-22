import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ContactsScreen } from '../screens/ContactsScreen';
import { ContactDetailScreen } from '../screens/ContactDetailScreen';
import { SocialMediaScreen } from '../screens/SocialMediaScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useAuth } from '../hooks/useAuth';
import { RootStackParamList, MainTabParamList, ContactsStackParamList } from '../types/navigation';
import { Loading } from '../components/ui';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const ContactsStack = createNativeStackNavigator<ContactsStackParamList>();

function ContactsStackNavigator() {
  return (
    <ContactsStack.Navigator>
      <ContactsStack.Screen 
        name="ContactsList" 
        component={ContactsScreen} 
        options={{ 
          headerShown: false
        }} 
      />
      <ContactsStack.Screen 
        name="ContactDetail" 
        component={ContactDetailScreen} 
        options={{ 
          title: 'Contact',
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: '#fff',
          },
        }} 
      />
    </ContactsStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          borderTopColor: '#F0F0F0',
          height: 76,
          paddingTop: 8,
          paddingBottom: 16,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Contacts"
        component={ContactsStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Social"
        component={SocialMediaScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="share-social" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export function MainNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading message="Loading..." />;
  }

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        contentStyle: {
          backgroundColor: '#fff',
        },
      }}
    >
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
} 