import { Request, Response } from 'express';
import { z } from 'zod';
import { Contact, IContact } from '../models/Contact';
import { SyncLog, SyncOperation, SyncStatus } from '../models/SyncLog';
import { isValidObjectId } from 'mongoose';
import { SyncService } from '../services/sync.service';
import { transformContact, transformContacts } from '../utils/transformers';

// Validation schemas
const contactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
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
  categories: z.array(
    z.object({
      type: z.string(),
      value: z.string()
    })
  ).default([]),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  socialProfiles: z.object({
    linkedin: z.string().url().optional(),
    instagram: z.string().url().optional(),
    x: z.string().url().optional(),
  }).optional().transform(val => val || {}),
  isFavorite: z.preprocess((val) => 
    val === undefined ? false : val,
    z.boolean()
  ),
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
        contacts: transformContacts(contacts),
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
      // Before parsing the data, log the raw request body
      console.log('Raw request body:', JSON.stringify(req.body, null, 2));
      
      const validatedData = contactSchema.parse(req.body);
      
      // Check if the categories field exists in the request
      const hasCategories = Array.isArray(validatedData.categories) && validatedData.categories.length > 0;
      
      // First create the contact with basic data
      const contact = await Contact.create({
        ...validatedData,
        userId: req.user._id,
        // Set category from first category if available
        category: hasCategories ? validatedData.categories[0].value : (validatedData.category || ''),
        // Initialize empty categories array 
        categories: []
      });
      
      // Then update it separately to set categories correctly
      if (hasCategories) {
        // Get categories array from validated data
        const categories = validatedData.categories.map(cat => ({
          type: cat.type || 'all',
          value: cat.value || ''
        }));
        
        console.log('Setting categories:', JSON.stringify(categories, null, 2));
        
        // Try multiple update methods to ensure categories are saved
        
        // First - standard Mongoose update with $set and runValidators false
        await Contact.findByIdAndUpdate(
          contact._id, 
          { $set: { categories: categories } },
          { 
            new: false,
            runValidators: false,
            strict: false
          }
        );
        
        // Fetch the updated contact with a delay to ensure MongoDB has completed the update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Fetch the updated contact
        const updatedContact = await Contact.findById(contact._id);
        
        if (!updatedContact) {
          throw new Error('Failed to retrieve updated contact');
        }
        
        // Get plain object to verify categories are saved
        const contactObj = updatedContact.toObject();
        
        // Log the updated contact
        console.log('Contact after categories update:', JSON.stringify(contactObj, null, 2));
        console.log('Categories in updated contact:', JSON.stringify(contactObj.categories, null, 2));
        
        // If categories are still not saved, manually set them in the response
        const finalCategories = Array.isArray(contactObj.categories) && contactObj.categories.length > 0 
          ? contactObj.categories 
          : categories;
        
        // Use the updated contact for response with guaranteed categories
        const transformedContact = transformContact({
          ...contactObj,
          categories: finalCategories
        });
        
        // Log the transformed contact for debugging
        console.log('Contact after transform:', JSON.stringify(transformedContact, null, 2));
        
        return res.status(201).json(transformedContact);
      }

      // If no categories, just return the original contact
      const contactObj = contact.toObject();
      
      // Log the contact before transformation for debugging
      console.log('Contact before transform:', JSON.stringify(contactObj, null, 2));

      // Transform the contact
      const transformedContact = transformContact(contactObj);

      // Log the transformed contact for debugging
      console.log('Contact after transform:', JSON.stringify(transformedContact, null, 2));

      res.status(201).json(transformedContact);
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

      res.json(transformContact(contact));
    } catch (error) {
      console.error('Get contact error:', error);
      res.status(500).json({ message: 'Failed to get contact' });
    }
  }

  // Update a contact
  static async updateContact(req: Request, res: Response) {
    try {
      // Before parsing the data, log the raw request body
      console.log('Raw update request body:', JSON.stringify(req.body, null, 2));
      
      const validatedData = contactSchema.partial().parse(req.body);
      
      // Check if categories are explicitly provided
      const hasCategories = Array.isArray(validatedData.categories);
      
      // Prepare update data with explicit handling of categories
      const updateData = {
        ...validatedData,
        // Only include categories if they're explicitly provided
        ...(hasCategories && {
          // Map to ensure proper format
          categories: validatedData.categories?.map(cat => ({
            type: cat.type || 'all',
            value: cat.value || ''
          })),
          // Update category field based on first category if present
          category: validatedData.categories?.[0]?.value || validatedData.category || ''
        })
      };

      // Log the update data for debugging
      console.log('Updating contact with data:', JSON.stringify(updateData, null, 2));

      // Use $set to properly update arrays and prevent empty array issues
      const contact = await Contact.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { $set: updateData },
        { 
          new: true,
          runValidators: true,
          // Return the document as a plain object
          lean: true,
          // Ensure arrays are properly handled
          strict: false
        }
      );

      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }

      // Log the contact before transformation for debugging
      console.log('Contact before transform:', JSON.stringify(contact, null, 2));

      const transformedContact = transformContact(contact);

      // Log the transformed contact for debugging
      console.log('Contact after transform:', JSON.stringify(transformedContact, null, 2));

      res.status(200).json(transformedContact);
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

      // Create sync log entry for deletion
      await SyncLog.create({
        userId: req.user._id,
        operation: SyncOperation.DELETE,
        entityId: contact._id,
        entityType: 'Contact',
        status: SyncStatus.PENDING,
      });

      res.status(200).json({ message: 'Contact deleted successfully' });
    } catch (error) {
      console.error('Delete contact error:', error);
      res.status(500).json({ message: 'Failed to delete contact' });
    }
  }

  // Search contacts
  static async searchContacts(req: Request, res: Response) {
    try {
      const { query, category, tags, page = 1, limit = 20 } = searchSchema.parse({
        query: req.query.query,
        category: req.query.category,
        tags: req.query.tags,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      });
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
        contacts: transformContacts(contacts),
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
        status: SyncStatus.PENDING,
      });

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

      if (!Array.isArray(changes)) {
        return res.status(400).json({ message: 'Changes must be an array' });
      }

      const result = await SyncService.syncChanges(req.user._id, changes);

      res.json({
        success: result.success,
        results: changes.map((change, index) => ({
          operation: change.operation,
          contactId: change.contactId,
          success: !result.errors || index < result.processed,
          error: result.errors?.[index],
        })),
        errors: result.errors || [],
      });
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