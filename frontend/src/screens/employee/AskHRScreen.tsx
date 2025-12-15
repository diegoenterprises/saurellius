/**
 * EMPLOYEE ASK HR SCREEN
 * Submit questions and requests to HR
 * Track tickets, view FAQs, get help
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

interface HRTicket {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  responses_count: number;
  last_response?: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful_count: number;
}

interface HRStats {
  open_tickets: number;
  avg_response_time: string;
  resolved_this_month: number;
}

const CATEGORIES = [
  { id: 'benefits', name: 'Benefits', icon: 'gift', color: '#3B82F6' },
  { id: 'payroll', name: 'Payroll', icon: 'cash', color: '#10B981' },
  { id: 'leave', name: 'Time Off', icon: 'calendar', color: '#F59E0B' },
  { id: 'policies', name: 'Policies', icon: 'document-text', color: '#8B5CF6' },
  { id: 'workplace', name: 'Workplace', icon: 'business', color: '#EC4899' },
  { id: 'other', name: 'Other', icon: 'help-circle', color: '#6B7280' },
];

export default function AskHRScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tickets, setTickets] = useState<HRTicket[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [stats, setStats] = useState<HRStats | null>(null);
  const [activeTab, setActiveTab] = useState<'tickets' | 'faqs'>('tickets');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', category: 'benefits', message: '', priority: 'medium' });
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [ticketsRes, faqsRes, statsRes] = await Promise.all([
        api.get('/api/employee/ask-hr/tickets'),
        api.get('/api/employee/ask-hr/faqs'),
        api.get('/api/employee/ask-hr/stats'),
      ]);
      setTickets(ticketsRes.data.tickets || []);
      setFaqs(faqsRes.data.faqs || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch HR data:', error);
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
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getCategoryInfo = (categoryId: string) => CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[5];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#3B82F6';
      case 'in_progress': return '#F59E0B';
      case 'resolved': return '#10B981';
      case 'closed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const handleSubmitTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    try {
      await api.post('/api/employee/ask-hr/tickets', newTicket);
      setShowNewTicket(false);
      setNewTicket({ subject: '', category: 'benefits', message: '', priority: 'medium' });
      fetchData();
      Alert.alert('Success', 'Your request has been submitted');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit request');
    }
  };

  const renderTicketCard = (ticket: HRTicket) => {
    const catInfo = getCategoryInfo(ticket.category);
    return (
      <TouchableOpacity key={ticket.id} style={styles.ticketCard}>
        <View style={styles.ticketHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: catInfo.color + '20' }]}>
            <Ionicons name={catInfo.icon as any} size={18} color={catInfo.color} />
          </View>
          <View style={styles.ticketInfo}>
            <Text style={styles.ticketSubject}>{ticket.subject}</Text>
            <Text style={styles.ticketId}>#{ticket.id.slice(-6)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>{ticket.status.replace('_', ' ')}</Text>
          </View>
        </View>

        <Text style={styles.ticketMessage} numberOfLines={2}>{ticket.message}</Text>

        <View style={styles.ticketMeta}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) + '20' }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(ticket.priority) }]}>{ticket.priority}</Text>
          </View>
          {ticket.assigned_to && (
            <View style={styles.assignedRow}><Ionicons name="person" size={12} color="#666" /><Text style={styles.assignedText}>{ticket.assigned_to}</Text></View>
          )}
          <Text style={styles.ticketDate}>{formatDate(ticket.created_at)}</Text>
        </View>

        {ticket.responses_count > 0 && (
          <View style={styles.responsesRow}>
            <Ionicons name="chatbubbles" size={14} color="#1473FF" />
            <Text style={styles.responsesText}>{ticket.responses_count} response{ticket.responses_count > 1 ? 's' : ''}</Text>
            {ticket.last_response && <Text style={styles.lastResponse}>Last: {formatDate(ticket.last_response)}</Text>}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFaqCard = (faq: FAQ) => {
    const isExpanded = expandedFaq === faq.id;
    const catInfo = getCategoryInfo(faq.category);
    return (
      <TouchableOpacity key={faq.id} style={styles.faqCard} onPress={() => setExpandedFaq(isExpanded ? null : faq.id)}>
        <View style={styles.faqHeader}>
          <View style={[styles.faqIcon, { backgroundColor: catInfo.color + '20' }]}>
            <Ionicons name="help" size={16} color={catInfo.color} />
          </View>
          <Text style={styles.faqQuestion}>{faq.question}</Text>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
        </View>
        {isExpanded && (
          <View style={styles.faqAnswer}>
            <Text style={styles.faqAnswerText}>{faq.answer}</Text>
            <View style={styles.faqFooter}>
              <TouchableOpacity style={styles.helpfulButton}><Ionicons name="thumbs-up-outline" size={14} color="#666" /><Text style={styles.helpfulText}>Helpful ({faq.helpful_count})</Text></TouchableOpacity>
            </View>
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
          <Text style={styles.headerTitle}>Ask HR</Text>
          <TouchableOpacity onPress={() => setShowNewTicket(true)}><Ionicons name="create-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.open_tickets}</Text><Text style={styles.statLabel}>Open</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.avg_response_time}</Text><Text style={styles.statLabel}>Avg Response</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.resolved_this_month}</Text><Text style={styles.statLabel}>Resolved</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'tickets' && styles.tabActive]} onPress={() => setActiveTab('tickets')}>
          <Text style={[styles.tabText, activeTab === 'tickets' && styles.tabTextActive]}>My Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'faqs' && styles.tabActive]} onPress={() => setActiveTab('faqs')}>
          <Text style={[styles.tabText, activeTab === 'faqs' && styles.tabTextActive]}>FAQs</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {activeTab === 'tickets' ? (
            tickets.length > 0 ? tickets.map(renderTicketCard) : (
              <View style={styles.emptyState}><Ionicons name="chatbubbles-outline" size={48} color="#666" /><Text style={styles.emptyText}>No requests yet</Text><TouchableOpacity style={styles.newTicketButton} onPress={() => setShowNewTicket(true)}><Ionicons name="add" size={18} color="#FFF" /><Text style={styles.newTicketText}>Submit a Request</Text></TouchableOpacity></View>
            )
          ) : (
            faqs.length > 0 ? faqs.map(renderFaqCard) : <View style={styles.emptyState}><Ionicons name="help-circle-outline" size={48} color="#666" /><Text style={styles.emptyText}>No FAQs available</Text></View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showNewTicket} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNewTicket(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>New Request</Text>
            <TouchableOpacity onPress={handleSubmitTicket}><Text style={styles.modalSave}>Submit</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Subject *</Text><TextInput style={styles.input} value={newTicket.subject} onChangeText={t => setNewTicket(p => ({...p, subject: t}))} placeholder="Brief summary of your question" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat.id} style={[styles.categoryOption, newTicket.category === cat.id && styles.categoryActive]} onPress={() => setNewTicket(p => ({...p, category: cat.id}))}>
                    <Ionicons name={cat.icon as any} size={18} color={newTicket.category === cat.id ? '#FFF' : cat.color} />
                    <Text style={[styles.categoryOptionText, newTicket.category === cat.id && styles.categoryOptionTextActive]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Message *</Text><TextInput style={[styles.input, styles.textArea]} value={newTicket.message} onChangeText={t => setNewTicket(p => ({...p, message: t}))} placeholder="Describe your question or request in detail..." placeholderTextColor="#666" multiline numberOfLines={6} /></View>
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
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: '#1473FF' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#a0a0a0' },
  tabTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  ticketCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  ticketHeader: { flexDirection: 'row', alignItems: 'center' },
  categoryIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  ticketInfo: { flex: 1 },
  ticketSubject: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  ticketId: { fontSize: 11, color: '#666', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  ticketMessage: { fontSize: 13, color: '#a0a0a0', marginTop: 10, lineHeight: 18 },
  ticketMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  assignedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  assignedText: { fontSize: 11, color: '#666' },
  ticketDate: { fontSize: 11, color: '#666', marginLeft: 'auto' },
  responsesRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 6 },
  responsesText: { fontSize: 12, color: '#1473FF' },
  lastResponse: { fontSize: 11, color: '#666', marginLeft: 'auto' },
  faqCard: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a4e' },
  faqHeader: { flexDirection: 'row', alignItems: 'center' },
  faqIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '500', color: '#FFF' },
  faqAnswer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  faqAnswerText: { fontSize: 13, color: '#a0a0a0', lineHeight: 20 },
  faqFooter: { marginTop: 12 },
  helpfulButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  helpfulText: { fontSize: 12, color: '#666' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
  newTicketButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1473FF', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, marginTop: 16, gap: 6 },
  newTicketText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  modalContainer: { flex: 1, backgroundColor: '#0f0f23' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  modalCancel: { fontSize: 16, color: '#a0a0a0' },
  modalSave: { fontSize: 16, fontWeight: '600', color: '#1473FF' },
  modalContent: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, color: '#a0a0a0', marginBottom: 8 },
  input: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, fontSize: 16, color: '#FFF', borderWidth: 1, borderColor: '#2a2a4e' },
  textArea: { height: 140, textAlignVertical: 'top' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#2a2a4e', borderRadius: 10, gap: 6 },
  categoryActive: { backgroundColor: '#1473FF' },
  categoryOptionText: { fontSize: 12, color: '#a0a0a0' },
  categoryOptionTextActive: { color: '#FFF' },
});
