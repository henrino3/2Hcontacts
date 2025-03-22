import request from 'supertest';
import mongoose, { Document, Types } from 'mongoose';
import { Express } from 'express';
import { createServer } from '../../utils/server';
import { Contact, IContact } from '../../models/Contact';
import { User, IUser } from '../../models/User';
import { generateToken } from '../../utils/jwt';
import { SyncLog, ISyncLog, SyncOperation, SyncStatus } from '../../models/SyncLog';

interface IUserDocument extends Document, IUser {
  _id: Types.ObjectId;
}

interface IContactDocument extends Document, IContact {
  _id: Types.ObjectId;
}

interface ISyncLogDocument extends Document, ISyncLog {
  _id: Types.ObjectId;
}

describe('Contact Routes', () => {
  let app: Express;
  let authToken: string;
  let testUser: IUserDocument;

  beforeAll(async () => {
    app = await createServer();
  });

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    }) as IUserDocument;

    // Generate auth token
    authToken = generateToken({
      userId: testUser._id.toString(),
      email: testUser.email,
      iat: Math.floor(Date.now() / 1000),
    });

    // Clear contacts and sync logs
    await Contact.deleteMany({});
    await SyncLog.deleteMany({});
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Contact.deleteMany({});
    await SyncLog.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/contacts', () => {
    it('should create a new contact', async () => {
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
      };

      const response = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(contactData);
      expect(response.body.userId).toBe(testUser._id.toString());
    });

    it('should return 400 for invalid contact data', async () => {
      const response = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });
  });

  describe('GET /api/contacts', () => {
    it('should list contacts with pagination', async () => {
      // Create test contacts
      const contacts = await Promise.all([
        Contact.create({
          firstName: 'John',
          lastName: 'Doe',
          userId: testUser._id,
        }),
        Contact.create({
          firstName: 'Jane',
          lastName: 'Smith',
          userId: testUser._id,
        }),
      ]);

      const response = await request(app)
        .get('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.contacts).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 2,
        pages: 1,
      });
    });
  });

  describe('GET /api/contacts/:id', () => {
    it('should get a contact by ID', async () => {
      const contact = await Contact.create({
        firstName: 'John',
        lastName: 'Doe',
        userId: testUser._id,
      }) as IContactDocument;

      const response = await request(app)
        .get(`/api/contacts/${contact._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(contact._id.toString());
    });

    it('should return 404 for non-existent contact', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/contacts/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/contacts/:id', () => {
    it('should update a contact', async () => {
      const contact = await Contact.create({
        firstName: 'John',
        lastName: 'Doe',
        userId: testUser._id,
      }) as IContactDocument;

      const updateData = {
        firstName: 'Jane',
        email: 'jane@example.com',
      };

      const response = await request(app)
        .put(`/api/contacts/${contact._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.firstName).toBe(updateData.firstName);
      expect(response.body.email).toBe(updateData.email);
    });
  });

  describe('DELETE /api/contacts/:id', () => {
    it('should delete a contact', async () => {
      const contact = await Contact.create({
        firstName: 'John',
        lastName: 'Doe',
        userId: testUser._id,
      }) as IContactDocument;

      const response = await request(app)
        .delete(`/api/contacts/${contact._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      const deletedContact = await Contact.findById(contact._id);
      expect(deletedContact).toBeNull();
    });
  });

  describe('GET /api/contacts/search', () => {
    it('should search contacts by query string', async () => {
      await Promise.all([
        Contact.create({
          firstName: 'John',
          lastName: 'Doe',
          userId: testUser._id,
        }),
        Contact.create({
          firstName: 'Jane',
          lastName: 'Smith',
          userId: testUser._id,
        }),
      ]);

      const response = await request(app)
        .get('/api/contacts/search')
        .query({ query: 'john' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.contacts).toHaveLength(1);
      expect(response.body.contacts[0].firstName).toBe('John');
    });

    it('should filter contacts by category and tags', async () => {
      await Promise.all([
        Contact.create({
          firstName: 'John',
          lastName: 'Doe',
          category: 'work',
          tags: ['important', 'client'],
          userId: testUser._id,
        }),
        Contact.create({
          firstName: 'Jane',
          lastName: 'Smith',
          category: 'personal',
          tags: ['family'],
          userId: testUser._id,
        }),
      ]);

      const response = await request(app)
        .get('/api/contacts/search')
        .query({ category: 'work', tags: ['important'] })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.contacts).toHaveLength(1);
      expect(response.body.contacts[0].firstName).toBe('John');
    });
  });

  describe('GET /api/contacts/sync/status', () => {
    it('should get sync status', async () => {
      const syncLog = await SyncLog.create({
        userId: testUser._id,
        operation: SyncOperation.CREATE,
        entityType: 'Contact',
        status: SyncStatus.PENDING,
      }) as ISyncLogDocument;

      const response = await request(app)
        .get('/api/contacts/sync/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]._id).toBe(syncLog._id.toString());
    });
  });

  describe('POST /api/contacts/sync', () => {
    it('should create sync logs for changes', async () => {
      const changes = [
        {
          operation: SyncOperation.CREATE,
          contact: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
        {
          operation: SyncOperation.UPDATE,
          contactId: new mongoose.Types.ObjectId().toString(),
          contact: {
            firstName: 'Updated',
          },
        },
      ];

      const response = await request(app)
        .post('/api/contacts/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ changes });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].status).toBe(SyncStatus.PENDING);
      expect(response.body[1].status).toBe(SyncStatus.PENDING);
    });

    it('should return 400 for invalid sync data', async () => {
      const response = await request(app)
        .post('/api/contacts/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ changes: [{ operation: 'INVALID' }] });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });
  });
}); 