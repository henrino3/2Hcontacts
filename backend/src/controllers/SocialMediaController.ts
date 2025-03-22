import { Request, Response } from 'express';
import { socialMediaService } from '../services/SocialMediaService';
import { generateRandomString } from '../utils/crypto';

export class SocialMediaController {
  async initiateAuth(req: Request, res: Response) {
    try {
      const { platform } = req.params;
      const userId = req.user.id;

      // Generate state parameter for CSRF protection
      const state = generateRandomString(32);
      req.session.oauthState = state;
      req.session.userId = userId;

      const authUrl = await socialMediaService.getAuthorizationUrl(platform, state);
      res.json({ authUrl });
    } catch (error) {
      console.error('Error initiating auth:', error);
      res.status(500).json({ error: 'Failed to initiate authentication' });
    }
  }

  async handleCallback(req: Request, res: Response) {
    try {
      const { platform } = req.params;
      const { code, state } = req.query;
      const storedState = req.session.oauthState;
      const userId = req.session.userId;

      if (!code || !state || !storedState || state !== storedState) {
        return res.status(400).json({ error: 'Invalid OAuth callback' });
      }

      const connection = await socialMediaService.handleOAuthCallback(
        platform,
        code as string,
        userId
      );

      // Clear OAuth state from session
      delete req.session.oauthState;
      delete req.session.userId;

      res.json({ success: true, connection });
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      res.status(500).json({ error: 'Failed to complete authentication' });
    }
  }

  async getConnections(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const connections = await socialMediaService.getConnections(userId);
      res.json(connections);
    } catch (error) {
      console.error('Error getting connections:', error);
      res.status(500).json({ error: 'Failed to get connections' });
    }
  }

  async disconnectPlatform(req: Request, res: Response) {
    try {
      const { platform } = req.params;
      const userId = req.user.id;

      await socialMediaService.disconnectPlatform(userId, platform);
      res.json({ success: true });
    } catch (error) {
      console.error('Error disconnecting platform:', error);
      res.status(500).json({ error: 'Failed to disconnect platform' });
    }
  }
}

export const socialMediaController = new SocialMediaController(); 