/**
 * CONTRACTOR PROPOSAL BUILDER SCREEN
 * Create and manage client proposals
 * Track proposal status and convert to contracts
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

interface ProposalItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  total: number;
}

interface Proposal {
  id: string;
  title: string;
  client_name: string;
  client_email?: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
  total_amount: number;
  valid_until?: string;
  created_at: string;
  sent_at?: string;
  viewed_at?: string;
  responded_at?: string;
  items: ProposalItem[];
  notes?: string;
  terms?: string;
}

interface ProposalStats {
  total_proposals: number;
  pending: number;
  accepted: number;
  acceptance_rate: number;
  total_value: number;
}

export default function ContractorProposalsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<ProposalStats | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', client_name: '', client_email: '', notes: '' });

  const fetchData = useCallback(async () => {
    try {
      const [proposalsRes, statsRes] = await Promise.all([
        api.get('/api/contractor/proposals', { params: { status: filterStatus !== 'all' ? filterStatus : undefined } }),
        api.get('/api/contractor/proposals/stats'),
      ]);
      setProposals(proposalsRes.data.proposals || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#10B981';
      case 'sent': case 'viewed': return '#3B82F6';
      case 'draft': return '#6B7280';
      case 'declined': case 'expired': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return 'checkmark-circle';
      case 'sent': return 'send';
      case 'viewed': return 'eye';
      case 'draft': return 'document';
      case 'declined': return 'close-circle';
      case 'expired': return 'time';
      default: return 'document';
    }
  };

  const handleCreateProposal = async () => {
    if (!formData.title.trim() || !formData.client_name.trim()) {
      Alert.alert('Error', 'Title and client name are required');
      return;
    }
    try {
      const response = await api.post('/api/contractor/proposals', formData);
      setShowCreateModal(false);
      setFormData({ title: '', client_name: '', client_email: '', notes: '' });
      fetchData();
      navigation.navigate('ProposalEditor', { proposalId: response.data.proposal.id });
    } catch (error) {
      Alert.alert('Error', 'Failed to create proposal');
    }
  };

  const handleSendProposal = async (proposal: Proposal) => {
    if (proposal.items.length === 0) {
      Alert.alert('Cannot Send', 'Add at least one item to the proposal first');
      return;
    }
    Alert.alert('Send Proposal', `Send proposal to ${proposal.client_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: async () => {
        try {
          await api.post(`/api/contractor/proposals/${proposal.id}/send`);
          fetchData();
          Alert.alert('Success', 'Proposal sent');
        } catch (error) {
          Alert.alert('Error', 'Failed to send proposal');
        }
      }},
    ]);
  };

  const handleDuplicateProposal = async (proposal: Proposal) => {
    try {
      await api.post(`/api/contractor/proposals/${proposal.id}/duplicate`);
      fetchData();
      Alert.alert('Success', 'Proposal duplicated');
    } catch (error) {
      Alert.alert('Error', 'Failed to duplicate proposal');
    }
  };

  const handleConvertToContract = (proposal: Proposal) => {
    navigation.navigate('ContractorContracts', { fromProposal: proposal.id });
  };

  const renderProposalCard = (proposal: Proposal) => {
    const isExpanded = expandedProposal === proposal.id;
    return (
      <View key={proposal.id} style={styles.proposalCard}>
        <TouchableOpacity style={styles.proposalHeader} onPress={() => setExpandedProposal(isExpanded ? null : proposal.id)}>
          <View style={[styles.statusIcon, { backgroundColor: getStatusColor(proposal.status) + '20' }]}>
            <Ionicons name={getStatusIcon(proposal.status) as any} size={20} color={getStatusColor(proposal.status)} />
          </View>
          <View style={styles.proposalInfo}>
            <Text style={styles.proposalTitle} numberOfLines={1}>{proposal.title}</Text>
            <Text style={styles.proposalClient}>{proposal.client_name}</Text>
          </View>
          <View style={styles.proposalRight}>
            <Text style={styles.proposalAmount}>{formatCurrency(proposal.total_amount)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(proposal.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(proposal.status) }]}>{proposal.status}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.proposalMeta}>
          <Text style={styles.metaText}>Created: {formatDate(proposal.created_at)}</Text>
          {proposal.valid_until && <Text style={styles.metaText}>Valid until: {formatDate(proposal.valid_until)}</Text>}
        </View>

        {proposal.status === 'viewed' && proposal.viewed_at && (
          <View style={styles.viewedAlert}>
            <Ionicons name="eye" size={14} color="#3B82F6" />
            <Text style={styles.viewedText}>Viewed on {formatDate(proposal.viewed_at)}</Text>
          </View>
        )}

        {isExpanded && (
          <View style={styles.proposalExpanded}>
            {proposal.items.length > 0 && (
              <View style={styles.itemsSection}>
                <Text style={styles.sectionTitle}>Items ({proposal.items.length})</Text>
                {proposal.items.map(item => (
                  <View key={item.id} style={styles.itemRow}>
                    <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
                    <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
                  </View>
                ))}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{formatCurrency(proposal.total_amount)}</Text>
                </View>
              </View>
            )}

            <View style={styles.proposalActions}>
              {proposal.status === 'draft' && (
                <>
                  <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('ProposalEditor', { proposalId: proposal.id })}>
                    <Ionicons name="create" size={18} color="#1473FF" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.actionButtonPrimary]} onPress={() => handleSendProposal(proposal)}>
                    <Ionicons name="send" size={18} color="#FFF" />
                    <Text style={[styles.actionButtonText, { color: colors.text }]}>Send</Text>
                  </TouchableOpacity>
                </>
              )}
              {proposal.status === 'accepted' && (
                <TouchableOpacity style={[styles.actionButton, styles.actionButtonSuccess]} onPress={() => handleConvertToContract(proposal)}>
                  <Ionicons name="document-text" size={18} color="#FFF" />
                  <Text style={[styles.actionButtonText, { color: colors.text }]}>Convert to Contract</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.actionButton} onPress={() => handleDuplicateProposal(proposal)}>
                <Ionicons name="copy" size={18} color="#8B5CF6" />
                <Text style={[styles.actionButtonText, { color: '#8B5CF6' }]}>Duplicate</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Proposals</Text>
          <TouchableOpacity onPress={() => setShowCreateModal(true)}><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_proposals}</Text><Text style={styles.statLabel}>Total</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.pending}</Text><Text style={styles.statLabel}>Pending</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.acceptance_rate}%</Text><Text style={styles.statLabel}>Win Rate</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{formatCurrency(stats.total_value)}</Text><Text style={styles.statLabel}>Value</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {['all', 'draft', 'sent', 'viewed', 'accepted', 'declined'].map(status => (
          <TouchableOpacity key={status} style={[styles.filterChip, filterStatus === status && styles.filterChipActive]} onPress={() => { setFilterStatus(status); setLoading(true); }}>
            <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>{status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {proposals.length > 0 ? proposals.map(renderProposalCard) : (
            <View style={styles.emptyState}><Ionicons name="document-outline" size={48} color="#666" /><Text style={styles.emptyText}>No proposals found</Text></View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>New Proposal</Text>
            <TouchableOpacity onPress={handleCreateProposal}><Text style={styles.modalSave}>Create</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Title *</Text><TextInput style={styles.input} value={formData.title} onChangeText={t => setFormData(p => ({...p, title: t}))} placeholder="Proposal title" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Client Name *</Text><TextInput style={styles.input} value={formData.client_name} onChangeText={t => setFormData(p => ({...p, client_name: t}))} placeholder="Client or company name" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Client Email</Text><TextInput style={styles.input} value={formData.client_email} onChangeText={t => setFormData(p => ({...p, client_email: t}))} placeholder="client@email.com" placeholderTextColor="#666" keyboardType="email-address" autoCapitalize="none" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Notes</Text><TextInput style={[styles.input, styles.textArea]} value={formData.notes} onChangeText={t => setFormData(p => ({...p, notes: t}))} placeholder="Optional notes" placeholderTextColor="#666" multiline numberOfLines={3} /></View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  statValue: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.card, marginRight: 8, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 13, color: '#a0a0a0', fontWeight: '500' },
  filterChipTextActive: { color: colors.text },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  proposalCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  proposalHeader: { flexDirection: 'row', alignItems: 'center' },
  statusIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  proposalInfo: { flex: 1 },
  proposalTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  proposalClient: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  proposalRight: { alignItems: 'flex-end' },
  proposalAmount: { fontSize: 16, fontWeight: 'bold', color: '#10B981' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  proposalMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  metaText: { fontSize: 11, color: '#666' },
  viewedAlert: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F620', padding: 8, borderRadius: 8, marginTop: 10, gap: 6 },
  viewedText: { fontSize: 12, color: '#3B82F6' },
  proposalExpanded: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  itemsSection: { marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  itemDesc: { flex: 1, fontSize: 13, color: '#a0a0a0' },
  itemTotal: { fontSize: 13, color: colors.text, fontWeight: '500', marginLeft: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, marginTop: 8, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  totalLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#10B981' },
  proposalActions: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1473FF20', borderRadius: 10, paddingVertical: 10, gap: 4 },
  actionButtonPrimary: { backgroundColor: '#1473FF' },
  actionButtonSuccess: { backgroundColor: '#10B981' },
  actionButtonText: { fontSize: 12, fontWeight: '500', color: '#1473FF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  modalCancel: { fontSize: 16, color: '#a0a0a0' },
  modalSave: { fontSize: 16, fontWeight: '600', color: '#1473FF' },
  modalContent: { padding: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, color: '#a0a0a0', marginBottom: 6 },
  input: { backgroundColor: colors.card, borderRadius: 10, padding: 14, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: '#2a2a4e' },
  textArea: { height: 80, textAlignVertical: 'top' },
});
