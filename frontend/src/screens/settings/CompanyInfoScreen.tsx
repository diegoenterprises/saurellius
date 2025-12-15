/**
 * SAURELLIUS COMPANY INFO
 * View and edit company information
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
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

interface CompanyData {
  company_name: string;
  ein: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
}

const CompanyInfoScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, gradients } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData>({
    company_name: '',
    ein: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: '',
  });

  const fetchCompanyInfo = useCallback(async () => {
    try {
      const response = await api.get('/api/company/info');
      setCompanyData(response.data?.data || {});
    } catch (error) {
      // Mock data
      setCompanyData({
        company_name: 'Diego Enterprises LLC',
        ein: 'XX-XXXXXXX',
        address: '123 Business Center Dr',
        city: 'Houston',
        state: 'TX',
        zip: '77001',
        phone: '(555) 123-4567',
        email: 'payroll@diegoenterprises.com',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanyInfo();
  }, [fetchCompanyInfo]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCompanyInfo();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/company/info', companyData);
      Alert.alert('Success', 'Company information updated');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update company information');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (label: string, key: keyof CompanyData, icon: string, editable = true) => (
    <View style={[styles.fieldContainer, { borderBottomColor: colors.border }]}>
      <View style={styles.fieldIcon}>
        <Ionicons name={icon as any} size={20} color={colors.primary} />
      </View>
      <View style={styles.fieldContent}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
        {isEditing && editable ? (
          <TextInput
            style={[styles.fieldInput, { color: colors.text, borderColor: colors.border }]}
            value={companyData[key]}
            onChangeText={(text) => setCompanyData(prev => ({ ...prev, [key]: text }))}
            placeholderTextColor={colors.textSecondary}
          />
        ) : (
          <Text style={[styles.fieldValue, { color: colors.text }]}>{companyData[key] || '-'}</Text>
        )}
      </View>
    </View>
  );

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
          <Text style={styles.headerTitle}>Company Info</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => isEditing ? handleSave() : setIsEditing(true)}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {renderField('Company Name', 'company_name', 'business-outline')}
          {renderField('EIN', 'ein', 'document-text-outline', false)}
          {renderField('Address', 'address', 'location-outline')}
          {renderField('City', 'city', 'map-outline')}
          {renderField('State', 'state', 'flag-outline')}
          {renderField('ZIP Code', 'zip', 'mail-outline')}
          {renderField('Phone', 'phone', 'call-outline')}
          {renderField('Email', 'email', 'at-outline')}
        </View>

        {isEditing && (
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={() => {
              setIsEditing(false);
              fetchCompanyInfo();
            }}
          >
            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
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
  editButton: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  editButtonText: { color: '#fff', fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
  fieldContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  fieldIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(20, 115, 255, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: 12, marginBottom: 4 },
  fieldValue: { fontSize: 16 },
  fieldInput: { fontSize: 16, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderRadius: 8 },
  cancelButton: { marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '500' },
});

export default CompanyInfoScreen;
