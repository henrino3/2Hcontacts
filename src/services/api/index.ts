import axios from 'axios';
import { API_CONFIG, getApiConfig } from '../../config/api';

// Create initial instance with default config
const api = axios.create(API_CONFIG);

// Initialize with dynamic config
(async () => {
  try {
    const config = await getApiConfig();
    api.defaults.baseURL = config.baseURL;
  } catch (error) {
    console.warn('Failed to get dynamic API config, using default:', error);
  }
})();

// Add request interceptor for auth token
api.interceptors.request.use(
  async (config) => {
    // TODO: Add auth token from secure storage
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      // TODO: Handle token refresh or logout
    }
    return Promise.reject(error);
  }
);

export default api; 