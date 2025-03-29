import axios from 'axios';
import { Types } from 'mongoose';
import { SocialMediaConnection, ISocialMediaConnection } from '../models/SocialMediaConnection';
import { User } from '../models/User';
import { SupportedPlatform } from '../types/social-media';

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

interface PlatformConfig {
  authUrl: string;
  tokenUrl: string;
  profileUrl: string;
  oauth: OAuthConfig;
}

type PlatformConfigs = Record<SupportedPlatform, PlatformConfig>;

const platformConfigs: PlatformConfigs = {
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    profileUrl: 'https://api.twitter.com/2/users/me',
    oauth: {
      clientId: process.env.TWITTER_CLIENT_ID || '',
      clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
      redirectUri: process.env.TWITTER_REDIRECT_URI || '',
      scope: ['tweet.read', 'users.read']
    }
  },
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    profileUrl: 'https://api.linkedin.com/v2/me',
    oauth: {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      redirectUri: process.env.LINKEDIN_REDIRECT_URI || '',
      scope: ['r_liteprofile', 'r_emailaddress']
    }
  }
};

class SocialMediaService {
  private platformConfigs: PlatformConfigs = platformConfigs;

  async getAuthUrl(platform: SupportedPlatform, state: string): Promise<string> {
    const config = this.platformConfigs[platform];
    if (!config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    if (!config.oauth.clientId || !config.oauth.redirectUri) {
      throw new Error('Missing required configuration');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.oauth.clientId,
      redirect_uri: config.oauth.redirectUri,
      state,
      scope: config.oauth.scope.join(' ')
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  async handleCallback(platform: SupportedPlatform, code: string): Promise<{ access_token: string }> {
    const config = this.platformConfigs[platform];
    if (!config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    if (!config.oauth.clientId || !config.oauth.clientSecret || !config.oauth.redirectUri) {
      throw new Error('Missing required configuration');
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.oauth.redirectUri,
      client_id: config.oauth.clientId,
      client_secret: config.oauth.clientSecret
    });

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code for token: ${response.statusText}`);
    }

    return response.json();
  }

  async connectSocialMedia(platform: SupportedPlatform, userId: string, accessToken: string): Promise<void> {
    const config = this.platformConfigs[platform];
    if (!config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Implement the connection logic here
    // This might involve saving the access token and platform info to the user's record
  }

  async disconnectPlatform(userId: string, platform: string) {
    await SocialMediaConnection.deleteOne({
      userId: new Types.ObjectId(userId),
      platform,
    });
  }

  private generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  private async exchangeCodeForToken(platform: SupportedPlatform, code: string): Promise<{ access_token: string }> {
    const config = this.platformConfigs[platform];
    if (!config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.oauth.redirectUri,
      client_id: config.oauth.clientId,
      client_secret: config.oauth.clientSecret,
    });

    switch (platform) {
      case 'linkedin': {
        const response = await axios.post<{ access_token: string }>(
          'https://www.linkedin.com/oauth/v2/accessToken',
          params.toString(),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          }
        );
        return response.data;
      }
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  private async fetchProfileData(platform: SupportedPlatform, accessToken: string): Promise<any> {
    switch (platform) {
      case 'linkedin': {
        const response = await axios.get('https://api.linkedin.com/v2/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return response.data;
      }
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  async getConnections(userId: string): Promise<ISocialMediaConnection[]> {
    return SocialMediaConnection.find({ userId, isActive: true });
  }

  async refreshTokenIfNeeded(connection: ISocialMediaConnection): Promise<ISocialMediaConnection> {
    if (!connection.tokenExpiresAt || !connection.refreshToken) {
      return connection;
    }

    const expirationBuffer = 5 * 60 * 1000; // 5 minutes
    if (connection.tokenExpiresAt.getTime() - Date.now() > expirationBuffer) {
      return connection;
    }

    // Type assertion to ensure connection.platform is treated as SupportedPlatform
    const platform = connection.platform as SupportedPlatform;
    const config = platformConfigs[platform];
    
    if (!config) {
      throw new Error(`Unsupported platform: ${connection.platform}`);
    }

    const tokenResponse = await axios.post(config.tokenUrl, {
      client_id: config.oauth.clientId,
      client_secret: config.oauth.clientSecret,
      refresh_token: connection.refreshToken,
      grant_type: 'refresh_token'
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    connection.accessToken = access_token;
    if (refresh_token) {
      connection.refreshToken = refresh_token;
    }
    if (expires_in) {
      connection.tokenExpiresAt = new Date(Date.now() + expires_in * 1000);
    }

    await connection.save();
    return connection;
  }
}

export const socialMediaService = new SocialMediaService(); 