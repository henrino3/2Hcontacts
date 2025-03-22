import { Request, Response } from 'express';
import { User, IUser } from '../models/User';
import { generateToken } from '../utils/jwt';
import bcrypt from 'bcrypt';
import { Document, Types } from 'mongoose';

interface IUserDocument extends Document, IUser {
  _id: Types.ObjectId;
}

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create new user
      const user = await User.create({
        email,
        password,
        name,
      }) as IUserDocument;

      // Generate token
      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        iat: Math.floor(Date.now() / 1000),
      });

      return res.status(201).json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
        token,
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email }).select('+password') as IUserDocument;
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate token
      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        iat: Math.floor(Date.now() / 1000),
      });

      return res.json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getCurrentUser(req: Request, res: Response) {
    try {
      // @ts-ignore - userId is added by auth middleware
      const userId = req.userId;
      const user = await User.findById(userId) as IUserDocument;

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
} 