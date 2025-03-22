import { Schema, model, Document, Types } from 'mongoose';

interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

interface ISocialProfiles {
  linkedin?: string;
  facebook?: string;
  twitter?: string;
  [key: string]: string | undefined;
}

export interface IContact extends Document {
  userId: Types.ObjectId;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: IAddress;
  company?: string;
  title?: string;
  notes?: string;
  category?: string;
  tags: string[];
  socialProfiles?: ISocialProfiles;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date;
}

const contactSchema = new Schema<IContact>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
  },
  company: {
    type: String,
    trim: true,
  },
  title: {
    type: String,
    trim: true,
  },
  notes: String,
  category: {
    type: String,
    trim: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  socialProfiles: {
    type: Map,
    of: String,
    default: {},
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
contactSchema.index({ userId: 1, lastName: 1, firstName: 1 });
contactSchema.index({ userId: 1, email: 1 });
contactSchema.index({ userId: 1, phone: 1 });
contactSchema.index({ userId: 1, tags: 1 });
contactSchema.index({ userId: 1, category: 1 });

export const Contact = model<IContact>('Contact', contactSchema); 