import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d'; // Fixed value since we don't need to make it configurable yet

export interface TokenPayload extends JwtPayload {
  userId: string;
  email: string;
}

export function generateToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
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