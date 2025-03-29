import { create } from 'zustand';
import { Contact } from '../../types';
import api from './api';

interface ContactStore {
  contacts: Contact[] | null;
  isLoading: boolean;
  error: string | null;
  fetchContacts: () => Promise<void>;
  createContact: (contact: Partial<Contact>) => Promise<Contact>;
  updateContact: (id: string, contact: Partial<Contact>) => Promise<Contact>;
  deleteContact: (id: string) => Promise<void>;
}

export const useContactStore = create<ContactStore>((set, get) => ({
  contacts: null,
  isLoading: false,
  error: null,

  fetchContacts: async () => {
    console.log('Fetching contacts...');
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.get('/contacts');
      console.log('API Response:', response.data);
      
      if (response.data && Array.isArray(response.data.contacts)) {
        set({ contacts: response.data.contacts, isLoading: false });
        console.log('Contacts updated:', response.data.contacts.length, 'contacts');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      set({ 
        contacts: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch contacts',
        isLoading: false 
      });
    }
  },

  createContact: async (contact) => {
    console.log('Creating contact:', contact);
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.post('/contacts', contact);
      console.log('Create contact response:', response.data);
      
      const newContact = response.data;
      const currentContacts = get().contacts || [];
      set({ 
        contacts: [...currentContacts, newContact],
        isLoading: false 
      });
      
      return newContact;
    } catch (error) {
      console.error('Error creating contact:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create contact',
        isLoading: false 
      });
      throw error;
    }
  },

  updateContact: async (id, contact) => {
    console.log('Updating contact:', id, contact);
    set({ isLoading: true, error: null });
    
    try {
      const contactId = contact._id || id;
      const response = await api.put(`/contacts/${contactId}`, contact);
      console.log('Update contact response:', response.data);
      
      const updatedContact = response.data;
      const currentContacts = get().contacts || [];
      set({
        contacts: currentContacts.map(c => 
          (c._id === contactId || c.id === contactId) ? updatedContact : c
        ),
        isLoading: false
      });
      
      return updatedContact;
    } catch (error) {
      console.error('Error updating contact:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update contact',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteContact: async (id) => {
    console.log('Deleting contact with ID:', id);
    set({ isLoading: true, error: null });
    
    try {
      // Find the contact first to get the MongoDB _id
      const currentContacts = get().contacts || [];
      console.log('Current contacts:', currentContacts.map(c => ({ id: c.id, _id: c._id })));
      
      // Try to find the contact by either id or _id
      const contact = currentContacts.find(c => c.id === id || c._id === id);
      console.log('Found contact:', contact ? { id: contact.id, _id: contact._id } : null);
      
      if (!contact) {
        throw new Error('Contact not found');
      }

      // Use the MongoDB _id for deletion - if not available, use the id
      const deleteId = contact._id || contact.id;
      console.log('Attempting to delete contact with _id:', deleteId);
      
      try {
        const response = await api.delete(`/contacts/${deleteId}`);
        console.log('Delete response:', response.data);
        
        // Only update the state if the delete was successful
        set({
          contacts: currentContacts.filter(c => c._id !== deleteId && c.id !== deleteId),
          isLoading: false
        });
        console.log('Contact deleted successfully');
      } catch (error: any) {
        // If we get a 404, the contact might have been deleted already
        if (error.response?.status === 404) {
          // Remove from local state anyway
          set({
            contacts: currentContacts.filter(c => c._id !== deleteId && c.id !== deleteId),
            isLoading: false,
            error: null
          });
          console.log('Contact not found on server, removed from local state');
          return;
        }
        throw error;
      }
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete contact',
        isLoading: false 
      });
      throw error;
    }
  },
})); 