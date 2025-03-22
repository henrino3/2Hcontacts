import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();

// Register new user
router.post('/register', AuthController.register);

// Login user
router.post('/login', AuthController.login);

// Get current user
router.get('/me', AuthController.getCurrentUser);

export default router; 