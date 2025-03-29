import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking, TouchableOpacity } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button } from '../components/ui';
import { Card } from '../components/ui/Card';
import { socialMediaApi } from '../services/api/socialMediaApi';
import { platformSDKService } from '../services/platformSDK';
import { useAuth } from '../hooks/useAuth';
import { SocialMediaConnection } from '../types';
import { Ionicons } from '@expo/vector-icons';

type Platform = 'facebook' | 'google' | 'twitter' | 'linkedin' | 'instagram';
type ButtonVariant = 'primary' | 'outline' | 'secondary';

export function SocialMediaScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: connections, isLoading } = useQuery({
    queryKey: ['socialMediaConnections'],
    queryFn: () => socialMediaApi.getConnections(),
    enabled: !!user
  });

  const disconnectMutation = useMutation({
    mutationFn: (platform: Platform) => socialMediaApi.disconnectPlatform(platform),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialMediaConnections'] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', 'Failed to disconnect platform');
      console.error('Disconnect error:', error);
    }
  });

  const handleConnect = async (platform: Platform) => {
    try {
      setIsConnecting(true);
      
      let authResult;
      switch (platform) {
        case 'facebook':
          authResult = await platformSDKService.authenticateWithFacebook();
          break;
        case 'google':
          authResult = await platformSDKService.authenticateWithGoogle();
          break;
        default:
          // For other platforms, use the existing OAuth flow
          const { authUrl } = await socialMediaApi.getAuthUrl(platform);
          await Linking.openURL(authUrl);
          return;
      }

      if (authResult.type === 'success' && authResult.accessToken) {
        // Handle successful SDK authentication
        await socialMediaApi.handleSDKAuth(platform, authResult.accessToken);
        queryClient.invalidateQueries({ queryKey: ['socialMediaConnections'] });
        Alert.alert('Success', 'Platform connected successfully');
      } else if (authResult.type === 'error') {
        Alert.alert('Error', authResult.error || 'Failed to connect platform');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate connection');
      console.error('Connect error:', error);
    } finally {
      setIsConnecting(false);
      await platformSDKService.cleanupWebBrowser();
    }
  };

  const handleDisconnect = (platform: Platform) => {
    Alert.alert(
      'Disconnect Platform',
      'Are you sure you want to disconnect this platform?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => disconnectMutation.mutate(platform)
        }
      ]
    );
  };

  useEffect(() => {
    // Handle deep linking for OAuth callback
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url.includes('/auth/callback')) {
        // Extract platform and code from URL
        const params = new URLSearchParams(url.split('?')[1]);
        const platform = url.split('/').slice(-2)[0] as Platform;
        const code = params.get('code');
        const state = params.get('state');

        if (code && state) {
          socialMediaApi.handleCallback(platform, code, state)
            .then(() => {
              queryClient.invalidateQueries({ queryKey: ['socialMediaConnections'] });
              Alert.alert('Success', 'Platform connected successfully');
            })
            .catch((error: Error) => {
              Alert.alert('Error', 'Failed to complete connection');
              console.error('Callback error:', error);
            });
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [queryClient]);

  const renderPlatformCard = (platform: Platform, isConnected: boolean) => {
    const iconName = platform === 'twitter' ? 'logo-twitter' :
                    platform === 'linkedin' ? 'logo-linkedin' :
                    'logo-instagram';

    const displayName = platform === 'twitter' ? 'X Corp' :
                       platform.charAt(0).toUpperCase() + platform.slice(1);

    return (
      <Card key={platform} style={styles.platformCard}>
        <View style={styles.platformContent}>
          <View style={styles.platformInfo}>
            <Ionicons name={iconName} size={24} color="#666" />
            <Text style={styles.platformName} weight="semibold">
              {displayName}
            </Text>
          </View>
          <Button
            variant={isConnected ? "outline" : "primary"}
            onPress={() => isConnected ? handleDisconnect(platform) : handleConnect(platform)}
            loading={isConnecting}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </Button>
        </View>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  const connectedPlatforms = new Set(connections?.map((conn: SocialMediaConnection) => conn.platform));

  // Define visible platforms in desired order
  const visiblePlatforms: Platform[] = ['linkedin', 'instagram', 'twitter'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text variant="h1" weight="bold" style={styles.title}>
          Connected Platforms
        </Text>
        <View style={styles.platformsGrid}>
          {visiblePlatforms.map(platform => 
            renderPlatformCard(platform, connectedPlatforms.has(platform))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
  },
  platformsGrid: {
    gap: 16,
  },
  platformCard: {
    padding: 16,
  },
  platformContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  platformName: {
    fontSize: 16,
  },
}); 