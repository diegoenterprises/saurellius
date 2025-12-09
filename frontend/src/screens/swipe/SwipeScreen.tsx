/**
 * SAURELLIUS SWIPE
 * Schedule Swap Request & Approval System
 * Employees can request shift swaps, and managers can approve them
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

interface Shift {
  id: string;
  employee_id: number;
  employee_name: string;
  date: string;
  start_time: string;
  end_time: string;
  display_time: string;
  position: string;
  position_color: {
    bg: string;
    text: string;
  };
}

interface SwapRequest {
  id: string;
  requester_id: number;
  requester_name: string;
  requester_shift: Shift;
  target_id: number;
  target_name: string;
  target_shift: Shift;
  reason: string;
  department: string;
  position: string;
  status: string;
  created_at: string;
  overtime_warning: boolean;
}

type TabType = 'pending' | 'my-requests' | 'history';

const SwipeScreen: React.FC<{ navigation?: any }> = ({ navigation: navProp }) => {
  const navigationHook = useNavigation();
  const navigation = navProp || navigationHook;
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [pendingRequests, setPendingRequests] = useState<SwapRequest[]>([]);
  const [myIncoming, setMyIncoming] = useState<SwapRequest[]>([]);
  const [myOutgoing, setMyOutgoing] = useState<SwapRequest[]>([]);
  const [history, setHistory] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SwapRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [managerNotes, setManagerNotes] = useState('');
  const [isManager, setIsManager] = useState(true); // TODO: Get from user context

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch pending manager approvals
      if (isManager) {
        const pendingRes = await api.get('/swipe/approval/pending');
        if (pendingRes.data.success) {
          setPendingRequests(pendingRes.data.pending_requests || []);
        }
      }

      // Fetch my requests
      const myRes = await api.get('/swipe/requests/my');
      if (myRes.data.success) {
        setMyIncoming(myRes.data.incoming || []);
        setMyOutgoing(myRes.data.outgoing || []);
      }

      // Fetch history
      const historyRes = await api.get('/swipe/history');
      if (historyRes.data.success) {
        setHistory(historyRes.data.history || []);
      }
    } catch (error) {
      console.error('Error fetching swipe data:', error);
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleManagerReview = async (requestId: string, approve: boolean) => {
    try {
      const response = await api.post(`/swipe/approval/${requestId}/review`, {
        approve,
        notes: managerNotes,
      });

      if (response.data.success) {
        Alert.alert(
          'Success',
          approve ? 'Swap request approved!' : 'Swap request denied.'
        );
        setShowDetailModal(false);
        setManagerNotes('');
        fetchData();
      }
    } catch (error) {
      console.error('Error reviewing request:', error);
      Alert.alert('Error', 'Failed to process request');
    }
  };

  const handleEmployeeResponse = async (requestId: string, accept: boolean) => {
    try {
      const response = await api.post(`/swipe/request/${requestId}/respond`, {
        accept,
      });

      if (response.data.success) {
        Alert.alert(
          'Success',
          accept
            ? 'Swap accepted! Waiting for manager approval.'
            : 'Swap request declined.'
        );
        fetchData();
      }
    } catch (error) {
      console.error('Error responding to request:', error);
      Alert.alert('Error', 'Failed to process response');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'accepted':
      case 'manager_pending':
        return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'manager_approved':
        return { bg: '#D1FAE5', text: '#065F46' };
      case 'declined':
      case 'manager_denied':
        return { bg: '#FEE2E2', text: '#991B1B' };
      default:
        return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Response';
      case 'accepted':
        return 'Accepted';
      case 'manager_pending':
        return 'Awaiting Manager';
      case 'manager_approved':
        return 'Approved';
      case 'declined':
        return 'Declined';
      case 'manager_denied':
        return 'Denied by Manager';
      default:
        return status;
    }
  };

  // Swap Request Card
  const SwapRequestCard: React.FC<{
    request: SwapRequest;
    showActions?: 'manager' | 'employee' | 'none';
  }> = ({ request, showActions = 'none' }) => {
    const statusColor = getStatusColor(request.status);

    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => {
          setSelectedRequest(request);
          setShowDetailModal(true);
        }}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View
            style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}
          >
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {getStatusLabel(request.status)}
            </Text>
          </View>
          {request.overtime_warning && (
            <View style={styles.overtimeWarning}>
              <Ionicons name="warning" size={14} color="#F59E0B" />
              <Text style={styles.overtimeText}>OT</Text>
            </View>
          )}
        </View>

        {/* Swap Details */}
        <View style={styles.swapContainer}>
          {/* Requester */}
          <View style={styles.shiftBox}>
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarTextSmall}>
                {request.requester_name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <Text style={styles.employeeName}>{request.requester_name}</Text>
            <View
              style={[
                styles.shiftPill,
                { backgroundColor: request.requester_shift.position_color?.bg || '#E2E8F0' },
              ]}
            >
              <Text style={styles.shiftDate}>
                {formatDate(request.requester_shift.date)}
              </Text>
              <Text
                style={[
                  styles.shiftTime,
                  { color: request.requester_shift.position_color?.text || '#475569' },
                ]}
              >
                {request.requester_shift.display_time}
              </Text>
            </View>
          </View>

          {/* Swap Arrow */}
          <View style={styles.swapArrow}>
            <Ionicons name="swap-horizontal" size={24} color="#6366F1" />
          </View>

          {/* Target */}
          <View style={styles.shiftBox}>
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarTextSmall}>
                {request.target_name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <Text style={styles.employeeName}>{request.target_name}</Text>
            <View
              style={[
                styles.shiftPill,
                { backgroundColor: request.target_shift.position_color?.bg || '#E2E8F0' },
              ]}
            >
              <Text style={styles.shiftDate}>
                {formatDate(request.target_shift.date)}
              </Text>
              <Text
                style={[
                  styles.shiftTime,
                  { color: request.target_shift.position_color?.text || '#475569' },
                ]}
              >
                {request.target_shift.display_time}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {showActions === 'manager' && request.status === 'manager_pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleManagerReview(request.id, true)}
            >
              <Text style={styles.approveBtnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleManagerReview(request.id, false)}
            >
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {showActions === 'employee' && request.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleEmployeeResponse(request.id, true)}
            >
              <Text style={styles.approveBtnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleEmployeeResponse(request.id, false)}
            >
              <Text style={styles.rejectBtnText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Tab Button
  const TabButton: React.FC<{
    tab: TabType;
    label: string;
    count?: number;
  }> = ({ tab, label, count }) => (
    <TouchableOpacity
      style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={styles.tabBadge}>
          <Text style={styles.tabBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'pending':
        return (
          <ScrollView
            style={styles.contentScroll}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {pendingRequests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
                <Text style={styles.emptyTitle}>All Clear!</Text>
                <Text style={styles.emptyText}>No pending approvals</Text>
              </View>
            ) : (
              pendingRequests.map((req) => (
                <SwapRequestCard key={req.id} request={req} showActions="manager" />
              ))
            )}
          </ScrollView>
        );

      case 'my-requests':
        return (
          <ScrollView
            style={styles.contentScroll}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {myIncoming.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Incoming Requests</Text>
                {myIncoming.map((req) => (
                  <SwapRequestCard key={req.id} request={req} showActions="employee" />
                ))}
              </>
            )}

            {myOutgoing.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>My Requests</Text>
                {myOutgoing.map((req) => (
                  <SwapRequestCard key={req.id} request={req} showActions="none" />
                ))}
              </>
            )}

            {myIncoming.length === 0 && myOutgoing.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="swap-horizontal-outline" size={48} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Requests</Text>
                <Text style={styles.emptyText}>
                  You haven't made or received any swap requests
                </Text>
              </View>
            )}
          </ScrollView>
        );

      case 'history':
        return (
          <ScrollView
            style={styles.contentScroll}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {history.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={48} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No History</Text>
                <Text style={styles.emptyText}>Past swap requests will appear here</Text>
              </View>
            ) : (
              history.map((req) => (
                <SwapRequestCard key={req.id} request={req} showActions="none" />
              ))
            )}
          </ScrollView>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#6366F1', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Swipe Approval</Text>
            <Text style={styles.headerSubtitle}>Schedule Swap Management</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TabButton
          tab="pending"
          label="Pending Approval"
          count={pendingRequests.length}
        />
        <TabButton
          tab="my-requests"
          label="My Requests"
          count={myIncoming.filter(r => r.status === 'pending').length}
        />
        <TabButton tab="history" label="History" />
      </View>

      {/* Content */}
      {renderContent()}

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Swap Request Details</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <ScrollView style={styles.modalBody}>
                <SwapRequestCard request={selectedRequest} showActions="none" />

                {selectedRequest.reason && (
                  <View style={styles.reasonBox}>
                    <Text style={styles.reasonLabel}>Reason:</Text>
                    <Text style={styles.reasonText}>{selectedRequest.reason}</Text>
                  </View>
                )}

                {isManager && selectedRequest.status === 'manager_pending' && (
                  <>
                    <Text style={styles.notesLabel}>Manager Notes (optional):</Text>
                    <TextInput
                      style={styles.notesInput}
                      value={managerNotes}
                      onChangeText={setManagerNotes}
                      placeholder="Add notes about this decision..."
                      multiline
                      numberOfLines={3}
                    />

                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={[styles.modalBtn, styles.approveModalBtn]}
                        onPress={() => handleManagerReview(selectedRequest.id, true)}
                      >
                        <Text style={styles.approveModalBtnText}>Approve Swap</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalBtn, styles.rejectModalBtn]}
                        onPress={() => handleManagerReview(selectedRequest.id, false)}
                      >
                        <Text style={styles.rejectModalBtnText}>Deny Swap</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 20,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  overtimeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  overtimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  swapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftBox: {
    flex: 1,
    alignItems: 'center',
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarTextSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  employeeName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  shiftPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  shiftDate: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  shiftTime: {
    fontSize: 13,
    fontWeight: '600',
  },
  swapArrow: {
    paddingHorizontal: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: '#10B981',
  },
  approveBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  rejectBtn: {
    backgroundColor: '#FEE2E2',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalBody: {
    padding: 16,
  },
  reasonBox: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#1E293B',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 20,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  approveModalBtn: {
    backgroundColor: '#10B981',
  },
  approveModalBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  rejectModalBtn: {
    backgroundColor: '#FEE2E2',
  },
  rejectModalBtnText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default SwipeScreen;
