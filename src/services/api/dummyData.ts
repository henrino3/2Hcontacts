import { create } from 'zustand';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  category?: string;
  tags?: string[];
  isFavorite: boolean;
  profilePicture?: string;
  socialProfiles?: {
    linkedin?: string;
    instagram?: string;
    x?: string;
  };
}

interface ContactStore {
  contacts: Contact[];
  updateContact: (updatedContact: Contact) => void;
  deleteContact: (contactId: string) => void;
}

export const useContactStore = create<ContactStore>((set) => ({
  contacts: [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@techsolutions.com',
      phone: '+1 (555) 123-4567',
      company: 'Tech Solutions Inc.',
      title: 'Senior Developer',
      isFavorite: true,
      category: 'Work',
      tags: ['developer', 'tech'],
      socialProfiles: {
        linkedin: 'johnsmith',
        x: '@johnsmith',
        instagram: '@johnsmith.dev'
      }
    },
    {
      id: '2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.j@creativedesigns.com',
      phone: '+1 (555) 234-5678',
      company: 'Creative Designs',
      title: 'UI/UX Designer',
      isFavorite: true,
      category: 'Work',
      tags: ['design', 'creative'],
    },
    {
      id: '3',
      firstName: 'Michael',
      lastName: 'Brown',
      email: 'mike.brown@family.net',
      phone: '+1 (555) 345-6789',
      company: 'Family',
      title: 'Brother',
      category: 'Family',
      tags: ['family', 'personal'],
      isFavorite: true
    },
    {
      id: '4',
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.davis@marketing.com',
      phone: '+1 (555) 456-7890',
      company: 'Marketing Pro',
      title: 'Marketing Manager',
      category: 'Work',
      tags: ['marketing', 'management'],
      isFavorite: false,
      socialProfiles: {
        linkedin: 'emilydavis',
        twitter: '@emilymarkets'
      }
    },
    {
      id: '5',
      firstName: 'David',
      lastName: 'Wilson',
      email: 'david.wilson@gym.fit',
      phone: '+1 (555) 567-8901',
      company: 'FitLife Gym',
      title: 'Personal Trainer',
      category: 'Health',
      tags: ['fitness', 'health', 'personal'],
      isFavorite: false
    },
    {
      id: '6',
      firstName: 'Lisa',
      lastName: 'Anderson',
      email: 'lisa.anderson@school.edu',
      phone: '+1 (555) 678-9012',
      company: 'City High School',
      title: 'Teacher',
      category: 'Education',
      tags: ['education', 'work'],
      isFavorite: false
    },
    {
      id: '7',
      firstName: 'Robert',
      lastName: 'Taylor',
      email: 'rob.taylor@finance.com',
      phone: '+1 (555) 789-0123',
      company: 'Investment Group',
      title: 'Financial Advisor',
      category: 'Finance',
      tags: ['finance', 'business'],
      isFavorite: false,
      socialProfiles: {
        linkedin: 'roberttaylor'
      }
    },
    {
      id: '8',
      firstName: 'Jennifer',
      lastName: 'Martinez',
      email: 'jen.martinez@startup.io',
      phone: '+1 (555) 890-1234',
      company: 'Tech Startup',
      title: 'CEO',
      category: 'Work',
      tags: ['startup', 'tech', 'management'],
      isFavorite: true,
      socialProfiles: {
        linkedin: 'jenmartinez',
        twitter: '@jenthefounder'
      }
    },
    {
      id: '9',
      firstName: 'William',
      lastName: 'Lee',
      email: 'will.lee@restaurant.com',
      phone: '+1 (555) 901-2345',
      company: 'Gourmet Kitchen',
      title: 'Chef',
      category: 'Business',
      tags: ['food', 'business'],
      isFavorite: false
    },
    {
      id: '10',
      firstName: 'Maria',
      lastName: 'Garcia',
      email: 'maria.g@community.org',
      phone: '+1 (555) 012-3456',
      company: 'Community Center',
      title: 'Volunteer Coordinator',
      category: 'Community',
      tags: ['volunteer', 'community', 'nonprofit'],
      isFavorite: false,
      socialProfiles: {
        twitter: '@mariaserves'
      }
    }
  ],
  updateContact: (updatedContact) =>
    set((state) => ({
      contacts: state.contacts.map((contact) =>
        contact.id === updatedContact.id ? updatedContact : contact
      ),
    })),
  deleteContact: (contactId) =>
    set((state) => ({
      contacts: state.contacts.filter((contact) => contact.id !== contactId),
    })),
})); 