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
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateUser } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';

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
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [autoClockOut, setAutoClockOut] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const userInitials = `${user?.first_name?.[0] || 'U'}${user?.last_name?.[0] || ''}`.toUpperCase();

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setIsUploading(true);
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        
        try {
          const response = await api.post('/api/auth/profile-picture', {
            profile_picture: base64Image,
          });
          
          if (response.data.success) {
            dispatch(updateUser(response.data.user));
            Alert.alert('Success', 'Profile picture updated!');
          }
        } catch (error) {
          Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeProfilePicture = async () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete('/api/auth/profile-picture');
              if (response.data.success) {
                dispatch(updateUser(response.data.user));
                Alert.alert('Success', 'Profile picture removed.');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to remove profile picture.');
            }
          },
        },
      ]
    );
  };

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
        { text: 'Log Out', style: 'destructive', onPress: () => dispatch(logout()) },
      ]
    );
  };

  const accountSettings: SettingItem[] = [
    { icon: 'person-outline', title: 'Profile', subtitle: 'Edit your personal information', type: 'link', onPress: () => navigation.navigate('Profile') },
    { icon: 'card-outline', title: 'Payment Methods', subtitle: 'Manage your payment options', type: 'link', onPress: () => navigation.navigate('Subscription') },
    { icon: 'business-outline', title: 'Company Info', subtitle: 'View company details', type: 'link', onPress: () => navigation.navigate('Compliance' as any) },
  ];

  const notificationSettings: SettingItem[] = [
    { icon: 'notifications-outline', title: 'Push Notifications', type: 'toggle', value: notifications, onPress: () => setNotifications(!notifications) },
    { icon: 'mail-outline', title: 'Email Alerts', type: 'toggle', value: emailAlerts, onPress: () => setEmailAlerts(!emailAlerts) },
  ];

  const securitySettings: SettingItem[] = [
    { icon: 'finger-print-outline', title: 'Biometric Login', subtitle: 'Use Face ID or Touch ID', type: 'toggle', value: biometrics, onPress: () => setBiometrics(!biometrics) },
    { icon: 'lock-closed-outline', title: 'Change Password', type: 'link', onPress: () => Alert.alert('Change Password', 'Password change email sent to your registered email address.') },
    { icon: 'shield-checkmark-outline', title: 'Two-Factor Auth', subtitle: 'Enabled', type: 'link', onPress: () => Alert.alert('Two-Factor Auth', 'Two-factor authentication is currently enabled for your account.') },
  ];

  const appSettings: SettingItem[] = [
    { icon: 'moon-outline', title: 'Dark Mode', type: 'toggle', value: darkMode, onPress: () => setDarkMode(!darkMode) },
    { icon: 'time-outline', title: 'Auto Clock-Out', subtitle: 'Clock out at end of day', type: 'toggle', value: autoClockOut, onPress: () => setAutoClockOut(!autoClockOut) },
    { icon: 'language-outline', title: 'Language', type: 'value', value: 'English' },
    { icon: 'location-outline', title: 'Timezone', type: 'value', value: 'CST' },
  ];

  const supportSettings: SettingItem[] = [
    { icon: 'help-circle-outline', title: 'Help Center', type: 'link', onPress: () => Alert.alert('Help Center', 'Visit help.saurellius.com for documentation and FAQs.') },
    { icon: 'chatbubble-outline', title: 'Contact Support', type: 'link', onPress: () => Alert.alert('Contact Support', 'Email: support@saurellius.com\nPhone: 1-800-PAY-STUB') },
    { icon: 'document-text-outline', title: 'Terms of Service', type: 'link', onPress: () => navigation.navigate('TermsConditions') },
    { icon: 'shield-outline', title: 'Privacy Policy', type: 'link', onPress: () => navigation.navigate('PrivacyPolicy') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1473FF', '#BE01FF']} style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Profile Picture Section */}
        <Text style={styles.sectionTitle}>Profile Picture</Text>
        <View style={styles.profileSection}>
          <View style={styles.profilePictureContainer}>
            {user?.profile_picture ? (
              <Image source={{ uri: user.profile_picture }} style={styles.profilePicture} />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <Text style={styles.profilePictureInitials}>{userInitials}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} onPress={pickImage} disabled={isUploading}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileActions}>
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage} disabled={isUploading}>
              <Ionicons name="cloud-upload-outline" size={18} color="#1473FF" />
              <Text style={styles.uploadButtonText}>{isUploading ? 'Uploading...' : 'Upload Photo'}</Text>
            </TouchableOpacity>
            {user?.profile_picture && (
              <TouchableOpacity style={styles.removeButton} onPress={removeProfilePicture}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

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
  container: { flex: 1, backgroundColor: '#0f0f23' },
  header: { paddingHorizontal: 20, paddingVertical: 20 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff' },
  content: { flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#a0a0a0', marginTop: 24, marginBottom: 8, marginHorizontal: 16 },
  section: { backgroundColor: '#1a1a2e', borderRadius: 12, marginHorizontal: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#2a2a4e' },
  profileSection: { backgroundColor: '#1a1a2e', borderRadius: 12, marginHorizontal: 16, padding: 20, borderWidth: 1, borderColor: '#2a2a4e', flexDirection: 'row', alignItems: 'center' },
  profilePictureContainer: { position: 'relative' },
  profilePicture: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#1473FF' },
  profilePicturePlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#1473FF' },
  profilePictureInitials: { fontSize: 28, fontWeight: '700', color: '#fff' },
  cameraButton: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0f0f23' },
  profileActions: { flex: 1, marginLeft: 16 },
  uploadButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(20, 115, 255, 0.15)', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginBottom: 8 },
  uploadButtonText: { color: '#1473FF', fontWeight: '600', marginLeft: 8 },
  removeButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  removeButtonText: { color: '#EF4444', fontWeight: '500', marginLeft: 6 },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  settingIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(20, 115, 255, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 16, color: '#fff' },
  settingSubtitle: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  settingValue: { fontSize: 14, color: '#a0a0a0' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 68, 68, 0.15)', marginHorizontal: 16, marginTop: 24, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#EF4444', marginLeft: 8 },
  version: { textAlign: 'center', fontSize: 12, color: '#a0a0a0', marginVertical: 24 },
});

export default SettingsScreen;
