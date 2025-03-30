import React, { useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text } from '../components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useContactStore } from '../services/api/dummyData';
import { Contact } from '../types';
import { CategoryMultiSelect } from '../components/CategoryMultiSelect';

type EditContactRouteProp = RouteProp<{
  params: {
    contact: Contact;
  };
}, 'params'>;

interface Category {
  type: string;
  value: string;
}

interface EditContactForm {
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  categories: Category[];
  socialProfiles: {
    linkedin: string;
    instagram: string;
    x: string;
  };
}

type FormField = keyof EditContactForm | `socialProfiles.${keyof EditContactForm['socialProfiles']}`;

export function EditContactScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<EditContactRouteProp>();
  const { contact } = route.params;
  const updateContact = useContactStore((state) => state.updateContact);

  const [form, setForm] = useState<EditContactForm>({
    firstName: contact.firstName,
    lastName: contact.lastName,
    company: contact.company || '',
    title: contact.title || '',
    email: contact.email || '',
    phone: contact.phone || '',
    categories: contact.categories || [],
    socialProfiles: {
      linkedin: contact.socialProfiles?.linkedin || '',
      instagram: contact.socialProfiles?.instagram || '',
      x: contact.socialProfiles?.x || '',
    },
  });

  const handleSave = () => {
    if (!form.firstName || !form.lastName) {
      Alert.alert('Error', 'First name and last name are required');
      return;
    }

    if (!contact.id) {
      Alert.alert('Error', 'Contact ID is missing');
      return;
    }

    // Convert social profiles to proper format
    const socialProfiles: Record<string, string> = {};
    if (form.socialProfiles.linkedin) socialProfiles.linkedin = form.socialProfiles.linkedin;
    if (form.socialProfiles.instagram) socialProfiles.instagram = form.socialProfiles.instagram;
    if (form.socialProfiles.x) socialProfiles.x = form.socialProfiles.x;

    // Prepare the update data
    const updateData = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      company: form.company.trim() || undefined,
      title: form.title.trim() || undefined,
      categories: form.categories || [],
      // Set category for backward compatibility with API
      category: form.categories?.[0]?.value || '',
      socialProfiles: Object.keys(socialProfiles).length > 0 ? socialProfiles : undefined,
      // Keep these fields from the original contact
      id: contact.id,
      _id: contact._id,
      userId: contact.userId,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
      lastSyncedAt: contact.lastSyncedAt,
      isFavorite: contact.isFavorite,
      notes: contact.notes || '',
      tags: contact.tags || [],
      address: contact.address || {},
    };

    // Update the contact
    updateContact(contact.id, updateData).then((response) => {
      console.log('Response from API:', JSON.stringify(response));
      
      // Make sure the updated contact has the correct categories
      const updatedContact = {
        ...response,
        // Use the API response categories if available, otherwise use form categories
        categories: response.categories || form.categories
      };
      
      console.log('Updated contact with categories:', JSON.stringify(updatedContact.categories));
      
      // Use navigation.navigate to previous screen with updated contact
      navigation.navigate({
        name: 'ContactDetail',
        params: {
          contact: updatedContact,
          refreshTimestamp: Date.now()
        },
        merge: true
      });
    }).catch((error: Error) => {
      Alert.alert('Error', error.message || 'Failed to update contact');
    });
  };

  const updateForm = (field: FormField, value: string) => {
    if (field.startsWith('socialProfiles.')) {
      const socialField = field.split('.')[1] as keyof typeof form.socialProfiles;
      setForm(prev => ({
        ...prev,
        socialProfiles: {
          ...prev.socialProfiles,
          [socialField]: value
        }
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          // Simply go back to previous screen with original contact
          navigation.goBack();
        }} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text variant="h2" weight="bold">Edit Contact</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText} weight="semibold">Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {form.firstName[0]}{form.lastName[0]}
            </Text>
          </View>
          <TouchableOpacity style={styles.addPhotoButton}>
            <Text style={styles.addPhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              value={form.firstName}
              onChangeText={(value) => updateForm('firstName', value)}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              value={form.lastName}
              onChangeText={(value) => updateForm('lastName', value)}
              autoCapitalize="words"
            />
          </View>

          <CategoryMultiSelect
            categories={form.categories}
            onChange={(categories) => setForm(prev => ({ ...prev, categories }))}
          />

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Company"
              value={form.company}
              onChangeText={(value) => updateForm('company', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Job Title"
              value={form.title}
              onChangeText={(value) => updateForm('title', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={form.email}
              onChangeText={(value) => updateForm('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Phone"
              value={form.phone}
              onChangeText={(value) => updateForm('phone', value)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={[styles.section, styles.inputGroup]}>
            <Text style={styles.sectionTitle} weight="semibold">Social Profiles</Text>
            <TextInput
              style={styles.input}
              placeholder="LinkedIn Profile"
              value={form.socialProfiles.linkedin}
              onChangeText={(value) => updateForm('socialProfiles.linkedin', value)}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder="Instagram Profile"
              value={form.socialProfiles.instagram}
              onChangeText={(value) => updateForm('socialProfiles.instagram', value)}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder="X (Twitter) Profile"
              value={form.socialProfiles.x}
              onChangeText={(value) => updateForm('socialProfiles.x', value)}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
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
  saveButton: {
    padding: 8,
    marginRight: -8,
  },
  saveButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '600',
    color: '#007AFF',
  },
  addPhotoButton: {
    padding: 8,
  },
  addPhotoText: {
    color: '#007AFF',
    fontSize: 16,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 16,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
}); 