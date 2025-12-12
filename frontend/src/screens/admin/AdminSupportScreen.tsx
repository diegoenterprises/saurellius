/**
 * ADMIN SUPPORT SCREEN
 * Customer support, account management, and ticket system
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/dashboard/Header';
import api from '../../services/api';

const COLORS = {
  background: '#0F0F23',
  surface: '#1A1A2E',
  surfaceLight: '#252545',
  primary: '#8B5CF6',
  blue: '#3B82F6',
  green: '#22C55E',
  yellow: '#F59E0B',
  red: '#EF4444',
  cyan: '#06B6D4',
  text: '#FFFFFF',
  textMuted: '#9CA3AF',
  border: '#2A2A4E',
};

interface Customer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  subscription_tier: string;
  subscription_status: string;
  created_at: string | null;
  last_login: string | null;
}

interface Ticket {
  id: number;
  ticket_number: string;
  customer_email: string;
  customer_name: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function AdminSupportScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'customers' | 'tickets'>('customers');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Customer state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Ticket state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketStats, setTicketStats] = useState({ open: 0, in_progress: 0, resolved: 0, closed: 0 });
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  // Filters
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchCustomers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (tierFilter) params.append('tier', tierFilter);
      
      const response = await api.get(`/api/admin/support/customers?${params}`);
      if (response.data.success) {
        setCustomers(response.data.customers);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await api.get(`/api/admin/support/tickets?${params}`);
      if (response.data.success) {
        setTickets(response.data.tickets);
        setTicketStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([fetchCustomers(), fetchTickets()]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'customers') {
      fetchCustomers();
    } else {
      fetchTickets();
    }
  }, [searchQuery, tierFilter, statusFilter, activeTab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    
    try {
      const response = await api.delete(`/api/admin/support/customers/${selectedCustomer.id}`);
      if (response.data.success) {
        setShowDeleteConfirm(false);
        setShowCustomerModal(false);
        setSelectedCustomer(null);
        fetchCustomers();
        Alert.alert('Success', 'Customer deleted successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete customer');
    }
  };

  const handleUpdateCustomer = async (updates: Partial<Customer>) => {
    if (!selectedCustomer) return;
    
    try {
      const response = await api.put(`/api/admin/support/customers/${selectedCustomer.id}`, updates);
      if (response.data.success) {
        fetchCustomers();
        Alert.alert('Success', 'Customer updated successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update customer');
    }
  };

  const handleUpdateTicket = async (ticketId: number, updates: any) => {
    try {
      const response = await api.put(`/api/admin/support/tickets/${ticketId}`, updates);
      if (response.data.success) {
        fetchTickets();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update ticket');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return COLORS.red;
      case 'high': return COLORS.yellow;
      case 'medium': return COLORS.blue;
      case 'low': return COLORS.green;
      default: return COLORS.textMuted;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return COLORS.blue;
      case 'in_progress': return COLORS.yellow;
      case 'resolved': return COLORS.green;
      case 'closed': return COLORS.textMuted;
      default: return COLORS.textMuted;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return '#6B7280';
      case 'starter': return COLORS.blue;
      case 'professional': return COLORS.primary;
      case 'business': return COLORS.green;
      default: return COLORS.textMuted;
    }
  };

  return (
    <View style={styles.container}>
      <Header />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Page Title */}
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Support Center</Text>
            <Text style={styles.pageSubtitle}>Manage customers and support tickets</Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'customers' && styles.tabActive]}
            onPress={() => setActiveTab('customers')}
          >
            <Ionicons name="people" size={20} color={activeTab === 'customers' ? COLORS.primary : COLORS.textMuted} />
            <Text style={[styles.tabText, activeTab === 'customers' && styles.tabTextActive]}>
              Customers ({customers.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tickets' && styles.tabActive]}
            onPress={() => setActiveTab('tickets')}
          >
            <Ionicons name="ticket" size={20} color={activeTab === 'tickets' ? COLORS.primary : COLORS.textMuted} />
            <Text style={[styles.tabText, activeTab === 'tickets' && styles.tabTextActive]}>
              Tickets ({ticketStats.open + ticketStats.in_progress})
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : activeTab === 'customers' ? (
          <>
            {/* Search & Filters */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputWrapper}>
                <Ionicons name="search" size={20} color={COLORS.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name or email..."
                  placeholderTextColor={COLORS.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <View style={styles.filterRow}>
                {['', 'free', 'starter', 'professional', 'business'].map((tier) => (
                  <TouchableOpacity
                    key={tier || 'all'}
                    style={[styles.filterChip, tierFilter === tier && styles.filterChipActive]}
                    onPress={() => setTierFilter(tier)}
                  >
                    <Text style={[styles.filterChipText, tierFilter === tier && styles.filterChipTextActive]}>
                      {tier || 'All'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Customer List */}
            <View style={styles.listContainer}>
              {customers.map((customer) => (
                <TouchableOpacity
                  key={customer.id}
                  style={styles.customerCard}
                  onPress={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerModal(true);
                  }}
                >
                  <View style={styles.customerAvatar}>
                    <Text style={styles.customerAvatarText}>
                      {customer.first_name?.[0] || customer.email[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{customer.full_name || customer.email}</Text>
                    <Text style={styles.customerEmail}>{customer.email}</Text>
                  </View>
                  <View style={styles.customerMeta}>
                    <View style={[styles.tierBadge, { backgroundColor: getTierColor(customer.subscription_tier) }]}>
                      <Text style={styles.tierBadgeText}>{customer.subscription_tier}</Text>
                    </View>
                    <Text style={styles.customerRole}>{customer.role}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
              
              {customers.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
                  <Text style={styles.emptyStateText}>No customers found</Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <>
            {/* Ticket Stats */}
            <View style={styles.ticketStats}>
              <View style={[styles.statCard, { borderLeftColor: COLORS.blue }]}>
                <Text style={styles.statValue}>{ticketStats.open}</Text>
                <Text style={styles.statLabel}>Open</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: COLORS.yellow }]}>
                <Text style={styles.statValue}>{ticketStats.in_progress}</Text>
                <Text style={styles.statLabel}>In Progress</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: COLORS.green }]}>
                <Text style={styles.statValue}>{ticketStats.resolved}</Text>
                <Text style={styles.statLabel}>Resolved</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: COLORS.textMuted }]}>
                <Text style={styles.statValue}>{ticketStats.closed}</Text>
                <Text style={styles.statLabel}>Closed</Text>
              </View>
            </View>

            {/* Status Filter */}
            <View style={styles.filterRow}>
              {['', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
                <TouchableOpacity
                  key={status || 'all'}
                  style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
                  onPress={() => setStatusFilter(status)}
                >
                  <Text style={[styles.filterChipText, statusFilter === status && styles.filterChipTextActive]}>
                    {status ? status.replace('_', ' ') : 'All'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Ticket List */}
            <View style={styles.listContainer}>
              {tickets.map((ticket) => (
                <TouchableOpacity
                  key={ticket.id}
                  style={styles.ticketCard}
                  onPress={() => {
                    setSelectedTicket(ticket);
                    setShowTicketModal(true);
                  }}
                >
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketNumber}>{ticket.ticket_number}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
                      <Text style={styles.statusBadgeText}>{ticket.status.replace('_', ' ')}</Text>
                    </View>
                  </View>
                  <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                  <View style={styles.ticketMeta}>
                    <Text style={styles.ticketCustomer}>{ticket.customer_email}</Text>
                    <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(ticket.priority) }]} />
                    <Text style={[styles.ticketPriority, { color: getPriorityColor(ticket.priority) }]}>
                      {ticket.priority}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              
              {tickets.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="ticket-outline" size={48} color={COLORS.textMuted} />
                  <Text style={styles.emptyStateText}>No tickets found</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Customer Detail Modal */}
      <Modal visible={showCustomerModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customer Details</Text>
              <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            {selectedCustomer && (
              <ScrollView>
                <View style={styles.customerDetailHeader}>
                  <View style={styles.customerDetailAvatar}>
                    <Text style={styles.customerDetailAvatarText}>
                      {selectedCustomer.first_name?.[0] || 'U'}{selectedCustomer.last_name?.[0] || ''}
                    </Text>
                  </View>
                  <Text style={styles.customerDetailName}>{selectedCustomer.full_name}</Text>
                  <Text style={styles.customerDetailEmail}>{selectedCustomer.email}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Subscription Tier</Text>
                  <View style={styles.tierSelector}>
                    {['free', 'starter', 'professional', 'business'].map((tier) => (
                      <TouchableOpacity
                        key={tier}
                        style={[
                          styles.tierOption,
                          selectedCustomer.subscription_tier === tier && styles.tierOptionActive
                        ]}
                        onPress={() => handleUpdateCustomer({ subscription_tier: tier })}
                      >
                        <Text style={[
                          styles.tierOptionText,
                          selectedCustomer.subscription_tier === tier && styles.tierOptionTextActive
                        ]}>
                          {tier}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Account Status</Text>
                  <Text style={styles.detailValue}>{selectedCustomer.subscription_status}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Role</Text>
                  <Text style={styles.detailValue}>{selectedCustomer.role}</Text>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.actionButtonPrimary]}
                    onPress={() => Alert.alert('Reset Password', 'Send password reset email?')}
                  >
                    <Ionicons name="key" size={18} color="#FFF" />
                    <Text style={styles.actionButtonText}>Reset Password</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.actionButtonDanger]}
                    onPress={() => setShowDeleteConfirm(true)}
                  >
                    <Ionicons name="trash" size={18} color="#FFF" />
                    <Text style={styles.actionButtonText}>Delete Account</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteConfirm} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.confirmModal]}>
            <Ionicons name="warning" size={48} color={COLORS.red} />
            <Text style={styles.confirmTitle}>Delete Customer?</Text>
            <Text style={styles.confirmText}>
              This will permanently delete {selectedCustomer?.email}. This action cannot be undone.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonCancel]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.confirmButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonDelete]}
                onPress={handleDeleteCustomer}
              >
                <Text style={styles.confirmButtonDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  pageHeader: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: COLORS.surfaceLight,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.text,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  listContainer: {
    gap: 12,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  customerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  customerEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  customerMeta: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
    textTransform: 'capitalize',
  },
  customerRole: {
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: 'capitalize',
  },
  ticketStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  ticketCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
    textTransform: 'capitalize',
  },
  ticketSubject: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketCustomer: {
    fontSize: 13,
    color: COLORS.textMuted,
    flex: 1,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ticketPriority: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  customerDetailHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  customerDetailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerDetailAvatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  customerDetailName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  customerDetailEmail: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  tierSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  tierOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tierOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tierOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
    textTransform: 'capitalize',
  },
  tierOptionTextActive: {
    color: '#FFF',
  },
  actionButtons: {
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  actionButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  actionButtonDanger: {
    backgroundColor: COLORS.red,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  confirmModal: {
    alignItems: 'center',
    maxWidth: 400,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
  },
  confirmText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonCancel: {
    backgroundColor: COLORS.surfaceLight,
  },
  confirmButtonDelete: {
    backgroundColor: COLORS.red,
  },
  confirmButtonCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  confirmButtonDeleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});

export { AdminSupportScreen };
