import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  name: string;
}

// Temporary mock implementation
const AuthService = {
  isAuthenticated: async () => {
    // For development, return false to always show the login screen
    return false;
  },
  
  login: async ({ email, password }: { email: string; password: string }) => {
    // Mock implementation
    if (email && password) {
      return true;
    }
    throw new Error('Invalid credentials');
  },
  
  register: async ({ name, email, password }: { name: string; email: string; password: string }) => {
    // Mock implementation
    if (name && email && password) {
      return true;
    }
    throw new Error('Invalid registration data');
  }
};

export default AuthService; 