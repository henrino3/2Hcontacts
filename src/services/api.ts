import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized error (e.g., clear token and redirect to login)
      await AsyncStorage.removeItem('authToken');
      // You can add navigation logic here if needed
    }
    return Promise.reject(error);
  }
);

export default api; 