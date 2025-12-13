/**
 * SAURELLIUS SECURITY SETTINGS
 * 2FA, login security, and session management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const SecuritySettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, gradients } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [smsAuth, setSmsAuth] = useState(false);
  const [emailAuth, setEmailAuth] = useState(true);
  const [appAuth, setAppAuth] = useState(false);
  const [loginNotifications, setLoginNotifications] = useState(true);
  const [activeSessions, setActiveSessions] = useState(1);

  const fetchSecuritySettings = useCallback(async () => {
    try {
      const response = await api.get('/api/security/settings');
      const data = response.data?.data || {};
      setTwoFactorEnabled(data.two_factor_enabled ?? false);
      setSmsAuth(data.sms_auth ?? false);
      setEmailAuth(data.email_auth ?? true);
      setAppAuth(data.app_auth ?? false);
      setLoginNotifications(data.login_notifications ?? true);
      setActiveSessions(data.active_sessions ?? 1);
    } catch (error) {
      // Use defaults
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSecuritySettings();
  }, [fetchSecuritySettings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSecuritySettings();
  };

  const updateSetting = async (key: string, value: boolean) => {
    try {
      await api.put('/api/security/settings', { [key]: value });
    } catch (error) {
      Alert.alert('Error', 'Failed to update security settings');
    }
  };

  const handleToggle2FA = () => {
    const newValue = !twoFactorEnabled;
    setTwoFactorEnabled(newValue);
    updateSetting('two_factor_enabled', newValue);
    if (newValue) {
      Alert.alert('Two-Factor Authentication', 'Choose your preferred 2FA method below');
    }
  };

  const handleLogoutAllSessions = () => {
    Alert.alert(
      'Log Out All Devices',
      'This will log you out from all devices except this one. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out All',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/api/auth/logout-all');
              Alert.alert('Success', 'Logged out from all other devices');
              setActiveSessions(1);
            } catch (error) {
              Alert.alert('Error', 'Failed to log out from other devices');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Security</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Two-Factor Authentication</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Enable 2FA</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>Add an extra layer of security</Text>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={handleToggle2FA}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {twoFactorEnabled && (
            <>
              <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
                <View style={[styles.iconContainer, { backgroundColor: '#22C55E20' }]}>
                  <Ionicons name="chatbubble-outline" size={22} color="#22C55E" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>SMS Authentication</Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>Receive codes via text</Text>
                </View>
                <Switch
                  value={smsAuth}
                  onValueChange={(v) => { setSmsAuth(v); updateSetting('sms_auth', v); }}
                  trackColor={{ false: colors.border, true: '#22C55E' }}
                  thumbColor="#fff"
                />
              </View>
              <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
                <View style={[styles.iconContainer, { backgroundColor: '#3B82F620' }]}>
                  <Ionicons name="mail-outline" size={22} color="#3B82F6" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>Email Authentication</Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>Receive codes via email</Text>
                </View>
                <Switch
                  value={emailAuth}
                  onValueChange={(v) => { setEmailAuth(v); updateSetting('email_auth', v); }}
                  trackColor={{ false: colors.border, true: '#3B82F6' }}
                  thumbColor="#fff"
                />
              </View>
              <View style={styles.settingItem}>
                <View style={[styles.iconContainer, { backgroundColor: '#8B5CF620' }]}>
                  <Ionicons name="phone-portrait-outline" size={22} color="#8B5CF6" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>Authenticator App</Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>Use Google/Microsoft Authenticator</Text>
                </View>
                <Switch
                  value={appAuth}
                  onValueChange={(v) => { setAppAuth(v); updateSetting('app_auth', v); }}
                  trackColor={{ false: colors.border, true: '#8B5CF6' }}
                  thumbColor="#fff"
                />
              </View>
            </>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Password</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="lock-closed-outline" size={22} color="#F59E0B" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Change Password</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>Update your password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Login Activity</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: '#06B6D420' }]}>
              <Ionicons name="notifications-outline" size={22} color="#06B6D4" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Login Notifications</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>Get alerted for new logins</Text>
            </View>
            <Switch
              value={loginNotifications}
              onValueChange={(v) => { setLoginNotifications(v); updateSetting('login_notifications', v); }}
              trackColor={{ false: colors.border, true: '#06B6D4' }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.settingItem}>
            <View style={[styles.iconContainer, { backgroundColor: '#EC489920' }]}>
              <Ionicons name="laptop-outline" size={22} color="#EC4899" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Active Sessions</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{activeSessions} device(s) logged in</Text>
            </View>
            <TouchableOpacity onPress={handleLogoutAllSessions}>
              <Text style={[styles.logoutAllText, { color: '#EF4444' }]}>Log Out All</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingVertical: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  content: { flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginTop: 24, marginBottom: 8, marginHorizontal: 16 },
  section: { borderRadius: 12, marginHorizontal: 16, overflow: 'hidden', borderWidth: 1 },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  iconContainer: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 16 },
  settingSubtitle: { fontSize: 13, marginTop: 2 },
  logoutAllText: { fontSize: 14, fontWeight: '600' },
});

export default SecuritySettingsScreen;
