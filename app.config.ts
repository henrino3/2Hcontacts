import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: '2HContacts',
  slug: '2hcontacts',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    backgroundColor: '#FFFFFF'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.2hcontacts',
    config: {
      usesNonExemptEncryption: false
    },
    newArchEnabled: false
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.2hcontacts',
    newArchEnabled: false
  },
  web: {
    favicon: './assets/favicon.png'
  },
  scheme: '2hcontacts',
  extra: {
    // Social Platform SDK Configurations
    facebookAppId: process.env.FACEBOOK_APP_ID || '',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID || '',
    googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID || '',
    eas: {
      projectId: process.env.EAS_PROJECT_ID || ''
    }
  }
};

export default config; 