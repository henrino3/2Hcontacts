import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Facebook from 'expo-facebook';
import * as Google from 'expo-auth-session/providers/google';
import { ResponseType } from 'expo-auth-session';
import Constants from 'expo-constants';

// Platform SDK configurations
const SDK_CONFIG = {
  facebook: {
    appId: Constants.expoConfig?.extra?.facebookAppId || '',
    appName: '2HContacts',
  },
  google: {
    clientId: Constants.expoConfig?.extra?.googleClientId || '',
    iosClientId: Constants.expoConfig?.extra?.googleIosClientId || '',
    androidClientId: Constants.expoConfig?.extra?.googleAndroidClientId || '',
  },
};

export interface PlatformAuthResult {
  type: 'success' | 'error' | 'cancel';
  accessToken?: string;
  error?: string;
}

class PlatformSDKService {
  private initialized: { [key: string]: boolean } = {};

  // Initialize Facebook SDK
  private async initializeFacebook(): Promise<void> {
    if (this.initialized.facebook) return;

    try {
      await Facebook.initializeAsync({
        appId: SDK_CONFIG.facebook.appId,
      });
      this.initialized.facebook = true;
    } catch (error) {
      console.error('Failed to initialize Facebook SDK:', error);
      throw error;
    }
  }

  // Facebook Authentication
  async authenticateWithFacebook(): Promise<PlatformAuthResult> {
    try {
      await this.initializeFacebook();

      const result = await Facebook.logInWithReadPermissionsAsync({
        permissions: ['public_profile', 'email'],
      });

      if (result.type === 'success') {
        return {
          type: 'success',
          accessToken: result.token,
        };
      } else {
        return {
          type: result.type === 'cancel' ? 'cancel' : 'error',
          error: 'Facebook authentication failed',
        };
      }
    } catch (error) {
      console.error('Facebook authentication error:', error);
      return {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Google Authentication
  async authenticateWithGoogle(): Promise<PlatformAuthResult> {
    try {
      const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: Platform.select({
          ios: SDK_CONFIG.google.iosClientId,
          android: SDK_CONFIG.google.androidClientId,
          default: SDK_CONFIG.google.clientId,
        }),
        responseType: ResponseType.Token,
        scopes: ['profile', 'email'],
      });

      const result = await promptAsync();

      if (result.type === 'success') {
        return {
          type: 'success',
          accessToken: result.authentication?.accessToken,
        };
      } else {
        return {
          type: result.type === 'cancel' ? 'cancel' : 'error',
          error: 'Google authentication failed',
        };
      }
    } catch (error) {
      console.error('Google authentication error:', error);
      return {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Helper method to handle web browser cleanup
  async cleanupWebBrowser(): Promise<void> {
    await WebBrowser.coolDownAsync();
  }
}

export const platformSDKService = new PlatformSDKService(); 