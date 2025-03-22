import mongoose, { Types } from 'mongoose';
import { SyncService, SyncConflict } from '../sync.service';
import { Contact } from '../../models/Contact';
import { SyncLog, SyncOperation, SyncStatus } from '../../models/SyncLog';
import { User } from '../../models/User';

describe('SyncService', () => {
  const testUser = {
    _id: new mongoose.Types.ObjectId(),
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockContact = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    tags: ['personal'],
    socialProfiles: new Map([['linkedin', 'john-doe']]),
  };

  beforeEach(async () => {
    await User.create({
      ...testUser,
      password: 'password123',
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Contact.deleteMany({});
    await SyncLog.deleteMany({});
  });

  describe('detectConflicts', () => {
    it('should detect conflicts between local and server versions', async () => {
      const contact = await Contact.create({
        ...mockContact,
        userId: testUser._id,
      });

      const localData = {
        ...mockContact,
        firstName: 'Jane',
        email: 'jane@example.com',
      };

      const conflicts = await SyncService.detectConflicts(
        testUser._id,
        contact._id as Types.ObjectId,
        localData
      );

      expect(conflicts).toBeDefined();
      expect(conflicts?.conflictFields).toContain('firstName');
      expect(conflicts?.conflictFields).toContain('email');
      expect(conflicts?.conflictFields).not.toContain('lastName');
    });

    it('should return null when no conflicts exist', async () => {
      const contact = await Contact.create({
        ...mockContact,
        userId: testUser._id,
      });

      const localData = { ...mockContact };

      const conflicts = await SyncService.detectConflicts(
        testUser._id,
        contact._id as Types.ObjectId,
        localData
      );

      expect(conflicts).toBeNull();
    });

    it('should return null when contact does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const conflicts = await SyncService.detectConflicts(
        testUser._id,
        nonExistentId,
        mockContact
      );

      expect(conflicts).toBeNull();
    });
  });

  describe('resolveConflict', () => {
    it('should resolve conflict using local version', async () => {
      const contact = await Contact.create({
        ...mockContact,
        userId: testUser._id,
      });

      const localVersion = {
        ...mockContact,
        firstName: 'Jane',
      };

      const syncLog = await SyncLog.create({
        userId: testUser._id,
        operation: SyncOperation.UPDATE,
        entityId: contact._id,
        entityType: 'Contact',
        status: SyncStatus.CONFLICT,
        conflictData: {
          localVersion,
          serverVersion: contact.toObject(),
        },
      });

      const resolved = await SyncService.resolveConflict(syncLog, 'local');

      expect(resolved.firstName).toBe('Jane');
      expect(syncLog.status).toBe(SyncStatus.COMPLETED);
      expect(syncLog.syncedAt).toBeDefined();
    });

    it('should resolve conflict using server version', async () => {
      const contact = await Contact.create({
        ...mockContact,
        userId: testUser._id,
      });

      const localVersion = {
        ...mockContact,
        firstName: 'Jane',
      };

      const syncLog = await SyncLog.create({
        userId: testUser._id,
        operation: SyncOperation.UPDATE,
        entityId: contact._id,
        entityType: 'Contact',
        status: SyncStatus.CONFLICT,
        conflictData: {
          localVersion,
          serverVersion: contact.toObject(),
        },
      });

      const resolved = await SyncService.resolveConflict(syncLog, 'server');

      expect(resolved.firstName).toBe('John');
      expect(syncLog.status).toBe(SyncStatus.COMPLETED);
      expect(syncLog.syncedAt).toBeDefined();
    });

    it('should merge versions when using merge strategy', async () => {
      const contact = await Contact.create({
        ...mockContact,
        userId: testUser._id,
      });

      const localVersion = {
        ...mockContact,
        firstName: 'Jane',
        tags: ['personal', 'work'],
        socialProfiles: new Map([['twitter', 'janedoe']]),
      };

      const syncLog = await SyncLog.create({
        userId: testUser._id,
        operation: SyncOperation.UPDATE,
        entityId: contact._id,
        entityType: 'Contact',
        status: SyncStatus.CONFLICT,
        conflictData: {
          localVersion,
          serverVersion: contact.toObject(),
        },
      });

      const resolved = await SyncService.resolveConflict(syncLog, 'merge');

      expect(resolved.tags).toContain('personal');
      expect(resolved.tags).toContain('work');
      expect(resolved.socialProfiles.get('linkedin')).toBe('john-doe');
      expect(resolved.socialProfiles.get('twitter')).toBe('janedoe');
    });
  });

  describe('processPendingSyncs', () => {
    it('should process pending sync operations', async () => {
      const syncLog = await SyncLog.create({
        userId: testUser._id,
        operation: SyncOperation.CREATE,
        entityId: new mongoose.Types.ObjectId(),
        entityType: 'Contact',
        status: SyncStatus.PENDING,
        conflictData: {
          localVersion: mockContact,
        },
      });

      await SyncService.processPendingSyncs(testUser._id);

      const updatedSyncLog = await SyncLog.findById(syncLog._id);
      expect(updatedSyncLog?.status).toBe(SyncStatus.COMPLETED);
      expect(updatedSyncLog?.syncedAt).toBeDefined();

      const contact = await Contact.findOne({ userId: testUser._id });
      expect(contact).toBeDefined();
      expect(contact?.firstName).toBe(mockContact.firstName);
    });

    it('should handle sync failures and increment retry count', async () => {
      // Create a sync log with invalid data to force an error
      const syncLog = await SyncLog.create({
        userId: testUser._id,
        operation: SyncOperation.UPDATE,
        entityId: new mongoose.Types.ObjectId(), // Non-existent contact
        entityType: 'Contact',
        status: SyncStatus.PENDING,
        conflictData: {
          localVersion: mockContact,
        },
      });

      await SyncService.processPendingSyncs(testUser._id);

      const updatedSyncLog = await SyncLog.findById(syncLog._id);
      expect(updatedSyncLog?.retryCount).toBe(1);
      expect(updatedSyncLog?.status).toBe(SyncStatus.PENDING);
    });

    it('should mark sync as failed after max retries', async () => {
      const syncLog = await SyncLog.create({
        userId: testUser._id,
        operation: SyncOperation.UPDATE,
        entityId: new mongoose.Types.ObjectId(),
        entityType: 'Contact',
        status: SyncStatus.PENDING,
        retryCount: 3,
        conflictData: {
          localVersion: mockContact,
        },
      });

      await SyncService.processPendingSyncs(testUser._id);

      const updatedSyncLog = await SyncLog.findById(syncLog._id);
      expect(updatedSyncLog?.status).toBe(SyncStatus.FAILED);
    });
  });
}); 