import { api } from './api';
import { SocialMediaConnection } from '../../types';

export interface AuthUrlResponse {
  authUrl: string;
}

export const socialMediaApi = {
  async getAuthUrl(platform: string): Promise<AuthUrlResponse> {
    const response = await api.get<AuthUrlResponse>(`/social/connect/${platform}`);
    return response.data;
  },

  async handleCallback(platform: string, code: string, state: string): Promise<SocialMediaConnection> {
    const response = await api.get<{ success: boolean; connection: SocialMediaConnection }>(
      `/social/callback/${platform}`,
      {
        params: { code, state }
      }
    );
    return response.data.connection;
  },

  async getConnections(): Promise<SocialMediaConnection[]> {
    const response = await api.get<SocialMediaConnection[]>('/social/connections');
    return response.data;
  },

  async disconnectPlatform(platform: string): Promise<void> {
    await api.delete(`/social/disconnect/${platform}`);
  }
}; 