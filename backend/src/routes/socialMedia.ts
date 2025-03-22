import { Router } from 'express';
import { socialMediaController } from '../controllers/SocialMediaController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Protect all routes with JWT authentication
router.use(authenticateJWT);

// Initialize OAuth flow for a platform
router.get('/connect/:platform', socialMediaController.initiateAuth);

// Handle OAuth callback
router.get('/callback/:platform', socialMediaController.handleCallback);

// Get user's social media connections
router.get('/connections', socialMediaController.getConnections);

// Disconnect a platform
router.delete('/disconnect/:platform', socialMediaController.disconnectPlatform);

export default router; 