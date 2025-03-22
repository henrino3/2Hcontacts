import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { Text } from '../components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { dummyContacts, Contact } from '../services/api/dummyData';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ContactsStackParamList = {
  CreateContact: undefined;
};

export function ContactsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ContactsStackParamList>>();
  const [contacts] = useState<Contact[]>(dummyContacts);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    
    const searchTerms = searchQuery.toLowerCase().trim().split(' ');
    return contacts.filter(contact => {
      const searchableText = `${contact.firstName} ${contact.lastName} ${contact.company} ${contact.title}`.toLowerCase();
      return searchTerms.every(term => searchableText.includes(term));
    });
  }, [contacts, searchQuery]);

  const handleAddContact = () => {
    navigation.navigate('CreateContact');
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity style={styles.contactItem}>
      <View style={styles.contactInfo}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {item.firstName[0]}{item.lastName[0]}
          </Text>
        </View>
        <View style={styles.contactDetails}>
          <Text weight="semibold" style={styles.contactName}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.contactSubtitle}>{item.title} at {item.company}</Text>
        </View>
      </View>
      {item.isFavorite && (
        <Ionicons name="star" size={20} color="#007AFF" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="h2" weight="bold">Contacts</Text>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => setIsSearchVisible(!isSearchVisible)}
          >
            <Ionicons 
              name={isSearchVisible ? "close-outline" : "search-outline"} 
              size={24} 
              color="#007AFF" 
            />
          </TouchableOpacity>
        </View>

        {isSearchVisible && (
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search contacts..."
              placeholderTextColor="#666"
              autoFocus
            />
          </View>
        )}

        <View style={styles.scrollContent}>
          {filteredContacts.length > 0 ? (
            <FlatList
              data={filteredContacts}
              renderItem={renderContact}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              style={styles.list}
            />
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="people" size={48} color="#007AFF" />
              </View>
              <Text style={styles.emptyStateTitle} weight="semibold">
                {searchQuery ? 'No Results Found' : 'No Contacts Yet'}
              </Text>
              <Text style={styles.emptyStateText}>
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Add your first contact by tapping the + button below'}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.fab} onPress={handleAddContact}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
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
  searchButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#F8F8F8',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#000',
  },
  scrollContent: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingRight: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}); 