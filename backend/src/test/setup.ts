import { setupGlobalMongoose, teardownGlobalMongoose, clearDatabase } from './globals';

// Suppress Mongoose warnings in test environment
process.env.SUPPRESS_JEST_WARNINGS = 'true';

beforeAll(async () => {
  await setupGlobalMongoose();
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await teardownGlobalMongoose();
});