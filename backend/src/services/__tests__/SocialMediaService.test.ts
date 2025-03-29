import mongoose from 'mongoose';
import { User } from '../../models/User';
import { SocialMediaConnection } from '../../models/SocialMediaConnection';
import { socialMediaService } from '../SocialMediaService';
import { clearDatabase } from '../../test/globals';

jest.setTimeout(60000);

describe('SocialMediaService', () => {
  let testUser: any;

  beforeEach(async () => {
    await clearDatabase();
    
    // Create test user
    testUser = await User.create({
      email: 'testuser@example.com',
      password: 'password123',
      name: 'Test User'
    });
  });

  describe('getAuthUrl', () => {
    it('should return authorization URL for supported platform', async () => {
      const state = 'random-state';
      const url = await socialMediaService.getAuthUrl('linkedin', state);
      
      expect(url).toContain('www.linkedin.com/oauth/v2/authorization');
      expect(url).toContain('state=' + state);
    });

    it('should throw error for unsupported platform', async () => {
      // @ts-ignore - Testing unsupported platform
      await expect(socialMediaService.getAuthUrl('snapchat', 'state')).rejects.toThrow('Unsupported platform');
    });
  });

  describe('handleCallback', () => {
    it('should exchange code for access token', async () => {
      // Mock fetch function
      global.fetch = jest.fn().mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: 'mock-token' })
        })
      );
      
      const result = await socialMediaService.handleCallback('linkedin', 'test-code');
      
      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('mock-token');
    });

    it('should throw error for failed token exchange', async () => {
      // Mock fetch function for failure
      global.fetch = jest.fn().mockImplementation(() => 
        Promise.resolve({
          ok: false,
          statusText: 'Unauthorized'
        })
      );
      
      await expect(socialMediaService.handleCallback('linkedin', 'invalid-code'))
        .rejects.toThrow('Failed to exchange code for token');
    });
  });

  describe('connectSocialMedia', () => {
    it('should connect social media account', async () => {
      await socialMediaService.connectSocialMedia('linkedin', testUser._id.toString(), 'test-token');
      // Success is not throwing an error
      expect(true).toBe(true);
    });

    it('should throw error for unsupported platform', async () => {
      // @ts-ignore - Testing unsupported platform
      await expect(socialMediaService.connectSocialMedia('snapchat', testUser._id.toString(), 'test-token'))
        .rejects.toThrow('Unsupported platform');
    });
  });
}); 