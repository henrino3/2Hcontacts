import { Request, Response } from 'express';
import { z } from 'zod';
import { Contact, IContact } from '../models/Contact';
import { SyncLog, SyncOperation, SyncStatus } from '../models/SyncLog';
import { isValidObjectId } from 'mongoose';
import { SyncService } from '../services/sync.service';

// Validation schemas
const contactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  socialProfiles: z.object({
    linkedin: z.string().url().optional(),
    instagram: z.string().url().optional(),
    x: z.string().url().optional(),
  }).optional(),
  isFavorite: z.boolean().optional(),
});

const searchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

const syncSchema = z.object({
  changes: z.array(z.object({
    operation: z.enum([SyncOperation.CREATE, SyncOperation.UPDATE, SyncOperation.DELETE]),
    contact: contactSchema.optional(),
    contactId: z.string().optional(),
  })),
});

export class ContactController {
  // List all contacts for the authenticated user
  static async listContacts(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const contacts = await Contact.find({ userId: req.user._id })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Contact.countDocuments({ userId: req.user._id });

      res.json({
        contacts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get contacts error:', error);
      res.status(500).json({ message: 'Failed to get contacts' });
    }
  }

  // Create a new contact
  static async createContact(req: Request, res: Response) {
    try {
      const validatedData = contactSchema.parse(req.body);
      const contact = await Contact.create({
        ...validatedData,
        userId: req.user._id,
      });
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Create contact error:', error);
      res.status(500).json({ message: 'Failed to create contact' });
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
      console.error('Get contact error:', error);
      res.status(500).json({ message: 'Failed to get contact' });
    }
  }

  // Update a contact
  static async updateContact(req: Request, res: Response) {
    try {
      const validatedData = contactSchema.partial().parse(req.body);
      const contact = await Contact.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        validatedData,
        { new: true }
      );

      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }

      res.json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Update contact error:', error);
      res.status(500).json({ message: 'Failed to update contact' });
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
      console.error('Delete contact error:', error);
      res.status(500).json({ message: 'Failed to delete contact' });
    }
  }

  // Search contacts
  static async searchContacts(req: Request, res: Response) {
    try {
      const { query, category, tags, page = 1, limit = 20 } = searchSchema.parse(req.query);
      const skip = (page - 1) * limit;

      const filter: any = { userId: req.user._id };

      if (query) {
        filter.$or = [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { company: { $regex: query, $options: 'i' } },
        ];
      }

      if (category) {
        filter.category = category;
      }

      if (tags && tags.length > 0) {
        filter.tags = { $all: tags };
      }

      const contacts = await Contact.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Contact.countDocuments(filter);

      res.json({
        contacts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Search contacts error:', error);
      res.status(500).json({ message: 'Failed to search contacts' });
    }
  }

  // Get sync status
  static async getSyncStatus(req: Request, res: Response) {
    try {
      const pendingSyncs = await SyncLog.find({
        userId: req.user._id,
        status: { $in: [SyncStatus.PENDING, SyncStatus.CONFLICT] },
      }).sort({ timestamp: 1 });

      res.json(pendingSyncs);
    } catch (error) {
      console.error('Get sync status error:', error);
      res.status(500).json({ message: 'Failed to get sync status' });
    }
  }

  // Sync contacts
  static async syncContacts(req: Request, res: Response) {
    try {
      const { changes } = syncSchema.parse(req.body);

      // Create sync logs for each change
      const syncLogs = await Promise.all(
        changes.map(async (change) => {
          const syncLog = await SyncLog.create({
            userId: req.user._id,
            operation: change.operation,
            entityId: change.contactId,
            entityType: 'Contact',
            timestamp: new Date(),
            status: SyncStatus.PENDING,
            conflictData: change.contact ? { localVersion: change.contact } : undefined,
          });

          return syncLog;
        })
      );

      // Process syncs in background
      SyncService.processPendingSyncs(req.user._id).catch((error) => {
        console.error('Background sync processing error:', error);
      });

      res.json(syncLogs);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Sync contacts error:', error);
      res.status(500).json({ message: 'Failed to sync contacts' });
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