/**
 * EMPLOYEE EXPENSE CLAIMS SCREEN
 * Submit and track expense reimbursements
 * Upload receipts, categorize expenses, view history
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
import { useTheme } from '../../context/ThemeContext';

interface ExpenseClaim {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed';
  receipt_url?: string;
  notes?: string;
  submitted_at?: string;
  reviewed_at?: string;
  reviewer_name?: string;
  rejection_reason?: string;
}

interface ExpenseStats {
  pending_amount: number;
  approved_ytd: number;
  reimbursed_ytd: number;
  pending_count: number;
}

const CATEGORIES = [
  { id: 'travel', name: 'Travel', icon: 'airplane', color: '#3B82F6' },
  { id: 'meals', name: 'Meals', icon: 'restaurant', color: '#F59E0B' },
  { id: 'lodging', name: 'Lodging', icon: 'bed', color: '#8B5CF6' },
  { id: 'supplies', name: 'Supplies', icon: 'cart', color: '#10B981' },
  { id: 'equipment', name: 'Equipment', icon: 'hardware-chip', color: '#EC4899' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280' },
];

export default function ExpenseClaimsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ description: '', category: 'travel', amount: '', date: new Date().toISOString().split('T')[0], notes: '' });

  const fetchData = useCallback(async () => {
    try {
      const [claimsRes, statsRes] = await Promise.all([
        api.get('/api/employee/expense-claims', { params: { status: filterStatus !== 'all' ? filterStatus : undefined } }),
        api.get('/api/employee/expense-claims/stats'),
      ]);
      setClaims(claimsRes.data.claims || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch expense claims:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reimbursed': return '#10B981';
      case 'approved': return '#3B82F6';
      case 'submitted': return '#F59E0B';
      case 'rejected': return '#EF4444';
      case 'draft': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getCategoryInfo = (categoryId: string) => CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[5];

  const handleSubmitClaim = async () => {
    if (!formData.description.trim() || !formData.amount) {
      Alert.alert('Error', 'Description and amount are required');
      return;
    }
    try {
      await api.post('/api/employee/expense-claims', { ...formData, amount: parseFloat(formData.amount) });
      setShowAddModal(false);
      setFormData({ description: '', category: 'travel', amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
      fetchData();
      Alert.alert('Success', 'Expense claim submitted');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit claim');
    }
  };

  const handleDeleteClaim = (claim: ExpenseClaim) => {
    if (claim.status !== 'draft') return;
    Alert.alert('Delete Claim', 'Delete this expense claim?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete('/api/employee/expense-claims/' + claim.id);
          fetchData();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete claim');
        }
      }},
    ]);
  };

  const renderClaimCard = (claim: ExpenseClaim) => {
    const categoryInfo = getCategoryInfo(claim.category);
    return (
      <TouchableOpacity key={claim.id} style={styles.claimCard} onLongPress={() => handleDeleteClaim(claim)}>
        <View style={styles.claimHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
            <Ionicons name={categoryInfo.icon as any} size={20} color={categoryInfo.color} />
          </View>
          <View style={styles.claimInfo}>
            <Text style={styles.claimDescription}>{claim.description}</Text>
            <Text style={styles.claimCategory}>{categoryInfo.name}</Text>
          </View>
          <View style={styles.claimRight}>
            <Text style={styles.claimAmount}>{formatCurrency(claim.amount)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(claim.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(claim.status) }]}>{claim.status}</Text>
            </View>
          </View>
        </View>
        <View style={styles.claimFooter}>
          <Text style={styles.claimDate}>{formatDate(claim.date)}</Text>
          {claim.reviewer_name && <Text style={styles.reviewerText}>Reviewed by {claim.reviewer_name}</Text>}
        </View>
        {claim.rejection_reason && (
          <View style={styles.rejectionBox}>
            <Ionicons name="alert-circle" size={14} color="#EF4444" />
            <Text style={styles.rejectionText}>{claim.rejection_reason}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Expense Claims</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{formatCurrency(stats.pending_amount)}</Text><Text style={styles.statLabel}>Pending</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3B82F6' }]}>{formatCurrency(stats.approved_ytd)}</Text><Text style={styles.statLabel}>Approved</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{formatCurrency(stats.reimbursed_ytd)}</Text><Text style={styles.statLabel}>Reimbursed</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {['all', 'draft', 'submitted', 'approved', 'rejected', 'reimbursed'].map(status => (
          <TouchableOpacity key={status} style={[styles.filterChip, filterStatus === status && styles.filterChipActive]} onPress={() => { setFilterStatus(status); setLoading(true); }}>
            <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {claims.length > 0 ? claims.map(renderClaimCard) : (
            <View style={styles.emptyState}><Ionicons name="receipt-outline" size={48} color="#666" /><Text style={styles.emptyText}>No expense claims</Text></View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>New Expense</Text>
            <TouchableOpacity onPress={handleSubmitClaim}><Text style={styles.modalSave}>Submit</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Description *</Text><TextInput style={styles.input} value={formData.description} onChangeText={t => setFormData(p => ({...p, description: t}))} placeholder="What was the expense for?" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Amount *</Text><TextInput style={styles.input} value={formData.amount} onChangeText={t => setFormData(p => ({...p, amount: t}))} placeholder="0.00" placeholderTextColor="#666" keyboardType="decimal-pad" /></View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat.id} style={[styles.categoryOption, formData.category === cat.id && styles.categoryOptionActive]} onPress={() => setFormData(p => ({...p, category: cat.id}))}>
                    <Ionicons name={cat.icon as any} size={20} color={formData.category === cat.id ? '#FFF' : cat.color} />
                    <Text style={[styles.categoryOptionText, formData.category === cat.id && styles.categoryOptionTextActive]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Notes</Text><TextInput style={[styles.input, styles.textArea]} value={formData.notes} onChangeText={t => setFormData(p => ({...p, notes: t}))} placeholder="Additional details..." placeholderTextColor="#666" multiline numberOfLines={3} /></View>
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
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1a1a2e', marginRight: 8, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 13, color: '#a0a0a0', fontWeight: '500' },
  filterChipTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  claimCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  claimHeader: { flexDirection: 'row', alignItems: 'center' },
  categoryIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  claimInfo: { flex: 1 },
  claimDescription: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  claimCategory: { fontSize: 12, color: '#666', marginTop: 2 },
  claimRight: { alignItems: 'flex-end' },
  claimAmount: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  claimFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  claimDate: { fontSize: 12, color: '#666' },
  reviewerText: { fontSize: 12, color: '#666' },
  rejectionBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF444420', padding: 10, borderRadius: 8, marginTop: 10, gap: 6 },
  rejectionText: { flex: 1, fontSize: 12, color: '#EF4444' },
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
  textArea: { height: 80, textAlignVertical: 'top' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#2a2a4e', borderRadius: 10, gap: 6 },
  categoryOptionActive: { backgroundColor: '#1473FF' },
  categoryOptionText: { fontSize: 12, color: '#a0a0a0' },
  categoryOptionTextActive: { color: '#FFF' },
});
