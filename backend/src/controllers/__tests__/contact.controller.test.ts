import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ContactController } from '../contact.controller';
import { Contact, IContact } from '../../models/Contact';
import { User } from '../../models/User';
import { SyncLog, SyncOperation, SyncStatus } from '../../models/SyncLog';
import { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Increase timeout for all tests in this file
jest.setTimeout(60000);

// Mock user for testing
const testUser = {
  _id: new mongoose.Types.ObjectId(),
  email: 'test@example.com',
  name: 'Test User',
};

// Mock contact data
const mockContact = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
};

describe('ContactController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(async () => {
    // Create test user
    await User.create({
      ...testUser,
      password: 'password123',
    });

    // Reset request and response mocks
    req = {
      user: testUser,
      params: {},
      body: {},
      query: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    // Clear contacts and sync logs
    await Contact.deleteMany({});
    await SyncLog.deleteMany({});
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Contact.deleteMany({});
    await SyncLog.deleteMany({});
  });

  describe('listContacts', () => {
    it('should return all contacts for the authenticated user', async () => {
      const contacts = [
        { ...mockContact, userId: testUser._id },
        { ...mockContact, firstName: 'Jane', userId: testUser._id },
      ];

      jest.spyOn(Contact, 'find').mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(contacts)
          })
        })
      } as any);

      jest.spyOn(Contact, 'countDocuments').mockResolvedValue(contacts.length);

      await ContactController.listContacts(req as Request, res as Response);

      expect(Contact.find).toHaveBeenCalledWith({ userId: testUser._id });
      expect(res.json).toHaveBeenCalledWith({
        contacts,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          pages: 1
        }
      });
    });

    it('should handle errors when listing contacts', async () => {
      jest.spyOn(Contact, 'find').mockImplementation(() => {
        throw new Error('Database error');
      });

      await ContactController.listContacts(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Failed to get contacts' });
    });
  });

  describe('createContact', () => {
    it('should create a new contact', async () => {
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      };

      req.body = contactData;
      await ContactController.createContact(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          email: contactData.email,
          phone: contactData.phone,
          userId: testUser._id.toString(),
        })
      );

      // Verify contact was created in database
      const contact = await Contact.findOne({ email: contactData.email });
      expect(contact).toBeDefined();
      expect(contact?.firstName).toBe(contactData.firstName);
    });

    it('should return 400 for invalid contact data', async () => {
      req.body = {
        email: 'invalid-email',
      };

      await ContactController.createContact(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation error',
        })
      );
    });
  });

  describe('getContact', () => {
    it('should return a contact by ID', async () => {
      const contactId = new mongoose.Types.ObjectId();
      req.params = { id: contactId.toString() };
      const contact = { ...mockContact, _id: contactId };

      jest.spyOn(Contact, 'findOne').mockResolvedValue(contact as any);

      await ContactController.getContact(req as Request, res as Response);

      expect(Contact.findOne).toHaveBeenCalledWith({
        _id: contactId.toString(),
        userId: testUser._id,
      });
      expect(res.json).toHaveBeenCalledWith(contact);
    });

    it('should return 400 when contact ID is missing', async () => {
      req.params = {};

      await ContactController.getContact(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Contact ID is required' });
    });

    it('should return 404 when contact is not found', async () => {
      req.params = { id: new mongoose.Types.ObjectId().toString() };

      jest.spyOn(Contact, 'findOne').mockResolvedValue(null);

      await ContactController.getContact(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Contact not found' });
    });

    it('should return 400 for invalid contact ID', async () => {
      req.params = { id: 'invalid-id' };

      await ContactController.getContact(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid contact ID' });
    });
  });

  describe('updateContact', () => {
    let existingContact: any;

    beforeEach(async () => {
      existingContact = await Contact.create({
        userId: testUser._id,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });
    });

    it('should update an existing contact', async () => {
      const updateData = {
        firstName: 'Jane',
        email: 'jane@example.com',
      };

      req.params = { id: existingContact._id.toString() };
      req.body = updateData;

      jest.spyOn(Contact, 'findOneAndUpdate').mockResolvedValue({
        ...existingContact.toObject(),
        ...updateData,
      } as any);

      await ContactController.updateContact(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updateData,
          userId: testUser._id.toString(),
        })
      );

      expect(Contact.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: existingContact._id.toString(), userId: testUser._id },
        updateData,
        { new: true }
      );
    });

    it('should return 404 for non-existent contact', async () => {
      req.params = { id: new mongoose.Types.ObjectId().toString() };
      req.body = { firstName: 'Jane' };

      await ContactController.updateContact(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Contact not found',
        })
      );
    });

    it('should return 403 for unauthorized access', async () => {
      const otherUser = {
        _id: new mongoose.Types.ObjectId(),
        email: 'other@example.com',
        name: 'Other User',
      };

      req.user = otherUser;
      req.params = { id: existingContact._id.toString() };
      req.body = { firstName: 'Jane' };

      await ContactController.updateContact(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Unauthorized access',
        })
      );
    });
  });

  describe('deleteContact', () => {
    let existingContact: any;

    beforeEach(async () => {
      existingContact = await Contact.create({
        userId: testUser._id,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });
    });

    it('should delete an existing contact', async () => {
      req.params = { id: existingContact._id.toString() };

      await ContactController.deleteContact(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Contact deleted successfully',
        })
      );

      // Verify contact was deleted from database
      const deletedContact = await Contact.findById(existingContact._id);
      expect(deletedContact).toBeNull();
    });

    it('should create a sync log entry for deletion', async () => {
      req.params = { id: existingContact._id.toString() };

      await ContactController.deleteContact(req as Request, res as Response);

      const syncLog = await SyncLog.findOne({
        userId: testUser._id,
        operation: SyncOperation.DELETE,
        entityId: existingContact._id,
      });

      expect(syncLog).toBeDefined();
      expect(syncLog?.status).toBe(SyncStatus.PENDING);
    });
  });

  describe('searchContacts', () => {
    beforeEach(async () => {
      await Contact.create([
        {
          userId: testUser._id,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          tags: ['work', 'important'],
          category: 'business',
        },
        {
          userId: testUser._id,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          tags: ['personal'],
          category: 'friends',
        },
        {
          userId: testUser._id,
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob@example.com',
          tags: ['work'],
          category: 'business',
        },
      ]);
    });

    it('should search contacts by query string', async () => {
      req.query = { query: 'john' };

      await ContactController.searchContacts(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
          }),
          expect.objectContaining({
            firstName: 'Bob',
            lastName: 'Johnson',
          }),
        ])
      );
    });

    it('should filter contacts by category', async () => {
      req.query = { category: 'business' };

      await ContactController.searchContacts(req as Request, res as Response);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response).toHaveLength(2);
      expect(response.every((contact: any) => contact.category === 'business')).toBe(true);
    });

    it('should filter contacts by tags', async () => {
      req.query = { tags: ['important'] };

      await ContactController.searchContacts(req as Request, res as Response);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response).toHaveLength(1);
      expect(response[0].firstName).toBe('John');
    });

    it('should paginate results', async () => {
      req.query = { page: '1', limit: '2' };

      await ContactController.searchContacts(req as Request, res as Response);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response).toHaveLength(2);
    });
  });

  describe('getSyncStatus', () => {
    it('should return pending sync items', async () => {
      const pendingSync = [
        {
          userId: testUser._id,
          operation: SyncOperation.CREATE,
          entityId: new mongoose.Types.ObjectId(),
          status: SyncStatus.PENDING,
        },
      ];

      jest.spyOn(SyncLog, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue(pendingSync),
      } as any);

      await ContactController.getSyncStatus(req as Request, res as Response);

      expect(SyncLog.find).toHaveBeenCalledWith({
        userId: testUser._id,
        status: SyncStatus.PENDING,
      });
      expect(res.json).toHaveBeenCalledWith({
        pendingChanges: 1,
        items: pendingSync,
      });
    });

    it('should handle sync status errors', async () => {
      jest.spyOn(SyncLog, 'find').mockImplementation(() => {
        throw new Error('Database error');
      });

      await ContactController.getSyncStatus(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Failed to get sync status' });
    });
  });

  describe('syncContacts', () => {
    it('should process sync changes successfully', async () => {
      const contactId = new mongoose.Types.ObjectId();
      const changes = [
        {
          operation: SyncOperation.CREATE,
          data: mockContact,
        },
        {
          operation: SyncOperation.UPDATE,
          contactId: contactId.toString(),
          data: { firstName: 'Jane' },
        },
      ];

      req.body = { changes };

      const mockSyncLog = {
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(SyncLog, 'create').mockResolvedValue(mockSyncLog as any);

      const mockCreatedContact = {
        ...mockContact,
        _id: new mongoose.Types.ObjectId(),
        toObject: () => ({ ...mockContact, _id: new mongoose.Types.ObjectId() }),
      };

      const mockUpdatedContact = {
        ...mockContact,
        _id: contactId,
        firstName: 'Jane',
        toObject: () => ({ ...mockContact, _id: contactId, firstName: 'Jane' }),
      };

      jest.spyOn(Contact, 'create').mockResolvedValue(mockCreatedContact as any);
      jest.spyOn(Contact, 'findOneAndUpdate').mockResolvedValue(mockUpdatedContact as any);

      await ContactController.syncContacts(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        results: expect.arrayContaining([
          expect.objectContaining({ operation: SyncOperation.CREATE }),
          expect.objectContaining({ operation: SyncOperation.UPDATE }),
        ]),
        errors: [],
      });
    });

    it('should handle invalid changes array', async () => {
      req.body = { changes: 'not-an-array' };

      await ContactController.syncContacts(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Changes must be an array' });
    });

    it('should handle sync errors', async () => {
      const changes = [
        {
          operation: 'INVALID',
          contactId: new mongoose.Types.ObjectId().toString(),
          data: {},
        },
      ];

      req.body = { changes };

      await ContactController.syncContacts(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        results: [],
        errors: expect.arrayContaining([
          expect.objectContaining({
            operation: 'INVALID',
            error: expect.stringContaining('Invalid operation'),
          }),
        ]),
      });
    });
  });
}); 