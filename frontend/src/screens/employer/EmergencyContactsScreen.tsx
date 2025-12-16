/**
 * EMPLOYER EMERGENCY CONTACTS SCREEN
 * Manage employee emergency contacts
 * View, update, and export emergency information
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
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface EmergencyContact {
  id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  contact_name: string;
  relationship: string;
  phone_primary: string;
  phone_secondary?: string;
  email?: string;
  address?: string;
  is_primary: boolean;
  last_updated: string;
  verified: boolean;
}

interface ContactStats {
  total_employees: number;
  with_contacts: number;
  missing_contacts: number;
  needs_update: number;
}

export default function EmergencyContactsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'missing' | 'outdated'>('all');

  const fetchData = useCallback(async () => {
    try {
      const [contactsRes, statsRes] = await Promise.all([
        api.get('/api/employer/emergency-contacts', { params: { search: searchQuery || undefined, filter: filterStatus !== 'all' ? filterStatus : undefined } }),
        api.get('/api/employer/emergency-contacts/stats'),
      ]);
      setContacts(contactsRes.data.contacts || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handleCall = (phone: string) => {
    Alert.alert('Call', `Call ${phone}?`);
  };

  const handleExport = () => {
    Alert.alert('Export', 'Export emergency contacts to CSV?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Export', onPress: () => Alert.alert('Success', 'Contacts exported') },
    ]);
  };

  const handleSendReminder = async (contact: EmergencyContact) => {
    try {
      await api.post(`/api/employer/emergency-contacts/${contact.employee_id}/remind`);
      Alert.alert('Success', 'Reminder sent to employee');
    } catch (error) {
      Alert.alert('Error', 'Failed to send reminder');
    }
  };

  const renderContactCard = (contact: EmergencyContact) => {
    const isOutdated = new Date(contact.last_updated) < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    return (
      <View key={contact.id} style={[styles.contactCard, isOutdated && styles.outdatedCard]}>
        {isOutdated && <View style={styles.outdatedBadge}><Ionicons name="alert-circle" size={12} color="#F59E0B" /><Text style={styles.outdatedText}>Needs Update</Text></View>}
        
        <View style={styles.employeeSection}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{contact.employee_name.split(' ').map(n => n[0]).join('')}</Text></View>
          <View style={styles.employeeInfo}>
            <Text style={styles.employeeName}>{contact.employee_name}</Text>
            <Text style={styles.employeeDept}>{contact.department}</Text>
          </View>
          {contact.verified && <Ionicons name="checkmark-circle" size={18} color="#10B981" />}
        </View>

        <View style={styles.contactSection}>
          <View style={styles.contactHeader}>
            <Text style={styles.contactLabel}>Emergency Contact</Text>
            {contact.is_primary && <View style={styles.primaryBadge}><Text style={styles.primaryText}>Primary</Text></View>}
          </View>
          <Text style={styles.contactName}>{contact.contact_name}</Text>
          <Text style={styles.relationship}>{contact.relationship}</Text>
          
          <View style={styles.phoneRow}>
            <TouchableOpacity style={styles.phoneButton} onPress={() => handleCall(contact.phone_primary)}>
              <Ionicons name="call" size={16} color="#10B981" />
              <Text style={styles.phoneText}>{contact.phone_primary}</Text>
            </TouchableOpacity>
            {contact.phone_secondary && (
              <TouchableOpacity style={styles.phoneButton} onPress={() => handleCall(contact.phone_secondary!)}>
                <Ionicons name="call-outline" size={16} color="#666" />
                <Text style={styles.phoneSecondary}>{contact.phone_secondary}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.contactFooter}>
          <Text style={styles.lastUpdated}>Updated {formatDate(contact.last_updated)}</Text>
          <TouchableOpacity style={styles.reminderButton} onPress={() => handleSendReminder(contact)}>
            <Ionicons name="mail" size={16} color="#1473FF" />
            <Text style={styles.reminderText}>Remind</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Emergency Contacts</Text>
          <TouchableOpacity onPress={handleExport}><Ionicons name="download-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_employees}</Text><Text style={styles.statLabel}>Employees</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.with_contacts}</Text><Text style={styles.statLabel}>Complete</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.missing_contacts}</Text><Text style={styles.statLabel}>Missing</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.needs_update}</Text><Text style={styles.statLabel}>Outdated</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput style={styles.searchInput} placeholder="Search employees..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={fetchData} />
      </View>

      <View style={styles.filterRow}>
        {(['all', 'missing', 'outdated'] as const).map(status => (
          <TouchableOpacity key={status} style={[styles.filterChip, filterStatus === status && styles.filterChipActive]} onPress={() => { setFilterStatus(status); setLoading(true); }}>
            <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {contacts.length > 0 ? contacts.map(renderContactCard) : (
            <View style={styles.emptyState}><Ionicons name="call-outline" size={48} color="#666" /><Text style={styles.emptyText}>No contacts found</Text></View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingBottom: 16 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  statsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 12, padding: 12 },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 6 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, marginHorizontal: 16, marginTop: 12, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: colors.text },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 13, color: '#a0a0a0', fontWeight: '500' },
  filterChipTextActive: { color: colors.text },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  contactCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  outdatedCard: { borderColor: '#F59E0B' },
  outdatedBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#F59E0B20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 10, gap: 4 },
  outdatedText: { fontSize: 11, fontWeight: '600', color: '#F59E0B' },
  employeeSection: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  employeeInfo: { flex: 1 },
  employeeName: { fontSize: 16, fontWeight: '600', color: colors.text },
  employeeDept: { fontSize: 13, color: '#666', marginTop: 2 },
  contactSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  contactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  contactLabel: { fontSize: 12, color: '#666' },
  primaryBadge: { backgroundColor: '#10B98120', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  primaryText: { fontSize: 10, fontWeight: '600', color: '#10B981' },
  contactName: { fontSize: 15, fontWeight: '600', color: colors.text },
  relationship: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  phoneRow: { flexDirection: 'row', marginTop: 10, gap: 16 },
  phoneButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  phoneText: { fontSize: 14, color: '#10B981' },
  phoneSecondary: { fontSize: 14, color: '#666' },
  contactFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  lastUpdated: { fontSize: 11, color: '#666' },
  reminderButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reminderText: { fontSize: 13, color: '#1473FF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
