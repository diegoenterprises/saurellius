/**
 * EMPLOYEE EMERGENCY INFO SCREEN
 * Manage emergency contacts and medical information
 * Critical information for workplace safety
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

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone_primary: string;
  phone_secondary?: string;
  email?: string;
  is_primary: boolean;
}

interface MedicalInfo {
  blood_type?: string;
  allergies: string[];
  medical_conditions: string[];
  medications: string[];
  physician_name?: string;
  physician_phone?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
}

interface EmergencyInfo {
  contacts: EmergencyContact[];
  medical: MedicalInfo;
  last_updated?: string;
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
const RELATIONSHIPS = ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'];

export default function EmergencyInfoScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [emergencyInfo, setEmergencyInfo] = useState<EmergencyInfo | null>(null);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingMedical, setEditingMedical] = useState(false);

  const [contactForm, setContactForm] = useState({
    name: '',
    relationship: '',
    phone_primary: '',
    phone_secondary: '',
    email: '',
    is_primary: false,
  });

  const [medicalForm, setMedicalForm] = useState<MedicalInfo>({
    blood_type: '',
    allergies: [],
    medical_conditions: [],
    medications: [],
    physician_name: '',
    physician_phone: '',
    insurance_provider: '',
    insurance_policy_number: '',
  });

  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newMedication, setNewMedication] = useState('');

  const fetchEmergencyInfo = useCallback(async () => {
    try {
      const response = await api.get('/api/employee/emergency-info');
      const info = response.data.info || { contacts: [], medical: {} };
      setEmergencyInfo(info);
      setMedicalForm(info.medical || {
        blood_type: '',
        allergies: [],
        medical_conditions: [],
        medications: [],
        physician_name: '',
        physician_phone: '',
        insurance_provider: '',
        insurance_policy_number: '',
      });
    } catch (error) {
      console.error('Failed to fetch emergency info:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEmergencyInfo();
  }, [fetchEmergencyInfo]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEmergencyInfo();
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setContactForm({
      name: '',
      relationship: '',
      phone_primary: '',
      phone_secondary: '',
      email: '',
      is_primary: emergencyInfo?.contacts.length === 0,
    });
    setShowContactForm(true);
  };

  const handleEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name,
      relationship: contact.relationship,
      phone_primary: contact.phone_primary,
      phone_secondary: contact.phone_secondary || '',
      email: contact.email || '',
      is_primary: contact.is_primary,
    });
    setShowContactForm(true);
  };

  const handleSaveContact = async () => {
    if (!contactForm.name.trim() || !contactForm.phone_primary.trim()) {
      Alert.alert('Required', 'Name and primary phone are required');
      return;
    }

    setSaving(true);
    try {
      if (editingContact) {
        await api.put(`/api/employee/emergency-contacts/${editingContact.id}`, contactForm);
      } else {
        await api.post('/api/employee/emergency-contacts', contactForm);
      }
      setShowContactForm(false);
      fetchEmergencyInfo();
      Alert.alert('Success', 'Emergency contact saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = (contact: EmergencyContact) => {
    Alert.alert(
      'Delete Contact',
      `Remove ${contact.name} as an emergency contact?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/employee/emergency-contacts/${contact.id}`);
              fetchEmergencyInfo();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete contact');
            }
          },
        },
      ]
    );
  };

  const handleSaveMedical = async () => {
    setSaving(true);
    try {
      await api.put('/api/employee/medical-info', medicalForm);
      setEditingMedical(false);
      fetchEmergencyInfo();
      Alert.alert('Success', 'Medical information saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save medical info');
    } finally {
      setSaving(false);
    }
  };

  const addToList = (field: 'allergies' | 'medical_conditions' | 'medications', value: string) => {
    if (!value.trim()) return;
    setMedicalForm(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), value.trim()]
    }));
    if (field === 'allergies') setNewAllergy('');
    if (field === 'medical_conditions') setNewCondition('');
    if (field === 'medications') setNewMedication('');
  };

  const removeFromList = (field: 'allergies' | 'medical_conditions' | 'medications', index: number) => {
    setMedicalForm(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index)
    }));
  };

  const renderContactCard = (contact: EmergencyContact) => (
    <View key={contact.id} style={styles.contactCard}>
      <View style={styles.contactHeader}>
        <View style={styles.contactAvatar}>
          <Ionicons name="person" size={24} color="#EF4444" />
        </View>
        <View style={styles.contactInfo}>
          <View style={styles.contactNameRow}>
            <Text style={styles.contactName}>{contact.name}</Text>
            {contact.is_primary && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryText}>Primary</Text>
              </View>
            )}
          </View>
          <Text style={styles.contactRelationship}>{contact.relationship}</Text>
        </View>
        <TouchableOpacity onPress={() => handleEditContact(contact)}>
          <Ionicons name="create-outline" size={20} color="#1473FF" />
        </TouchableOpacity>
      </View>

      <View style={styles.contactDetails}>
        <View style={styles.contactDetailRow}>
          <Ionicons name="call" size={16} color="#10B981" />
          <Text style={styles.contactDetailText}>{contact.phone_primary}</Text>
          <Text style={styles.contactDetailLabel}>Primary</Text>
        </View>
        {contact.phone_secondary && (
          <View style={styles.contactDetailRow}>
            <Ionicons name="call-outline" size={16} color="#666" />
            <Text style={styles.contactDetailText}>{contact.phone_secondary}</Text>
            <Text style={styles.contactDetailLabel}>Secondary</Text>
          </View>
        )}
        {contact.email && (
          <View style={styles.contactDetailRow}>
            <Ionicons name="mail" size={16} color="#3B82F6" />
            <Text style={styles.contactDetailText}>{contact.email}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteContact(contact)}
      >
        <Ionicons name="trash-outline" size={16} color="#EF4444" />
        <Text style={styles.deleteButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContactForm = () => (
    <View style={styles.formSection}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>
          {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
        </Text>
        <TouchableOpacity onPress={() => setShowContactForm(false)}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={contactForm.name}
          onChangeText={(text) => setContactForm(prev => ({ ...prev, name: text }))}
          placeholder="Enter full name"
          placeholderTextColor="#666"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Relationship *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {RELATIONSHIPS.map((rel) => (
            <TouchableOpacity
              key={rel}
              style={[styles.chip, contactForm.relationship === rel && styles.chipActive]}
              onPress={() => setContactForm(prev => ({ ...prev, relationship: rel }))}
            >
              <Text style={[styles.chipText, contactForm.relationship === rel && styles.chipTextActive]}>
                {rel}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Primary Phone *</Text>
        <TextInput
          style={styles.input}
          value={contactForm.phone_primary}
          onChangeText={(text) => setContactForm(prev => ({ ...prev, phone_primary: text }))}
          placeholder="(555) 123-4567"
          placeholderTextColor="#666"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Secondary Phone</Text>
        <TextInput
          style={styles.input}
          value={contactForm.phone_secondary}
          onChangeText={(text) => setContactForm(prev => ({ ...prev, phone_secondary: text }))}
          placeholder="Optional"
          placeholderTextColor="#666"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.input}
          value={contactForm.email}
          onChangeText={(text) => setContactForm(prev => ({ ...prev, email: text }))}
          placeholder="Optional"
          placeholderTextColor="#666"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setContactForm(prev => ({ ...prev, is_primary: !prev.is_primary }))}
      >
        <Ionicons 
          name={contactForm.is_primary ? "checkbox" : "square-outline"} 
          size={24} 
          color={contactForm.is_primary ? "#1473FF" : "#666"} 
        />
        <Text style={styles.checkboxLabel}>Set as primary emergency contact</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.saveButton, saving && styles.buttonDisabled]}
        onPress={handleSaveContact}
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
            <Text style={styles.saveText}>Save Contact</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderMedicalSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Medical Information</Text>
        <TouchableOpacity onPress={() => setEditingMedical(!editingMedical)}>
          <Ionicons name={editingMedical ? "close" : "create-outline"} size={20} color="#1473FF" />
        </TouchableOpacity>
      </View>

      {editingMedical ? (
        <View style={styles.medicalForm}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Blood Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {BLOOD_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, medicalForm.blood_type === type && styles.chipActive]}
                  onPress={() => setMedicalForm(prev => ({ ...prev, blood_type: type }))}
                >
                  <Text style={[styles.chipText, medicalForm.blood_type === type && styles.chipTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Allergies</Text>
            <View style={styles.listInputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={newAllergy}
                onChangeText={setNewAllergy}
                placeholder="Add allergy"
                placeholderTextColor="#666"
              />
              <TouchableOpacity 
                style={styles.addItemButton}
                onPress={() => addToList('allergies', newAllergy)}
              >
                <Ionicons name="add" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.tagList}>
              {medicalForm.allergies?.map((item, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{item}</Text>
                  <TouchableOpacity onPress={() => removeFromList('allergies', index)}>
                    <Ionicons name="close" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Medical Conditions</Text>
            <View style={styles.listInputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={newCondition}
                onChangeText={setNewCondition}
                placeholder="Add condition"
                placeholderTextColor="#666"
              />
              <TouchableOpacity 
                style={styles.addItemButton}
                onPress={() => addToList('medical_conditions', newCondition)}
              >
                <Ionicons name="add" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.tagList}>
              {medicalForm.medical_conditions?.map((item, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{item}</Text>
                  <TouchableOpacity onPress={() => removeFromList('medical_conditions', index)}>
                    <Ionicons name="close" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Medications</Text>
            <View style={styles.listInputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={newMedication}
                onChangeText={setNewMedication}
                placeholder="Add medication"
                placeholderTextColor="#666"
              />
              <TouchableOpacity 
                style={styles.addItemButton}
                onPress={() => addToList('medications', newMedication)}
              >
                <Ionicons name="add" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.tagList}>
              {medicalForm.medications?.map((item, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{item}</Text>
                  <TouchableOpacity onPress={() => removeFromList('medications', index)}>
                    <Ionicons name="close" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Primary Physician</Text>
            <TextInput
              style={styles.input}
              value={medicalForm.physician_name}
              onChangeText={(text) => setMedicalForm(prev => ({ ...prev, physician_name: text }))}
              placeholder="Doctor's name"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Physician Phone</Text>
            <TextInput
              style={styles.input}
              value={medicalForm.physician_phone}
              onChangeText={(text) => setMedicalForm(prev => ({ ...prev, physician_phone: text }))}
              placeholder="Phone number"
              placeholderTextColor="#666"
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSaveMedical}
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
                <Text style={styles.saveText}>Save Medical Info</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.medicalCard}>
          <View style={styles.medicalRow}>
            <Text style={styles.medicalLabel}>Blood Type</Text>
            <Text style={styles.medicalValue}>{emergencyInfo?.medical?.blood_type || 'Not specified'}</Text>
          </View>
          <View style={styles.medicalRow}>
            <Text style={styles.medicalLabel}>Allergies</Text>
            <Text style={styles.medicalValue}>
              {emergencyInfo?.medical?.allergies?.length 
                ? emergencyInfo.medical.allergies.join(', ')
                : 'None listed'}
            </Text>
          </View>
          <View style={styles.medicalRow}>
            <Text style={styles.medicalLabel}>Conditions</Text>
            <Text style={styles.medicalValue}>
              {emergencyInfo?.medical?.medical_conditions?.length 
                ? emergencyInfo.medical.medical_conditions.join(', ')
                : 'None listed'}
            </Text>
          </View>
          <View style={styles.medicalRow}>
            <Text style={styles.medicalLabel}>Medications</Text>
            <Text style={styles.medicalValue}>
              {emergencyInfo?.medical?.medications?.length 
                ? emergencyInfo.medical.medications.join(', ')
                : 'None listed'}
            </Text>
          </View>
        </View>
      )}
    </View>
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
          <Text style={styles.headerTitle}>Emergency Information</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />
        }
      >
        <View style={styles.alertBanner}>
          <Ionicons name="alert-circle" size={24} color="#EF4444" />
          <Text style={styles.alertText}>
            This information is critical for your safety. Please keep it up to date.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            {!showContactForm && (
              <TouchableOpacity onPress={handleAddContact}>
                <Ionicons name="add-circle" size={24} color="#1473FF" />
              </TouchableOpacity>
            )}
          </View>

          {showContactForm ? (
            renderContactForm()
          ) : emergencyInfo?.contacts && emergencyInfo.contacts.length > 0 ? (
            emergencyInfo.contacts.map(renderContactCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>No emergency contacts added</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddContact}>
                <Text style={styles.emptyButtonText}>Add Contact</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {renderMedicalSection()}

        {emergencyInfo?.last_updated && (
          <Text style={styles.lastUpdated}>
            Last updated: {new Date(emergencyInfo.last_updated).toLocaleDateString()}
          </Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF444420',
    margin: 16,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: '#EF4444',
    lineHeight: 20,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  contactCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EF444420',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  primaryBadge: {
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  primaryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F59E0B',
  },
  contactRelationship: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 2,
  },
  contactDetails: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    paddingTop: 12,
  },
  contactDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  contactDetailText: {
    flex: 1,
    fontSize: 14,
    color: '#FFF',
  },
  contactDetailLabel: {
    fontSize: 11,
    color: '#666',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    gap: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#EF4444',
  },
  formSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
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
    backgroundColor: '#0f0f23',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  chipScroll: {
    marginTop: 6,
  },
  chip: {
    backgroundColor: '#2a2a4e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#1473FF',
  },
  chipText: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  chipTextActive: {
    color: '#FFF',
    fontWeight: '500',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#FFF',
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveGradient: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  emptyButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1473FF',
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
  },
  medicalCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  medicalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  medicalLabel: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  medicalValue: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  medicalForm: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  listInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addItemButton: {
    width: 48,
    height: 48,
    backgroundColor: '#1473FF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a4e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 13,
    color: '#FFF',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});
