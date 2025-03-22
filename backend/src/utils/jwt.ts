import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d'; // Fixed value since we don't need to make it configurable yet

interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function extractTokenFromHeader(header: string | undefined): string {
  if (!header) {
    throw new Error('No authorization header');
  }

  const [type, token] = header.split(' ');

  if (type !== 'Bearer') {
    throw new Error('Invalid token type');
  }

  if (!token) {
    throw new Error('No token provided');
  }

  return token;
} 