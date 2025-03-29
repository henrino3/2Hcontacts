import { Router } from 'express';
import { register, login, me } from '../controllers/auth';
import { authenticate } from '../middleware/auth';
import type { RequestHandler } from 'express';

const router = Router();

// Public routes
router.post('/register', register as unknown as RequestHandler);
router.post('/login', login as unknown as RequestHandler);

// Protected routes
router.get('/me', authenticate as unknown as RequestHandler, me as unknown as RequestHandler);

export default router; 