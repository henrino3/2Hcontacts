import { SyncLog, ISyncLog, SyncOperation, SyncStatus } from '../SyncLog';
import { User, IUser } from '../User';
import { Contact, IContact } from '../Contact';
import mongoose, { Error } from 'mongoose';

describe('SyncLog Model', () => {
  let testUser: IUser;
  let testContact: IContact;

  beforeEach(async () => {
    testUser = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });

    testContact = await Contact.create({
      userId: testUser._id,
      firstName: 'John',
      lastName: 'Doe',
    });
  });

  describe('validation', () => {
    it('should validate a valid sync log', async () => {
      const validSyncLog = new SyncLog({
        userId: testUser._id,
        operation: SyncOperation.CREATE,
        entityId: testContact._id,
        entityType: 'Contact',
      });

      const savedSyncLog = await validSyncLog.save();
      expect(savedSyncLog._id).toBeDefined();
      expect(savedSyncLog.status).toBe(SyncStatus.PENDING);
      expect(savedSyncLog.retryCount).toBe(0);
    });

    it('should fail validation without required fields', async () => {
      const syncLogWithoutRequired = new SyncLog({});
      
      let error: Error.ValidationError | null = null;
      try {
        await syncLogWithoutRequired.save();
      } catch (err) {
        error = err as Error.ValidationError;
      }
      
      expect(error).toBeDefined();
      expect(error?.errors.userId).toBeDefined();
      expect(error?.errors.operation).toBeDefined();
      expect(error?.errors.entityId).toBeDefined();
      expect(error?.errors.entityType).toBeDefined();
    });

    it('should validate operation enum values', async () => {
      const syncLogWithInvalidOperation = new SyncLog({
        userId: testUser._id,
        operation: 'INVALID_OPERATION',
        entityId: testContact._id,
        entityType: 'Contact',
      });

      let error: Error.ValidationError | null = null;
      try {
        await syncLogWithInvalidOperation.save();
      } catch (err) {
        error = err as Error.ValidationError;
      }

      expect(error).toBeDefined();
      expect(error?.errors.operation).toBeDefined();
    });

    it('should validate status enum values', async () => {
      const syncLogWithInvalidStatus = new SyncLog({
        userId: testUser._id,
        operation: SyncOperation.CREATE,
        entityId: testContact._id,
        entityType: 'Contact',
        status: 'INVALID_STATUS',
      });

      let error: Error.ValidationError | null = null;
      try {
        await syncLogWithInvalidStatus.save();
      } catch (err) {
        error = err as Error.ValidationError;
      }

      expect(error).toBeDefined();
      expect(error?.errors.status).toBeDefined();
    });
  });

  describe('default values', () => {
    it('should set default values correctly', async () => {
      const syncLog = new SyncLog({
        userId: testUser._id,
        operation: SyncOperation.CREATE,
        entityId: testContact._id,
        entityType: 'Contact',
      });

      const savedSyncLog = await syncLog.save();
      expect(savedSyncLog.status).toBe(SyncStatus.PENDING);
      expect(savedSyncLog.retryCount).toBe(0);
      expect(savedSyncLog.timestamp).toBeDefined();
    });
  });

  describe('state transitions', () => {
    it('should allow updating status and syncedAt', async () => {
      const syncLog = await SyncLog.create({
        userId: testUser._id,
        operation: SyncOperation.CREATE,
        entityId: testContact._id,
        entityType: 'Contact',
      });

      syncLog.status = SyncStatus.COMPLETED;
      syncLog.syncedAt = new Date();
      await syncLog.save();

      const retrievedSyncLog = await SyncLog.findById(syncLog._id);
      expect(retrievedSyncLog?.status).toBe(SyncStatus.COMPLETED);
      expect(retrievedSyncLog?.syncedAt).toBeDefined();
    });

    it('should allow incrementing retry count', async () => {
      const syncLog = await SyncLog.create({
        userId: testUser._id,
        operation: SyncOperation.CREATE,
        entityId: testContact._id,
        entityType: 'Contact',
      });

      syncLog.retryCount += 1;
      await syncLog.save();

      const retrievedSyncLog = await SyncLog.findById(syncLog._id);
      expect(retrievedSyncLog?.retryCount).toBe(1);
    });

    it('should store conflict data', async () => {
      const conflictData = {
        localVersion: { name: 'Local Name' },
        serverVersion: { name: 'Server Name' },
      };

      const syncLog = await SyncLog.create({
        userId: testUser._id,
        operation: SyncOperation.UPDATE,
        entityId: testContact._id,
        entityType: 'Contact',
        status: SyncStatus.CONFLICT,
        conflictData,
      });

      const retrievedSyncLog = await SyncLog.findById(syncLog._id);
      expect(retrievedSyncLog?.status).toBe(SyncStatus.CONFLICT);
      expect(retrievedSyncLog?.conflictData).toEqual(conflictData);
    });
  });

  describe('indexing', () => {
    it('should create compound index for userId and status', async () => {
      const indexes = await SyncLog.collection.getIndexes();
      expect(indexes).toHaveProperty('userId_1_status_1');
    });

    it('should create compound index for userId, entityType, and entityId', async () => {
      const indexes = await SyncLog.collection.getIndexes();
      expect(indexes).toHaveProperty('userId_1_entityType_1_entityId_1');
    });

    it('should create index for timestamp', async () => {
      const indexes = await SyncLog.collection.getIndexes();
      expect(indexes).toHaveProperty('timestamp_1');
    });
  });
}); 