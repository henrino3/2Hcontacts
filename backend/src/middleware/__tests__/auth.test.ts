import { Request, Response, NextFunction } from 'express';
import mongoose, { Document } from 'mongoose';
import { authenticate, requireRole } from '../auth';
import { User, IUser, UserRole } from '../../models/User';
import { generateToken } from '../../utils/jwt';

interface UserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  role: UserRole;
}

interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
}

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock<NextFunction>;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate valid token and attach user', async () => {
      // Create test user
      const user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'user' as UserRole,
      }) as UserDocument;

      // Generate valid token
      const tokenPayload: TokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        iat: Math.floor(Date.now() / 1000),
      };
      const token = generateToken(tokenPayload);

      req.headers = {
        authorization: `Bearer ${token}`,
      };

      await authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(user._id.toString());
      expect(req.user.email).toBe(user.email);
    });

    it('should return 401 when no authorization header is present', async () => {
      await authenticate(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication failed' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token format', async () => {
      req.headers = {
        authorization: 'InvalidFormat token',
      };

      await authenticate(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication failed' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for expired or invalid token', async () => {
      req.headers = {
        authorization: 'Bearer invalid.token.here',
      };

      await authenticate(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication failed' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not found', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const tokenPayload: TokenPayload = {
        userId: nonExistentUserId.toString(),
        email: 'nonexistent@example.com',
        iat: Math.floor(Date.now() / 1000),
      };
      const token = generateToken(tokenPayload);

      req.headers = {
        authorization: `Bearer ${token}`,
      };

      await authenticate(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow access when user has required role', () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin' as UserRole,
      } as UserDocument;
      req.user = mockUser;

      const middleware = requireRole(['admin']);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      const middleware = requireRole(['admin']);
      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when user lacks required role', () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as UserRole,
      } as UserDocument;
      req.user = mockUser;

      const middleware = requireRole(['admin']);
      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Insufficient permissions' });
      expect(next).not.toHaveBeenCalled();
    });
  });
}); 