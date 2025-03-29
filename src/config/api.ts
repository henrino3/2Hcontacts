import Constants from 'expo-constants';
import { Platform } from 'react-native';
import axios from 'axios';

const PORT = 3001;

// Create a promise that resolves to the API config
export const getApiConfig = async () => {
  const baseURL = Platform.select({
    android: `http://10.0.2.2:${PORT}/api`,
    ios: `http://localhost:${PORT}/api`,
  });

  console.log('API Config - Base URL:', baseURL);

  return {
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    timeout: 10000, // 10 second timeout for regular requests
  } as const;
};

// Export a default config that uses port 3001
export const API_CONFIG = {
  baseURL: Platform.select({
    android: `http://10.0.2.2:${PORT}/api`,
    ios: `http://localhost:${PORT}/api`,
  }),
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
} as const; 