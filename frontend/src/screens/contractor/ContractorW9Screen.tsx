/**
 * CONTRACTOR W9 MANAGEMENT SCREEN
 * View, update, and manage W-9 tax information
 * IRS certification and TIN verification
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface W9Info {
  id: string;
  name: string;
  business_name?: string;
  federal_tax_classification: string;
  exempt_payee_code?: string;
  fatca_exemption_code?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  tin_type: 'ssn' | 'ein';
  tin_last_four: string;
  tin_verified: boolean;
  certification_date?: string;
  status: 'complete' | 'incomplete' | 'pending_verification';
  last_updated: string;
}

const TAX_CLASSIFICATIONS = [
  { value: 'individual', label: 'Individual/sole proprietor', short: 'Individual' },
  { value: 'c_corp', label: 'C Corporation', short: 'C Corp' },
  { value: 's_corp', label: 'S Corporation', short: 'S Corp' },
  { value: 'partnership', label: 'Partnership', short: 'Partnership' },
  { value: 'trust', label: 'Trust/estate', short: 'Trust' },
  { value: 'llc_c', label: 'LLC (C corporation)', short: 'LLC-C' },
  { value: 'llc_s', label: 'LLC (S corporation)', short: 'LLC-S' },
  { value: 'llc_p', label: 'LLC (Partnership)', short: 'LLC-P' },
  { value: 'llc_d', label: 'LLC (Disregarded entity)', short: 'LLC-D' },
  { value: 'other', label: 'Other', short: 'Other' },
];

export default function ContractorW9Screen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [w9Info, setW9Info] = useState<W9Info | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showCertification, setShowCertification] = useState(false);
  
  const [editedW9, setEditedW9] = useState<Partial<W9Info>>({});

  const fetchW9 = useCallback(async () => {
    try {
      const response = await api.get('/api/contractor/w9');
      setW9Info(response.data.w9 || null);
    } catch (error) {
      console.error('Failed to fetch W-9:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchW9();
  }, [fetchW9]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchW9();
  };

  const handleStartEdit = () => {
    if (w9Info) {
      setEditedW9({ ...w9Info });
    }
    setEditMode(true);
  };

  const handleSaveW9 = async () => {
    if (!editedW9.name?.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await api.put('/api/contractor/w9', editedW9);
      if (response.data.success) {
        setW9Info(response.data.w9);
        setEditMode(false);
        Alert.alert('Success', 'W-9 information updated successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save W-9');
    } finally {
      setSaving(false);
    }
  };

  const handleCertify = async () => {
    Alert.alert(
      'IRS Certification',
      'Under penalties of perjury, I certify that:\n\n1. The number shown is my correct taxpayer identification number.\n\n2. I am not subject to backup withholding.\n\n3. I am a U.S. citizen or other U.S. person.\n\n4. The FATCA code(s) entered are correct.\n\nDo you certify that this information is true and correct?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'I Certify',
          onPress: async () => {
            try {
              const response = await api.post('/api/contractor/w9/certify');
              if (response.data.success) {
                fetchW9();
                Alert.alert('Success', 'W-9 has been certified');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to certify W-9');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return '#10B981';
      case 'pending_verification': return '#F59E0B';
      case 'incomplete': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'complete': return 'Complete & Verified';
      case 'pending_verification': return 'Pending Verification';
      case 'incomplete': return 'Incomplete';
      default: return status;
    }
  };

  const getTaxClassificationLabel = (value: string) => {
    return TAX_CLASSIFICATIONS.find(t => t.value === value)?.label || value;
  };

  const renderViewMode = () => (
    <View style={styles.content}>
      <View style={styles.statusCard}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(w9Info?.status || 'incomplete') }]} />
        <View style={styles.statusContent}>
          <Text style={styles.statusLabel}>W-9 Status</Text>
          <Text style={[styles.statusValue, { color: getStatusColor(w9Info?.status || 'incomplete') }]}>
            {getStatusLabel(w9Info?.status || 'incomplete')}
          </Text>
        </View>
        {w9Info?.certification_date && (
          <Text style={styles.certificationDate}>
            Certified: {new Date(w9Info.certification_date).toLocaleDateString()}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Taxpayer Information</Text>
          <TouchableOpacity onPress={handleStartEdit}>
            <Ionicons name="create-outline" size={20} color="#1473FF" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{w9Info?.name}</Text>
          </View>
          {w9Info?.business_name && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Business Name</Text>
              <Text style={styles.infoValue}>{w9Info.business_name}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tax Classification</Text>
            <Text style={styles.infoValue}>
              {getTaxClassificationLabel(w9Info?.federal_tax_classification || '')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>
              {w9Info?.address.street}{'\n'}
              {w9Info?.address.city}, {w9Info?.address.state} {w9Info?.address.zip}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tax Identification Number</Text>

        <View style={styles.tinCard}>
          <View style={styles.tinHeader}>
            <View style={[styles.tinIcon, { backgroundColor: w9Info?.tin_verified ? '#10B98120' : '#F59E0B20' }]}>
              <Ionicons 
                name={w9Info?.tin_verified ? "checkmark-shield" : "shield"} 
                size={28} 
                color={w9Info?.tin_verified ? "#10B981" : "#F59E0B"} 
              />
            </View>
            <View style={styles.tinInfo}>
              <Text style={styles.tinType}>
                {w9Info?.tin_type === 'ssn' ? 'Social Security Number' : 'Employer Identification Number'}
              </Text>
              <Text style={styles.tinNumber}>
                •••-••-{w9Info?.tin_last_four}
              </Text>
            </View>
          </View>
          
          {w9Info?.tin_verified ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.verifiedText}>TIN Verified</Text>
            </View>
          ) : (
            <View style={styles.pendingBadge}>
              <Ionicons name="time" size={16} color="#F59E0B" />
              <Text style={styles.pendingText}>Verification Pending</Text>
            </View>
          )}
        </View>
      </View>

      {w9Info?.status !== 'complete' && (
        <TouchableOpacity style={styles.certifyButton} onPress={handleCertify}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.certifyGradient}
          >
            <Ionicons name="shield-checkmark" size={22} color="#FFF" />
            <Text style={styles.certifyText}>Certify W-9</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      <View style={styles.infoSection}>
        <Ionicons name="information-circle" size={24} color="#3B82F6" />
        <View style={styles.infoSectionContent}>
          <Text style={styles.infoSectionTitle}>About Form W-9</Text>
          <Text style={styles.infoSectionText}>
            The W-9 is used to provide your taxpayer identification number to clients who pay you $600 or more. 
            They use this information to report payments to the IRS on Form 1099-NEC.
          </Text>
        </View>
      </View>

      <Text style={styles.lastUpdated}>
        Last updated: {w9Info?.last_updated ? new Date(w9Info.last_updated).toLocaleDateString() : 'Never'}
      </Text>
    </View>
  );

  const renderEditMode = () => (
    <ScrollView style={styles.editContent}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Name (as shown on your income tax return) *</Text>
        <TextInput
          style={styles.input}
          value={editedW9.name || ''}
          onChangeText={(text) => setEditedW9(prev => ({ ...prev, name: text }))}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Business Name (if different)</Text>
        <TextInput
          style={styles.input}
          value={editedW9.business_name || ''}
          onChangeText={(text) => setEditedW9(prev => ({ ...prev, business_name: text }))}
          placeholder="Optional"
          placeholderTextColor="#666"
        />
      </View>

      <Text style={styles.inputLabel}>Federal Tax Classification *</Text>
      <View style={styles.classificationGrid}>
        {TAX_CLASSIFICATIONS.map((classification) => (
          <TouchableOpacity
            key={classification.value}
            style={[
              styles.classificationOption,
              editedW9.federal_tax_classification === classification.value && styles.classificationSelected
            ]}
            onPress={() => setEditedW9(prev => ({ ...prev, federal_tax_classification: classification.value }))}
          >
            <Text style={[
              styles.classificationText,
              editedW9.federal_tax_classification === classification.value && styles.classificationTextSelected
            ]}>
              {classification.short}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Address</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Street Address *</Text>
        <TextInput
          style={styles.input}
          value={editedW9.address?.street || ''}
          onChangeText={(text) => setEditedW9(prev => ({
            ...prev,
            address: { ...prev.address!, street: text }
          }))}
        />
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 2 }]}>
          <Text style={styles.inputLabel}>City *</Text>
          <TextInput
            style={styles.input}
            value={editedW9.address?.city || ''}
            onChangeText={(text) => setEditedW9(prev => ({
              ...prev,
              address: { ...prev.address!, city: text }
            }))}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
          <Text style={styles.inputLabel}>State *</Text>
          <TextInput
            style={styles.input}
            value={editedW9.address?.state || ''}
            onChangeText={(text) => setEditedW9(prev => ({
              ...prev,
              address: { ...prev.address!, state: text }
            }))}
            maxLength={2}
            autoCapitalize="characters"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>ZIP Code *</Text>
        <TextInput
          style={styles.input}
          value={editedW9.address?.zip || ''}
          onChangeText={(text) => setEditedW9(prev => ({
            ...prev,
            address: { ...prev.address!, zip: text }
          }))}
          keyboardType="number-pad"
          maxLength={5}
        />
      </View>

      <View style={styles.warningCard}>
        <Ionicons name="warning" size={24} color="#F59E0B" />
        <Text style={styles.warningText}>
          To update your TIN (SSN or EIN), please contact support. This requires additional verification.
        </Text>
      </View>

      <View style={styles.editActions}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => setEditMode(false)}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSaveW9}
          disabled={saving}
        >
          <LinearGradient
            colors={['#1473FF', '#BE01FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveGradient}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
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
          <TouchableOpacity onPress={() => editMode ? setEditMode(false) : navigation.goBack()}>
            <Ionicons name={editMode ? "close" : "arrow-back"} size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editMode ? 'Edit W-9' : 'W-9 Information'}</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          !editMode ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" /> : undefined
        }
      >
        {editMode ? renderEditMode() : renderViewMode()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  editContent: {
    padding: 16,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 14,
  },
  statusContent: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  certificationDate: {
    fontSize: 11,
    color: '#666',
  },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: colors.card,
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
    color: colors.text,
    fontWeight: '500',
    flex: 1.5,
    textAlign: 'right',
  },
  tinCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  tinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  tinIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  tinInfo: {
    flex: 1,
  },
  tinType: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  tinNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 4,
    letterSpacing: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98120',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#10B981',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B20',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  pendingText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#F59E0B',
  },
  certifyButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  certifyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  certifyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#3B82F620',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoSectionContent: {
    flex: 1,
  },
  infoSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  infoSectionText: {
    fontSize: 13,
    color: '#a0a0a0',
    lineHeight: 18,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
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
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  inputRow: {
    flexDirection: 'row',
  },
  classificationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  classificationOption: {
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#2a2a4e',
  },
  classificationSelected: {
    borderColor: '#1473FF',
    backgroundColor: '#1473FF20',
  },
  classificationText: {
    fontSize: 13,
    color: '#a0a0a0',
    fontWeight: '500',
  },
  classificationTextSelected: {
    color: '#1473FF',
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B20',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
    marginTop: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#F59E0B',
    lineHeight: 18,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#a0a0a0',
    fontWeight: '500',
  },
  saveButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
