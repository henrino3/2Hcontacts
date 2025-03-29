import { api } from './api';
import type { Contact, PaginatedResponse } from '../../types';

// Regular expression for validating MongoDB ObjectId format
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

function isValidObjectId(id: string): boolean {
  return OBJECT_ID_REGEX.test(id);
}

class ContactApi {
  async getContacts(): Promise<PaginatedResponse<Contact>> {
    try {
      const response = await api.get<PaginatedResponse<Contact>>('/contacts');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Please log in to view contacts');
      }
      throw new Error('Failed to fetch contacts. Please try again.');
    }
  }

  async getContact(id: string): Promise<Contact> {
    if (!id || !isValidObjectId(id)) {
      throw new Error('Invalid contact ID format');
    }

    try {
      const response = await api.get<Contact>(`/contacts/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error('Invalid contact ID format');
      } else if (error.response?.status === 404) {
        throw new Error('Contact not found');
      }
      throw new Error('Failed to fetch contact. Please try again.');
    }
  }

  async createContact(contact: Omit<Contact, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'lastSyncedAt'>): Promise<Contact> {
    try {
      const response = await api.post<Contact>('/contacts', contact);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error('Invalid contact data. Please check all required fields.');
      } else if (error.response?.status === 401) {
        throw new Error('Please log in to create contacts');
      }
      throw new Error('Failed to create contact. Please try again.');
    }
  }

  async updateContact(id: string, contact: Partial<Contact>): Promise<Contact> {
    if (!id || !isValidObjectId(id)) {
      throw new Error('Invalid contact ID format');
    }

    try {
      const response = await api.put<Contact>(`/contacts/${id}`, contact);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error('Invalid contact data or ID format');
      } else if (error.response?.status === 404) {
        throw new Error('Contact not found');
      } else if (error.response?.status === 401) {
        throw new Error('Please log in to update contacts');
      }
      throw new Error('Failed to update contact. Please try again.');
    }
  }

  async deleteContact(id: string): Promise<void> {
    if (!id || !isValidObjectId(id)) {
      throw new Error('Invalid contact ID format');
    }

    try {
      const response = await api.delete(`/contacts/${id}`);
      if (response.status !== 200 && response.status !== 204) {
        throw new Error('Failed to delete contact');
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error('Invalid contact ID format');
      } else if (error.response?.status === 404) {
        throw new Error('Contact not found');
      } else if (error.response?.status === 401) {
        throw new Error('Please log in to delete contacts');
      }
      throw new Error('Failed to delete contact. Please try again.');
    }
  }
}

export const contactApi = new ContactApi(); 