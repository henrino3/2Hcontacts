import { Router } from 'express';
import { register, login, me } from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authenticate, me);

export default router; 