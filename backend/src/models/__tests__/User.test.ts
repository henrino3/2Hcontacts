import { User } from '../User';
import mongoose, { Error } from 'mongoose';

describe('User Model', () => {
  describe('validation', () => {
    it('should validate a valid user', async () => {
      const validUser = new User({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      const savedUser = await validUser.save();
      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe('test@example.com');
      expect(savedUser.name).toBe('Test User');
    });

    it('should fail validation without required fields', async () => {
      const userWithoutRequired = new User({});
      
      let error: Error.ValidationError | null = null;
      try {
        await userWithoutRequired.save();
      } catch (err) {
        error = err as Error.ValidationError;
      }
      
      expect(error).toBeDefined();
      expect(error?.errors.email).toBeDefined();
      expect(error?.errors.password).toBeDefined();
      expect(error?.errors.name).toBeDefined();
    });

    it('should trim whitespace from email and name', async () => {
      const user = new User({
        email: '  test@example.com  ',
        password: 'password123',
        name: '  Test User  ',
      });

      const savedUser = await user.save();
      expect(savedUser.email).toBe('test@example.com');
      expect(savedUser.name).toBe('Test User');
    });

    it('should convert email to lowercase', async () => {
      const user = new User({
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
        name: 'Test User',
      });

      const savedUser = await user.save();
      expect(savedUser.email).toBe('test@example.com');
    });

    it('should enforce unique email constraint', async () => {
      const firstUser = new User({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User 1',
      });
      await firstUser.save();

      const duplicateUser = new User({
        email: 'test@example.com',
        password: 'password456',
        name: 'Test User 2',
      });

      let error: mongoose.mongo.MongoError | null = null;
      try {
        await duplicateUser.save();
      } catch (err) {
        error = err as mongoose.mongo.MongoError;
      }
      
      expect(error).toBeDefined();
      expect(error?.code).toBe(11000); // MongoDB duplicate key error code
    });

    it('should fail validation with invalid email', async () => {
      const userWithInvalidEmail = new User({
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      });

      let error: Error.ValidationError | null = null;
      try {
        await userWithInvalidEmail.save();
      } catch (err) {
        error = err as Error.ValidationError;
      }

      expect(error).toBeDefined();
    });

    it('should enforce minimum password length', async () => {
      const userWithShortPassword = new User({
        email: 'test@example.com',
        password: 'short',
        name: 'Test User',
      });

      let error: Error.ValidationError | null = null;
      try {
        await userWithShortPassword.save();
      } catch (err) {
        error = err as Error.ValidationError;
      }

      expect(error).toBeDefined();
      expect(error?.errors.password).toBeDefined();
    });
  });

  describe('password hashing', () => {
    it('should hash password before saving', async () => {
      const password = 'password123';
      const user = new User({
        email: 'test@example.com',
        password,
        name: 'Test User',
      });

      await user.save();
      expect(user.password).not.toBe(password);
    });

    it('should not rehash password when updating other fields', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      await user.save();
      const hashedPassword = user.password;

      user.name = 'Updated Name';
      await user.save();

      expect(user.password).toBe(hashedPassword);
    });
  });

  describe('comparePassword method', () => {
    it('should return true for correct password', async () => {
      const password = 'password123';
      const user = new User({
        email: 'test@example.com',
        password,
        name: 'Test User',
      });

      await user.save();
      const isMatch = await user.comparePassword(password);
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      await user.save();
      const isMatch = await user.comparePassword('wrongpassword');
      expect(isMatch).toBe(false);
    });
  });
}); 