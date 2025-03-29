import mongoose from 'mongoose';
import { Contact, IContact } from '../models/Contact';
import dotenv from 'dotenv';

dotenv.config();

// Create a dummy user ID for testing
const DUMMY_USER_ID = new mongoose.Types.ObjectId();

const dummyContacts = [
  {
    userId: DUMMY_USER_ID,
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    company: "Tech Corp",
    title: "Software Engineer",
    category: "Work",
    tags: ["tech", "engineering"],
    isFavorite: true,
    socialProfiles: {
      linkedin: "johndoe",
      x: "@johndoe"
    }
  },
  {
    userId: DUMMY_USER_ID,
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    phone: "+1 (555) 234-5678",
    company: "Design Studio",
    title: "UI/UX Designer",
    category: "Work",
    tags: ["design", "creative"],
    isFavorite: true,
    socialProfiles: {
      linkedin: "janesmith",
      instagram: "@janedesigns"
    }
  },
  {
    userId: DUMMY_USER_ID,
    firstName: "Michael",
    lastName: "Johnson",
    email: "michael.j@example.com",
    phone: "+1 (555) 345-6789",
    company: "Marketing Pro",
    title: "Marketing Manager",
    category: "Work",
    tags: ["marketing", "management"],
    isFavorite: false,
    socialProfiles: {
      linkedin: "michaelj",
      x: "@michaelj"
    }
  },
  {
    userId: DUMMY_USER_ID,
    firstName: "Sarah",
    lastName: "Williams",
    email: "sarah.w@example.com",
    phone: "+1 (555) 456-7890",
    company: "Freelance",
    title: "Content Writer",
    category: "Freelancer",
    tags: ["writing", "content"],
    isFavorite: false,
    socialProfiles: {
      linkedin: "sarahw",
      instagram: "@sarahwrites"
    }
  },
  {
    userId: DUMMY_USER_ID,
    firstName: "David",
    lastName: "Brown",
    email: "david.brown@example.com",
    phone: "+1 (555) 567-8901",
    company: "Finance Plus",
    title: "Financial Advisor",
    category: "Finance",
    tags: ["finance", "consulting"],
    isFavorite: true,
    socialProfiles: {
      linkedin: "davidbrown"
    }
  }
];

async function seedContacts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/contacts');
    console.log('Connected to MongoDB');

    // Clear existing contacts
    await Contact.deleteMany({});
    console.log('Cleared existing contacts');

    // Insert dummy contacts
    const createdContacts = await Contact.create(dummyContacts);
    console.log(`Created ${createdContacts.length} contacts`);

    // Log the created contacts
    createdContacts.forEach((contact: IContact) => {
      console.log(`Created contact: ${contact.firstName} ${contact.lastName}`);
    });

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeding function
seedContacts(); 