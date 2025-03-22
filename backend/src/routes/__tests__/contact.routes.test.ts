import request from 'supertest';
import mongoose from 'mongoose';
import { Express } from 'express';
import { createServer } from '../../utils/server';
import { Contact } from '../../models/Contact';
import { User } from '../../models/User';
import { generateToken } from '../../utils/jwt';

describe('Contact Routes', () => {
  let app: Express;
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    app = await createServer();
  });

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });

    // Generate auth token
    authToken = generateToken({
      userId: testUser._id,
      email: testUser.email,
      iat: Math.floor(Date.now() / 1000),
    });

    // Clear contacts
    await Contact.deleteMany({});
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Contact.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/contacts', () => {
    it('should return all contacts for authenticated user', async () => {
      // Create test contacts
      await Contact.create([
        {
          userId: testUser._id,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        {
          userId: testUser._id,
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
        },
      ]);

      const response = await request(app)
        .get('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('firstName');
      expect(response.body[1]).toHaveProperty('firstName');
      expect(response.body.map((c: any) => c.firstName).sort()).toEqual(['Jane', 'John']);
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app).get('/api/contacts');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/contacts', () => {
    it('should create a new contact', async () => {
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      };

      const response = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(contactData);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('userId', testUser._id.toString());
    });

    it('should return 400 for invalid contact data', async () => {
      const response = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'John' }); // Missing required lastName

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/contacts/:id', () => {
    it('should return a contact by ID', async () => {
      const contact = await Contact.create({
        userId: testUser._id,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });

      const response = await request(app)
        .get(`/api/contacts/${contact._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });
    });

    it('should return 404 for non-existent contact', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/contacts/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid contact ID', async () => {
      const response = await request(app)
        .get('/api/contacts/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/contacts/:id', () => {
    it('should update a contact', async () => {
      const contact = await Contact.create({
        userId: testUser._id,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });

      const updateData = {
        firstName: 'Jane',
        email: 'jane@example.com',
      };

      const response = await request(app)
        .put(`/api/contacts/${contact._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(updateData);
      expect(response.body.lastName).toBe('Doe'); // Unchanged field
    });

    it('should return 404 for updating non-existent contact', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .put(`/api/contacts/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/contacts/:id', () => {
    it('should delete a contact', async () => {
      const contact = await Contact.create({
        userId: testUser._id,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });

      const response = await request(app)
        .delete(`/api/contacts/${contact._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify contact is deleted
      const deletedContact = await Contact.findById(contact._id);
      expect(deletedContact).toBeNull();
    });

    it('should return 404 for deleting non-existent contact', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/api/contacts/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
}); 