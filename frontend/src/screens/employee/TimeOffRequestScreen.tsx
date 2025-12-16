/**
 * EMPLOYEE TIME OFF REQUEST SCREEN
 * Submit and manage PTO, sick leave, and other time-off requests
 * View balances, request history, and approval status
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
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface TimeOffBalance {
  type: string;
  type_label: string;
  available: number;
  used: number;
  pending: number;
  accrual_rate: number;
  max_carryover: number;
}

interface TimeOffRequest {
  id: string;
  type: string;
  type_label: string;
  start_date: string;
  end_date: string;
  hours: number;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  denial_reason?: string;
}

const TIME_OFF_TYPES = [
  { id: 'pto', label: 'Paid Time Off', icon: 'sunny', color: '#F59E0B' },
  { id: 'sick', label: 'Sick Leave', icon: 'medkit', color: '#EF4444' },
  { id: 'personal', label: 'Personal Day', icon: 'person', color: '#8B5CF6' },
  { id: 'bereavement', label: 'Bereavement', icon: 'heart', color: '#6B7280' },
  { id: 'jury_duty', label: 'Jury Duty', icon: 'briefcase', color: '#3B82F6' },
  { id: 'unpaid', label: 'Unpaid Leave', icon: 'time', color: '#9CA3AF' },
];

export default function TimeOffRequestScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balances, setBalances] = useState<TimeOffBalance[]>([]);
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'balances' | 'requests' | 'calendar'>('balances');
  
  const [newRequest, setNewRequest] = useState({
    type: '',
    start_date: '',
    end_date: '',
    hours: '',
    notes: '',
  });

  const fetchTimeOffData = useCallback(async () => {
    try {
      const [balancesRes, requestsRes] = await Promise.all([
        api.get('/api/employee/time-off/balances'),
        api.get('/api/employee/time-off/requests'),
      ]);
      
      setBalances(balancesRes.data.balances || []);
      setRequests(requestsRes.data.requests || []);
    } catch (error) {
      console.error('Failed to fetch time-off data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTimeOffData();
  }, [fetchTimeOffData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTimeOffData();
  };

  const getTypeInfo = (typeId: string) => {
    return TIME_OFF_TYPES.find(t => t.id === typeId) || TIME_OFF_TYPES[0];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'denied': return '#EF4444';
      case 'cancelled': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const handleSubmitRequest = async () => {
    if (!newRequest.type) {
      Alert.alert('Error', 'Please select a time-off type');
      return;
    }
    if (!newRequest.start_date || !newRequest.end_date) {
      Alert.alert('Error', 'Please select start and end dates');
      return;
    }

    try {
      const response = await api.post('/api/employee/time-off/request', {
        ...newRequest,
        hours: parseFloat(newRequest.hours) || 8,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Time-off request submitted successfully');
        setShowRequestModal(false);
        resetNewRequest();
        fetchTimeOffData();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit request');
    }
  };

  const handleCancelRequest = (requestId: string) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this time-off request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/api/employee/time-off/requests/${requestId}/cancel`);
              fetchTimeOffData();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel request');
            }
          },
        },
      ]
    );
  };

  const resetNewRequest = () => {
    setNewRequest({
      type: '',
      start_date: '',
      end_date: '',
      hours: '',
      notes: '',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderBalanceCard = (balance: TimeOffBalance) => {
    const typeInfo = getTypeInfo(balance.type);
    const totalAvailable = balance.available + balance.pending;
    const usagePercent = totalAvailable > 0 ? (balance.used / (balance.used + totalAvailable)) * 100 : 0;

    return (
      <View key={balance.type} style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <View style={[styles.balanceIcon, { backgroundColor: typeInfo.color + '20' }]}>
            <Ionicons name={typeInfo.icon as any} size={24} color={typeInfo.color} />
          </View>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceType}>{balance.type_label}</Text>
            <Text style={styles.balanceAccrual}>
              Accrues {balance.accrual_rate} hrs/pay period
            </Text>
          </View>
        </View>

        <View style={styles.balanceStats}>
          <View style={styles.balanceStat}>
            <Text style={styles.balanceStatValue}>{balance.available}</Text>
            <Text style={styles.balanceStatLabel}>Available</Text>
          </View>
          <View style={styles.balanceStat}>
            <Text style={[styles.balanceStatValue, { color: '#F59E0B' }]}>{balance.pending}</Text>
            <Text style={styles.balanceStatLabel}>Pending</Text>
          </View>
          <View style={styles.balanceStat}>
            <Text style={[styles.balanceStatValue, { color: '#a0a0a0' }]}>{balance.used}</Text>
            <Text style={styles.balanceStatLabel}>Used</Text>
          </View>
        </View>

        <View style={styles.balanceProgress}>
          <View style={styles.balanceProgressBar}>
            <View style={[styles.balanceProgressUsed, { width: `${usagePercent}%` }]} />
          </View>
        </View>
      </View>
    );
  };

  const renderRequestItem = ({ item }: { item: TimeOffRequest }) => {
    const typeInfo = getTypeInfo(item.type);

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={[styles.requestTypeIcon, { backgroundColor: typeInfo.color + '20' }]}>
            <Ionicons name={typeInfo.icon as any} size={20} color={typeInfo.color} />
          </View>
          <View style={styles.requestInfo}>
            <Text style={styles.requestType}>{item.type_label}</Text>
            <Text style={styles.requestDates}>
              {formatDate(item.start_date)} - {formatDate(item.end_date)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.requestDetails}>
          <View style={styles.requestDetail}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.requestDetailText}>{item.hours} hours</Text>
          </View>
          {item.notes && (
            <View style={styles.requestDetail}>
              <Ionicons name="document-text-outline" size={16} color="#666" />
              <Text style={styles.requestDetailText} numberOfLines={1}>{item.notes}</Text>
            </View>
          )}
        </View>

        {item.status === 'pending' && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => handleCancelRequest(item.id)}
          >
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          </TouchableOpacity>
        )}

        {item.status === 'denied' && item.denial_reason && (
          <View style={styles.denialReason}>
            <Ionicons name="information-circle" size={16} color="#EF4444" />
            <Text style={styles.denialReasonText}>{item.denial_reason}</Text>
          </View>
        )}

        {item.status === 'approved' && item.approved_by && (
          <View style={styles.approvalInfo}>
            <Text style={styles.approvalText}>
              Approved by {item.approved_by}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderRequestModal = () => (
    <Modal
      visible={showRequestModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowRequestModal(false)}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Request Time Off</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.sectionLabel}>Type of Time Off</Text>
          <View style={styles.typeGrid}>
            {TIME_OFF_TYPES.map((type) => {
              const balance = balances.find(b => b.type === type.id);
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeOption,
                    newRequest.type === type.id && styles.typeOptionSelected,
                    { borderColor: newRequest.type === type.id ? type.color : '#2a2a4e' }
                  ]}
                  onPress={() => setNewRequest(prev => ({ ...prev, type: type.id }))}
                >
                  <View style={[styles.typeOptionIcon, { backgroundColor: type.color + '20' }]}>
                    <Ionicons name={type.icon as any} size={20} color={type.color} />
                  </View>
                  <Text style={styles.typeOptionLabel}>{type.label}</Text>
                  {balance && (
                    <Text style={styles.typeOptionBalance}>{balance.available} hrs avail</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Start Date *</Text>
            <TextInput
              style={styles.input}
              value={newRequest.start_date}
              onChangeText={(text) => setNewRequest(prev => ({ ...prev, start_date: text }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>End Date *</Text>
            <TextInput
              style={styles.input}
              value={newRequest.end_date}
              onChangeText={(text) => setNewRequest(prev => ({ ...prev, end_date: text }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hours (optional)</Text>
            <TextInput
              style={styles.input}
              value={newRequest.hours}
              onChangeText={(text) => setNewRequest(prev => ({ ...prev, hours: text }))}
              placeholder="8"
              placeholderTextColor="#666"
              keyboardType="decimal-pad"
            />
            <Text style={styles.inputHelper}>Leave blank for full days (8 hours each)</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newRequest.notes}
              onChangeText={(text) => setNewRequest(prev => ({ ...prev, notes: text }))}
              placeholder="Reason for request..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmitRequest}
          >
            <LinearGradient
              colors={['#1473FF', '#BE01FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButtonGradient}
            >
              <Ionicons name="send" size={20} color="#FFF" />
              <Text style={styles.submitButtonText}>Submit Request</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Time Off</Text>
          <TouchableOpacity onPress={() => setShowRequestModal(true)}>
            <Ionicons name="add-circle" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.totalBalance}>
          <Text style={styles.totalBalanceLabel}>Total Available</Text>
          <Text style={styles.totalBalanceValue}>
            {balances.reduce((sum, b) => sum + b.available, 0)} hours
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.tabs}>
        {(['balances', 'requests'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'balances' ? (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />
          }
        >
          {balances.map(renderBalanceCard)}
          
          <TouchableOpacity 
            style={styles.requestButton}
            onPress={() => setShowRequestModal(true)}
          >
            <Ionicons name="add-circle" size={20} color="#1473FF" />
            <Text style={styles.requestButtonText}>Request Time Off</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color="#666" />
              <Text style={styles.emptyStateText}>No time-off requests</Text>
              <Text style={styles.emptyStateSubtext}>Your request history will appear here</Text>
            </View>
          }
        />
      )}

      {renderRequestModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  totalBalance: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  totalBalanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  totalBalanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 12,
  },
  tabActive: {
    backgroundColor: '#1473FF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    padding: 16,
  },
  balanceCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceType: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  balanceAccrual: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  balanceStat: {
    alignItems: 'center',
  },
  balanceStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  balanceStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  balanceProgress: {
    marginTop: 4,
  },
  balanceProgressBar: {
    height: 6,
    backgroundColor: '#2a2a4e',
    borderRadius: 3,
  },
  balanceProgressUsed: {
    height: '100%',
    backgroundColor: '#a0a0a0',
    borderRadius: 3,
  },
  requestCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestType: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  requestDates: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  requestDetails: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    paddingTop: 12,
    gap: 8,
  },
  requestDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestDetailText: {
    fontSize: 13,
    color: '#a0a0a0',
    flex: 1,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  denialReason: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EF444420',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  denialReasonText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
  },
  approvalInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  approvalText: {
    fontSize: 12,
    color: '#10B981',
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1473FF20',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    gap: 8,
  },
  requestButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1473FF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
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
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  typeOption: {
    width: '31%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2a2a4e',
  },
  typeOptionSelected: {
    backgroundColor: '#1473FF10',
  },
  typeOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeOptionLabel: {
    fontSize: 11,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  typeOptionBalance: {
    fontSize: 10,
    color: '#10B981',
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputHelper: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
