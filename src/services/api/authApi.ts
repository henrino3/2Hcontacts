import { api } from './api';
import { AuthResponse, LoginCredentials, RegisterData, User } from '../../types';

// Regular expression for validating MongoDB ObjectId format
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

function isValidObjectId(id: string): boolean {
  return OBJECT_ID_REGEX.test(id);
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  async resetPassword(email: string): Promise<void> {
    await api.post('/auth/reset-password', { email });
  },

  async updatePassword(token: string, password: string): Promise<void> {
    await api.post('/auth/update-password', { token, password });
  }
}; 