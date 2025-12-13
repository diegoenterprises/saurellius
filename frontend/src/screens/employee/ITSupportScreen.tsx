/**
 * EMPLOYEE IT SUPPORT SCREEN
 * Submit and track IT support tickets
 * Access self-help resources, status updates
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

interface ITTicket {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  description: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolution?: string;
}

interface ITStats {
  open_tickets: number;
  avg_resolution_time: string;
  satisfaction_rate: number;
}

const CATEGORIES = [
  { id: 'hardware', name: 'Hardware', icon: 'hardware-chip', color: '#3B82F6' },
  { id: 'software', name: 'Software', icon: 'apps', color: '#10B981' },
  { id: 'network', name: 'Network', icon: 'wifi', color: '#F59E0B' },
  { id: 'email', name: 'Email', icon: 'mail', color: '#8B5CF6' },
  { id: 'access', name: 'Access', icon: 'key', color: '#EC4899' },
  { id: 'other', name: 'Other', icon: 'help-circle', color: '#6B7280' },
];

export default function ITSupportScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tickets, setTickets] = useState<ITTicket[]>([]);
  const [stats, setStats] = useState<ITStats | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', category: 'software', priority: 'medium', description: '' });

  const fetchData = useCallback(async () => {
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        api.get('/api/employee/it-support/tickets'),
        api.get('/api/employee/it-support/stats'),
      ]);
      setTickets(ticketsRes.data.tickets || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch IT tickets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getCategoryInfo = (categoryId: string) => CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[5];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#3B82F6';
      case 'in_progress': return '#F59E0B';
      case 'waiting': return '#8B5CF6';
      case 'resolved': return '#10B981';
      case 'closed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const handleSubmitTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    try {
      await api.post('/api/employee/it-support/tickets', newTicket);
      setShowNewTicket(false);
      setNewTicket({ subject: '', category: 'software', priority: 'medium', description: '' });
      fetchData();
      Alert.alert('Success', 'Ticket submitted');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit ticket');
    }
  };

  const renderTicketCard = (ticket: ITTicket) => {
    const catInfo = getCategoryInfo(ticket.category);
    return (
      <TouchableOpacity key={ticket.id} style={styles.ticketCard}>
        <View style={styles.ticketHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: catInfo.color + '20' }]}>
            <Ionicons name={catInfo.icon as any} size={20} color={catInfo.color} />
          </View>
          <View style={styles.ticketInfo}>
            <Text style={styles.ticketNumber}>#{ticket.ticket_number}</Text>
            <Text style={styles.ticketSubject}>{ticket.subject}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>{ticket.status.replace('_', ' ')}</Text>
          </View>
        </View>

        <Text style={styles.ticketDesc} numberOfLines={2}>{ticket.description}</Text>

        <View style={styles.ticketMeta}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) + '20' }]}>
            <Ionicons name="flag" size={12} color={getPriorityColor(ticket.priority)} />
            <Text style={[styles.priorityText, { color: getPriorityColor(ticket.priority) }]}>{ticket.priority}</Text>
          </View>
          {ticket.assigned_to && (
            <View style={styles.assignedRow}><Ionicons name="person" size={12} color="#666" /><Text style={styles.assignedText}>{ticket.assigned_to}</Text></View>
          )}
          <Text style={styles.ticketDate}>{formatDate(ticket.created_at)}</Text>
        </View>

        {ticket.status === 'resolved' && ticket.resolution && (
          <View style={styles.resolutionBox}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text style={styles.resolutionText} numberOfLines={2}>{ticket.resolution}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>IT Support</Text>
          <TouchableOpacity onPress={() => setShowNewTicket(true)}><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.open_tickets}</Text><Text style={styles.statLabel}>Open</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.avg_resolution_time}</Text><Text style={styles.statLabel}>Avg Time</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.satisfaction_rate}%</Text><Text style={styles.statLabel}>Satisfaction</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction}><Ionicons name="wifi" size={20} color="#F59E0B" /><Text style={styles.quickText}>Network</Text></TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}><Ionicons name="key" size={20} color="#EC4899" /><Text style={styles.quickText}>Password</Text></TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}><Ionicons name="laptop" size={20} color="#3B82F6" /><Text style={styles.quickText}>Equipment</Text></TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}><Ionicons name="apps" size={20} color="#10B981" /><Text style={styles.quickText}>Software</Text></TouchableOpacity>
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Tickets</Text>
          {tickets.length > 0 ? tickets.map(renderTicketCard) : (
            <View style={styles.emptyState}><Ionicons name="ticket-outline" size={48} color="#666" /><Text style={styles.emptyText}>No support tickets</Text></View>
          )}
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>

      <TouchableOpacity style={styles.newTicketFab} onPress={() => setShowNewTicket(true)}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={showNewTicket} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNewTicket(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>New Ticket</Text>
            <TouchableOpacity onPress={handleSubmitTicket}><Text style={styles.modalSave}>Submit</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Subject *</Text><TextInput style={styles.input} value={newTicket.subject} onChangeText={t => setNewTicket(p => ({...p, subject: t}))} placeholder="Brief description of the issue" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat.id} style={[styles.categoryOption, newTicket.category === cat.id && styles.categoryActive]} onPress={() => setNewTicket(p => ({...p, category: cat.id}))}>
                    <Ionicons name={cat.icon as any} size={20} color={newTicket.category === cat.id ? '#FFF' : cat.color} />
                    <Text style={[styles.categoryOptionText, newTicket.category === cat.id && styles.categoryOptionTextActive]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.priorityRow}>
                {['low', 'medium', 'high', 'critical'].map(p => (
                  <TouchableOpacity key={p} style={[styles.priorityOption, newTicket.priority === p && { backgroundColor: getPriorityColor(p) }]} onPress={() => setNewTicket(prev => ({...prev, priority: p as any}))}>
                    <Text style={[styles.priorityOptionText, newTicket.priority === p && { color: '#FFF' }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Description *</Text><TextInput style={[styles.input, styles.textArea]} value={newTicket.description} onChangeText={t => setNewTicket(p => ({...p, description: t}))} placeholder="Describe the issue in detail..." placeholderTextColor="#666" multiline numberOfLines={6} /></View>
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
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  quickActions: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e', gap: 8 },
  quickAction: { flex: 1, alignItems: 'center', backgroundColor: '#1a1a2e', paddingVertical: 12, borderRadius: 10, gap: 4, borderWidth: 1, borderColor: '#2a2a4e' },
  quickText: { fontSize: 11, color: '#a0a0a0' },
  content: { flex: 1 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#FFF', marginBottom: 14 },
  ticketCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  ticketHeader: { flexDirection: 'row', alignItems: 'center' },
  categoryIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  ticketInfo: { flex: 1 },
  ticketNumber: { fontSize: 11, color: '#666' },
  ticketSubject: { fontSize: 15, fontWeight: '600', color: '#FFF', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  ticketDesc: { fontSize: 13, color: '#a0a0a0', marginTop: 10, lineHeight: 18 },
  ticketMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  priorityText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  assignedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  assignedText: { fontSize: 11, color: '#666' },
  ticketDate: { fontSize: 11, color: '#666', marginLeft: 'auto' },
  resolutionBox: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12, padding: 10, backgroundColor: '#10B98110', borderRadius: 8, gap: 8 },
  resolutionText: { flex: 1, fontSize: 12, color: '#10B981', lineHeight: 16 },
  newTicketFab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center', shadowColor: '#1473FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
  modalContainer: { flex: 1, backgroundColor: '#0f0f23' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  modalCancel: { fontSize: 16, color: '#a0a0a0' },
  modalSave: { fontSize: 16, fontWeight: '600', color: '#1473FF' },
  modalContent: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, color: '#a0a0a0', marginBottom: 8 },
  input: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, fontSize: 16, color: '#FFF', borderWidth: 1, borderColor: '#2a2a4e' },
  textArea: { height: 120, textAlignVertical: 'top' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#2a2a4e', borderRadius: 10, gap: 6 },
  categoryActive: { backgroundColor: '#1473FF' },
  categoryOptionText: { fontSize: 12, color: '#a0a0a0' },
  categoryOptionTextActive: { color: '#FFF' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityOption: { flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: '#2a2a4e', borderRadius: 10 },
  priorityOptionText: { fontSize: 12, color: '#a0a0a0', textTransform: 'capitalize' },
});
