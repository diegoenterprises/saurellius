/**
 * CONTRACTOR MILESTONES SCREEN
 * Track project milestones and deliverables
 * Update progress, request payments, manage deadlines
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
import { useTheme } from '../../context/ThemeContext';

interface Milestone {
  id: string;
  project_id: string;
  project_name: string;
  client_name: string;
  title: string;
  description?: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'paid' | 'overdue';
  progress: number;
  deliverables: { id: string; name: string; completed: boolean }[];
  submitted_at?: string;
  approved_at?: string;
  paid_at?: string;
}

interface MilestoneStats {
  total_milestones: number;
  completed: number;
  in_progress: number;
  pending_payment: number;
  total_value: number;
}

export default function ContractorMilestonesScreen(): React.ReactElement {
  const navigation = useNavigation();
  const { colors, gradients } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [stats, setStats] = useState<MilestoneStats | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [milestonesRes, statsRes] = await Promise.all([
        api.get('/api/contractor/milestones', { params: { status: filterStatus !== 'all' ? filterStatus : undefined } }),
        api.get('/api/contractor/milestones/stats'),
      ]);
      setMilestones(milestonesRes.data.milestones || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch milestones:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'approved': return '#3B82F6';
      case 'submitted': return '#8B5CF6';
      case 'in_progress': return '#F59E0B';
      case 'pending': return '#6B7280';
      case 'overdue': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const handleToggleDeliverable = async (milestone: Milestone, deliverableId: string) => {
    try {
      await api.post(`/api/contractor/milestones/${milestone.id}/deliverables/${deliverableId}/toggle`);
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update deliverable');
    }
  };

  const handleSubmitMilestone = async (milestone: Milestone) => {
    const incompleteCount = milestone.deliverables.filter(d => !d.completed).length;
    if (incompleteCount > 0) {
      Alert.alert('Incomplete Deliverables', `${incompleteCount} deliverable(s) not completed. Submit anyway?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: () => submitMilestone(milestone) },
      ]);
    } else {
      submitMilestone(milestone);
    }
  };

  const submitMilestone = async (milestone: Milestone) => {
    try {
      await api.post(`/api/contractor/milestones/${milestone.id}/submit`);
      fetchData();
      Alert.alert('Success', 'Milestone submitted for review');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit milestone');
    }
  };

  const handleRequestPayment = async (milestone: Milestone) => {
    try {
      await api.post(`/api/contractor/milestones/${milestone.id}/request-payment`);
      fetchData();
      Alert.alert('Success', 'Payment requested');
    } catch (error) {
      Alert.alert('Error', 'Failed to request payment');
    }
  };

  const renderMilestoneCard = (milestone: Milestone) => {
    const isExpanded = expandedMilestone === milestone.id;
    const daysUntilDue = getDaysUntilDue(milestone.due_date);
    const isUrgent = daysUntilDue <= 3 && milestone.status !== 'paid' && milestone.status !== 'approved';

    return (
      <View key={milestone.id} style={[styles.milestoneCard, isUrgent && styles.urgentCard]}>
        <TouchableOpacity style={styles.milestoneHeader} onPress={() => setExpandedMilestone(isExpanded ? null : milestone.id)}>
          <View style={styles.milestoneInfo}>
            <Text style={styles.milestoneTitle}>{milestone.title}</Text>
            <Text style={styles.projectName}>{milestone.project_name}</Text>
            <Text style={styles.clientName}>{milestone.client_name}</Text>
          </View>
          <View style={styles.milestoneRight}>
            <Text style={styles.milestoneAmount}>{formatCurrency(milestone.amount)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(milestone.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(milestone.status) }]}>{milestone.status.replace('_', ' ')}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressValue}>{milestone.progress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${milestone.progress}%`, backgroundColor: getStatusColor(milestone.status) }]} />
          </View>
        </View>

        <View style={styles.dueDateRow}>
          <Ionicons name="calendar" size={14} color={isUrgent ? '#EF4444' : '#666'} />
          <Text style={[styles.dueDateText, isUrgent && styles.urgentText]}>
            Due: {formatDate(milestone.due_date)}
            {daysUntilDue > 0 && milestone.status !== 'paid' && ` (${daysUntilDue} days)`}
            {daysUntilDue < 0 && milestone.status !== 'paid' && ` (${Math.abs(daysUntilDue)} days overdue)`}
          </Text>
        </View>

        {isExpanded && (
          <View style={styles.milestoneExpanded}>
            {milestone.description && <Text style={styles.description}>{milestone.description}</Text>}

            {milestone.deliverables.length > 0 && (
              <View style={styles.deliverablesSection}>
                <Text style={styles.deliverablesTitle}>Deliverables ({milestone.deliverables.filter(d => d.completed).length}/{milestone.deliverables.length})</Text>
                {milestone.deliverables.map(deliverable => (
                  <TouchableOpacity key={deliverable.id} style={styles.deliverableRow} onPress={() => handleToggleDeliverable(milestone, deliverable.id)} disabled={milestone.status === 'paid'}>
                    <Ionicons name={deliverable.completed ? 'checkbox' : 'square-outline'} size={20} color={deliverable.completed ? '#10B981' : '#666'} />
                    <Text style={[styles.deliverableName, deliverable.completed && styles.deliverableCompleted]}>{deliverable.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.milestoneActions}>
              {milestone.status === 'in_progress' && (
                <TouchableOpacity style={[styles.actionButton, styles.submitButton]} onPress={() => handleSubmitMilestone(milestone)}>
                  <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                  <Text style={styles.submitText}>Submit for Review</Text>
                </TouchableOpacity>
              )}
              {milestone.status === 'approved' && (
                <TouchableOpacity style={[styles.actionButton, styles.paymentButton]} onPress={() => handleRequestPayment(milestone)}>
                  <Ionicons name="cash" size={18} color="#FFF" />
                  <Text style={styles.paymentText}>Request Payment</Text>
                </TouchableOpacity>
              )}
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
          <Text style={styles.headerTitle}>Milestones</Text>
          <View style={{ width: 24 }} />
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_milestones}</Text><Text style={styles.statLabel}>Total</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.in_progress}</Text><Text style={styles.statLabel}>In Progress</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{formatCurrency(stats.total_value)}</Text><Text style={styles.statLabel}>Value</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {['all', 'pending', 'in_progress', 'submitted', 'approved', 'paid'].map(status => (
          <TouchableOpacity key={status} style={[styles.filterChip, filterStatus === status && styles.filterChipActive]} onPress={() => { setFilterStatus(status); setLoading(true); }}>
            <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>{status === 'all' ? 'All' : status.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {milestones.length > 0 ? milestones.map(renderMilestoneCard) : (
            <View style={styles.emptyState}><Ionicons name="flag-outline" size={48} color="#666" /><Text style={styles.emptyText}>No milestones found</Text></View>
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
  statsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 12, padding: 12 },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1a1a2e', marginRight: 8, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 12, color: '#a0a0a0', fontWeight: '500', textTransform: 'capitalize' },
  filterChipTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: { padding: 16 },
  milestoneCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  urgentCard: { borderColor: '#EF4444' },
  milestoneHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  milestoneInfo: { flex: 1 },
  milestoneTitle: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  projectName: { fontSize: 13, color: '#a0a0a0', marginTop: 4 },
  clientName: { fontSize: 12, color: '#666', marginTop: 2 },
  milestoneRight: { alignItems: 'flex-end' },
  milestoneAmount: { fontSize: 18, fontWeight: 'bold', color: '#10B981' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 6 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  progressSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 12, color: '#a0a0a0' },
  progressValue: { fontSize: 12, color: '#FFF', fontWeight: '600' },
  progressBar: { height: 6, backgroundColor: '#2a2a4e', borderRadius: 3 },
  progressFill: { height: '100%', borderRadius: 3 },
  dueDateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  dueDateText: { fontSize: 12, color: '#666' },
  urgentText: { color: '#EF4444' },
  milestoneExpanded: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  description: { fontSize: 14, color: '#a0a0a0', lineHeight: 20, marginBottom: 14 },
  deliverablesSection: { marginBottom: 14 },
  deliverablesTitle: { fontSize: 13, fontWeight: '600', color: '#FFF', marginBottom: 10 },
  deliverableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  deliverableName: { flex: 1, fontSize: 14, color: '#a0a0a0' },
  deliverableCompleted: { color: '#666', textDecorationLine: 'line-through' },
  milestoneActions: { gap: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  submitButton: { backgroundColor: '#8B5CF6' },
  paymentButton: { backgroundColor: '#10B981' },
  submitText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  paymentText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
