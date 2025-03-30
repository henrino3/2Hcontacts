import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal, Pressable, Alert, useWindowDimensions, RefreshControl } from 'react-native';
import { Text } from '../components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useContactStore } from '../services/api/dummyData';
import { Contact } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CategoryPicker } from '../components/CategoryPicker';
import { DateRangePicker } from '../components/DateRangePicker';
import { format } from 'date-fns';
import { useThemeColor } from '../utils/theme';
import { useDeviceContacts } from '../hooks/useDeviceContacts';
import { CategoryMultiSelect } from '../components/CategoryMultiSelect';
import { useHeaderHeight } from '@react-navigation/elements';
import { useContactSync } from '../hooks/useContactSync';

type ErrorModal = {
  visible: boolean;
  title: string;
  message: string;
};

type FilterType = 'city' | 'country' | 'category';

interface Filters {
  city?: string;
  category?: string;
  categories?: Array<{
    type: string;
    value: string;
  }>;
  country?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

type SortField = 'createdAt' | 'firstName' | 'lastName' | 'company' | 'category';
type SortOrder = 'asc' | 'desc';

interface Sort {
  field: SortField;
  order: SortOrder;
}

export function ContactsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const headerHeight = useHeaderHeight();
  const { contacts, isLoading, error, fetchContacts } = useContactStore();
  const { importContacts, isImporting } = useDeviceContacts();
  const { isSyncing } = useContactSync();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({});
  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('city');
  const [errorModal, setErrorModal] = useState<ErrorModal>({
    visible: false,
    title: '',
    message: '',
  });
  const [sort, setSort] = useState<Sort>({ field: 'createdAt', order: 'desc' });
  const [showSortModal, setShowSortModal] = useState(false);
  const { colors } = useThemeColor();
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);

  const styles = makeStyles(colors);

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

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    if (!contacts) return;

    let filtered = [...contacts];

    // Apply date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(contact => {
        const createdAt = new Date(contact.createdAt);
        return (
          createdAt >= filters.dateRange!.start &&
          createdAt <= filters.dateRange!.end
        );
      });
    }

    // Apply city filter
    if (filters.city) {
      filtered = filtered.filter(contact => 
        contact.address?.city?.toLowerCase() === filters.city?.toLowerCase()
      );
    }

    // Apply country filter
    if (filters.country) {
      filtered = filtered.filter(contact => 
        contact.address?.country?.toLowerCase() === filters.country?.toLowerCase()
      );
    }

    // Apply category filter - support both legacy category and new categories array
    if (filters.category || (filters.categories && filters.categories.length > 0)) {
      filtered = filtered.filter(contact => {
        // If using new categories array
        if (filters.categories && filters.categories.length > 0) {
          // Check if any of the contact's categories match any of the filter categories
          return filters.categories.some(filterCategory => 
            contact.categories?.some(contactCategory => 
              contactCategory.value.toLowerCase() === filterCategory.value.toLowerCase()
            )
          );
        } 
        // If using legacy category field
        else if (filters.category) {
          return contact.category?.toLowerCase() === filters.category.toLowerCase();
        }
        return false;
      });
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(contact =>
        contact.firstName.toLowerCase().includes(query) ||
        contact.lastName.toLowerCase().includes(query) ||
        (contact.email && contact.email.toLowerCase().includes(query)) ||
        (contact.phone && contact.phone.toLowerCase().includes(query)) ||
        (contact.company && contact.company.toLowerCase().includes(query))
      );
    }

    setFilteredContacts(filtered);
  }, [contacts, filters, searchQuery]);

  const sortedContacts = [...(filteredContacts || [])].sort((a, b) => {
    const order = sort.order === 'desc' ? -1 : 1;
    
    switch (sort.field) {
      case 'createdAt':
        return order * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'firstName':
        return order * a.firstName.localeCompare(b.firstName);
      case 'lastName':
        return order * a.lastName.localeCompare(b.lastName);
      case 'company':
        return order * ((a.company || '').localeCompare(b.company || ''));
      case 'category':
        return order * ((a.category || '').localeCompare(b.category || ''));
      default:
        return 0;
    }
  });

  const groupedContacts = sortedContacts.reduce((groups, contact) => {
    const date = new Date(contact.createdAt);
    const key = format(date, 'MMM d, yyyy');
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(contact);
    return groups;
  }, {} as Record<string, Contact[]>);

  const handleFilter = (type: FilterType) => {
    setFilterType(type);
    setShowFilter(true);
  };

  const handleClearFilters = () => {
    setFilters({});
    setShowFilter(false);
  };

  const handleDateRangeSelect = (range: { start: Date; end: Date }) => {
    setFilters(prev => ({
      ...prev,
      dateRange: range
    }));
    setShowFilter(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.city) count++;
    if (filters.category) count++;
    if (filters.country) count++;
    if (filters.dateRange) count++;
    return count;
  };

  const getContactKey = (contact: Contact) => {
    if (contact._id) return contact._id;
    if (contact.id) return contact.id;
    return `${contact.firstName}-${contact.lastName}-${Date.now()}`;
  };

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilter}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilter(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text weight="bold" style={styles.modalTitle}>Filter Contacts</Text>
            <TouchableOpacity
              onPress={() => setShowFilter(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterTypeSelector}>
            <TouchableOpacity
              style={[
                styles.filterTypeButton,
                filterType === 'city' && styles.activeFilterTypeButton
              ]}
              onPress={() => {
                setFilterType('city');
                setFilters(prev => ({ city: prev.city }));
              }}
            >
              <Text style={[
                styles.filterTypeText,
                filterType === 'city' && styles.activeFilterTypeText
              ]}>By City</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterTypeButton,
                filterType === 'country' && styles.activeFilterTypeButton
              ]}
              onPress={() => {
                setFilterType('country');
                setFilters(prev => ({ country: prev.country }));
              }}
            >
              <Text style={[
                styles.filterTypeText,
                filterType === 'country' && styles.activeFilterTypeText
              ]}>By Country</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterTypeButton,
                filterType === 'category' && styles.activeFilterTypeButton
              ]}
              onPress={() => {
                setFilterType('category');
                setFilters(prev => ({ category: prev.category }));
              }}
            >
              <Text style={[
                styles.filterTypeText,
                filterType === 'category' && styles.activeFilterTypeText
              ]}>By Category</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterContent}>
            {filterType === 'city' && (
              <CategoryPicker
                value={filters.city}
                onChange={(city: string) => {
                  setFilters(prev => ({ ...prev, city }));
                  setShowFilter(false);
                }}
                type="cities"
              />
            )}
            {filterType === 'country' && (
              <CategoryPicker
                value={filters.country}
                onChange={(country: string) => {
                  setFilters(prev => ({ ...prev, country }));
                  setShowFilter(false);
                }}
                type="countries"
              />
            )}
            {filterType === 'category' && (
              <CategoryMultiSelect
                categories={filters.categories || []}
                onChange={(newCategories) => {
                  setFilters(prev => ({ 
                    ...prev, 
                    categories: newCategories,
                    // Keep the first category for backward compatibility
                    category: newCategories.length > 0 ? newCategories[0].value : undefined 
                  }));
                  if (newCategories.length === 0) {
                    setShowFilter(false);
                  }
                }}
              />
            )}
            {getActiveFilterCount() > 0 && (
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={() => {
                  handleClearFilters();
                  setFilterType('category');
                }}
              >
                <Text style={styles.clearFilterText}>Show All Contacts</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderSortModal = () => (
    <Modal
      visible={showSortModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowSortModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text weight="bold" style={styles.modalTitle}>Sort By</Text>
            <TouchableOpacity
              onPress={() => setShowSortModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.sortOptions}>
            {[
              { field: 'firstName', label: 'First Name' },
              { field: 'lastName', label: 'Last Name' },
              { field: 'company', label: 'Company' },
              { field: 'category', label: 'Category' },
              { field: 'createdAt', label: 'Creation Date' },
            ].map(({ field, label }) => (
              <TouchableOpacity
                key={field}
                style={[
                  styles.sortOption,
                  sort.field === field && styles.activeSortOption
                ]}
                onPress={() => {
                  setSort(prev => ({
                    field: field as SortField,
                    order: prev.field === field ? (prev.order === 'asc' ? 'desc' : 'asc') : 'asc'
                  }));
                  setShowSortModal(false);
                }}
              >
                <Text style={[
                  styles.sortOptionText,
                  sort.field === field && styles.activeSortOptionText
                ]}>
                  {label}
                </Text>
                {sort.field === field && (
                  <Ionicons
                    name={sort.order === 'desc' ? 'chevron-down' : 'chevron-up'}
                    size={20}
                    color={sort.field === field ? '#fff' : '#000'}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const getTitle = () => {
    if (filters.category) {
      return filters.category.charAt(0).toUpperCase() + filters.category.slice(1);
    }
    if (filters.city) {
      return filters.city;
    }
    if (filters.country) {
      return filters.country;
    }
    return 'All Contacts';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text weight="bold" style={styles.title}>{getTitle()}</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={() => setShowFilter(true)}
              style={[styles.headerButton, getActiveFilterCount() > 0 && styles.activeFilterButton]}
            >
              <Ionicons 
                name="filter" 
                size={24} 
                color={getActiveFilterCount() > 0 ? '#fff' : colors.text} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowSortModal(true)}
              style={styles.headerButton}
            >
              <Ionicons name="swap-vertical" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Account')}
              style={styles.headerButton}
            >
              <Ionicons name="person-circle-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.secondaryBackground }]}
          placeholder="Search contacts..."
          placeholderTextColor={colors.secondaryText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={Object.entries(groupedContacts)}
          renderItem={({ item: [date, contacts] }) => (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{date}</Text>
              </View>
              {contacts.map((contact) => (
                <TouchableOpacity
                  key={getContactKey(contact)}
                  style={styles.contactItem}
                  onPress={() => navigation.navigate('ContactDetail', { contact })}
                >
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>
                      {contact.firstName} {contact.lastName}
                    </Text>
                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                    {contact.categories && contact.categories.length > 0 && (
                      <View style={styles.contactCategories}>
                        {contact.categories.map((category, index) => (
                          <Text key={index} style={styles.contactCategory} numberOfLines={1}>
                            {category.value}
                            {index < contact.categories.length - 1 ? ', ' : ''}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
                </TouchableOpacity>
              ))}
            </View>
          )}
          keyExtractor={([date]) => date}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={fetchContacts}
            />
          }
        />
      )}

      {renderFilterModal()}
      {renderSortModal()}
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
    backgroundColor: colors.background,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    padding: 8,
  },
  activeFilterButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  searchInput: {
    height: 36,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 17,
    color: colors.searchText,
    backgroundColor: colors.secondaryBackground,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.secondaryBackground,
  },
  sectionHeaderText: {
    fontSize: 15,
    color: colors.secondaryText,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.itemBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 17,
    color: colors.text,
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 15,
    color: colors.secondaryText,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.modalOverlay,
  },
  modalContent: {
    backgroundColor: colors.modalBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  filterTypeSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.secondaryBackground,
    alignItems: 'center',
  },
  activeFilterTypeButton: {
    backgroundColor: colors.primary,
  },
  filterTypeText: {
    fontSize: 14,
    color: colors.text,
  },
  activeFilterTypeText: {
    color: '#fff',
  },
  filterContent: {
    padding: 16,
  },
  clearFilterButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.destructive,
    alignItems: 'center',
  },
  clearFilterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sortOptions: {
    padding: 16,
    gap: 12,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.secondaryBackground,
    borderRadius: 8,
  },
  activeSortOption: {
    backgroundColor: colors.primary,
  },
  sortOptionText: {
    fontSize: 17,
    color: colors.text,
  },
  activeSortOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.destructive,
    fontSize: 16,
    fontWeight: '600',
  },
  contactCategories: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contactCategory: {
    fontSize: 15,
    color: colors.secondaryText,
  },
}); 