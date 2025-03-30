import { Schema, model, Document, Types } from 'mongoose';

interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

interface ISocialProfiles {
  linkedin?: string;
  instagram?: string;
  x?: string;
  [key: string]: string | undefined;
}

interface ICategory {
  type: string;
  value: string;
}

interface IContactBase {
  userId: Types.ObjectId;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: IAddress;
  company?: string;
  title?: string;
  notes?: string;
  categories: ICategory[];
  category?: string;
  tags: string[];
  socialProfiles: Map<string, string>;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date;
}

export interface IContact extends Document, IContactBase {}

// Create a category type schema but don't make it a full schema
const categoryTypeSchema = {
  type: {
    type: String,
    required: true,
    trim: true,
  },
  value: {
    type: String,
    required: true,
    trim: true,
  },
  // Don't generate _id for category objects
  _id: false
};

// Define the category schema for more explicit handling
const contactCategorySchema = {
  type: [{
    type: {
      type: String,
      required: true,
      trim: true
    },
    value: {
      type: String,
      required: true,
      trim: true
    },
    _id: false
  }],
  default: [],
  _id: false
};

const contactSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
  },
  company: {
    type: String,
    trim: true,
  },
  title: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  // Simplify the categories schema for better array handling
  categories: contactCategorySchema,
  category: {
    type: String,
    trim: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  socialProfiles: {
    type: Map,
    of: String,
    default: new Map(),
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  // Ensure virtuals are included in JSON
  toJSON: { virtuals: true },
  // Ensure virtuals are included when converting to objects
  toObject: { virtuals: true },
});

// Add indexes
contactSchema.index({ userId: 1 });
contactSchema.index({ email: 1 });
contactSchema.index({ phone: 1 });
contactSchema.index({ 'categories.type': 1, 'categories.value': 1 });
contactSchema.index({ tags: 1 });

// Update lastSyncedAt on save
contactSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.lastSyncedAt = new Date();
  }
  next();
});

// Ensure categories array is set correctly
contactSchema.pre('save', function(next) {
  // If categories are empty but category exists, set categories based on category
  if ((!this.categories || this.categories.length === 0) && this.category) {
    // Create a properly formatted category object
    // Using explicit type assertion to avoid TypeScript errors
    this.categories = [{
      type: 'all',
      value: this.category,
      _id: undefined // Ensure no _id is generated
    }] as any;
  }
  next();
});

// Set category field based on first category in categories array
contactSchema.pre('save', function(next) {
  if (this.categories && this.categories.length > 0) {
    this.category = this.categories[0].value;
  }
  next();
});

// Also update category on findOneAndUpdate
contactSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() as any;
  
  // Log the update for debugging
  console.log('Pre-findOneAndUpdate hook called with update:', JSON.stringify(update, null, 2));
  
  // If categories is being updated and it has items, update the category field
  if (update?.$set?.categories?.length > 0) {
    if (!update.$set) update.$set = {};
    
    // Set category from first category
    update.$set.category = update.$set.categories[0].value;
    
    // Log the modified update
    console.log('Modified update with category:', JSON.stringify(update, null, 2));
  }
  
  next();
});

// Add a post-findOneAndUpdate hook to log the updated document
contactSchema.post('findOneAndUpdate', function(doc) {
  if (doc) {
    console.log('Post-findOneAndUpdate: Updated document categories:', 
      JSON.stringify(doc.categories || [], null, 2));
  }
});

export const Contact = model<IContact>('Contact', contactSchema); 