/**
 * EMPLOYEE PROFILE SCREEN
 * Self-service employee profile management
 * Personal info, contact details, emergency contacts, preferences
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
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface EmployeeProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profile_photo_url?: string;
  date_of_birth: string;
  ssn_last_four: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  emergency_contact: {
    name: string;
    relationship: string;
    phone: string;
  };
  employment: {
    employee_id: string;
    department: string;
    job_title: string;
    hire_date: string;
    employment_type: string;
    manager_name?: string;
  };
  preferences: {
    email_notifications: boolean;
    sms_notifications: boolean;
    language: string;
    timezone: string;
  };
}

export default function EmployeeProfileScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editSection, setEditSection] = useState<string | null>(null);
  const [editedProfile, setEditedProfile] = useState<Partial<EmployeeProfile>>({});

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get('/api/employee/profile');
      setProfile(response.data.profile || null);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleEditSection = (section: string) => {
    setEditSection(section);
    if (profile) {
      setEditedProfile({ ...profile });
    }
  };

  const handleSaveSection = async () => {
    setSaving(true);
    try {
      const response = await api.put('/api/employee/profile', editedProfile);
      if (response.data.success) {
        setProfile(response.data.profile);
        setEditSection(null);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to change your photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        const formData = new FormData();
        formData.append('photo', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any);

        const response = await api.post('/api/employee/profile/photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response.data.success) {
          fetchProfile();
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to upload photo');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderContactEditModal = () => (
    <Modal
      visible={editSection === 'contact'}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setEditSection(null)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Contact Info</Text>
          <TouchableOpacity onPress={handleSaveSection} disabled={saving}>
            <Text style={[styles.modalSave, saving && { opacity: 0.5 }]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={editedProfile.email || ''}
              onChangeText={(text) => setEditedProfile(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={editedProfile.phone || ''}
              onChangeText={(text) => setEditedProfile(prev => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.sectionLabel}>Address</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Street Address</Text>
            <TextInput
              style={styles.input}
              value={editedProfile.address?.street || ''}
              onChangeText={(text) => setEditedProfile(prev => ({
                ...prev,
                address: { ...prev.address!, street: text }
              }))}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                value={editedProfile.address?.city || ''}
                onChangeText={(text) => setEditedProfile(prev => ({
                  ...prev,
                  address: { ...prev.address!, city: text }
                }))}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.input}
                value={editedProfile.address?.state || ''}
                onChangeText={(text) => setEditedProfile(prev => ({
                  ...prev,
                  address: { ...prev.address!, state: text }
                }))}
                maxLength={2}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ZIP Code</Text>
            <TextInput
              style={styles.input}
              value={editedProfile.address?.zip || ''}
              onChangeText={(text) => setEditedProfile(prev => ({
                ...prev,
                address: { ...prev.address!, zip: text }
              }))}
              keyboardType="number-pad"
              maxLength={5}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderEmergencyEditModal = () => (
    <Modal
      visible={editSection === 'emergency'}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setEditSection(null)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Emergency Contact</Text>
          <TouchableOpacity onPress={handleSaveSection} disabled={saving}>
            <Text style={[styles.modalSave, saving && { opacity: 0.5 }]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contact Name</Text>
            <TextInput
              style={styles.input}
              value={editedProfile.emergency_contact?.name || ''}
              onChangeText={(text) => setEditedProfile(prev => ({
                ...prev,
                emergency_contact: { ...prev.emergency_contact!, name: text }
              }))}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Relationship</Text>
            <TextInput
              style={styles.input}
              value={editedProfile.emergency_contact?.relationship || ''}
              onChangeText={(text) => setEditedProfile(prev => ({
                ...prev,
                emergency_contact: { ...prev.emergency_contact!, relationship: text }
              }))}
              placeholder="e.g., Spouse, Parent, Sibling"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={editedProfile.emergency_contact?.phone || ''}
              onChangeText={(text) => setEditedProfile(prev => ({
                ...prev,
                emergency_contact: { ...prev.emergency_contact!, phone: text }
              }))}
              keyboardType="phone-pad"
            />
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
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleChangePhoto}>
            {profile?.profile_photo_url ? (
              <Image source={{ uri: profile.profile_photo_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </Text>
              </View>
            )}
            <View style={styles.cameraButton}>
              <Ionicons name="camera" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>{profile?.first_name} {profile?.last_name}</Text>
          <Text style={styles.profileTitle}>{profile?.employment.job_title}</Text>
          <Text style={styles.profileDept}>{profile?.employment.department}</Text>
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
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <TouchableOpacity onPress={() => handleEditSection('contact')}>
              <Ionicons name="create-outline" size={20} color="#1473FF" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="mail" size={18} color="#3B82F6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile?.email}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="call" size={18} color="#10B981" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{profile?.phone || 'Not provided'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="location" size={18} color="#F59E0B" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>
                  {profile?.address ? 
                    `${profile.address.street}\n${profile.address.city}, ${profile.address.state} ${profile.address.zip}` :
                    'Not provided'
                  }
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            <TouchableOpacity onPress={() => handleEditSection('emergency')}>
              <Ionicons name="create-outline" size={20} color="#1473FF" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            {profile?.emergency_contact?.name ? (
              <>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="person" size={18} color="#EF4444" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{profile.emergency_contact.relationship}</Text>
                    <Text style={styles.infoValue}>{profile.emergency_contact.name}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="call" size={18} color="#EF4444" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{profile.emergency_contact.phone}</Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.emptyContact}>
                <Ionicons name="alert-circle" size={24} color="#F59E0B" />
                <Text style={styles.emptyContactText}>No emergency contact on file</Text>
                <TouchableOpacity 
                  style={styles.addContactButton}
                  onPress={() => handleEditSection('emergency')}
                >
                  <Text style={styles.addContactText}>Add Contact</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Employment Details</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="id-card" size={18} color="#8B5CF6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Employee ID</Text>
                <Text style={styles.infoValue}>{profile?.employment.employee_id}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar" size={18} color="#8B5CF6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Hire Date</Text>
                <Text style={styles.infoValue}>{formatDate(profile?.employment.hire_date || '')}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="briefcase" size={18} color="#8B5CF6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Employment Type</Text>
                <Text style={styles.infoValue}>{profile?.employment.employment_type}</Text>
              </View>
            </View>

            {profile?.employment.manager_name && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="people" size={18} color="#8B5CF6" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Reports To</Text>
                  <Text style={styles.infoValue}>{profile.employment.manager_name}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('DirectDepositSetup')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#10B98120' }]}>
                <Ionicons name="card" size={22} color="#10B981" />
              </View>
              <Text style={styles.quickActionText}>Direct Deposit</Text>
              <Ionicons name="chevron-forward" size={18} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('W4Wizard')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#3B82F620' }]}>
                <Ionicons name="document-text" size={22} color="#3B82F6" />
              </View>
              <Text style={styles.quickActionText}>Tax Withholding (W-4)</Text>
              <Ionicons name="chevron-forward" size={18} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('BenefitsEnrollment')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#F59E0B20' }]}>
                <Ionicons name="heart" size={22} color="#F59E0B" />
              </View>
              <Text style={styles.quickActionText}>Benefits</Text>
              <Ionicons name="chevron-forward" size={18} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('ChangePassword')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#EF444420' }]}>
                <Ionicons name="lock-closed" size={22} color="#EF4444" />
              </View>
              <Text style={styles.quickActionText}>Change Password</Text>
              <Ionicons name="chevron-forward" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {renderContactEditModal()}
      {renderEmergencyEditModal()}
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
    paddingBottom: 24,
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
  profileHeader: {
    alignItems: 'center',
    marginTop: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#1473FF',
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1473FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1473FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  profileTitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  profileDept: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    padding: 16,
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
    alignItems: 'flex-start',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#FFF',
    lineHeight: 20,
  },
  emptyContact: {
    alignItems: 'center',
    padding: 24,
  },
  emptyContactText: {
    fontSize: 14,
    color: '#F59E0B',
    marginTop: 8,
  },
  addContactButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#1473FF',
    borderRadius: 8,
  },
  addContactText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
  },
  quickActions: {
    gap: 10,
    marginTop: 4,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  quickActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  quickActionText: {
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
});
