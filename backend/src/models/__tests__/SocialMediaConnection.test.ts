import mongoose, { Types, Document } from 'mongoose';
import { SocialMediaConnection } from '../SocialMediaConnection';
import { User, IUser } from '../User';
import { clearDatabase } from '../../test/globals';

interface IUserDocument extends Document, IUser {
  _id: Types.ObjectId;
}

// Increase test timeout
jest.setTimeout(60000);

describe('SocialMediaConnection Model', () => {
  let testUser: { _id: Types.ObjectId; email: string; name: string };

  beforeEach(async () => {
    await clearDatabase();

    testUser = {
      _id: new Types.ObjectId(),
      email: 'test@example.com',
      name: 'Test User',
    };

    await User.create({
      ...testUser,
      password: 'password123',
    });
  });

  it('should create a social media connection successfully', async () => {
    const connection = await SocialMediaConnection.create({
      userId: testUser._id,
      platform: 'twitter',
      platformUserId: '123456',
      accessToken: 'test-token',
      profileData: {
        username: 'testuser',
        displayName: 'Test User',
        profileUrl: 'https://twitter.com/testuser'
      }
    });

    expect(connection).toBeDefined();
    expect(connection.platform).toBe('twitter');
    expect(connection.isActive).toBe(true);
    expect(connection.profileData.username).toBe('testuser');
  });

  it('should not allow duplicate platform connections for the same user', async () => {
    await SocialMediaConnection.create({
      userId: testUser._id,
      platform: 'twitter',
      platformUserId: '123456',
      accessToken: 'test-token',
      profileData: {
        username: 'testuser',
        displayName: 'Test User',
        profileUrl: 'https://twitter.com/testuser'
      }
    });

    await expect(SocialMediaConnection.create({
      userId: testUser._id,
      platform: 'twitter',
      platformUserId: '789012',
      accessToken: 'another-token',
      profileData: {
        username: 'anotheruser',
        displayName: 'Another User',
        profileUrl: 'https://twitter.com/anotheruser'
      }
    })).rejects.toThrow();
  });

  it('should update profile data successfully', async () => {
    const connection = await SocialMediaConnection.create({
      userId: testUser._id,
      platform: 'twitter',
      platformUserId: '123456',
      accessToken: 'test-token',
      profileData: {
        username: 'testuser',
        displayName: 'Test User',
        profileUrl: 'https://twitter.com/testuser'
      }
    });

    const oldLastSyncedAt = connection.lastSyncedAt;

    await new Promise(resolve => setTimeout(resolve, 100)); // Wait to ensure timestamp difference

    await connection.updateProfileData({
      displayName: 'Updated User',
      avatarUrl: 'https://example.com/avatar.jpg'
    });

    expect(connection.profileData.displayName).toBe('Updated User');
    expect(connection.profileData.avatarUrl).toBe('https://example.com/avatar.jpg');
    expect(connection.profileData.username).toBe('testuser');
    expect(connection.lastSyncedAt.getTime()).toBeGreaterThan(oldLastSyncedAt.getTime());
  });

  it('should require all mandatory fields', async () => {
    const invalidConnection = new SocialMediaConnection({
      userId: testUser._id,
      platform: 'twitter'
      // Missing other required fields
    });

    await expect(invalidConnection.validate()).rejects.toThrow();
  });

  it('should only allow valid platform values', async () => {
    const invalidConnection = new SocialMediaConnection({
      userId: testUser._id,
      platform: 'invalid-platform',
      platformUserId: '123456',
      accessToken: 'test-token',
      profileData: {
        username: 'testuser',
        displayName: 'Test User',
        profileUrl: 'https://example.com/testuser'
      }
    });

    await expect(invalidConnection.validate()).rejects.toThrow();
  });
}); 