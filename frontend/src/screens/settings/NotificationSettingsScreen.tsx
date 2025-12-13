/**
 * SAURELLIUS NOTIFICATION SETTINGS
 * Manage push, email, and in-app notification preferences
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
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, gradients } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Notification preferences
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [paystubReady, setPaystubReady] = useState(true);
  const [payrollReminders, setPayrollReminders] = useState(true);
  const [taxDeadlines, setTaxDeadlines] = useState(true);
  const [employeeUpdates, setEmployeeUpdates] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [marketing, setMarketing] = useState(false);

  const fetchPreferences = useCallback(async () => {
    try {
      const response = await api.get('/api/notifications/preferences');
      const prefs = response.data?.data || response.data || {};
      setPushEnabled(prefs.push_enabled ?? true);
      setEmailEnabled(prefs.email_enabled ?? true);
      setPaystubReady(prefs.paystub_ready ?? true);
      setPayrollReminders(prefs.payroll_reminders ?? true);
      setTaxDeadlines(prefs.tax_deadlines ?? true);
      setEmployeeUpdates(prefs.employee_updates ?? true);
      setSecurityAlerts(prefs.security_alerts ?? true);
      setMarketing(prefs.marketing ?? false);
    } catch (error) {
      // Load from AsyncStorage as fallback
      const stored = await AsyncStorage.getItem('notification_preferences');
      if (stored) {
        const prefs = JSON.parse(stored);
        setPushEnabled(prefs.push_enabled ?? true);
        setEmailEnabled(prefs.email_enabled ?? true);
        setPaystubReady(prefs.paystub_ready ?? true);
        setPayrollReminders(prefs.payroll_reminders ?? true);
        setTaxDeadlines(prefs.tax_deadlines ?? true);
        setEmployeeUpdates(prefs.employee_updates ?? true);
        setSecurityAlerts(prefs.security_alerts ?? true);
        setMarketing(prefs.marketing ?? false);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const savePreferences = async (key: string, value: boolean) => {
    setSaving(true);
    const prefs = {
      push_enabled: pushEnabled,
      email_enabled: emailEnabled,
      paystub_ready: paystubReady,
      payroll_reminders: payrollReminders,
      tax_deadlines: taxDeadlines,
      employee_updates: employeeUpdates,
      security_alerts: securityAlerts,
      marketing: marketing,
      [key]: value,
    };

    try {
      await api.put('/api/notifications/preferences', prefs);
      await AsyncStorage.setItem('notification_preferences', JSON.stringify(prefs));
    } catch (error) {
      await AsyncStorage.setItem('notification_preferences', JSON.stringify(prefs));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: string, setter: (v: boolean) => void, currentValue: boolean) => {
    const newValue = !currentValue;
    setter(newValue);
    savePreferences(key, newValue);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPreferences();
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
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>General</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <Ionicons name="notifications-outline" size={22} color={colors.primary} style={styles.icon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Push Notifications</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>Receive push alerts</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={() => handleToggle('push_enabled', setPushEnabled, pushEnabled)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <Ionicons name="mail-outline" size={22} color={colors.primary} style={styles.icon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Email Notifications</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>Receive email alerts</Text>
            </View>
            <Switch
              value={emailEnabled}
              onValueChange={() => handleToggle('email_enabled', setEmailEnabled, emailEnabled)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Payroll Alerts</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <Ionicons name="document-text-outline" size={22} color={colors.primary} style={styles.icon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Paystub Ready</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>When new paystubs are available</Text>
            </View>
            <Switch
              value={paystubReady}
              onValueChange={() => handleToggle('paystub_ready', setPaystubReady, paystubReady)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <Ionicons name="calendar-outline" size={22} color={colors.primary} style={styles.icon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Payroll Reminders</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>Upcoming payroll deadlines</Text>
            </View>
            <Switch
              value={payrollReminders}
              onValueChange={() => handleToggle('payroll_reminders', setPayrollReminders, payrollReminders)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <Ionicons name="receipt-outline" size={22} color={colors.primary} style={styles.icon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Tax Deadlines</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>Important tax filing dates</Text>
            </View>
            <Switch
              value={taxDeadlines}
              onValueChange={() => handleToggle('tax_deadlines', setTaxDeadlines, taxDeadlines)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Other</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <Ionicons name="people-outline" size={22} color={colors.primary} style={styles.icon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Employee Updates</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>New hires, terminations, changes</Text>
            </View>
            <Switch
              value={employeeUpdates}
              onValueChange={() => handleToggle('employee_updates', setEmployeeUpdates, employeeUpdates)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} style={styles.icon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Security Alerts</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>Login attempts, password changes</Text>
            </View>
            <Switch
              value={securityAlerts}
              onValueChange={() => handleToggle('security_alerts', setSecurityAlerts, securityAlerts)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.settingItem}>
            <Ionicons name="megaphone-outline" size={22} color={colors.primary} style={styles.icon} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Marketing</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>Product updates and offers</Text>
            </View>
            <Switch
              value={marketing}
              onValueChange={() => handleToggle('marketing', setMarketing, marketing)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {saving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.savingText, { color: colors.textSecondary }]}>Saving...</Text>
          </View>
        )}

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
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  icon: { marginRight: 12 },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 16 },
  settingSubtitle: { fontSize: 13, marginTop: 2 },
  savingIndicator: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  savingText: { marginLeft: 8, fontSize: 14 },
});

export default NotificationSettingsScreen;
