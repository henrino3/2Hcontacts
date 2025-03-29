import React, { useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Pressable } from 'react-native';
import { Text } from '../components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useContactStore } from '../services/api/dummyData';

type CreateContactForm = {
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

type ErrorModal = {
  visible: boolean;
  title: string;
  message: string;
};

const initialForm: CreateContactForm = {
  firstName: '',
  lastName: '',
  company: '',
  title: '',
  email: '',
  phone: '',
  socialProfiles: {
    linkedin: '',
    instagram: '',
    x: '',
  },
};

export function CreateContactScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [form, setForm] = useState<CreateContactForm>(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<ErrorModal>({
    visible: false,
    title: '',
    message: '',
  });
  const createContact = useContactStore((state) => state.createContact);

  const showError = (title: string, message: string) => {
    setErrorModal({
      visible: true,
      title,
      message,
    });
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!form.firstName.trim()) {
      errors.push('First name is required');
    }
    if (!form.lastName.trim()) {
      errors.push('Last name is required');
    }
    if (form.email.trim() && !form.email.includes('@')) {
      errors.push('Please enter a valid email address');
    }

    // Validate social profile URLs if provided
    const urlPattern = /^https?:\/\/.+/;
    if (form.socialProfiles.linkedin && !urlPattern.test(form.socialProfiles.linkedin)) {
      errors.push('LinkedIn profile must be a valid URL starting with http:// or https://');
    }
    if (form.socialProfiles.instagram && !urlPattern.test(form.socialProfiles.instagram)) {
      errors.push('Instagram profile must be a valid URL starting with http:// or https://');
    }
    if (form.socialProfiles.x && !urlPattern.test(form.socialProfiles.x)) {
      errors.push('X (Twitter) profile must be a valid URL starting with http:// or https://');
    }

    if (errors.length > 0) {
      showError('Please Fix the Following', errors.join('\n• '));
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      // Only include social profiles if they are not empty and valid URLs
      const socialProfiles: Record<string, string> = {};
      if (form.socialProfiles.linkedin) socialProfiles.linkedin = form.socialProfiles.linkedin;
      if (form.socialProfiles.instagram) socialProfiles.instagram = form.socialProfiles.instagram;
      if (form.socialProfiles.x) socialProfiles.x = form.socialProfiles.x;

      const contactData = {
        ...form,
        socialProfiles: Object.keys(socialProfiles).length > 0 ? socialProfiles : undefined,
        // Only include optional fields if they are not empty
        company: form.company.trim() || undefined,
        title: form.title.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
      };

      await createContact(contactData);
      navigation.goBack();
    } catch (error) {
      console.error('Error creating contact:', error);
      showError(
        'Unable to Create Contact',
        'There was a problem creating your contact. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text>Cancel</Text>
        </TouchableOpacity>
        <Text weight="bold" style={styles.title}>New Contact</Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" />
          ) : (
            <Text weight="semibold" style={styles.saveButton}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form}>
        <View style={styles.section}>
          <Text weight="semibold" style={styles.sectionTitle}>Basic Info</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, !form.firstName.trim() && styles.requiredField]}
              placeholder="First Name *"
              value={form.firstName}
              onChangeText={(text) => setForm({ ...form, firstName: text })}
            />
            <TextInput
              style={[styles.input, !form.lastName.trim() && styles.requiredField]}
              placeholder="Last Name *"
              value={form.lastName}
              onChangeText={(text) => setForm({ ...form, lastName: text })}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text weight="semibold" style={styles.sectionTitle}>Work</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Company"
              value={form.company}
              onChangeText={(text) => setForm({ ...form, company: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={form.title}
              onChangeText={(text) => setForm({ ...form, title: text })}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text weight="semibold" style={styles.sectionTitle}>Contact</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, form.email && !form.email.includes('@') && styles.errorField]}
              placeholder="Email"
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Phone"
              value={form.phone}
              onChangeText={(text) => setForm({ ...form, phone: text })}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text weight="semibold" style={styles.sectionTitle}>Social Profiles</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="LinkedIn URL (https://...)"
              value={form.socialProfiles.linkedin}
              onChangeText={(text) => setForm({
                ...form,
                socialProfiles: { ...form.socialProfiles, linkedin: text }
              })}
              keyboardType="url"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Instagram URL (https://...)"
              value={form.socialProfiles.instagram}
              onChangeText={(text) => setForm({
                ...form,
                socialProfiles: { ...form.socialProfiles, instagram: text }
              })}
              keyboardType="url"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="X URL (https://...)"
              value={form.socialProfiles.x}
              onChangeText={(text) => setForm({
                ...form,
                socialProfiles: { ...form.socialProfiles, x: text }
              })}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModal.visible}
        onRequestClose={() => setErrorModal({ ...errorModal, visible: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text weight="bold" style={styles.modalTitle}>{errorModal.title}</Text>
            <Text style={styles.modalMessage}>• {errorModal.message}</Text>
            <Pressable
              style={styles.modalButton}
              onPress={() => setErrorModal({ ...errorModal, visible: false })}
            >
              <Text weight="semibold" style={styles.modalButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
  },
  saveButton: {
    color: '#007AFF',
  },
  form: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  inputGroup: {
    gap: 12,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  requiredField: {
    borderColor: '#ff9500',
  },
  errorField: {
    borderColor: '#ff3b30',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
}); 