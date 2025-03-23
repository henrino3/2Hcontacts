import React, { useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text } from '../components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Contact, useContactStore } from '../services/api/dummyData';

type EditContactRouteProp = RouteProp<{
  params: {
    contact: Contact;
  };
}, 'params'>;

type EditContactForm = {
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  socialProfiles: {
    linkedin: string;
    instagram: string;
    x: string;
  };
};

export function EditContactScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<EditContactRouteProp>();
  const { contact } = route.params;
  const updateContact = useContactStore((state) => state.updateContact);

  const [form, setForm] = useState<EditContactForm>({
    firstName: contact.firstName,
    lastName: contact.lastName,
    company: contact.company,
    title: contact.title,
    email: contact.email,
    phone: contact.phone,
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

    // Update the contact with the new form data while preserving other fields
    updateContact({
      ...contact,
      ...form,
    });

    navigation.goBack();
  };

  const updateForm = (field: keyof EditContactForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const updateSocialProfile = (platform: keyof EditContactForm['socialProfiles'], value: string) => {
    setForm(prev => ({
      ...prev,
      socialProfiles: {
        ...prev.socialProfiles,
        [platform]: value,
      },
    }));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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
              onChangeText={(value) => updateSocialProfile('linkedin', value)}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder="Instagram Profile"
              value={form.socialProfiles.instagram}
              onChangeText={(value) => updateSocialProfile('instagram', value)}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder="X (Twitter) Profile"
              value={form.socialProfiles.x}
              onChangeText={(value) => updateSocialProfile('x', value)}
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