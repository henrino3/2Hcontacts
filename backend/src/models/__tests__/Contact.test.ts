import { Contact, IContact } from '../Contact';
import { User, IUser } from '../User';
import mongoose, { Document, Types } from 'mongoose';

interface IUserDocument extends Document, IUser {
  _id: Types.ObjectId;
}

describe('Contact Model', () => {
  let testUser: IUserDocument;

  beforeEach(async () => {
    testUser = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    }) as IUserDocument;
  });

  describe('validation', () => {
    it('should validate a valid contact', async () => {
      const validContact = new Contact({
        userId: testUser._id,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      });

      const savedContact = await validContact.save();
      expect(savedContact._id).toBeDefined();
      expect(savedContact.firstName).toBe('John');
      expect(savedContact.lastName).toBe('Doe');
    });

    it('should fail validation without required fields', async () => {
      const contactWithoutRequired = new Contact({});
      
      let validationError: mongoose.Error.ValidationError | null = null;
      try {
        await contactWithoutRequired.save();
      } catch (err) {
        validationError = err as mongoose.Error.ValidationError;
      }
      
      expect(validationError).toBeDefined();
      expect(validationError?.errors.userId).toBeDefined();
      expect(validationError?.errors.firstName).toBeDefined();
      expect(validationError?.errors.lastName).toBeDefined();
    });

    it('should trim whitespace from string fields', async () => {
      const contact = new Contact({
        userId: testUser._id,
        firstName: '  John  ',
        lastName: '  Doe  ',
        email: '  john@example.com  ',
        phone: '  +1234567890  ',
      });

      const savedContact = await contact.save();
      expect(savedContact.firstName).toBe('John');
      expect(savedContact.lastName).toBe('Doe');
      expect(savedContact.email).toBe('john@example.com');
      expect(savedContact.phone).toBe('+1234567890');
    });

    it('should convert email to lowercase', async () => {
      const contact = new Contact({
        userId: testUser._id,
        firstName: 'John',
        lastName: 'Doe',
        email: 'JOHN@EXAMPLE.COM',
      });

      const savedContact = await contact.save();
      expect(savedContact.email).toBe('john@example.com');
    });
  });

  describe('default values', () => {
    it('should set default values correctly', async () => {
      const contact = new Contact({
        userId: testUser._id,
        firstName: 'John',
        lastName: 'Doe',
      });

      const savedContact = await contact.save();
      expect(savedContact.isFavorite).toBe(false);
      expect(savedContact.tags).toEqual([]);
      expect(savedContact.lastSyncedAt).toBeDefined();
    });
  });

  describe('indexing', () => {
    it('should create compound index for userId and name', async () => {
      const indexes = await Contact.collection.getIndexes();
      expect(indexes).toHaveProperty('userId_1_lastName_1_firstName_1');
    });

    it('should create compound index for userId and email', async () => {
      const indexes = await Contact.collection.getIndexes();
      expect(indexes).toHaveProperty('userId_1_email_1');
    });

    it('should create compound index for userId and phone', async () => {
      const indexes = await Contact.collection.getIndexes();
      expect(indexes).toHaveProperty('userId_1_phone_1');
    });

    it('should create compound index for userId and tags', async () => {
      const indexes = await Contact.collection.getIndexes();
      expect(indexes).toHaveProperty('userId_1_tags_1');
    });

    it('should create compound index for userId and category', async () => {
      const indexes = await Contact.collection.getIndexes();
      expect(indexes).toHaveProperty('userId_1_category_1');
    });
  });

  describe('data integrity', () => {
    it('should store and retrieve complex contact data correctly', async () => {
      const contactData = {
        userId: testUser._id,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: {
          street: '123 Main St',
          city: 'Test City',
          state: 'TS',
          country: 'Test Country',
          postalCode: '12345',
        },
        company: 'Test Company',
        title: 'Software Engineer',
        notes: 'Test notes',
        category: 'Work',
        tags: ['colleague', 'developer'],
        socialProfiles: new Map([
          ['linkedin', 'linkedin.com/johndoe'],
          ['twitter', 'twitter.com/johndoe']
        ]),
        isFavorite: true,
      };

      const contact = new Contact(contactData);
      const savedContact = await contact.save();

      const retrievedContact = await Contact.findById(savedContact._id);
      expect(retrievedContact).toBeDefined();
      expect(retrievedContact?.address).toEqual(contactData.address);
      expect(retrievedContact?.tags).toEqual(contactData.tags);
      
      if (retrievedContact) {
        expect(retrievedContact.socialProfiles).toBeDefined();
        expect(retrievedContact.socialProfiles.get('linkedin')).toBe('linkedin.com/johndoe');
        expect(retrievedContact.socialProfiles.get('twitter')).toBe('twitter.com/johndoe');
      }
    });
  });

  describe('sync functionality', () => {
    it('should update lastSyncedAt timestamp on save', async () => {
      const contact = new Contact({
        userId: testUser._id,
        firstName: 'John',
        lastName: 'Doe',
      });

      const savedContact = await contact.save();
      expect(savedContact.lastSyncedAt).toBeDefined();
      expect(savedContact.lastSyncedAt instanceof Date).toBe(true);
    });

    it('should update lastSyncedAt timestamp on update', async () => {
      const contact = await Contact.create({
        userId: testUser._id,
        firstName: 'John',
        lastName: 'Doe',
      });

      const originalSyncTime = contact.lastSyncedAt;
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms

      contact.firstName = 'Jane';
      const updatedContact = await contact.save();

      expect(updatedContact.lastSyncedAt).toBeDefined();
      expect(updatedContact.lastSyncedAt).not.toEqual(originalSyncTime);
      expect(updatedContact.lastSyncedAt.getTime()).toBeGreaterThan(originalSyncTime.getTime());
    });

    it('should maintain social profiles as a Map', async () => {
      const socialProfiles = new Map([
        ['linkedin', 'https://linkedin.com/in/johndoe'],
        ['instagram', '@johndoe'],
        ['x', '@johndoe']
      ]);

      const contact = await Contact.create({
        userId: testUser._id,
        firstName: 'John',
        lastName: 'Doe',
        socialProfiles
      });

      const savedContact = await Contact.findById(contact._id);
      expect(savedContact?.socialProfiles instanceof Map).toBe(true);
      expect(savedContact?.socialProfiles.get('linkedin')).toBe('https://linkedin.com/in/johndoe');
      expect(savedContact?.socialProfiles.get('instagram')).toBe('@johndoe');
      expect(savedContact?.socialProfiles.get('x')).toBe('@johndoe');
    });

    it('should handle empty social profiles', async () => {
      const contact = await Contact.create({
        userId: testUser._id,
        firstName: 'John',
        lastName: 'Doe',
      });

      const savedContact = await Contact.findById(contact._id);
      expect(savedContact?.socialProfiles instanceof Map).toBe(true);
      expect(savedContact?.socialProfiles.size).toBe(0);
    });
  });
}); 