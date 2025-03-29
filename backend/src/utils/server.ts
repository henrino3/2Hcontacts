import express, { Express } from 'express';
import cors from 'cors';
import contactRoutes from '../routes/contact.routes';
import authRoutes from '../routes/auth.routes';
import { setupGlobalMongoose } from '../test/globals';

export async function createServer(): Promise<Express> {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/contacts', contactRoutes);

  // Ensure the database is connected (using the global connection)
  await setupGlobalMongoose();

  return app;
} 