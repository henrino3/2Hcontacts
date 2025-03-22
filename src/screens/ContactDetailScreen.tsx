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
  const [isEditing, setIsEditing] = useState(false);

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
        </TouchableOpacity>
        <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
          <Text style={styles.editButtonText} weight="semibold">Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {contact.firstName[0]}{contact.lastName[0]}
            </Text>
          </View>
          <Text style={styles.name} weight="bold">
            {contact.firstName} {contact.lastName}
          </Text>
          <Text style={styles.title}>
            {contact.title} at {contact.company}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} weight="semibold">Contact Info</Text>
          
          <TouchableOpacity style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="mail-outline" size={20} color="#666" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{contact.email}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="call-outline" size={20} color="#666" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{contact.phone}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="business-outline" size={20} color="#666" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Company</Text>
              <Text style={styles.infoValue}>{contact.company}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="briefcase-outline" size={20} color="#666" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Job Title</Text>
              <Text style={styles.infoValue}>{contact.title}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {contact.socialProfiles && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle} weight="semibold">Social Profiles</Text>
            {contact.socialProfiles.linkedin && (
              <TouchableOpacity style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons name="logo-linkedin" size={20} color="#0077B5" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>LinkedIn</Text>
                  <Text style={styles.infoValue}>{contact.socialProfiles.linkedin}</Text>
                </View>
              </TouchableOpacity>
            )}
            {contact.socialProfiles.twitter && (
              <TouchableOpacity style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Twitter</Text>
                  <Text style={styles.infoValue}>{contact.socialProfiles.twitter}</Text>
                </View>
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
    padding: 8,
    marginLeft: -8,
  },
  editButton: {
    padding: 8,
    marginRight: -8,
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#007AFF',
  },
  name: {
    fontSize: 24,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 14,
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
  },
  deleteButton: {
    marginTop: 24,
    marginBottom: 32,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#FFF1F0',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
}); 