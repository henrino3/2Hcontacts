import { api } from './api';
import { SocialMediaConnection } from '../../types';

// Regular expression for validating MongoDB ObjectId format
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

function isValidObjectId(id: string): boolean {
  return OBJECT_ID_REGEX.test(id);
}

interface AuthUrlResponse {
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

  async handleSDKAuth(platform: string, accessToken: string): Promise<SocialMediaConnection> {
    const response = await api.post<{ success: boolean; connection: SocialMediaConnection }>(
      `/social/sdk-auth/${platform}`,
      { accessToken }
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