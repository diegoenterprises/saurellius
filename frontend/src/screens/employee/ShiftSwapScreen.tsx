/**
 * EMPLOYEE SHIFT SWAP SCREEN
 * Request and manage shift swaps with coworkers
 * View available shifts, send/receive swap requests
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

interface Shift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  department: string;
  position: string;
}

interface SwapRequest {
  id: string;
  type: 'sent' | 'received';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  my_shift: Shift;
  their_shift: Shift;
  other_employee_name: string;
  created_at: string;
  responded_at?: string;
  reason?: string;
}

interface AvailableShift extends Shift {
  employee_name: string;
  employee_id: string;
}

export default function ShiftSwapScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'available'>('requests');
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [availableShifts, setAvailableShifts] = useState<AvailableShift[]>([]);
  const [myShifts, setMyShifts] = useState<Shift[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [requestsRes, availableRes, myShiftsRes] = await Promise.all([
        api.get('/api/employee/shift-swaps'),
        api.get('/api/employee/shift-swaps/available'),
        api.get('/api/employee/shifts/upcoming'),
      ]);
      setRequests(requestsRes.data.requests || []);
      setAvailableShifts(availableRes.data.shifts || []);
      setMyShifts(myShiftsRes.data.shifts || []);
    } catch (error) {
      console.error('Failed to fetch shift data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'rejected': case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const handleRespondToRequest = async (request: SwapRequest, approve: boolean) => {
    Alert.alert(approve ? 'Approve Swap' : 'Reject Swap', `${approve ? 'Accept' : 'Decline'} this shift swap request?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: approve ? 'Approve' : 'Reject', style: approve ? 'default' : 'destructive', onPress: async () => {
        try {
          await api.post(`/api/employee/shift-swaps/${request.id}/${approve ? 'approve' : 'reject'}`);
          fetchData();
          Alert.alert('Success', `Swap request ${approve ? 'approved' : 'rejected'}`);
        } catch (error) {
          Alert.alert('Error', 'Failed to respond to request');
        }
      }},
    ]);
  };

  const handleRequestSwap = async (shift: AvailableShift) => {
    if (myShifts.length === 0) {
      Alert.alert('No Shifts', 'You have no upcoming shifts to swap');
      return;
    }
    Alert.alert('Request Swap', `Request to swap with ${shift.employee_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Request', onPress: async () => {
        try {
          await api.post('/api/employee/shift-swaps', { target_shift_id: shift.id, my_shift_id: myShifts[0].id });
          fetchData();
          Alert.alert('Success', 'Swap request sent');
        } catch (error) {
          Alert.alert('Error', 'Failed to send swap request');
        }
      }},
    ]);
  };

  const handleCancelRequest = async (request: SwapRequest) => {
    Alert.alert('Cancel Request', 'Cancel this swap request?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: async () => {
        try {
          await api.post(`/api/employee/shift-swaps/${request.id}/cancel`);
          fetchData();
        } catch (error) {
          Alert.alert('Error', 'Failed to cancel request');
        }
      }},
    ]);
  };

  const renderRequestCard = (request: SwapRequest) => (
    <View key={request.id} style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={[styles.typeBadge, { backgroundColor: request.type === 'received' ? '#3B82F620' : '#8B5CF620' }]}>
          <Ionicons name={request.type === 'received' ? 'arrow-down' : 'arrow-up'} size={14} color={request.type === 'received' ? '#3B82F6' : '#8B5CF6'} />
          <Text style={[styles.typeText, { color: request.type === 'received' ? '#3B82F6' : '#8B5CF6' }]}>{request.type === 'received' ? 'Incoming' : 'Outgoing'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>{request.status}</Text>
        </View>
      </View>

      <Text style={styles.employeeName}>{request.other_employee_name}</Text>

      <View style={styles.shiftsComparison}>
        <View style={styles.shiftBox}>
          <Text style={styles.shiftLabel}>Your Shift</Text>
          <Text style={styles.shiftDate}>{formatDate(request.my_shift.date)}</Text>
          <Text style={styles.shiftTime}>{request.my_shift.start_time} - {request.my_shift.end_time}</Text>
        </View>
        <Ionicons name="swap-horizontal" size={24} color="#1473FF" />
        <View style={styles.shiftBox}>
          <Text style={styles.shiftLabel}>Their Shift</Text>
          <Text style={styles.shiftDate}>{formatDate(request.their_shift.date)}</Text>
          <Text style={styles.shiftTime}>{request.their_shift.start_time} - {request.their_shift.end_time}</Text>
        </View>
      </View>

      {request.status === 'pending' && request.type === 'received' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => handleRespondToRequest(request, false)}>
            <Ionicons name="close" size={18} color="#EF4444" /><Text style={styles.rejectText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={() => handleRespondToRequest(request, true)}>
            <Ionicons name="checkmark" size={18} color="#FFF" /><Text style={styles.approveText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}

      {request.status === 'pending' && request.type === 'sent' && (
        <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancelRequest(request)}>
          <Text style={styles.cancelText}>Cancel Request</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAvailableShift = (shift: AvailableShift) => (
    <TouchableOpacity key={shift.id} style={styles.availableCard} onPress={() => handleRequestSwap(shift)}>
      <View style={styles.availableHeader}>
        <View style={styles.employeeAvatar}><Text style={styles.avatarText}>{shift.employee_name[0]}</Text></View>
        <View style={styles.availableInfo}>
          <Text style={styles.availableEmployee}>{shift.employee_name}</Text>
          <Text style={styles.availablePosition}>{shift.position}</Text>
        </View>
        <Ionicons name="swap-horizontal-outline" size={24} color="#1473FF" />
      </View>
      <View style={styles.availableDetails}>
        <View style={styles.detailItem}><Ionicons name="calendar" size={14} color="#666" /><Text style={styles.detailText}>{formatDate(shift.date)}</Text></View>
        <View style={styles.detailItem}><Ionicons name="time" size={14} color="#666" /><Text style={styles.detailText}>{shift.start_time} - {shift.end_time}</Text></View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  const pendingReceived = requests.filter(r => r.type === 'received' && r.status === 'pending').length;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Shift Swap</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'requests' && styles.tabActive]} onPress={() => setActiveTab('requests')}>
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>Requests</Text>
          {pendingReceived > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{pendingReceived}</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'available' && styles.tabActive]} onPress={() => setActiveTab('available')}>
          <Text style={[styles.tabText, activeTab === 'available' && styles.tabTextActive]}>Available ({availableShifts.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {activeTab === 'requests' ? (
            requests.length > 0 ? requests.map(renderRequestCard) : (
              <View style={styles.emptyState}><Ionicons name="swap-horizontal-outline" size={48} color="#666" /><Text style={styles.emptyText}>No swap requests</Text></View>
            )
          ) : (
            availableShifts.length > 0 ? availableShifts.map(renderAvailableShift) : (
              <View style={styles.emptyState}><Ionicons name="calendar-outline" size={48} color="#666" /><Text style={styles.emptyText}>No shifts available for swap</Text></View>
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
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  tabActive: { backgroundColor: '#1473FF' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#a0a0a0' },
  tabTextActive: { color: '#FFF' },
  badge: { backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#FFF' },
  content: { flex: 1 },
  section: { padding: 16 },
  requestCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, gap: 4 },
  typeText: { fontSize: 11, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  employeeName: { fontSize: 16, fontWeight: '600', color: '#FFF', marginBottom: 12 },
  shiftsComparison: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f0f23', borderRadius: 12, padding: 12 },
  shiftBox: { flex: 1, alignItems: 'center' },
  shiftLabel: { fontSize: 10, color: '#666', marginBottom: 4 },
  shiftDate: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  shiftTime: { fontSize: 11, color: '#a0a0a0', marginTop: 2 },
  actionButtons: { flexDirection: 'row', marginTop: 14, gap: 10 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  rejectButton: { backgroundColor: '#EF444420' },
  approveButton: { backgroundColor: '#10B981' },
  rejectText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
  approveText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  cancelButton: { alignItems: 'center', marginTop: 12 },
  cancelText: { fontSize: 13, color: '#EF4444' },
  availableCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  availableHeader: { flexDirection: 'row', alignItems: 'center' },
  employeeAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  availableInfo: { flex: 1 },
  availableEmployee: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  availablePosition: { fontSize: 12, color: '#666', marginTop: 2 },
  availableDetails: { flexDirection: 'row', marginTop: 12, gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: '#a0a0a0' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
