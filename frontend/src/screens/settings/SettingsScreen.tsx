/**
 * SAURELLIUS SETTINGS
 * App preferences, notifications, security, and account settings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface SettingItem {
  icon: string;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'link' | 'value';
  value?: boolean | string;
  onPress?: () => void;
}

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [autoClockOut, setAutoClockOut] = useState(true);

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity 
      key={item.title}
      style={styles.settingItem}
      onPress={item.onPress}
      disabled={item.type === 'toggle'}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={item.icon as any} size={22} color="#1473FF" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{item.title}</Text>
        {item.subtitle && <Text style={styles.settingSubtitle}>{item.subtitle}</Text>}
      </View>
      {item.type === 'toggle' && (
        <Switch
          value={item.value as boolean}
          onValueChange={item.onPress}
          trackColor={{ false: '#ddd', true: '#1473FF' }}
          thumbColor="#fff"
        />
      )}
      {item.type === 'link' && (
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      )}
      {item.type === 'value' && (
        <Text style={styles.settingValue}>{item.value as string}</Text>
      )}
    </TouchableOpacity>
  );

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => navigation.navigate('Login') },
      ]
    );
  };

  const accountSettings: SettingItem[] = [
    { icon: 'person-outline', title: 'Profile', subtitle: 'Edit your personal information', type: 'link', onPress: () => navigation.navigate('Profile') },
    { icon: 'card-outline', title: 'Payment Methods', subtitle: 'Manage your payment options', type: 'link' },
    { icon: 'business-outline', title: 'Company Info', subtitle: 'View company details', type: 'link' },
  ];

  const notificationSettings: SettingItem[] = [
    { icon: 'notifications-outline', title: 'Push Notifications', type: 'toggle', value: notifications, onPress: () => setNotifications(!notifications) },
    { icon: 'mail-outline', title: 'Email Alerts', type: 'toggle', value: emailAlerts, onPress: () => setEmailAlerts(!emailAlerts) },
  ];

  const securitySettings: SettingItem[] = [
    { icon: 'finger-print-outline', title: 'Biometric Login', subtitle: 'Use Face ID or Touch ID', type: 'toggle', value: biometrics, onPress: () => setBiometrics(!biometrics) },
    { icon: 'lock-closed-outline', title: 'Change Password', type: 'link' },
    { icon: 'shield-checkmark-outline', title: 'Two-Factor Auth', subtitle: 'Enabled', type: 'link' },
  ];

  const appSettings: SettingItem[] = [
    { icon: 'moon-outline', title: 'Dark Mode', type: 'toggle', value: darkMode, onPress: () => setDarkMode(!darkMode) },
    { icon: 'time-outline', title: 'Auto Clock-Out', subtitle: 'Clock out at end of day', type: 'toggle', value: autoClockOut, onPress: () => setAutoClockOut(!autoClockOut) },
    { icon: 'language-outline', title: 'Language', type: 'value', value: 'English' },
    { icon: 'location-outline', title: 'Timezone', type: 'value', value: 'CST' },
  ];

  const supportSettings: SettingItem[] = [
    { icon: 'help-circle-outline', title: 'Help Center', type: 'link' },
    { icon: 'chatbubble-outline', title: 'Contact Support', type: 'link' },
    { icon: 'document-text-outline', title: 'Terms of Service', type: 'link', onPress: () => navigation.navigate('TermsConditions') },
    { icon: 'shield-outline', title: 'Privacy Policy', type: 'link', onPress: () => navigation.navigate('PrivacyPolicy') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1473FF', '#BE01FF']} style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.section}>
          {accountSettings.map(renderSettingItem)}
        </View>

        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.section}>
          {notificationSettings.map(renderSettingItem)}
        </View>

        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.section}>
          {securitySettings.map(renderSettingItem)}
        </View>

        <Text style={styles.sectionTitle}>App Preferences</Text>
        <View style={styles.section}>
          {appSettings.map(renderSettingItem)}
        </View>

        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.section}>
          {supportSettings.map(renderSettingItem)}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingHorizontal: 20, paddingVertical: 20 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff' },
  content: { flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginTop: 24, marginBottom: 8, marginHorizontal: 16 },
  section: { backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  settingIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#EBF4FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 16, color: '#333' },
  settingSubtitle: { fontSize: 13, color: '#999', marginTop: 2 },
  settingValue: { fontSize: 14, color: '#666' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEE2E2', marginHorizontal: 16, marginTop: 24, padding: 16, borderRadius: 12 },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#EF4444', marginLeft: 8 },
  version: { textAlign: 'center', fontSize: 12, color: '#999', marginVertical: 24 },
});

export default SettingsScreen;
