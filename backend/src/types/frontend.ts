export interface FrontendContact {
  id: string;
  _id: string; // Include both for compatibility
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  company: string;
  title: string;
  notes: string;
  category: string;
  tags: string[];
  socialProfiles: {
    linkedin: string;
    instagram: string;
    x: string;
  };
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string;
} 