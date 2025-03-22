import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ContactController } from '../contact.controller';
import { Contact, IContact } from '../../models/Contact';
import { User } from '../../models/User';
import { SyncLog, SyncOperation, SyncStatus } from '../../models/SyncLog';

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

  beforeEach(() => {
    // Reset mocks before each test
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

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('listContacts', () => {
    it('should return all contacts for the authenticated user', async () => {
      const contacts = [
        { ...mockContact, userId: testUser._id },
        { ...mockContact, firstName: 'Jane', userId: testUser._id },
      ];

      jest.spyOn(Contact, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue(contacts),
      } as any);

      await ContactController.listContacts(req as Request, res as Response);

      expect(Contact.find).toHaveBeenCalledWith({ userId: testUser._id });
      expect(res.json).toHaveBeenCalledWith(contacts);
    });

    it('should handle errors when listing contacts', async () => {
      jest.spyOn(Contact, 'find').mockImplementation(() => {
        throw new Error('Database error');
      });

      await ContactController.listContacts(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error fetching contacts' });
    });
  });

  describe('createContact', () => {
    it('should create a new contact', async () => {
      req.body = mockContact;
      const createdContact = { ...mockContact, _id: new mongoose.Types.ObjectId() };

      jest.spyOn(Contact, 'create').mockResolvedValue(createdContact as any);

      await ContactController.createContact(req as Request, res as Response);

      expect(Contact.create).toHaveBeenCalledWith({
        ...mockContact,
        userId: testUser._id,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(createdContact);
    });

    it('should return 400 when firstName is missing', async () => {
      req.body = { lastName: 'Doe' };

      await ContactController.createContact(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'First name and last name are required' });
    });

    it('should return 400 when lastName is missing', async () => {
      req.body = { firstName: 'John' };

      await ContactController.createContact(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'First name and last name are required' });
    });

    it('should handle validation errors when creating contact', async () => {
      req.body = mockContact;
      const error = new Error('Validation error');

      jest.spyOn(Contact, 'create').mockRejectedValue(error);

      await ContactController.createContact(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: error.message });
    });

    it('should handle non-Error instances when creating contact', async () => {
      req.body = mockContact;

      jest.spyOn(Contact, 'create').mockRejectedValue('Unknown error');

      await ContactController.createContact(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error creating contact' });
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
    it('should update a contact', async () => {
      const contactId = new mongoose.Types.ObjectId();
      req.params = { id: contactId.toString() };
      req.body = { firstName: 'Updated' };
      const updatedContact = { ...mockContact, firstName: 'Updated' };

      jest.spyOn(Contact, 'findOneAndUpdate').mockResolvedValue(updatedContact as any);

      await ContactController.updateContact(req as Request, res as Response);

      expect(Contact.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: contactId.toString(), userId: testUser._id },
        { firstName: 'Updated' },
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith(updatedContact);
    });

    it('should return 400 when contact ID is missing', async () => {
      req.params = {};
      req.body = { firstName: 'Updated' };

      await ContactController.updateContact(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Contact ID is required' });
    });

    it('should return 400 when no update data is provided', async () => {
      req.params = { id: new mongoose.Types.ObjectId().toString() };
      req.body = {};

      await ContactController.updateContact(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'No update data provided' });
    });

    it('should return 404 when updating non-existent contact', async () => {
      req.params = { id: new mongoose.Types.ObjectId().toString() };
      req.body = { firstName: 'Updated' };

      jest.spyOn(Contact, 'findOneAndUpdate').mockResolvedValue(null);

      await ContactController.updateContact(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Contact not found' });
    });

    it('should handle validation errors when updating contact', async () => {
      req.params = { id: new mongoose.Types.ObjectId().toString() };
      req.body = { firstName: 'Updated' };
      const error = new Error('Validation error');

      jest.spyOn(Contact, 'findOneAndUpdate').mockRejectedValue(error);

      await ContactController.updateContact(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: error.message });
    });

    it('should handle non-Error instances when updating contact', async () => {
      req.params = { id: new mongoose.Types.ObjectId().toString() };
      req.body = { firstName: 'Updated' };

      jest.spyOn(Contact, 'findOneAndUpdate').mockRejectedValue('Unknown error');

      await ContactController.updateContact(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error updating contact' });
    });
  });

  describe('deleteContact', () => {
    it('should delete a contact', async () => {
      const contactId = new mongoose.Types.ObjectId();
      req.params = { id: contactId.toString() };
      const deletedContact = { ...mockContact, _id: contactId };

      jest.spyOn(Contact, 'findOneAndDelete').mockResolvedValue(deletedContact as any);

      await ContactController.deleteContact(req as Request, res as Response);

      expect(Contact.findOneAndDelete).toHaveBeenCalledWith({
        _id: contactId.toString(),
        userId: testUser._id,
      });
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 400 when contact ID is missing', async () => {
      req.params = {};

      await ContactController.deleteContact(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Contact ID is required' });
    });

    it('should return 404 when deleting non-existent contact', async () => {
      req.params = { id: new mongoose.Types.ObjectId().toString() };

      jest.spyOn(Contact, 'findOneAndDelete').mockResolvedValue(null);

      await ContactController.deleteContact(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Contact not found' });
    });
  });

  describe('searchContacts', () => {
    it('should search contacts by query string', async () => {
      const contacts = [
        { ...mockContact, userId: testUser._id },
        { ...mockContact, firstName: 'Jane', userId: testUser._id },
      ];

      jest.spyOn(Contact, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue(contacts),
      } as any);

      req.query = { query: 'john' };

      await ContactController.searchContacts(req as Request, res as Response);

      expect(Contact.find).toHaveBeenCalledWith({
        userId: testUser._id,
        $or: [
          { firstName: { $regex: 'john', $options: 'i' } },
          { lastName: { $regex: 'john', $options: 'i' } },
          { email: { $regex: 'john', $options: 'i' } },
        ],
      });
      expect(res.json).toHaveBeenCalledWith(contacts);
    });

    it('should filter contacts by category', async () => {
      const contacts = [mockContact];

      jest.spyOn(Contact, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue(contacts),
      } as any);

      req.query = { category: 'work' };

      await ContactController.searchContacts(req as Request, res as Response);

      expect(Contact.find).toHaveBeenCalledWith({
        userId: testUser._id,
        category: 'work',
      });
      expect(res.json).toHaveBeenCalledWith(contacts);
    });

    it('should filter contacts by tags', async () => {
      const contacts = [mockContact];

      jest.spyOn(Contact, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue(contacts),
      } as any);

      req.query = { tags: ['friend', 'work'] };

      await ContactController.searchContacts(req as Request, res as Response);

      expect(Contact.find).toHaveBeenCalledWith({
        userId: testUser._id,
        tags: { $all: ['friend', 'work'] },
      });
      expect(res.json).toHaveBeenCalledWith(contacts);
    });

    it('should handle search errors', async () => {
      jest.spyOn(Contact, 'find').mockImplementation(() => {
        throw new Error('Database error');
      });

      await ContactController.searchContacts(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error searching contacts' });
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
      expect(res.json).toHaveBeenCalledWith({ message: 'Error fetching sync status' });
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