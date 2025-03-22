import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { SocialMediaConnection, ISocialMediaConnection } from '../SocialMediaConnection';
import { User } from '../User';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('SocialMediaConnection Model', () => {
  let userId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    });
    userId = user._id;
  });

  beforeEach(async () => {
    await SocialMediaConnection.deleteMany({});
  });

  it('should create a social media connection successfully', async () => {
    const connection = await SocialMediaConnection.create({
      userId,
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
      userId,
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
      userId,
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
      userId,
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
      userId,
      platform: 'twitter'
      // Missing other required fields
    });

    await expect(invalidConnection.validate()).rejects.toThrow();
  });

  it('should only allow valid platform values', async () => {
    const invalidConnection = new SocialMediaConnection({
      userId,
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