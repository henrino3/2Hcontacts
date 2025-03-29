import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Define global variables to be used across all tests
interface Global {
  mongoServer?: MongoMemoryServer;
  mongoUri?: string;
}

// Create a global object to store MongoDB connection information
export const testGlobals: Global = {};

export async function setupGlobalMongoose(): Promise<void> {
  // Create MongoDB Memory Server if it doesn't exist
  if (!testGlobals.mongoServer) {
    testGlobals.mongoServer = await MongoMemoryServer.create();
    testGlobals.mongoUri = testGlobals.mongoServer.getUri();

    // Configure mongoose to use this connection for all tests
    mongoose.set('strictQuery', true);
    await mongoose.connect(testGlobals.mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }
}

export async function teardownGlobalMongoose(): Promise<void> {
  // Only disconnect and stop if we have an active connection
  if (testGlobals.mongoServer) {
    await mongoose.disconnect();
    await testGlobals.mongoServer.stop();
    testGlobals.mongoServer = undefined;
    testGlobals.mongoUri = undefined;
  }
}

export async function clearDatabase(): Promise<void> {
  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
} 