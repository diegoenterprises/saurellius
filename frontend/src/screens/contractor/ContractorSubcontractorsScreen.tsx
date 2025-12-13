/**
 * CONTRACTOR SUBCONTRACTORS SCREEN
 * Manage subcontractors working under you
 * Track assignments, payments, and documentation
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

interface Subcontractor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialty: string;
  status: 'active' | 'inactive' | 'pending';
  hourly_rate?: number;
  total_paid_ytd: number;
  active_projects: number;
  w9_on_file: boolean;
  insurance_verified: boolean;
  created_at: string;
  last_payment_date?: string;
}

interface SubcontractorStats {
  total_subcontractors: number;
  active: number;
  total_paid_ytd: number;
  pending_payments: number;
}

export default function ContractorSubcontractorsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [stats, setStats] = useState<SubcontractorStats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', specialty: '', hourly_rate: '' });

  const fetchData = useCallback(async () => {
    try {
      const [subsRes, statsRes] = await Promise.all([
        api.get('/api/contractor/subcontractors', { params: { search: searchQuery || undefined } }),
        api.get('/api/contractor/subcontractors/stats'),
      ]);
      setSubcontractors(subsRes.data.subcontractors || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch subcontractors:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#6B7280';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const handleAddSubcontractor = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }
    try {
      await api.post('/api/contractor/subcontractors', {
        ...formData,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : undefined,
      });
      setShowAddModal(false);
      setFormData({ name: '', email: '', phone: '', specialty: '', hourly_rate: '' });
      fetchData();
      Alert.alert('Success', 'Subcontractor added');
    } catch (error) {
      Alert.alert('Error', 'Failed to add subcontractor');
    }
  };

  const handleDeactivate = (sub: Subcontractor) => {
    Alert.alert('Deactivate Subcontractor', `Deactivate ${sub.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Deactivate', style: 'destructive', onPress: async () => {
        try {
          await api.post(`/api/contractor/subcontractors/${sub.id}/deactivate`);
          fetchData();
        } catch (error) {
          Alert.alert('Error', 'Failed to deactivate');
        }
      }},
    ]);
  };

  const renderSubcontractorCard = (sub: Subcontractor) => (
    <View key={sub.id} style={styles.subCard}>
      <View style={styles.subHeader}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{sub.name.split(' ').map(n => n[0]).join('')}</Text></View>
        <View style={styles.subInfo}>
          <Text style={styles.subName}>{sub.name}</Text>
          <Text style={styles.subSpecialty}>{sub.specialty}</Text>
          <Text style={styles.subEmail}>{sub.email}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(sub.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(sub.status) }]}>{sub.status}</Text>
        </View>
      </View>

      <View style={styles.subStats}>
        <View style={styles.subStatItem}>
          <Text style={styles.subStatValue}>{formatCurrency(sub.total_paid_ytd)}</Text>
          <Text style={styles.subStatLabel}>Paid YTD</Text>
        </View>
        <View style={styles.subStatItem}>
          <Text style={styles.subStatValue}>{sub.active_projects}</Text>
          <Text style={styles.subStatLabel}>Projects</Text>
        </View>
        {sub.hourly_rate && (
          <View style={styles.subStatItem}>
            <Text style={styles.subStatValue}>${sub.hourly_rate}/hr</Text>
            <Text style={styles.subStatLabel}>Rate</Text>
          </View>
        )}
      </View>

      <View style={styles.complianceRow}>
        <View style={[styles.complianceItem, sub.w9_on_file && styles.complianceOk]}>
          <Ionicons name={sub.w9_on_file ? 'checkmark-circle' : 'alert-circle'} size={16} color={sub.w9_on_file ? '#10B981' : '#EF4444'} />
          <Text style={[styles.complianceText, { color: sub.w9_on_file ? '#10B981' : '#EF4444' }]}>W-9</Text>
        </View>
        <View style={[styles.complianceItem, sub.insurance_verified && styles.complianceOk]}>
          <Ionicons name={sub.insurance_verified ? 'checkmark-circle' : 'alert-circle'} size={16} color={sub.insurance_verified ? '#10B981' : '#EF4444'} />
          <Text style={[styles.complianceText, { color: sub.insurance_verified ? '#10B981' : '#EF4444' }]}>Insurance</Text>
        </View>
      </View>

      <View style={styles.subActions}>
        <TouchableOpacity style={styles.actionButton}><Ionicons name="mail-outline" size={18} color="#1473FF" /></TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}><Ionicons name="call-outline" size={18} color="#10B981" /></TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}><Ionicons name="cash-outline" size={18} color="#F59E0B" /></TouchableOpacity>
        {sub.status === 'active' && (
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDeactivate(sub)}><Ionicons name="pause-circle-outline" size={18} color="#EF4444" /></TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Subcontractors</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_subcontractors}</Text><Text style={styles.statLabel}>Total</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.active}</Text><Text style={styles.statLabel}>Active</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{formatCurrency(stats.total_paid_ytd)}</Text><Text style={styles.statLabel}>Paid YTD</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput style={styles.searchInput} placeholder="Search subcontractors..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={fetchData} />
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {subcontractors.length > 0 ? subcontractors.map(renderSubcontractorCard) : (
            <View style={styles.emptyState}><Ionicons name="people-outline" size={48} color="#666" /><Text style={styles.emptyText}>No subcontractors</Text></View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Add Subcontractor</Text>
            <TouchableOpacity onPress={handleAddSubcontractor}><Text style={styles.modalSave}>Add</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Name *</Text><TextInput style={styles.input} value={formData.name} onChangeText={t => setFormData(p => ({...p, name: t}))} placeholder="Full name" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Email *</Text><TextInput style={styles.input} value={formData.email} onChangeText={t => setFormData(p => ({...p, email: t}))} placeholder="email@example.com" placeholderTextColor="#666" keyboardType="email-address" autoCapitalize="none" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Phone</Text><TextInput style={styles.input} value={formData.phone} onChangeText={t => setFormData(p => ({...p, phone: t}))} placeholder="(555) 555-5555" placeholderTextColor="#666" keyboardType="phone-pad" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Specialty</Text><TextInput style={styles.input} value={formData.specialty} onChangeText={t => setFormData(p => ({...p, specialty: t}))} placeholder="e.g., Electrical, Plumbing" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Hourly Rate</Text><TextInput style={styles.input} value={formData.hourly_rate} onChangeText={t => setFormData(p => ({...p, hourly_rate: t}))} placeholder="0.00" placeholderTextColor="#666" keyboardType="decimal-pad" /></View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingBottom: 16 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  statsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 12, padding: 12 },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', marginHorizontal: 16, marginTop: 12, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: '#FFF' },
  content: { flex: 1 },
  section: { padding: 16 },
  subCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  subHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  subInfo: { flex: 1 },
  subName: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  subSpecialty: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  subEmail: { fontSize: 12, color: '#666', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  subStats: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  subStatItem: { flex: 1, alignItems: 'center' },
  subStatValue: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  subStatLabel: { fontSize: 10, color: '#666', marginTop: 2 },
  complianceRow: { flexDirection: 'row', marginTop: 12, gap: 12 },
  complianceItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  complianceOk: {},
  complianceText: { fontSize: 12 },
  subActions: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 10 },
  actionButton: { padding: 10, backgroundColor: '#0f0f23', borderRadius: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
  modalContainer: { flex: 1, backgroundColor: '#0f0f23' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  modalCancel: { fontSize: 16, color: '#a0a0a0' },
  modalSave: { fontSize: 16, fontWeight: '600', color: '#1473FF' },
  modalContent: { padding: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, color: '#a0a0a0', marginBottom: 6 },
  input: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14, fontSize: 16, color: '#FFF', borderWidth: 1, borderColor: '#2a2a4e' },
});
