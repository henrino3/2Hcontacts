import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import axios from 'axios';
import { socialMediaService } from '../SocialMediaService';
import { SocialMediaConnection } from '../../models/SocialMediaConnection';
import { User } from '../../models/User';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SocialMediaService', () => {
  let mongoServer: MongoMemoryServer;
  let userId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create a test user
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    });
    userId = user._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await SocialMediaConnection.deleteMany({});
    jest.clearAllMocks();
  });

  describe('getAuthorizationUrl', () => {
    it('should generate correct authorization URL for Twitter', async () => {
      process.env.TWITTER_CLIENT_ID = 'test-client-id';
      process.env.API_BASE_URL = 'http://localhost:3000';

      const url = await socialMediaService.getAuthorizationUrl('twitter', 'test-state');
      
      expect(url).toContain('https://twitter.com/i/oauth2/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('state=test-state');
      expect(url).toContain('scope=tweet.read+users.read+offline.access');
    });

    it('should throw error for unsupported platform', async () => {
      await expect(socialMediaService.getAuthorizationUrl('invalid', 'test-state'))
        .rejects
        .toThrow('Unsupported platform: invalid');
    });
  });

  describe('handleOAuthCallback', () => {
    it('should handle Twitter OAuth callback successfully', async () => {
      const mockTokenResponse = {
        data: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600
        }
      };

      const mockProfileResponse = {
        data: {
          data: {
            id: 'twitter-user-id',
            username: 'testuser',
            name: 'Test User',
            profile_image_url: 'https://example.com/avatar.jpg'
          }
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockTokenResponse);
      mockedAxios.get.mockResolvedValueOnce(mockProfileResponse);

      const connection = await socialMediaService.handleOAuthCallback(
        'twitter',
        'test-code',
        userId
      );

      expect(connection).toBeDefined();
      expect(connection.platform).toBe('twitter');
      expect(connection.platformUserId).toBe('twitter-user-id');
      expect(connection.accessToken).toBe('test-access-token');
      expect(connection.refreshToken).toBe('test-refresh-token');
      expect(connection.isActive).toBe(true);
    });
  });

  describe('refreshTokenIfNeeded', () => {
    it('should refresh token when close to expiration', async () => {
      const connection = await SocialMediaConnection.create({
        userId,
        platform: 'twitter',
        platformUserId: 'twitter-user-id',
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
        tokenExpiresAt: new Date(Date.now() + 4 * 60 * 1000), // 4 minutes from now
        profileData: {
          username: 'testuser',
          displayName: 'Test User',
          profileUrl: 'https://twitter.com/testuser'
        }
      });

      const mockTokenResponse = {
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockTokenResponse);

      const updatedConnection = await socialMediaService.refreshTokenIfNeeded(connection);

      expect(updatedConnection.accessToken).toBe('new-access-token');
      expect(updatedConnection.refreshToken).toBe('new-refresh-token');
    });

    it('should not refresh token when not close to expiration', async () => {
      const connection = await SocialMediaConnection.create({
        userId,
        platform: 'twitter',
        platformUserId: 'twitter-user-id',
        accessToken: 'current-access-token',
        refreshToken: 'current-refresh-token',
        tokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        profileData: {
          username: 'testuser',
          displayName: 'Test User',
          profileUrl: 'https://twitter.com/testuser'
        }
      });

      const updatedConnection = await socialMediaService.refreshTokenIfNeeded(connection);

      expect(updatedConnection.accessToken).toBe('current-access-token');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('disconnectPlatform', () => {
    it('should mark connection as inactive', async () => {
      await SocialMediaConnection.create({
        userId,
        platform: 'twitter',
        platformUserId: 'twitter-user-id',
        accessToken: 'test-access-token',
        profileData: {
          username: 'testuser',
          displayName: 'Test User',
          profileUrl: 'https://twitter.com/testuser'
        }
      });

      await socialMediaService.disconnectPlatform(userId, 'twitter');

      const connection = await SocialMediaConnection.findOne({ userId, platform: 'twitter' });
      expect(connection?.isActive).toBe(false);
    });
  });
}); 