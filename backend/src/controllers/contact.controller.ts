import { Request, Response } from 'express';
import { Contact, IContact } from '../models/Contact';
import { SyncLog, SyncOperation, SyncStatus } from '../models/SyncLog';
import { isValidObjectId } from 'mongoose';
import { SyncService } from '../services/sync.service';

export class ContactController {
  // List all contacts for the authenticated user
  static async listContacts(req: Request, res: Response) {
    try {
      const contacts = await Contact.find({ userId: req.user._id })
        .sort({ lastName: 1, firstName: 1 });
      
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching contacts' });
    }
  }

  // Create a new contact
  static async createContact(req: Request, res: Response) {
    try {
      if (!req.body.firstName || !req.body.lastName) {
        return res.status(400).json({ message: 'First name and last name are required' });
      }

      const contactData = {
        ...req.body,
        userId: req.user._id,
      };

      const contact = await Contact.create(contactData);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Error creating contact' });
      }
    }
  }

  // Get a single contact by ID
  static async getContact(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'Contact ID is required' });
      }

      if (!isValidObjectId(id)) {
        return res.status(400).json({ message: 'Invalid contact ID' });
      }

      const contact = await Contact.findOne({
        _id: id,
        userId: req.user._id,
      });

      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }

      res.json(contact);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching contact' });
    }
  }

  // Update a contact
  static async updateContact(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'Contact ID is required' });
      }

      if (!isValidObjectId(id)) {
        return res.status(400).json({ message: 'Invalid contact ID' });
      }

      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'No update data provided' });
      }

      const contact = await Contact.findOneAndUpdate(
        {
          _id: id,
          userId: req.user._id,
        },
        req.body,
        { new: true, runValidators: true }
      );

      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }

      res.json(contact);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Error updating contact' });
      }
    }
  }

  // Delete a contact
  static async deleteContact(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'Contact ID is required' });
      }

      if (!isValidObjectId(id)) {
        return res.status(400).json({ message: 'Invalid contact ID' });
      }

      const contact = await Contact.findOneAndDelete({
        _id: id,
        userId: req.user._id,
      });

      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting contact' });
    }
  }

  // Search contacts
  static async searchContacts(req: Request, res: Response) {
    try {
      const { query, category, tags } = req.query;
      const searchQuery: any = { userId: req.user._id };

      // Text search across name and email fields
      if (query) {
        searchQuery.$or = [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
        ];
      }

      // Filter by category
      if (category) {
        searchQuery.category = category;
      }

      // Filter by tags
      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        searchQuery.tags = { $all: tagArray };
      }

      const contacts = await Contact.find(searchQuery)
        .sort({ lastName: 1, firstName: 1 });

      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: 'Error searching contacts' });
    }
  }

  // Get sync status
  static async getSyncStatus(req: Request, res: Response) {
    try {
      const pendingSync = await SyncLog.find({
        userId: req.user._id,
        status: SyncStatus.PENDING,
      }).sort({ timestamp: 1 });

      res.json({
        pendingChanges: pendingSync.length,
        items: pendingSync,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching sync status' });
    }
  }

  // Sync contacts
  static async syncContacts(req: Request, res: Response) {
    try {
      const { changes } = req.body;

      if (!Array.isArray(changes)) {
        return res.status(400).json({ message: 'Changes must be an array' });
      }

      const syncResults = [];
      const errors = [];

      for (const change of changes) {
        try {
          const { operation, contactId, data } = change;

          // Validate operation
          if (!Object.values(SyncOperation).includes(operation)) {
            throw new Error(`Invalid operation: ${operation}`);
          }

          // Create sync log entry
          const syncLog = await SyncLog.create({
            userId: req.user._id,
            operation,
            entityId: contactId,
            entityType: 'Contact',
            status: SyncStatus.PENDING,
            conflictData: {
              localVersion: data,
            },
          });

          // Process sync immediately
          try {
            switch (operation) {
              case SyncOperation.CREATE:
                await SyncService.processCreate(syncLog);
                break;

              case SyncOperation.UPDATE:
                // Check for conflicts
                if (contactId) {
                  const conflict = await SyncService.detectConflicts(
                    req.user._id,
                    contactId,
                    data
                  );

                  if (conflict) {
                    syncLog.status = SyncStatus.CONFLICT;
                    syncLog.conflictData = conflict;
                    await syncLog.save();
                    
                    syncResults.push({
                      operation,
                      contactId,
                      status: 'conflict',
                      conflicts: conflict.conflictFields,
                    });
                    continue;
                  }
                }
                await SyncService.processUpdate(syncLog);
                break;

              case SyncOperation.DELETE:
                await SyncService.processDelete(syncLog);
                break;
            }

            syncResults.push({
              operation,
              contactId: syncLog.entityId,
              status: 'completed',
            });
          } catch (error) {
            syncLog.retryCount += 1;
            if (syncLog.retryCount >= 3) {
              syncLog.status = SyncStatus.FAILED;
            }
            await syncLog.save();

            throw error;
          }
        } catch (error) {
          errors.push({
            operation: change.operation,
            contactId: change.contactId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Process any remaining pending syncs in the background
      SyncService.processPendingSyncs(req.user._id).catch(console.error);

      res.json({
        success: errors.length === 0,
        results: syncResults,
        errors,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error syncing contacts' });
    }
  }

  // Resolve sync conflict
  static async resolveConflict(req: Request, res: Response) {
    try {
      const { syncLogId, resolution } = req.body;

      if (!isValidObjectId(syncLogId)) {
        return res.status(400).json({ message: 'Invalid sync log ID' });
      }

      if (!['local', 'server', 'merge'].includes(resolution)) {
        return res.status(400).json({ message: 'Invalid resolution strategy' });
      }

      const syncLog = await SyncLog.findOne({
        _id: syncLogId,
        userId: req.user._id,
        status: SyncStatus.CONFLICT,
      });

      if (!syncLog) {
        return res.status(404).json({ message: 'Sync log not found or not in conflict' });
      }

      const resolvedContact = await SyncService.resolveConflict(
        syncLog,
        resolution as 'local' | 'server' | 'merge'
      );

      res.json({
        message: 'Conflict resolved successfully',
        contact: resolvedContact,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error resolving conflict' });
    }
  }
} 