import { Types } from 'mongoose';
import { Contact, IContact } from '../models/Contact';
import { SyncLog, ISyncLog, SyncOperation, SyncStatus } from '../models/SyncLog';

export interface SyncConflict {
  localVersion: Partial<IContact>;
  serverVersion: Partial<IContact>;
  conflictFields: string[];
}

export class SyncService {
  /**
   * Detects conflicts between local and server versions of a contact
   */
  static async detectConflicts(
    userId: Types.ObjectId,
    contactId: Types.ObjectId,
    localData: Partial<IContact>
  ): Promise<SyncConflict | null> {
    const serverContact = await Contact.findOne({ _id: contactId, userId });
    if (!serverContact) {
      return null;
    }

    const conflictFields = this.findConflictingFields(localData, serverContact.toObject());
    if (conflictFields.length === 0) {
      return null;
    }

    return {
      localVersion: localData,
      serverVersion: serverContact.toObject(),
      conflictFields,
    };
  }

  /**
   * Finds fields that have different values between local and server versions
   */
  private static findConflictingFields(
    localData: Partial<IContact>,
    serverData: Partial<IContact>
  ): string[] {
    const conflicts: string[] = [];
    const fieldsToCompare = Object.keys(localData) as Array<keyof IContact>;

    for (const field of fieldsToCompare) {
      if (field === '_id' || field === 'userId' || field === 'lastSyncedAt') {
        continue;
      }

      if (JSON.stringify(localData[field]) !== JSON.stringify(serverData[field])) {
        conflicts.push(field);
      }
    }

    return conflicts;
  }

  /**
   * Resolves a sync conflict using the specified strategy
   */
  static async resolveConflict(
    syncLog: ISyncLog,
    resolution: 'local' | 'server' | 'merge'
  ): Promise<IContact> {
    if (!syncLog.conflictData) {
      throw new Error('No conflict data found');
    }

    const { localVersion, serverVersion } = syncLog.conflictData;

    let resolvedData: Partial<IContact>;
    switch (resolution) {
      case 'local':
        resolvedData = localVersion;
        break;
      case 'server':
        resolvedData = serverVersion;
        break;
      case 'merge':
        resolvedData = this.mergeVersions(localVersion, serverVersion);
        break;
      default:
        throw new Error('Invalid resolution strategy');
    }

    // Update the contact with resolved data
    const updatedContact = await Contact.findOneAndUpdate(
      { _id: syncLog.entityId, userId: syncLog.userId },
      resolvedData,
      { new: true }
    );

    if (!updatedContact) {
      throw new Error('Contact not found');
    }

    // Update sync log status
    syncLog.status = SyncStatus.COMPLETED;
    syncLog.syncedAt = new Date();
    await syncLog.save();

    return updatedContact;
  }

  /**
   * Merges local and server versions of a contact
   */
  private static mergeVersions(
    localVersion: Partial<IContact>,
    serverVersion: Partial<IContact>
  ): Partial<IContact> {
    const merged = { ...serverVersion };

    // Merge arrays (tags)
    if (localVersion.tags && serverVersion.tags) {
      merged.tags = Array.from(new Set([...serverVersion.tags, ...localVersion.tags]));
    }

    // Merge maps (socialProfiles)
    if (localVersion.socialProfiles && serverVersion.socialProfiles) {
      merged.socialProfiles = new Map([
        ...serverVersion.socialProfiles,
        ...localVersion.socialProfiles,
      ]);
    }

    // For other fields, prefer the most recent version based on lastSyncedAt
    const localDate = new Date(localVersion.lastSyncedAt || 0);
    const serverDate = new Date(serverVersion.lastSyncedAt || 0);

    if (localDate > serverDate) {
      Object.assign(merged, localVersion);
    }

    return merged;
  }

  /**
   * Processes pending sync operations in the background
   */
  static async processPendingSyncs(userId: Types.ObjectId): Promise<void> {
    const pendingSyncs = await SyncLog.find({
      userId,
      status: SyncStatus.PENDING,
    }).sort({ timestamp: 1 });

    for (const syncLog of pendingSyncs) {
      try {
        if (syncLog.retryCount >= 3) {
          syncLog.status = SyncStatus.FAILED;
          await syncLog.save();
          continue;
        }

        switch (syncLog.operation) {
          case SyncOperation.CREATE:
            await this.processCreate(syncLog);
            break;
          case SyncOperation.UPDATE:
            await this.processUpdate(syncLog);
            break;
          case SyncOperation.DELETE:
            await this.processDelete(syncLog);
            break;
        }
      } catch (error) {
        syncLog.retryCount += 1;
        await syncLog.save();
      }
    }
  }

  /**
   * Processes a create operation sync log
   */
  static async processCreate(syncLog: ISyncLog): Promise<void> {
    const contact = await Contact.create({
      ...syncLog.conflictData?.localVersion,
      userId: syncLog.userId,
    });

    syncLog.status = SyncStatus.COMPLETED;
    syncLog.syncedAt = new Date();
    await syncLog.save();
  }

  /**
   * Processes an update operation sync log
   */
  static async processUpdate(syncLog: ISyncLog): Promise<void> {
    const conflict = await this.detectConflicts(
      syncLog.userId,
      syncLog.entityId,
      syncLog.conflictData?.localVersion || {}
    );

    if (conflict) {
      syncLog.status = SyncStatus.CONFLICT;
      syncLog.conflictData = conflict;
      await syncLog.save();
      return;
    }

    const contact = await Contact.findOneAndUpdate(
      { _id: syncLog.entityId, userId: syncLog.userId },
      syncLog.conflictData?.localVersion || {},
      { new: true }
    );

    if (!contact) {
      throw new Error('Contact not found');
    }

    syncLog.status = SyncStatus.COMPLETED;
    syncLog.syncedAt = new Date();
    await syncLog.save();
  }

  /**
   * Processes a delete operation sync log
   */
  static async processDelete(syncLog: ISyncLog): Promise<void> {
    await Contact.findOneAndDelete({
      _id: syncLog.entityId,
      userId: syncLog.userId,
    });

    syncLog.status = SyncStatus.COMPLETED;
    syncLog.syncedAt = new Date();
    await syncLog.save();
  }
} 