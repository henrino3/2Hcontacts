import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api/api';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../types';
import axios, { AxiosError } from 'axios';

const AuthService = {
  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  },
  
  login: async ({ email, password }: LoginCredentials): Promise<User> => {
    try {
      console.log('Attempting login with:', { email, password });
      const response = await api.post<AuthResponse>('/auth/login', { email, password });
      console.log('Login response:', response.data);
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Invalid credentials');
    }
  },
  
  register: async ({ name, email, password }: RegisterData): Promise<User> => {
    try {
      console.log('Attempting registration with:', { name, email, password });
      const response = await api.post<AuthResponse>('/auth/register', { name, email, password });
      console.log('Registration response:', response.data);
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data.user;
    } catch (error) {
      console.error('Registration error:', error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{message: string}>;
        if (axiosError.response?.data) {
          console.error('Server response:', axiosError.response.data);
          throw new Error(axiosError.response.data.message || 'Registration failed. Please try again.');
        }
      }
      throw new Error('Registration failed. Please try again.');
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  }
};

export default AuthService; 