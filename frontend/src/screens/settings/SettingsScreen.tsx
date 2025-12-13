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
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateUser } from '../../store/slices/authSlice';
import { toggleDarkMode } from '../../store/slices/settingsSlice';
import { AppDispatch, RootState } from '../../store';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

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
  const { darkMode } = useSelector((state: RootState) => state.settings);
  const { colors, gradients, isDark } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [autoClockOut, setAutoClockOut] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const handleDarkModeToggle = () => {
    dispatch(toggleDarkMode(!darkMode));
  };

  const userInitials = `${user?.first_name?.[0] || 'U'}${user?.last_name?.[0] || ''}`.toUpperCase();

  const pickImage = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to open image picker.');
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    setIsUploading(true);
    try {
      // Create form data
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const match = /\.([\w]+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('profile_picture', {
        uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
        name: filename,
        type,
      } as any);

      const response = await api.post('/api/auth/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        dispatch(updateUser(response.data.user));
        Alert.alert('Success', 'Profile picture updated!');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to upload profile picture.');
    } finally {
      setIsUploading(false);
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
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={item.onPress}
      disabled={item.type === 'toggle'}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={item.icon as any} size={22} color={colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{item.title}</Text>
        {item.subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>}
      </View>
      {item.type === 'toggle' && (
        <Switch
          value={item.value as boolean}
          onValueChange={item.onPress}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      )}
      {item.type === 'link' && (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      )}
      {item.type === 'value' && (
        <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{item.value as string}</Text>
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
    { icon: 'card-outline', title: 'Payment Methods', subtitle: 'Manage your payment options', type: 'link', onPress: () => navigation.navigate('PaymentMethods' as any) },
    { icon: 'business-outline', title: 'Company Info', subtitle: 'View company details', type: 'link', onPress: () => navigation.navigate('CompanyInfo' as any) },
  ];

  const notificationSettings: SettingItem[] = [
    { icon: 'notifications-outline', title: 'Notification Preferences', subtitle: 'Manage all notifications', type: 'link', onPress: () => navigation.navigate('NotificationSettings' as any) },
  ];

  const securitySettings: SettingItem[] = [
    { icon: 'shield-checkmark-outline', title: 'Security Settings', subtitle: '2FA, login activity, sessions', type: 'link', onPress: () => navigation.navigate('SecuritySettings' as any) },
    { icon: 'lock-closed-outline', title: 'Change Password', subtitle: 'Update your password', type: 'link', onPress: () => navigation.navigate('ChangePassword' as any) },
  ];

  const appSettings: SettingItem[] = [
    { icon: 'moon-outline', title: 'Dark Mode', type: 'toggle', value: darkMode, onPress: handleDarkModeToggle },
    { icon: 'time-outline', title: 'Auto Clock-Out', subtitle: 'Clock out at end of day', type: 'toggle', value: autoClockOut, onPress: () => setAutoClockOut(!autoClockOut) },
    { icon: 'language-outline', title: 'Language', subtitle: 'English', type: 'link', onPress: () => navigation.navigate('LanguageSettings' as any) },
    { icon: 'location-outline', title: 'Timezone', subtitle: 'CST', type: 'link', onPress: () => navigation.navigate('TimezoneSettings' as any) },
  ];

  const supportSettings: SettingItem[] = [
    { icon: 'help-circle-outline', title: 'Help Center', subtitle: 'FAQs and support', type: 'link', onPress: () => navigation.navigate('HelpCenter' as any) },
    { icon: 'document-text-outline', title: 'Terms of Service', type: 'link', onPress: () => navigation.navigate('TermsConditions') },
    { icon: 'shield-outline', title: 'Privacy Policy', type: 'link', onPress: () => navigation.navigate('PrivacyPolicy') },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Profile Picture Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Profile Picture</Text>
        <View style={[styles.profileSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
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

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {accountSettings.map(renderSettingItem)}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notifications</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {notificationSettings.map(renderSettingItem)}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Security</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {securitySettings.map(renderSettingItem)}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>App Preferences</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {appSettings.map(renderSettingItem)}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {supportSettings.map(renderSettingItem)}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textMuted }]}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  header: { paddingHorizontal: 16, paddingVertical: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
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
