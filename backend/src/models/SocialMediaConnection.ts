import mongoose, { Schema, Document } from 'mongoose';

interface ISocialMediaConnectionMethods {
  updateProfileData(profileData: Partial<ISocialMediaConnectionDoc['profileData']>): Promise<ISocialMediaConnectionDoc>;
}

export interface ISocialMediaConnectionDoc extends Document {
  userId: mongoose.Types.ObjectId;
  platform: 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'google';
  platformUserId: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  profileData: {
    username: string;
    displayName: string;
    profileUrl: string;
    avatarUrl?: string;
  };
  lastSyncedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ISocialMediaConnection = ISocialMediaConnectionDoc & ISocialMediaConnectionMethods;

const socialMediaConnectionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['facebook', 'twitter', 'linkedin', 'instagram', 'google'],
    index: true
  },
  platformUserId: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String
  },
  tokenExpiresAt: {
    type: Date
  },
  profileData: {
    username: {
      type: String,
      required: true
    },
    displayName: {
      type: String,
      required: true
    },
    profileUrl: {
      type: String,
      required: true
    },
    avatarUrl: {
      type: String
    }
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for unique platform connection per user
socialMediaConnectionSchema.index({ userId: 1, platform: 1 }, { unique: true });

// Method to update profile data
socialMediaConnectionSchema.methods.updateProfileData = async function(
  this: ISocialMediaConnection,
  profileData: Partial<ISocialMediaConnectionDoc['profileData']>
): Promise<ISocialMediaConnection> {
  this.profileData = { ...this.profileData, ...profileData };
  this.lastSyncedAt = new Date();
  return this.save();
};

export const SocialMediaConnection = mongoose.model<ISocialMediaConnection>('SocialMediaConnection', socialMediaConnectionSchema); 