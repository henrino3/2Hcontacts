export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Contact {
  id: string;
  _id?: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  company?: string;
  title?: string;
  notes?: string;
  category?: string;
  tags?: string[];
  socialProfiles?: {
    linkedin?: string;
    instagram?: string;
    x?: string;
  };
  isFavorite: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastSyncedAt?: string;
}

export interface SocialMediaConnection {
  id: string;
  userId: string;
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'google';
  platformUserId: string;
  profileData: {
    username: string;
    displayName: string;
    profileUrl: string;
    avatarUrl?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
}

export interface PaginatedResponse<T> {
  contacts: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
} 