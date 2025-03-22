import axios from 'axios';
import { SocialMediaConnection, ISocialMediaConnection } from '../models/SocialMediaConnection';
import { User } from '../models/User';

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

interface PlatformConfig {
  [key: string]: {
    authUrl: string;
    tokenUrl: string;
    profileUrl: string;
    oauth: OAuthConfig;
  };
}

const platformConfig: PlatformConfig = {
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    profileUrl: 'https://api.twitter.com/2/users/me',
    oauth: {
      clientId: process.env.TWITTER_CLIENT_ID || '',
      clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
      redirectUri: `${process.env.API_BASE_URL}/auth/twitter/callback`,
      scope: ['tweet.read', 'users.read', 'offline.access']
    }
  },
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    profileUrl: 'https://api.linkedin.com/v2/me',
    oauth: {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      redirectUri: `${process.env.API_BASE_URL}/auth/linkedin/callback`,
      scope: ['r_liteprofile', 'r_emailaddress', 'w_member_social']
    }
  }
};

class SocialMediaService {
  async getAuthorizationUrl(platform: string, state: string): Promise<string> {
    const config = platformConfig[platform];
    if (!config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const params = new URLSearchParams({
      client_id: config.oauth.clientId,
      redirect_uri: config.oauth.redirectUri,
      scope: config.oauth.scope.join(' '),
      response_type: 'code',
      state
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  async handleOAuthCallback(platform: string, code: string, userId: string): Promise<ISocialMediaConnection> {
    const config = platformConfig[platform];
    if (!config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post(config.tokenUrl, {
      client_id: config.oauth.clientId,
      client_secret: config.oauth.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.oauth.redirectUri
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Get user profile from platform
    const profileResponse = await axios.get(config.profileUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const profileData = await this.normalizeProfileData(platform, profileResponse.data);

    // Save or update connection
    const connection = await SocialMediaConnection.findOneAndUpdate(
      { userId, platform },
      {
        platformUserId: profileData.platformUserId,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : undefined,
        profileData: {
          username: profileData.username,
          displayName: profileData.displayName,
          profileUrl: profileData.profileUrl,
          avatarUrl: profileData.avatarUrl
        },
        isActive: true
      },
      { upsert: true, new: true }
    );

    return connection;
  }

  private async normalizeProfileData(platform: string, rawData: any) {
    switch (platform) {
      case 'twitter':
        return {
          platformUserId: rawData.data.id,
          username: rawData.data.username,
          displayName: rawData.data.name,
          profileUrl: `https://twitter.com/${rawData.data.username}`,
          avatarUrl: rawData.data.profile_image_url
        };
      case 'linkedin':
        return {
          platformUserId: rawData.id,
          username: rawData.vanityName || rawData.id,
          displayName: `${rawData.localizedFirstName} ${rawData.localizedLastName}`,
          profileUrl: `https://www.linkedin.com/in/${rawData.vanityName || rawData.id}`,
          avatarUrl: rawData.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier
        };
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  async refreshTokenIfNeeded(connection: ISocialMediaConnection): Promise<ISocialMediaConnection> {
    if (!connection.tokenExpiresAt || !connection.refreshToken) {
      return connection;
    }

    const expirationBuffer = 5 * 60 * 1000; // 5 minutes
    if (connection.tokenExpiresAt.getTime() - Date.now() > expirationBuffer) {
      return connection;
    }

    const config = platformConfig[connection.platform];
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

  async getConnections(userId: string): Promise<ISocialMediaConnection[]> {
    return SocialMediaConnection.find({ userId, isActive: true });
  }

  async disconnectPlatform(userId: string, platform: string): Promise<void> {
    await SocialMediaConnection.findOneAndUpdate(
      { userId, platform },
      { isActive: false }
    );
  }
}

export const socialMediaService = new SocialMediaService(); 