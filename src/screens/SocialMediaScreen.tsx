import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking, TouchableOpacity } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Card } from '../components/ui';
import { socialMediaApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { SocialMediaConnection } from '../types';
import { Ionicons } from '@expo/vector-icons';

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
    mutationFn: (platform: string) => socialMediaApi.disconnectPlatform(platform),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialMediaConnections'] });
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to disconnect platform');
      console.error('Disconnect error:', error);
    }
  });

  const handleConnect = async (platform: string) => {
    try {
      setIsConnecting(true);
      const { authUrl } = await socialMediaApi.getAuthUrl(platform);
      await Linking.openURL(authUrl);
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate connection');
      console.error('Connect error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = (platform: string) => {
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
        const platform = url.split('/').slice(-2)[0];
        const code = params.get('code');
        const state = params.get('state');

        if (code && state) {
          socialMediaApi.handleCallback(platform, code, state)
            .then(() => {
              queryClient.invalidateQueries({ queryKey: ['socialMediaConnections'] });
              Alert.alert('Success', 'Platform connected successfully');
            })
            .catch((error) => {
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="h2" weight="bold">Social Media</Text>
        </View>

        <View style={styles.scrollContent}>
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="share-social" size={48} color="#007AFF" />
            </View>
            <Text style={styles.emptyStateTitle} weight="semibold">Connect Your Accounts</Text>
            <Text style={styles.emptyStateText}>Link your social media accounts to import and sync your connections</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.connectButton, styles.linkedinButton]}>
              <Ionicons name="logo-linkedin" size={24} color="#fff" />
              <Text style={styles.connectButtonText}>Connect LinkedIn</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.connectButton, styles.twitterButton]}>
              <Ionicons name="logo-twitter" size={24} color="#fff" />
              <Text style={styles.connectButtonText}>Connect Twitter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  scrollContent: {
    flex: 1,
    paddingBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  linkedinButton: {
    backgroundColor: '#0077B5',
  },
  twitterButton: {
    backgroundColor: '#1DA1F2',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
}); 