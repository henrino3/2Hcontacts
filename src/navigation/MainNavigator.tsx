import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ContactsScreen } from '../screens/ContactsScreen';
import { CreateContactScreen } from '../screens/CreateContactScreen';
import { ContactDetailScreen } from '../screens/ContactDetailScreen';
import { EditContactScreen } from '../screens/EditContactScreen';
import { SocialMediaScreen } from '../screens/SocialMediaScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { Contact } from '../services/api/dummyData';

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Contacts: undefined;
  Social: undefined;
  Profile: undefined;
};

export type ContactsStackParamList = {
  ContactsList: undefined;
  CreateContact: undefined;
  ContactDetail: { contact: Contact };
  EditContact: { contact: Contact };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const ContactsStack = createNativeStackNavigator<ContactsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function ContactsStackNavigator() {
  return (
    <ContactsStack.Navigator>
      <ContactsStack.Screen 
        name="ContactsList" 
        component={ContactsScreen}
        options={{ headerShown: false }}
      />
      <ContactsStack.Screen
        name="CreateContact"
        component={CreateContactScreen}
        options={{ headerShown: false }}
      />
      <ContactsStack.Screen
        name="ContactDetail"
        component={ContactDetailScreen}
        options={{ headerShown: false }}
      />
      <ContactsStack.Screen
        name="EditContact"
        component={EditContactScreen}
        options={{ headerShown: false }}
      />
    </ContactsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
    </ProfileStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          height: 60,
          paddingBottom: 8,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Contacts"
        component={ContactsStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Social"
        component={SocialMediaScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="share-social-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
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