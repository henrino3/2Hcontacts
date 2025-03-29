import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useContactStore } from '../services/api/dummyData';

export function SocialScreen() {
  const contacts = useContactStore((state) => state.contacts);
  const socialContacts = contacts.filter(contact => contact.socialProfiles);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="h1" weight="bold" style={styles.title}>
          Social
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {socialContacts.length > 0 ? (
          socialContacts.map(contact => (
            <View key={contact.id} style={styles.contactCard}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {contact.firstName[0]}{contact.lastName[0]}
                </Text>
              </View>
              <View style={styles.contactInfo}>
                <Text weight="semibold" style={styles.contactName}>
                  {contact.firstName} {contact.lastName}
                </Text>
                <View style={styles.socialLinks}>
                  {contact.socialProfiles?.linkedin && (
                    <TouchableOpacity style={styles.socialButton}>
                      <Ionicons name="logo-linkedin" size={20} color="#0077B5" />
                      <Text style={styles.socialButtonText}>LinkedIn</Text>
                    </TouchableOpacity>
                  )}
                  {contact.socialProfiles?.twitter && (
                    <TouchableOpacity style={styles.socialButton}>
                      <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
                      <Text style={styles.socialButtonText}>Twitter</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#666" />
            <Text style={styles.emptyStateText}>
              No contacts with social profiles yet
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  title: {
    fontSize: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  contactCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    marginBottom: 8,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 8,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  socialButtonText: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
  },
}); 