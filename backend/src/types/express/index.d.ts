import 'express';
import { Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: Types.ObjectId;
        email: string;
        role: string;
        [key: string]: any;
      };
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    oauthState?: string;
    [key: string]: any;
  }
} 