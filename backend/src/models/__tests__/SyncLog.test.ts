import { SyncLog, ISyncLog, SyncOperation, SyncStatus } from '../SyncLog';
import { User, IUser } from '../User';
import { Contact, IContact } from '../Contact';
import mongoose, { Document, Types } from 'mongoose';

interface IUserDocument extends Document, IUser {
  _id: Types.ObjectId;
}

describe('SyncLog Model', () => {
  let testUser: IUserDocument;
  let testContact: IContact;

  beforeEach(async () => {
    testUser = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    }) as IUserDocument;

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
      
      let validationError: mongoose.Error.ValidationError | null = null;
      try {
        await syncLogWithoutRequired.save();
      } catch (err) {
        validationError = err as mongoose.Error.ValidationError;
      }
      
      expect(validationError).toBeDefined();
      expect(validationError?.errors.userId).toBeDefined();
      expect(validationError?.errors.operation).toBeDefined();
      expect(validationError?.errors.entityId).toBeDefined();
      expect(validationError?.errors.entityType).toBeDefined();
    });

    it('should validate operation enum values', async () => {
      const invalidOperation = 'INVALID_OPERATION';
      const syncLog = new SyncLog({
        userId: testUser._id,
        operation: invalidOperation,
        entityId: testContact._id,
        entityType: 'Contact',
      });

      let validationError: mongoose.Error.ValidationError | null = null;
      try {
        await syncLog.save();
      } catch (err) {
        validationError = err as mongoose.Error.ValidationError;
      }

      expect(validationError).toBeDefined();
      expect(validationError?.errors.operation).toBeDefined();
    });

    it('should validate status enum values', async () => {
      const syncLogWithInvalidStatus = new SyncLog({
        userId: testUser._id,
        operation: SyncOperation.CREATE,
        entityId: testContact._id,
        entityType: 'Contact',
        status: 'INVALID_STATUS',
      });

      let error: mongoose.Error.ValidationError | null = null;
      try {
        await syncLogWithInvalidStatus.save();
      } catch (err) {
        error = err as mongoose.Error.ValidationError;
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

      const retrievedSyncLog = await SyncLog.findById(syncLog._id).lean();
      expect(retrievedSyncLog?.status).toBe(SyncStatus.CONFLICT);
      expect(retrievedSyncLog?.conflictData).toEqual(expect.objectContaining(conflictData));
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

  describe('status transitions', () => {
    it('should handle successful sync completion', async () => {
      const syncLog = await SyncLog.create({
        userId: testUser._id,
        operation: SyncOperation.CREATE,
        entityId: testContact._id,
        entityType: 'Contact',
        status: SyncStatus.PENDING,
      });

      syncLog.status = SyncStatus.COMPLETED;
      const updatedLog = await syncLog.save();

      expect(updatedLog.status).toBe(SyncStatus.COMPLETED);
      expect(updatedLog.completedAt).toBeDefined();
    });

    it('should handle sync failure', async () => {
      const syncLog = await SyncLog.create({
        userId: testUser._id,
        operation: SyncOperation.UPDATE,
        entityId: testContact._id,
        entityType: 'Contact',
        status: SyncStatus.PENDING,
      });

      syncLog.status = SyncStatus.FAILED;
      syncLog.error = 'Network error';
      const updatedLog = await syncLog.save();

      expect(updatedLog.status).toBe(SyncStatus.FAILED);
      expect(updatedLog.error).toBe('Network error');
      expect(updatedLog.failedAt).toBeDefined();
    });

    it('should increment retry count on retry', async () => {
      const syncLog = await SyncLog.create({
        userId: testUser._id,
        operation: SyncOperation.UPDATE,
        entityId: testContact._id,
        entityType: 'Contact',
        status: SyncStatus.FAILED,
        retryCount: 0,
      });

      syncLog.status = SyncStatus.PENDING;
      syncLog.retryCount += 1;
      const updatedLog = await syncLog.save();

      expect(updatedLog.status).toBe(SyncStatus.PENDING);
      expect(updatedLog.retryCount).toBe(1);
      expect(updatedLog.lastRetryAt).toBeDefined();
    });
  });

  describe('querying', () => {
    it('should find pending sync logs for a user', async () => {
      await SyncLog.create([
        {
          userId: testUser._id,
          operation: SyncOperation.CREATE,
          entityId: testContact._id,
          entityType: 'Contact',
          status: SyncStatus.PENDING,
        },
        {
          userId: testUser._id,
          operation: SyncOperation.UPDATE,
          entityId: testContact._id,
          entityType: 'Contact',
          status: SyncStatus.COMPLETED,
        },
      ]);

      const pendingLogs = await SyncLog.find({
        userId: testUser._id,
        status: SyncStatus.PENDING,
      });

      expect(pendingLogs).toHaveLength(1);
      expect(pendingLogs[0].operation).toBe(SyncOperation.CREATE);
    });

    it('should find failed sync logs for retry', async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const createdLogs = await SyncLog.create([
        {
          userId: testUser._id,
          operation: SyncOperation.CREATE,
          entityId: testContact._id,
          entityType: 'Contact',
          status: SyncStatus.FAILED,
          failedAt: oneHourAgo,
          retryCount: 1,
        },
        {
          userId: testUser._id,
          operation: SyncOperation.UPDATE,
          entityId: testContact._id,
          entityType: 'Contact',
          status: SyncStatus.FAILED,
          failedAt: new Date(),
          retryCount: 5,
        },
      ]);

      // Verify the logs were created correctly
      const allLogs = await SyncLog.find({ userId: testUser._id });
      console.log('All logs:', allLogs);

      const retryableLogs = await SyncLog.find({
        userId: testUser._id,
        status: SyncStatus.FAILED,
        retryCount: { $lt: 3 },
        failedAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) }, // 30 minutes ago
      });

      console.log('Retryable logs:', retryableLogs);
      console.log('Query time:', new Date(Date.now() - 30 * 60 * 1000));
      console.log('Failed at:', oneHourAgo);

      expect(retryableLogs).toHaveLength(1);
      expect(retryableLogs[0].retryCount).toBe(1);
    });
  });
}); 