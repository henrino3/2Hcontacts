import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text } from '../components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Contact } from '../types';
import { contactApi } from '../services/api/contactApi';
import { useContactStore } from '../services/api/dummyData';

type RootStackParamList = {
  ContactDetail: {
    contact: Contact;
  };
};

type ContactDetailRouteProp = RouteProp<RootStackParamList, 'ContactDetail'>;

export function ContactDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<ContactDetailRouteProp>();
  const { contact } = route.params;
  const deleteContactFromStore = useContactStore((state) => state.deleteContact);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleEdit = () => {
    navigation.navigate('EditContact', { contact });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              // Use _id if available, fallback to id
              const contactId = (contact as any)._id || contact.id;
              await contactApi.deleteContact(contactId);
              deleteContactFromStore(contact.id);
              navigation.goBack();
            } catch (error) {
              console.error('Delete contact error:', error);
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to delete contact. Please try again.'
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
          <Text style={styles.backButtonText}>Contacts</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {contact.firstName[0]}{contact.lastName[0]}
            </Text>
          </View>
          <Text style={styles.name} weight="bold">
            {contact.firstName} {contact.lastName}
          </Text>
          {contact.title && contact.company && (
            <Text style={styles.subtitle}>
              {contact.title} at {contact.company}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Info</Text>
          {contact.phone && (
            <TouchableOpacity style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="call-outline" size={24} color="#007AFF" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{contact.phone}</Text>
              </View>
            </TouchableOpacity>
          )}
          {contact.email && (
            <TouchableOpacity style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="mail-outline" size={24} color="#007AFF" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{contact.email}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {contact.socialProfiles && Object.keys(contact.socialProfiles).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social Profiles</Text>
            {contact.socialProfiles.linkedin && (
              <TouchableOpacity style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons name="logo-linkedin" size={24} color="#0077B5" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>LinkedIn</Text>
                  <Text style={styles.infoValue}>{contact.socialProfiles.linkedin}</Text>
                </View>
              </TouchableOpacity>
            )}
            {contact.socialProfiles.x && (
              <TouchableOpacity style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>X</Text>
                  <Text style={styles.infoValue}>{contact.socialProfiles.x}</Text>
                </View>
              </TouchableOpacity>
            )}
            {contact.socialProfiles.instagram && (
              <TouchableOpacity style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons name="logo-instagram" size={24} color="#E4405F" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Instagram</Text>
                  <Text style={styles.infoValue}>{contact.socialProfiles.instagram}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity 
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          <Text style={styles.deleteButtonText}>
            {isDeleting ? 'Deleting...' : 'Delete Contact'}
          </Text>
        </TouchableOpacity>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 17,
    color: '#007AFF',
    marginLeft: 4,
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 17,
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    color: '#007AFF',
  },
  name: {
    fontSize: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 17,
    color: '#666',
  },
  section: {
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  infoIcon: {
    width: 32,
    alignItems: 'center',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 17,
  },
  deleteButton: {
    marginTop: 32,
    marginBottom: 32,
    marginHorizontal: 16,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#C6C6C8',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 17,
    fontWeight: '400',
  },
}); 