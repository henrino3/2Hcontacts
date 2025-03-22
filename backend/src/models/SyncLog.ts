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
  timestamp: Date;
  syncedAt?: Date;
  status: SyncStatus;
  conflictData?: any;
  retryCount: number;
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
  timestamp: {
    type: Date,
    default: Date.now,
  },
  syncedAt: {
    type: Date,
  },
  status: {
    type: String,
    enum: Object.values(SyncStatus),
    default: SyncStatus.PENDING,
  },
  conflictData: {
    type: Schema.Types.Mixed,
  },
  retryCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
syncLogSchema.index({ userId: 1, status: 1 });
syncLogSchema.index({ userId: 1, entityType: 1, entityId: 1 });
syncLogSchema.index({ timestamp: 1 });

export const SyncLog = model<ISyncLog>('SyncLog', syncLogSchema); 