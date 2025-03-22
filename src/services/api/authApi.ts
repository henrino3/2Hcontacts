import { api } from './api';
import { AuthResponse, LoginCredentials, RegisterData, User } from '../../types';

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