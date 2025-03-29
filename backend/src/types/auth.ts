export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
} 