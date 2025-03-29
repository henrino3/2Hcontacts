import { Schema, model, Document, Types } from 'mongoose';

export enum SyncOperation {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum SyncStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CONFLICT = 'CONFLICT',
}

export interface ISyncLog extends Document {
  userId: Types.ObjectId;
  operation: SyncOperation;
  entityId: Types.ObjectId;
  entityType: string;
  status: SyncStatus;
  retryCount: number;
  error?: string;
  completedAt?: Date;
  failedAt?: Date;
  lastRetryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
  timestamp: Date;
  conflictData?: {
    localVersion: any;
    serverVersion: any;
  };
}

const syncLogSchema = new Schema<ISyncLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  operation: {
    type: String,
    enum: Object.values(SyncOperation),
    required: true,
  },
  entityId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  entityType: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(SyncStatus),
    default: SyncStatus.PENDING,
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  error: String,
  completedAt: Date,
  failedAt: Date,
  lastRetryAt: Date,
  syncedAt: Date,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  conflictData: {
    type: {
      localVersion: Schema.Types.Mixed,
      serverVersion: Schema.Types.Mixed,
    },
    required: false,
  },
}, {
  timestamps: true,
});

// Add indexes for better query performance
syncLogSchema.index({ userId: 1, status: 1 });
syncLogSchema.index({ userId: 1, entityType: 1, entityId: 1 });

// Update timestamps on status changes
syncLogSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    switch (this.status) {
      case SyncStatus.COMPLETED:
        this.completedAt = new Date();
        break;
      case SyncStatus.FAILED:
        this.failedAt = new Date();
        break;
      case SyncStatus.PENDING:
        if (this.isModified('retryCount')) {
          this.lastRetryAt = new Date();
        }
        break;
    }
  }
  next();
});

export const SyncLog = model<ISyncLog>('SyncLog', syncLogSchema); 