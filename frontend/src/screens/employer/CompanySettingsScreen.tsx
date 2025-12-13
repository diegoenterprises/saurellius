/**
 * EMPLOYER COMPANY SETTINGS SCREEN
 * Manage company information, payroll settings, tax setup
 * Bank accounts, pay schedules, and compliance settings
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Switch,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface CompanySettings {
  company: {
    name: string;
    legal_name: string;
    dba_name?: string;
    ein: string;
    entity_type: string;
    industry: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
    phone: string;
    email: string;
    website?: string;
  };
  payroll: {
    pay_frequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
    pay_day: number;
    overtime_rate: number;
    auto_approve_timesheets: boolean;
    require_timesheet_approval: boolean;
    direct_deposit_lead_days: number;
  };
  taxes: {
    federal_deposit_schedule: 'semiweekly' | 'monthly';
    state_withholding_id?: string;
    state_unemployment_id?: string;
    local_tax_ids: { jurisdiction: string; id: string }[];
  };
  notifications: {
    payroll_reminders: boolean;
    tax_deadline_alerts: boolean;
    new_hire_notifications: boolean;
    compliance_alerts: boolean;
  };
}

const PAY_FREQUENCIES = [
  { value: 'weekly', label: 'Weekly', description: '52 pay periods/year' },
  { value: 'biweekly', label: 'Bi-Weekly', description: '26 pay periods/year' },
  { value: 'semimonthly', label: 'Semi-Monthly', description: '24 pay periods/year' },
  { value: 'monthly', label: 'Monthly', description: '12 pay periods/year' },
];

const ENTITY_TYPES = [
  'Sole Proprietorship',
  'Partnership',
  'LLC',
  'S-Corporation',
  'C-Corporation',
  'Non-Profit',
];

export default function CompanySettingsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [editSection, setEditSection] = useState<string | null>(null);
  const [editedSettings, setEditedSettings] = useState<Partial<CompanySettings>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await api.get('/api/employer/settings');
      setSettings(response.data.settings || null);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSettings();
  };

  const handleSaveSection = async (section: string) => {
    setSaving(true);
    try {
      const response = await api.put(`/api/employer/settings/${section}`, editedSettings[section as keyof CompanySettings]);
      if (response.data.success) {
        setSettings(response.data.settings);
        setEditSection(null);
        setHasChanges(false);
        Alert.alert('Success', 'Settings updated successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotification = async (key: keyof CompanySettings['notifications']) => {
    if (!settings) return;
    
    const newValue = !settings.notifications[key];
    try {
      await api.put('/api/employer/settings/notifications', {
        ...settings.notifications,
        [key]: newValue,
      });
      setSettings(prev => prev ? {
        ...prev,
        notifications: { ...prev.notifications, [key]: newValue }
      } : null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleTogglePayrollSetting = async (key: keyof CompanySettings['payroll'], value: boolean) => {
    if (!settings) return;
    
    try {
      await api.put('/api/employer/settings/payroll', {
        ...settings.payroll,
        [key]: value,
      });
      setSettings(prev => prev ? {
        ...prev,
        payroll: { ...prev.payroll, [key]: value }
      } : null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update payroll settings');
    }
  };

  const renderCompanyEditModal = () => (
    <Modal
      visible={editSection === 'company'}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setEditSection(null)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Company Info</Text>
          <TouchableOpacity onPress={() => handleSaveSection('company')} disabled={saving}>
            <Text style={[styles.modalSave, saving && { opacity: 0.5 }]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Company Name *</Text>
            <TextInput
              style={styles.input}
              value={editedSettings.company?.name || settings?.company.name}
              onChangeText={(text) => setEditedSettings(prev => ({
                ...prev,
                company: { ...prev.company!, name: text }
              }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Legal Name</Text>
            <TextInput
              style={styles.input}
              value={editedSettings.company?.legal_name || settings?.company.legal_name}
              onChangeText={(text) => setEditedSettings(prev => ({
                ...prev,
                company: { ...prev.company!, legal_name: text }
              }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>DBA Name (if applicable)</Text>
            <TextInput
              style={styles.input}
              value={editedSettings.company?.dba_name || settings?.company.dba_name}
              onChangeText={(text) => setEditedSettings(prev => ({
                ...prev,
                company: { ...prev.company!, dba_name: text }
              }))}
              placeholder="Doing Business As"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              value={editedSettings.company?.phone || settings?.company.phone}
              onChangeText={(text) => setEditedSettings(prev => ({
                ...prev,
                company: { ...prev.company!, phone: text }
              }))}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={editedSettings.company?.email || settings?.company.email}
              onChangeText={(text) => setEditedSettings(prev => ({
                ...prev,
                company: { ...prev.company!, email: text }
              }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Website</Text>
            <TextInput
              style={styles.input}
              value={editedSettings.company?.website || settings?.company.website}
              onChangeText={(text) => setEditedSettings(prev => ({
                ...prev,
                company: { ...prev.company!, website: text }
              }))}
              autoCapitalize="none"
              placeholder="https://example.com"
              placeholderTextColor="#666"
            />
          </View>

          <Text style={styles.sectionLabel}>Business Address</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Street Address</Text>
            <TextInput
              style={styles.input}
              value={editedSettings.company?.address?.street || settings?.company.address.street}
              onChangeText={(text) => setEditedSettings(prev => ({
                ...prev,
                company: { 
                  ...prev.company!, 
                  address: { ...prev.company?.address!, street: text }
                }
              }))}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                value={editedSettings.company?.address?.city || settings?.company.address.city}
                onChangeText={(text) => setEditedSettings(prev => ({
                  ...prev,
                  company: { 
                    ...prev.company!, 
                    address: { ...prev.company?.address!, city: text }
                  }
                }))}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.input}
                value={editedSettings.company?.address?.state || settings?.company.address.state}
                onChangeText={(text) => setEditedSettings(prev => ({
                  ...prev,
                  company: { 
                    ...prev.company!, 
                    address: { ...prev.company?.address!, state: text }
                  }
                }))}
                maxLength={2}
                autoCapitalize="characters"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.inputLabel}>ZIP</Text>
              <TextInput
                style={styles.input}
                value={editedSettings.company?.address?.zip || settings?.company.address.zip}
                onChangeText={(text) => setEditedSettings(prev => ({
                  ...prev,
                  company: { 
                    ...prev.company!, 
                    address: { ...prev.company?.address!, zip: text }
                  }
                }))}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderPayrollEditModal = () => (
    <Modal
      visible={editSection === 'payroll'}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setEditSection(null)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Payroll Settings</Text>
          <TouchableOpacity onPress={() => handleSaveSection('payroll')} disabled={saving}>
            <Text style={[styles.modalSave, saving && { opacity: 0.5 }]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.inputLabel}>Pay Frequency</Text>
          <View style={styles.frequencyOptions}>
            {PAY_FREQUENCIES.map((freq) => (
              <TouchableOpacity
                key={freq.value}
                style={[
                  styles.frequencyOption,
                  (editedSettings.payroll?.pay_frequency || settings?.payroll.pay_frequency) === freq.value && 
                    styles.frequencyOptionSelected
                ]}
                onPress={() => setEditedSettings(prev => ({
                  ...prev,
                  payroll: { ...prev.payroll!, pay_frequency: freq.value as any }
                }))}
              >
                <Text style={styles.frequencyLabel}>{freq.label}</Text>
                <Text style={styles.frequencyDesc}>{freq.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Overtime Rate Multiplier</Text>
            <View style={styles.rateInput}>
              <TextInput
                style={styles.rateTextInput}
                value={(editedSettings.payroll?.overtime_rate || settings?.payroll.overtime_rate || 1.5).toString()}
                onChangeText={(text) => setEditedSettings(prev => ({
                  ...prev,
                  payroll: { ...prev.payroll!, overtime_rate: parseFloat(text) || 1.5 }
                }))}
                keyboardType="decimal-pad"
              />
              <Text style={styles.rateSymbol}>x</Text>
            </View>
            <Text style={styles.inputHelper}>Standard is 1.5x for hours over 40/week</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Direct Deposit Lead Days</Text>
            <TextInput
              style={styles.input}
              value={(editedSettings.payroll?.direct_deposit_lead_days || settings?.payroll.direct_deposit_lead_days || 2).toString()}
              onChangeText={(text) => setEditedSettings(prev => ({
                ...prev,
                payroll: { ...prev.payroll!, direct_deposit_lead_days: parseInt(text) || 2 }
              }))}
              keyboardType="number-pad"
            />
            <Text style={styles.inputHelper}>Days before pay date to process direct deposits</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1473FF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Company Settings</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />
        }
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="business" size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Company Information</Text>
            </View>
            <TouchableOpacity onPress={() => {
              setEditedSettings({ company: { ...settings?.company } as any });
              setEditSection('company');
            }}>
              <Ionicons name="create-outline" size={20} color="#1473FF" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Company Name</Text>
              <Text style={styles.infoValue}>{settings?.company.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>EIN</Text>
              <Text style={styles.infoValue}>{settings?.company.ein}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Entity Type</Text>
              <Text style={styles.infoValue}>{settings?.company.entity_type}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{settings?.company.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{settings?.company.email}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>
                {settings?.company.address.street}, {settings?.company.address.city}, {settings?.company.address.state} {settings?.company.address.zip}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="calendar" size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>Payroll Settings</Text>
            </View>
            <TouchableOpacity onPress={() => {
              setEditedSettings({ payroll: { ...settings?.payroll } as any });
              setEditSection('payroll');
            }}>
              <Ionicons name="create-outline" size={20} color="#1473FF" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pay Frequency</Text>
              <Text style={styles.infoValue}>
                {PAY_FREQUENCIES.find(f => f.value === settings?.payroll.pay_frequency)?.label}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Overtime Rate</Text>
              <Text style={styles.infoValue}>{settings?.payroll.overtime_rate}x</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Direct Deposit Lead</Text>
              <Text style={styles.infoValue}>{settings?.payroll.direct_deposit_lead_days} days</Text>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Auto-approve Timesheets</Text>
                <Text style={styles.toggleDesc}>Automatically approve submitted timesheets</Text>
              </View>
              <Switch
                value={settings?.payroll.auto_approve_timesheets}
                onValueChange={(value) => handleTogglePayrollSetting('auto_approve_timesheets', value)}
                trackColor={{ false: '#2a2a4e', true: '#1473FF' }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Require Timesheet Approval</Text>
                <Text style={styles.toggleDesc}>Managers must approve before payroll</Text>
              </View>
              <Switch
                value={settings?.payroll.require_timesheet_approval}
                onValueChange={(value) => handleTogglePayrollSetting('require_timesheet_approval', value)}
                trackColor={{ false: '#2a2a4e', true: '#1473FF' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="notifications" size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Notifications</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Payroll Reminders</Text>
                <Text style={styles.toggleDesc}>Get reminded before payroll deadlines</Text>
              </View>
              <Switch
                value={settings?.notifications.payroll_reminders}
                onValueChange={() => handleToggleNotification('payroll_reminders')}
                trackColor={{ false: '#2a2a4e', true: '#1473FF' }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Tax Deadline Alerts</Text>
                <Text style={styles.toggleDesc}>Alerts for upcoming tax deadlines</Text>
              </View>
              <Switch
                value={settings?.notifications.tax_deadline_alerts}
                onValueChange={() => handleToggleNotification('tax_deadline_alerts')}
                trackColor={{ false: '#2a2a4e', true: '#1473FF' }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>New Hire Notifications</Text>
                <Text style={styles.toggleDesc}>Notify when employees complete onboarding</Text>
              </View>
              <Switch
                value={settings?.notifications.new_hire_notifications}
                onValueChange={() => handleToggleNotification('new_hire_notifications')}
                trackColor={{ false: '#2a2a4e', true: '#1473FF' }}
                thumbColor="#FFF"
              />
            </View>

            <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Compliance Alerts</Text>
                <Text style={styles.toggleDesc}>Important compliance and regulatory updates</Text>
              </View>
              <Switch
                value={settings?.notifications.compliance_alerts}
                onValueChange={() => handleToggleNotification('compliance_alerts')}
                trackColor={{ false: '#2a2a4e', true: '#1473FF' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.quickLinks}>
            <TouchableOpacity 
              style={styles.quickLink}
              onPress={() => navigation.navigate('TaxCenter')}
            >
              <View style={[styles.quickLinkIcon, { backgroundColor: '#8B5CF620' }]}>
                <Ionicons name="calculator" size={22} color="#8B5CF6" />
              </View>
              <Text style={styles.quickLinkText}>Tax Setup</Text>
              <Ionicons name="chevron-forward" size={18} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickLink}
              onPress={() => navigation.navigate('PaymentMethods')}
            >
              <View style={[styles.quickLinkIcon, { backgroundColor: '#10B98120' }]}>
                <Ionicons name="card" size={22} color="#10B981" />
              </View>
              <Text style={styles.quickLinkText}>Payment Methods</Text>
              <Ionicons name="chevron-forward" size={18} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickLink}
              onPress={() => navigation.navigate('YearEndDashboard')}
            >
              <View style={[styles.quickLinkIcon, { backgroundColor: '#EF444420' }]}>
                <Ionicons name="document-text" size={22} color="#EF4444" />
              </View>
              <Text style={styles.quickLinkText}>Year-End Forms</Text>
              <Ionicons name="chevron-forward" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {renderCompanyEditModal()}
      {renderPayrollEditModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  infoCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  infoLabel: {
    fontSize: 14,
    color: '#a0a0a0',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
    flex: 1.5,
    textAlign: 'right',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '500',
  },
  toggleDesc: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
  },
  quickLinks: {
    gap: 10,
    marginTop: 4,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  quickLinkIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  quickLinkText: {
    flex: 1,
    fontSize: 15,
    color: '#FFF',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
  },
  modalCancel: {
    fontSize: 16,
    color: '#a0a0a0',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1473FF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 24,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#a0a0a0',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputHelper: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  frequencyOptions: {
    gap: 10,
    marginBottom: 20,
  },
  frequencyOption: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#2a2a4e',
  },
  frequencyOptionSelected: {
    borderColor: '#1473FF',
    backgroundColor: '#1473FF10',
  },
  frequencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  frequencyDesc: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 2,
  },
  rateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a4e',
    paddingHorizontal: 14,
  },
  rateTextInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    paddingVertical: 14,
  },
  rateSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1473FF',
    marginLeft: 8,
  },
});
