import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Text } from '../components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useContactStore } from '../services/api/dummyData';

export function ContactsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const contacts = useContactStore((state) => state.contacts);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filteredContacts = contacts.filter((contact) => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || 
           contact.email.toLowerCase().includes(query) ||
           contact.company.toLowerCase().includes(query);
  });

  const handleAddContact = () => {
    navigation.navigate('CreateContact');
  };

  const renderContact = ({ item: contact }) => (
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
        <Text style={styles.contactDetails}>
          {contact.title} at {contact.company}
        </Text>
      </View>
      {contact.isFavorite && (
        <Ionicons name="star" size={20} color="#FFD700" style={styles.favoriteIcon} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="h1" weight="bold" style={styles.title}>
          Contacts
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={() => setShowSearch(!showSearch)}
            style={styles.headerButton}
          >
            <Ionicons 
              name={showSearch ? "close-outline" : "search-outline"} 
              size={24} 
              color="#007AFF" 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAddContact} style={styles.headerButton}>
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>
      )}

      {filteredContacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {searchQuery ? 'No contacts found' : 'No contacts yet'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
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
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchInput: {
    height: 40,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  list: {
    padding: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
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
    marginBottom: 2,
  },
  contactDetails: {
    fontSize: 14,
    color: '#666',
  },
  favoriteIcon: {
    marginLeft: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
  },
}); 