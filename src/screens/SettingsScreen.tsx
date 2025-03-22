import React from 'react';
import { View, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Text, Button } from '../components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';

export function SettingsScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = React.useState(true);
  const [isBiometricEnabled, setIsBiometricEnabled] = React.useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text variant="h2" weight="bold">Settings</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle} weight="semibold">Appearance</Text>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon-outline" size={24} color="#333" />
                <Text style={styles.settingLabel}>Dark Mode</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: '#D1D1D6', true: '#007AFF' }}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} weight="semibold">Notifications</Text>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications-outline" size={24} color="#333" />
                <Text style={styles.settingLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={isNotificationsEnabled}
                onValueChange={setIsNotificationsEnabled}
                trackColor={{ false: '#D1D1D6', true: '#007AFF' }}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} weight="semibold">Security</Text>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="finger-print-outline" size={24} color="#333" />
                <Text style={styles.settingLabel}>Biometric Authentication</Text>
              </View>
              <Switch
                value={isBiometricEnabled}
                onValueChange={setIsBiometricEnabled}
                trackColor={{ false: '#D1D1D6', true: '#007AFF' }}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.aboutButton}>
            <View style={styles.settingInfo}>
              <Ionicons name="information-circle-outline" size={24} color="#333" />
              <Text style={styles.settingLabel}>About</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <View style={styles.buttonContainer}>
            <Button
              variant="destructive"
              onPress={logout}
              style={styles.logoutButton}
            >
              Logout
            </Button>
          </View>
        </View>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flex: 1,
    paddingBottom: 16,
  },
  section: {
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  aboutButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 24,
  },
  buttonContainer: {
    padding: 16,
    marginTop: 'auto',
  },
  logoutButton: {
    marginTop: 16,
  },
}); 