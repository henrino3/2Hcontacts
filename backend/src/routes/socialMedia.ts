import { Router } from 'express';
import { socialMediaController } from '../controllers/SocialMediaController';
import { authenticate } from '../middleware/auth';
import type { RequestHandler } from 'express';

const router = Router();

// Protect all routes with JWT authentication
router.use(authenticate as RequestHandler);

// Initialize OAuth flow for a platform
router.get('/connect/:platform', socialMediaController.initiateAuth as RequestHandler);

// Handle OAuth callback
router.get('/callback/:platform', socialMediaController.handleCallback as RequestHandler);

// Get user's social media connections
router.get('/connections', socialMediaController.getConnections);

// Disconnect a platform
router.delete('/disconnect/:platform', socialMediaController.disconnectPlatform as RequestHandler);

// Connect a platform
router.post('/connect/:platform', authenticate as RequestHandler, socialMediaController.connect as RequestHandler);

export default router; 