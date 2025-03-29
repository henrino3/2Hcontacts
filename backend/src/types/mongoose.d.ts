import { Document, Types } from 'mongoose';

export interface BaseDocument extends Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDocument extends BaseDocument {
  email: string;
  password: string;
  name: string;
  role: string;
  profilePicture?: string;
}

export interface ContactDocument extends BaseDocument {
  userId: Types.ObjectId;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  company?: string;
  title?: string;
  notes?: string;
  category?: string;
  tags?: string[];
  socialProfiles?: {
    [key: string]: string;
  };
  isFavorite: boolean;
  lastSyncedAt?: Date;
}

export interface SocialMediaConnectionDocument extends BaseDocument {
  userId: Types.ObjectId;
  platform: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  platformUserId: string;
  profileData?: Record<string, any>;
} 