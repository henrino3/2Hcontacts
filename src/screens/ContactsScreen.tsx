import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal, Pressable, Alert } from 'react-native';
import { Text } from '../components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useContactStore } from '../services/api/dummyData';
import { Contact } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ErrorModal = {
  visible: boolean;
  title: string;
  message: string;
};

export function ContactsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { contacts, isLoading, error, fetchContacts, deleteContact } = useContactStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [errorModal, setErrorModal] = useState<ErrorModal>({
    visible: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    async function checkAuthAndFetch() {
      try {
        const token = await AsyncStorage.getItem('authToken');
        console.log('Auth token:', token ? 'Present' : 'Missing');
        
        if (token) {
          console.log('Fetching contacts...');
          await fetchContacts();
        } else {
          console.log('No auth token found');
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Error in checkAuthAndFetch:', error);
      }
    }

    checkAuthAndFetch();
  }, [fetchContacts, navigation]);

  useEffect(() => {
    console.log('Contacts state:', {
      isLoading,
      error,
      contactsCount: contacts?.length ?? null,
    });
  }, [contacts, isLoading, error]);

  const filteredContacts = contacts?.filter((contact: Contact) => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || 
           (contact.email && contact.email.toLowerCase().includes(query)) ||
           (contact.company && contact.company.toLowerCase().includes(query));
  }) || [];

  const handleAddContact = () => {
    navigation.navigate('CreateContact');
  };

  const handleDeleteContact = async (contact: Contact) => {
    try {
      // Show confirmation dialog
      Alert.alert(
        'Delete Contact',
        `Are you sure you want to delete ${contact.firstName} ${contact.lastName}?`,
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
                // Use either _id or id for deletion
                const contactId = contact._id || contact.id;
                await deleteContact(contactId);
                // Refresh contacts list
                await fetchContacts();
              } catch (error) {
                Alert.alert(
                  'Error',
                  'Unable to delete contact. Please try again.'
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Unable to delete contact. Please try again.'
      );
    }
  };

  const handleFilter = () => {
    // TODO: Implement filter functionality
    console.log('Filter pressed');
  };

  const renderContact = ({ item: contact }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => navigation.navigate('ContactDetail', { contact })}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>
          {contact.firstName[0]}{contact.lastName[0]}
        </Text>
      </View>
      <View style={styles.contactInfo}>
        <Text weight="semibold" style={styles.contactName}>
          {contact.firstName} {contact.lastName}
        </Text>
        {contact.title && contact.company && (
          <Text style={styles.contactDetails}>
            {contact.title} at {contact.company}
          </Text>
        )}
      </View>
      {contact.isFavorite && (
        <Ionicons name="star" size={20} color="#FFD700" style={styles.favoriteIcon} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {showSearch ? (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={() => setShowSearch(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text weight="bold" style={styles.title}>Contacts</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={() => setShowSearch(true)}>
                <Ionicons name="search" size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleFilter}>
                <Ionicons name="filter" size={22} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddContact} style={styles.addButton}>
                <Ionicons name="add" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchContacts} style={styles.retryButton}>
            <Text>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : contacts === null ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : filteredContacts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text>No contacts found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          renderItem={renderContact}
          keyExtractor={(contact) => contact.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModal.visible}
        onRequestClose={() => setErrorModal({ ...errorModal, visible: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text weight="bold" style={styles.modalTitle}>{errorModal.title}</Text>
            <Text style={styles.modalMessage}>{errorModal.message}</Text>
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
    fontSize: 24,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    marginBottom: 2,
  },
  contactDetails: {
    fontSize: 14,
    color: '#666',
  },
  favoriteIcon: {
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  addButton: {
    padding: 4,
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
    textAlign: 'center',
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