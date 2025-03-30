import { Types } from 'mongoose';
import { IContact } from '../models/Contact';
import { FrontendContact } from '../types/frontend';

export function transformContact(contact: IContact | any): FrontendContact {
  // Ensure we have an _id, even if it's a string
  const id = contact._id?.toString() || contact.id;
  
  // Convert Mongoose document to plain object if needed
  const contactData = contact.toObject ? contact.toObject() : contact;

  // Log the raw contact data to debug categories
  console.log('Transform - Raw contact data:', JSON.stringify({
    id: contactData._id || contactData.id,
    categories: contactData.categories,
    category: contactData.category
  }, null, 2));

  // Ensure categories is properly handled - must handle array with possible nested objects
  let categories: Array<{type: string, value: string}> = [];
  
  // First check if categories exists and is an array
  if (Array.isArray(contactData.categories)) {
    // Map each category to ensure correct format
    categories = contactData.categories.map((cat: any) => {
      if (typeof cat === 'object' && cat !== null) {
        return {
          type: cat.type || 'all',
          value: cat.value || ''
        };
      }
      // Handle primitive values
      return {
        type: 'all',
        value: String(cat)
      };
    });
  }
    
  // If no categories but category exists, create default category
  if (categories.length === 0 && contactData.category) {
    categories = [{
      type: 'all',
      value: contactData.category
    }];
  }

  // Log the processed categories
  console.log('Transform - Processed categories:', JSON.stringify(categories, null, 2));

  // Handle social profiles
  const socialProfiles = {
    linkedin: contactData.socialProfiles?.get?.('linkedin') || contactData.socialProfiles?.linkedin || '',
    instagram: contactData.socialProfiles?.get?.('instagram') || contactData.socialProfiles?.instagram || '',
    x: contactData.socialProfiles?.get?.('x') || contactData.socialProfiles?.x || '',
  };
  
  return {
    id: id,
    _id: id, // Include both id and _id for compatibility
    userId: contactData.userId?.toString(),
    firstName: contactData.firstName,
    lastName: contactData.lastName,
    email: contactData.email || '',
    phone: contactData.phone || '',
    address: contactData.address || {},
    company: contactData.company || '',
    title: contactData.title || '',
    notes: contactData.notes || '',
    categories,
    category: contactData.category || '',
    tags: contactData.tags || [],
    socialProfiles,
    isFavorite: contactData.isFavorite || false,
    createdAt: contactData.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: contactData.updatedAt?.toISOString() || new Date().toISOString(),
    lastSyncedAt: contactData.lastSyncedAt?.toISOString() || new Date().toISOString(),
  };
}

export function transformContacts(contacts: IContact[] | any[]): FrontendContact[] {
  return contacts.map(contact => transformContact(contact));
} 