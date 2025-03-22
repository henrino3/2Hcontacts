import express, { Express } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import contactRoutes from '../routes/contact.routes';
import authRoutes from '../routes/auth.routes';

export async function createServer(): Promise<Express> {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/contacts', contactRoutes);

  // Connect to test database
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hcontacts_test';
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB test database');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }

  return app;
} 