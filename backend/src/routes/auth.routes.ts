import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth';
import { register, login, me } from '../controllers/auth';

const router = Router();

// Register a new user
router.post('/register', ((req: Request, res: Response, next: NextFunction) => {
  register(req, res).catch(next);
}) as RequestHandler);

// Login user
router.post('/login', ((req: Request, res: Response, next: NextFunction) => {
  login(req, res).catch(next);
}) as RequestHandler);

// Get current user
router.get('/me', authenticate as RequestHandler, ((req: Request, res: Response, next: NextFunction) => {
  me(req, res).catch(next);
}) as RequestHandler);

export default router; 