import { Types } from 'mongoose';
import { IContact } from '../models/Contact';
import { FrontendContact } from '../types/frontend';

export function transformContact(contact: IContact | any): FrontendContact {
  // Ensure we have an _id, even if it's a string
  const id = contact._id?.toString() || contact.id;
  
  return {
    id: id,
    _id: id, // Include both id and _id for compatibility
    userId: contact.userId?.toString(),
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email || '',
    phone: contact.phone || '',
    address: contact.address || {},
    company: contact.company || '',
    title: contact.title || '',
    notes: contact.notes || '',
    category: contact.category || '',
    tags: contact.tags || [],
    socialProfiles: {
      linkedin: contact.socialProfiles?.get?.('linkedin') || contact.socialProfiles?.linkedin || '',
      instagram: contact.socialProfiles?.get?.('instagram') || contact.socialProfiles?.instagram || '',
      x: contact.socialProfiles?.get?.('x') || contact.socialProfiles?.x || '',
    },
    isFavorite: contact.isFavorite || false,
    createdAt: contact.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: contact.updatedAt?.toISOString() || new Date().toISOString(),
    lastSyncedAt: contact.lastSyncedAt?.toISOString() || new Date().toISOString(),
  };
}

export function transformContacts(contacts: IContact[] | any[]): FrontendContact[] {
  return contacts.map(transformContact);
} 