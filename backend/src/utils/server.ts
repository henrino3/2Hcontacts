import express, { Express } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import contactRoutes from '../routes/contact.routes';

export async function createServer(): Promise<Express> {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/api/contacts', contactRoutes);

  // Connect to test database
  if (!process.env.MONGODB_URI) {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/hcontacts_test';
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  return app;
} 