import { Request, Response } from 'express';
import { socialMediaService } from '../services/SocialMediaService';
import { SupportedPlatform } from '../types/social-media';

export class SocialMediaController {
  async initiateAuth(req: Request, res: Response) {
    try {
      const { platform } = req.params;
      const state = Math.random().toString(36).substring(7);

      const authUrl = await socialMediaService.getAuthUrl(platform as SupportedPlatform, state);

      // Store state in session for validation during callback
      req.session.oauthState = state;

      res.json({ authUrl });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async handleCallback(req: Request, res: Response) {
    try {
      const { platform } = req.params;
      const { code, state } = req.query;

      // Validate state to prevent CSRF
      if (!state || state !== req.session.oauthState) {
        return res.status(400).json({ error: 'Invalid state parameter' });
      }

      // Clear state from session
      delete req.session.oauthState;

      const { access_token } = await socialMediaService.handleCallback(platform as SupportedPlatform, code as string);

      // Store the access token securely (e.g., in the database)
      await socialMediaService.connectSocialMedia(platform as SupportedPlatform, req.user?._id.toString() || '', access_token);

      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async connect(req: Request, res: Response) {
    try {
      const { platform } = req.params;
      const { accessToken } = req.body;
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const connection = await socialMediaService.connectSocialMedia(
        userId.toString(),
        platform,
        accessToken
      );

      res.json(connection);
    } catch (error) {
      res.status(500).json({ error: 'Failed to connect social media account' });
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
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      await socialMediaService.disconnectPlatform(userId.toString(), platform);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to disconnect platform' });
    }
  }
}

export const socialMediaController = new SocialMediaController(); 