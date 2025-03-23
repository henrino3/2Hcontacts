import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Text } from '../components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Contact } from '../services/api/dummyData';

type ContactDetailRouteProp = RouteProp<{
  params: {
    contact: Contact;
  };
}, 'params'>;

export function ContactDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<ContactDetailRouteProp>();
  const { contact } = route.params;

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
          onPress: () => {
            // TODO: Implement delete functionality
            navigation.goBack();
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

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {contact.firstName[0]}{contact.lastName[0]}
            </Text>
          </View>
          <Text style={styles.name} weight="semibold">
            {contact.firstName} {contact.lastName}
          </Text>
          {(contact.title || contact.company) && (
            <Text style={styles.subtitle}>
              {[contact.title, contact.company].filter(Boolean).join(' at ')}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="mail-outline" size={20} color="#007AFF" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoValue}>{contact.email}</Text>
              <Text style={styles.infoLabel}>Email</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="call-outline" size={20} color="#007AFF" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoValue}>{contact.phone}</Text>
              <Text style={styles.infoLabel}>Phone</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {contact.socialProfiles && Object.keys(contact.socialProfiles).length > 0 && (
          <View style={styles.section}>
            {contact.socialProfiles.linkedin && (
              <TouchableOpacity style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons name="logo-linkedin" size={20} color="#0077B5" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>{contact.socialProfiles.linkedin}</Text>
                  <Text style={styles.infoLabel}>LinkedIn</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            )}
            {contact.socialProfiles.instagram && (
              <TouchableOpacity style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons name="logo-instagram" size={20} color="#E4405F" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>{contact.socialProfiles.instagram}</Text>
                  <Text style={styles.infoLabel}>Instagram</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            )}
            {contact.socialProfiles.x && (
              <TouchableOpacity style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons name="logo-twitter" size={20} color="#000000" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>{contact.socialProfiles.x}</Text>
                  <Text style={styles.infoLabel}>X (Twitter)</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonText}>Delete Contact</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButtonText: {
    fontSize: 17,
    color: '#007AFF',
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 17,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#F2F2F7',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '600',
    color: '#007AFF',
  },
  name: {
    fontSize: 28,
    marginBottom: 4,
    color: '#000000',
  },
  subtitle: {
    fontSize: 17,
    color: '#666666',
  },
  section: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#C6C6C8',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 44,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  infoIcon: {
    width: 29,
    height: 29,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  infoValue: {
    fontSize: 17,
    color: '#000000',
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
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 17,
    fontWeight: '400',
  },
}); 