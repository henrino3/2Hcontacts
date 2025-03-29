import { Request, Response, NextFunction } from 'express';
import { User } from '../../models/User';
import { UserRole } from '../../types/auth';
import { authenticate } from '../auth';
import { generateToken, TokenPayload } from '../../utils/jwt';
import { Types } from 'mongoose';
import { clearDatabase } from '../../test/globals';

jest.setTimeout(60000); // Increase timeout to 60 seconds

type MockRequest = {
  headers: {
    authorization?: string;
  };
  user?: any;
};

describe('Auth Middleware', () => {
  let req: MockRequest;
  let res: Partial<Response>;
  let next: NextFunction;
  let testUser: any;

  beforeEach(async () => {
    await clearDatabase();
    
    testUser = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: UserRole.USER,
    });

    const tokenPayload: TokenPayload = {
      userId: testUser._id.toString(),
      email: testUser.email,
      role: testUser.role,
    };

    const token = generateToken(tokenPayload);

    req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
      user: undefined,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('authenticate', () => {
    it('should authenticate valid token', async () => {
      await authenticate(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.id.toString()).toEqual(testUser._id.toString());
    });

    it('should reject missing token', async () => {
      req.headers.authorization = undefined;
      await authenticate(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
    });

    it('should reject invalid token format', async () => {
      req.headers.authorization = 'Invalid-Token-Format';
      await authenticate(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token format' });
    });

    it('should reject expired token', async () => {
      const expiredToken = generateToken({
        userId: testUser._id.toString(),
        email: testUser.email,
        role: testUser.role,
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      });

      req.headers.authorization = `Bearer ${expiredToken}`;
      await authenticate(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token expired' });
    });
  });
}); 