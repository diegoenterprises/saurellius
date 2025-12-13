/**
 * EMPLOYER PTO MANAGEMENT SCREEN
 * Manage company PTO policies and employee requests
 * Configure accrual rules, approve/deny requests, view balances
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface PTORequest {
  id: string;
  employee_name: string;
  employee_id: string;
  type: 'vacation' | 'sick' | 'personal' | 'bereavement' | 'jury_duty';
  start_date: string;
  end_date: string;
  hours: number;
  status: 'pending' | 'approved' | 'denied';
  reason?: string;
  submitted_at: string;
  balance_after: number;
}

interface PTOPolicy {
  id: string;
  name: string;
  type: string;
  accrual_rate: number;
  accrual_frequency: string;
  max_balance: number;
  carryover_limit: number;
  employees_count: number;
}

interface PTOStats {
  pending_requests: number;
  approved_today: number;
  total_hours_used_ytd: number;
  employees_on_pto: number;
}

export default function PTOManagementScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'policies'>('requests');
  const [requests, setRequests] = useState<PTORequest[]>([]);
  const [policies, setPolicies] = useState<PTOPolicy[]>([]);
  const [stats, setStats] = useState<PTOStats | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('pending');

  const fetchData = useCallback(async () => {
    try {
      const [requestsRes, policiesRes, statsRes] = await Promise.all([
        api.get('/api/employer/pto/requests', { params: { status: filterStatus !== 'all' ? filterStatus : undefined } }),
        api.get('/api/employer/pto/policies'),
        api.get('/api/employer/pto/stats'),
      ]);
      setRequests(requestsRes.data.requests || []);
      setPolicies(policiesRes.data.policies || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch PTO data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vacation': return '#3B82F6';
      case 'sick': return '#EF4444';
      case 'personal': return '#8B5CF6';
      case 'bereavement': return '#6B7280';
      case 'jury_duty': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const handleApprove = async (request: PTORequest) => {
    Alert.alert('Approve Request', `Approve ${request.hours} hours of ${request.type} for ${request.employee_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: async () => {
        try {
          await api.post(`/api/employer/pto/requests/${request.id}/approve`);
          fetchData();
          Alert.alert('Success', 'Request approved');
        } catch (error) {
          Alert.alert('Error', 'Failed to approve request');
        }
      }},
    ]);
  };

  const handleDeny = async (request: PTORequest) => {
    Alert.alert('Deny Request', `Deny this PTO request from ${request.employee_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Deny', style: 'destructive', onPress: async () => {
        try {
          await api.post(`/api/employer/pto/requests/${request.id}/deny`);
          fetchData();
          Alert.alert('Success', 'Request denied');
        } catch (error) {
          Alert.alert('Error', 'Failed to deny request');
        }
      }},
    ]);
  };

  const renderRequestCard = (request: PTORequest) => (
    <View key={request.id} style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.employeeInfo}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{request.employee_name[0]}</Text></View>
          <View>
            <Text style={styles.employeeName}>{request.employee_name}</Text>
            <View style={[styles.typeBadge, { backgroundColor: getTypeColor(request.type) + '20' }]}>
              <Text style={[styles.typeText, { color: getTypeColor(request.type) }]}>{request.type}</Text>
            </View>
          </View>
        </View>
        <View style={styles.hoursBox}>
          <Text style={styles.hoursValue}>{request.hours}h</Text>
          <Text style={styles.hoursLabel}>requested</Text>
        </View>
      </View>

      <View style={styles.dateRow}>
        <Ionicons name="calendar" size={14} color="#666" />
        <Text style={styles.dateText}>{formatDate(request.start_date)} - {formatDate(request.end_date)}</Text>
      </View>

      {request.reason && <Text style={styles.reason} numberOfLines={2}>{request.reason}</Text>}

      <View style={styles.balanceInfo}>
        <Text style={styles.balanceLabel}>Balance after approval:</Text>
        <Text style={styles.balanceValue}>{request.balance_after}h</Text>
      </View>

      {request.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, styles.denyButton]} onPress={() => handleDeny(request)}>
            <Ionicons name="close" size={18} color="#EF4444" />
            <Text style={styles.denyText}>Deny</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={() => handleApprove(request)}>
            <Ionicons name="checkmark" size={18} color="#FFF" />
            <Text style={styles.approveText}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderPolicyCard = (policy: PTOPolicy) => (
    <View key={policy.id} style={styles.policyCard}>
      <View style={styles.policyHeader}>
        <Text style={styles.policyName}>{policy.name}</Text>
        <View style={[styles.typeBadge, { backgroundColor: getTypeColor(policy.type) + '20' }]}>
          <Text style={[styles.typeText, { color: getTypeColor(policy.type) }]}>{policy.type}</Text>
        </View>
      </View>
      <View style={styles.policyDetails}>
        <View style={styles.policyItem}><Text style={styles.policyLabel}>Accrual Rate</Text><Text style={styles.policyValue}>{policy.accrual_rate}h/{policy.accrual_frequency}</Text></View>
        <View style={styles.policyItem}><Text style={styles.policyLabel}>Max Balance</Text><Text style={styles.policyValue}>{policy.max_balance}h</Text></View>
        <View style={styles.policyItem}><Text style={styles.policyLabel}>Carryover</Text><Text style={styles.policyValue}>{policy.carryover_limit}h</Text></View>
        <View style={styles.policyItem}><Text style={styles.policyLabel}>Employees</Text><Text style={styles.policyValue}>{policy.employees_count}</Text></View>
      </View>
    </View>
  );

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>PTO Management</Text>
          <TouchableOpacity><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pending_requests}</Text><Text style={styles.statLabel}>Pending</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.approved_today}</Text><Text style={styles.statLabel}>Approved</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.employees_on_pto}</Text><Text style={styles.statLabel}>On PTO</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'requests' && styles.tabActive]} onPress={() => setActiveTab('requests')}>
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'policies' && styles.tabActive]} onPress={() => setActiveTab('policies')}>
          <Text style={[styles.tabText, activeTab === 'policies' && styles.tabTextActive]}>Policies</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'requests' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
          {['pending', 'approved', 'denied', 'all'].map(status => (
            <TouchableOpacity key={status} style={[styles.filterChip, filterStatus === status && styles.filterChipActive]} onPress={() => { setFilterStatus(status); setLoading(true); }}>
              <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {activeTab === 'requests' ? (
            requests.length > 0 ? requests.map(renderRequestCard) : (
              <View style={styles.emptyState}><Ionicons name="calendar-outline" size={48} color="#666" /><Text style={styles.emptyText}>No {filterStatus} requests</Text></View>
            )
          ) : (
            policies.length > 0 ? policies.map(renderPolicyCard) : (
              <View style={styles.emptyState}><Ionicons name="document-outline" size={48} color="#666" /><Text style={styles.emptyText}>No policies configured</Text></View>
            )
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingBottom: 16 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  statsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 12, padding: 14 },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 12 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: '#1473FF' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#a0a0a0' },
  tabTextActive: { color: '#FFF' },
  filterBar: { paddingHorizontal: 16, paddingVertical: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1a1a2e', marginRight: 8, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 13, color: '#a0a0a0', fontWeight: '500' },
  filterChipTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: { padding: 16 },
  requestCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  employeeInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  employeeName: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4, alignSelf: 'flex-start' },
  typeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  hoursBox: { alignItems: 'center', backgroundColor: '#0f0f23', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  hoursValue: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  hoursLabel: { fontSize: 10, color: '#666' },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  dateText: { fontSize: 13, color: '#a0a0a0' },
  reason: { fontSize: 13, color: '#666', marginTop: 8, fontStyle: 'italic' },
  balanceInfo: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  balanceLabel: { fontSize: 12, color: '#666' },
  balanceValue: { fontSize: 12, fontWeight: '600', color: '#10B981' },
  actionButtons: { flexDirection: 'row', marginTop: 12, gap: 10 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  denyButton: { backgroundColor: '#EF444420' },
  approveButton: { backgroundColor: '#10B981' },
  denyText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
  approveText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  policyCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  policyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  policyName: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  policyDetails: { flexDirection: 'row', flexWrap: 'wrap' },
  policyItem: { width: '50%', paddingVertical: 6 },
  policyLabel: { fontSize: 11, color: '#666' },
  policyValue: { fontSize: 14, fontWeight: '500', color: '#FFF', marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
