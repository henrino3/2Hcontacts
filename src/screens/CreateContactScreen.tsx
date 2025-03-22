import React, { useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type CreateContactForm = {
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  email: string;
  phone: string;
};

export function CreateContactScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [form, setForm] = useState<CreateContactForm>({
    firstName: '',
    lastName: '',
    company: '',
    title: '',
    email: '',
    phone: '',
  });

  const handleSave = () => {
    // TODO: Implement contact creation
    navigation.goBack();
  };

  const updateForm = (field: keyof CreateContactForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text variant="h2" weight="bold">New Contact</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText} weight="semibold">Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person-add" size={32} color="#007AFF" />
          </View>
          <TouchableOpacity style={styles.addPhotoButton}>
            <Text style={styles.addPhotoText}>Add Photo</Text>
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
}); 