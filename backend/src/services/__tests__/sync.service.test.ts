import mongoose, { Types } from 'mongoose';
import { SyncService } from '../sync.service';
import { Contact } from '../../models/Contact';
import { SyncLog, SyncOperation, SyncStatus } from '../../models/SyncLog';
import { User } from '../../models/User';
import { clearDatabase } from '../../test/globals';

jest.setTimeout(60000); // Increase timeout to 60 seconds

const mockContact = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  socialProfiles: new Map([['linkedin', 'john-doe']]),
  tags: ['work'],
  isFavorite: false,
};

describe('SyncService', () => {
  let testUser: any;
  let testContact: any;

  beforeEach(async () => {
    await clearDatabase();

    testUser = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    });

    testContact = await Contact.create({
      userId: testUser._id,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    });
  });

  describe('syncChanges', () => {
    it('should process create operations', async () => {
      const newContact = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
      };

      const changes = [{
        operation: SyncOperation.CREATE,
        contact: newContact,
      }];

      const result = await SyncService.syncChanges(testUser._id, changes);

      expect(result.success).toBe(true);
      expect(result.processed).toBe(1);
      expect(result.failed).toBe(0);

      // Verify contact was created
      const createdContact = await Contact.findOne({ email: newContact.email });
      expect(createdContact).toBeDefined();
      expect(createdContact?.firstName).toBe(newContact.firstName);

      // Verify sync log was created
      const syncLog = await SyncLog.findOne({
        userId: testUser._id,
        operation: SyncOperation.CREATE,
        status: SyncStatus.COMPLETED,
      });
      expect(syncLog).toBeDefined();
    });

    it('should process update operations', async () => {
      const updateData = {
        firstName: 'Johnny',
        email: 'johnny@example.com',
      };

      const changes = [{
        operation: SyncOperation.UPDATE,
        contactId: testContact._id.toString(),
        contact: updateData,
      }];

      const result = await SyncService.syncChanges(testUser._id, changes);

      expect(result.success).toBe(true);
      expect(result.processed).toBe(1);
      expect(result.failed).toBe(0);

      // Verify contact was updated
      const updatedContact = await Contact.findById(testContact._id);
      expect(updatedContact?.firstName).toBe(updateData.firstName);
      expect(updatedContact?.email).toBe(updateData.email);

      // Verify sync log was created
      const syncLog = await SyncLog.findOne({
        userId: testUser._id,
        operation: SyncOperation.UPDATE,
        status: SyncStatus.COMPLETED,
      });
      expect(syncLog).toBeDefined();
    });

    it('should process delete operations', async () => {
      const changes = [{
        operation: SyncOperation.DELETE,
        contactId: testContact._id.toString(),
      }];

      const result = await SyncService.syncChanges(testUser._id, changes);

      expect(result.success).toBe(true);
      expect(result.processed).toBe(1);
      expect(result.failed).toBe(0);

      // Verify contact was deleted
      const deletedContact = await Contact.findById(testContact._id);
      expect(deletedContact).toBeNull();

      // Verify sync log was created
      const syncLog = await SyncLog.findOne({
        userId: testUser._id,
        operation: SyncOperation.DELETE,
        status: SyncStatus.COMPLETED,
      });
      expect(syncLog).toBeDefined();
    });

    it('should handle validation errors', async () => {
      const invalidContact = {
        firstName: '', // Invalid: empty string
        lastName: 'Smith',
        email: 'invalid-email', // Invalid: not an email
      };

      const changes = [{
        operation: SyncOperation.CREATE,
        contact: invalidContact,
      }];

      const result = await SyncService.syncChanges(testUser._id, changes);

      expect(result.success).toBe(false);
      expect(result.processed).toBe(0);
      expect(result.failed).toBe(1);

      // Verify sync log was created with failed status
      const syncLog = await SyncLog.findOne({
        userId: testUser._id,
        operation: SyncOperation.CREATE,
        status: SyncStatus.FAILED,
      });
      expect(syncLog).toBeDefined();
      expect(syncLog?.error).toContain('Validation error');
    });

    it('should handle non-existent contacts for updates', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const changes = [{
        operation: SyncOperation.UPDATE,
        contactId: nonExistentId.toString(),
        contact: { firstName: 'New Name' },
      }];

      const result = await SyncService.syncChanges(testUser._id, changes);

      expect(result.success).toBe(false);
      expect(result.processed).toBe(0);
      expect(result.failed).toBe(1);

      // Verify sync log was created with failed status
      const syncLog = await SyncLog.findOne({
        userId: testUser._id,
        operation: SyncOperation.UPDATE,
        status: SyncStatus.FAILED,
      });
      expect(syncLog).toBeDefined();
      expect(syncLog?.error).toContain('Contact not found');
    });
  });

  describe('getChanges', () => {
    it('should return changes since last sync', async () => {
      const lastSyncDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

      // Create some changes after last sync
      const newContact = await Contact.create({
        userId: testUser._id,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        createdAt: new Date(),
      });

      testContact.firstName = 'Johnny';
      await testContact.save();

      const changes = await SyncService.getChanges(testUser._id, lastSyncDate);

      expect(changes).toHaveLength(2);
      expect(changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            operation: SyncOperation.CREATE,
            contact: expect.objectContaining({
              firstName: 'Jane',
              lastName: 'Smith',
            }),
          }),
          expect.objectContaining({
            operation: SyncOperation.UPDATE,
            contact: expect.objectContaining({
              firstName: 'Johnny',
            }),
          }),
        ])
      );
    });

    it('should handle no changes since last sync', async () => {
      const lastSyncDate = new Date();

      const changes = await SyncService.getChanges(testUser._id, lastSyncDate);

      expect(changes).toHaveLength(0);
    });

    it('should include deleted contacts in changes', async () => {
      const lastSyncDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      
      // Create a contact and then delete it
      const contactToDelete = await Contact.create({
        userId: testUser._id,
        firstName: 'To',
        lastName: 'Delete',
        email: 'delete@example.com',
      });

      const contactId = contactToDelete._id.toString();

      // Create a sync log for the deletion
      await SyncLog.create({
        userId: testUser._id,
        operation: SyncOperation.DELETE,
        entityId: contactToDelete._id,
        entityType: 'Contact',
        timestamp: new Date(),
        status: SyncStatus.COMPLETED,
      });

      // Actually delete the contact
      await Contact.findByIdAndDelete(contactToDelete._id);

      const changes = await SyncService.getChanges(testUser._id, lastSyncDate);

      expect(changes.some(change => 
        change.operation === SyncOperation.DELETE && 
        change.contactId === contactId
      )).toBe(true);
    });
  });

  describe('detectConflicts', () => {
    it('should detect conflicts between local and server versions', async () => {
      // Update the contact on the server
      testContact.firstName = 'ServerVersion';
      testContact.email = 'server@example.com';
      await testContact.save();

      // Local version has different changes
      const localContact = {
        id: testContact._id.toString(),
        firstName: 'LocalVersion',
        lastName: 'Different',
        email: 'local@example.com',
      };

      const conflict = await SyncService.detectConflicts(
        testUser._id.toString(),
        localContact,
        new Date(Date.now() - 60 * 60 * 1000) // Base time 1 hour ago
      );

      expect(conflict).toBeDefined();
      expect(conflict?.serverVersion?.firstName).toBe('ServerVersion');
      expect(conflict?.localVersion?.firstName).toBe('LocalVersion');
    });

    it('should return null when no conflicts exist', async () => {
      // No changes made to the contact since base time
      const localContact = {
        id: testContact._id.toString(),
        firstName: 'John', // Same as server
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const conflict = await SyncService.detectConflicts(
        testUser._id.toString(),
        localContact,
        new Date(Date.now() - 60 * 60 * 1000) // Base time 1 hour ago
      );

      expect(conflict).toBeNull();
    });

    it('should return null when contact does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const localContact = {
        id: nonExistentId,
        firstName: 'NonExistent',
        lastName: 'Contact',
        email: 'nonexistent@example.com',
      };

      const conflict = await SyncService.detectConflicts(
        testUser._id.toString(),
        localContact,
        new Date()
      );

      expect(conflict).toBeNull();
    });
  });

  describe('resolveConflict', () => {
    it('should resolve conflict using local version', async () => {
      // Update the contact on the server
      testContact.firstName = 'ServerVersion';
      testContact.email = 'server@example.com';
      await testContact.save();

      // Local version has different changes
      const localContact = {
        id: testContact._id.toString(),
        firstName: 'LocalVersion',
        lastName: 'Different',
        email: 'local@example.com',
      };

      await SyncService.resolveConflict({
        contactId: testContact._id.toString(),
        userId: testUser._id,
        serverVersion: testContact.toObject(),
        localVersion: localContact,
        resolution: 'local'
      });

      const resolvedContact = await Contact.findById(testContact._id);
      expect(resolvedContact?.firstName).toBe('LocalVersion');
      expect(resolvedContact?.lastName).toBe('Different');
      expect(resolvedContact?.email).toBe('local@example.com');
    });

    it('should resolve conflict using server version', async () => {
      // Update the contact on the server
      testContact.firstName = 'ServerVersion';
      testContact.email = 'server@example.com';
      await testContact.save();

      // Local version has different changes
      const localContact = {
        id: testContact._id.toString(),
        firstName: 'LocalVersion',
        lastName: 'Different',
        email: 'local@example.com',
      };

      await SyncService.resolveConflict({
        contactId: testContact._id.toString(),
        userId: testUser._id,
        serverVersion: testContact.toObject(),
        localVersion: localContact,
        resolution: 'server'
      });

      const resolvedContact = await Contact.findById(testContact._id);
      expect(resolvedContact?.firstName).toBe('ServerVersion');
      expect(resolvedContact?.email).toBe('server@example.com');
    });

    it('should merge versions when using merge strategy', async () => {
      // Update the contact on the server with some fields
      testContact.firstName = 'ServerFirst';
      testContact.email = 'server@example.com';
      await testContact.save();

      // Local version has different fields changed
      const localContact = {
        id: testContact._id.toString(),
        lastName: 'LocalLast',
        phone: '555-555-5555',
      };

      await SyncService.resolveConflict({
        contactId: testContact._id.toString(),
        userId: testUser._id,
        serverVersion: testContact.toObject(),
        localVersion: localContact,
        resolution: 'merge'
      });

      const resolvedContact = await Contact.findById(testContact._id);
      expect(resolvedContact?.firstName).toBe('ServerFirst');
      expect(resolvedContact?.lastName).toBe('LocalLast');
      expect(resolvedContact?.email).toBe('server@example.com');
      expect(resolvedContact?.phone).toBe('555-555-5555');
    });
  });

  describe('processPendingSyncs', () => {
    it('should process pending sync operations', async () => {
      // Create a pending sync operation
      const syncLog = await SyncLog.create({
        userId: testUser._id,
        operation: SyncOperation.UPDATE,
        entityId: testContact._id,
        entityType: 'Contact',
        data: { firstName: 'Updated' },
        status: SyncStatus.PENDING,
        timestamp: new Date(),
      });

      const result = await SyncService.processPendingSyncs(testUser._id);

      expect(result.processed).toBe(1);
      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);

      // Check if contact was updated
      const updatedContact = await Contact.findById(testContact._id);
      expect(updatedContact?.firstName).toBe('Updated');

      // Check if sync log was updated
      const updatedLog = await SyncLog.findById(syncLog._id);
      expect(updatedLog?.status).toBe(SyncStatus.COMPLETED);
    });

    it('should handle sync failures and increment retry count', async () => {
      // Create a sync operation that will fail (invalid data)
      await SyncLog.create({
        userId: testUser._id,
        operation: SyncOperation.UPDATE,
        entityId: testContact._id,
        entityType: 'Contact',
        data: { email: 'invalid-email' }, // Invalid email format
        status: SyncStatus.PENDING,
        timestamp: new Date(),
      });

      const result = await SyncService.processPendingSyncs(testUser._id);

      expect(result.processed).toBe(1);
      expect(result.success).toBe(0);
      expect(result.failed).toBe(1);

      // Check if sync log was updated
      const failedLog = await SyncLog.findOne({
        userId: testUser._id,
        status: SyncStatus.FAILED,
      });
      expect(failedLog).toBeDefined();
      expect(failedLog?.retryCount).toBe(1);
    });

    it('should mark sync as failed after max retries', async () => {
      // Create a sync operation with max retries
      await SyncLog.create({
        userId: testUser._id,
        operation: SyncOperation.UPDATE,
        entityId: testContact._id,
        entityType: 'Contact',
        data: { email: 'invalid-email' }, // Will cause validation error
        status: SyncStatus.FAILED,
        retryCount: 5, // Max retries (assuming max is 5)
        timestamp: new Date(),
      });

      await SyncService.processPendingSyncs(testUser._id);

      // Check if sync log stays as FAILED
      const failedLog = await SyncLog.findOne({
        userId: testUser._id,
        status: SyncStatus.FAILED,
      });
      expect(failedLog).toBeDefined();
      expect(failedLog?.retryCount).toBe(5); // Shouldn't increase
    });
  });
}); 