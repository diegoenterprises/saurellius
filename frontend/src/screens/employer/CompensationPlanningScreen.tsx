/**
 * EMPLOYER COMPENSATION PLANNING SCREEN
 * Plan and manage salary reviews and adjustments
 * Budget allocation, merit increases, equity analysis
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

interface CompensationCycle {
  id: string;
  name: string;
  year: number;
  status: 'planning' | 'in_progress' | 'completed' | 'approved';
  budget_amount: number;
  allocated_amount: number;
  employees_affected: number;
  avg_increase_percent: number;
  start_date: string;
  end_date: string;
}

interface EmployeeAdjustment {
  id: string;
  employee_name: string;
  department: string;
  current_salary: number;
  proposed_salary: number;
  increase_percent: number;
  increase_type: 'merit' | 'promotion' | 'equity' | 'market';
  status: 'pending' | 'approved' | 'rejected';
  manager_approved: boolean;
  hr_approved: boolean;
}

interface CompStats {
  total_budget: number;
  remaining_budget: number;
  avg_increase: number;
  employees_reviewed: number;
  pending_approvals: number;
}

export default function CompensationPlanningScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cycles, setCycles] = useState<CompensationCycle[]>([]);
  const [adjustments, setAdjustments] = useState<EmployeeAdjustment[]>([]);
  const [stats, setStats] = useState<CompStats | null>(null);
  const [activeTab, setActiveTab] = useState<'cycles' | 'adjustments'>('cycles');
  const [activeCycleId, setActiveCycleId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [cyclesRes, statsRes] = await Promise.all([
        api.get('/api/employer/compensation/cycles'),
        api.get('/api/employer/compensation/stats'),
      ]);
      setCycles(cyclesRes.data.cycles || []);
      setStats(statsRes.data.stats || null);
      if (cyclesRes.data.cycles?.length > 0) {
        const active = cyclesRes.data.cycles.find((c: CompensationCycle) => c.status === 'in_progress') || cyclesRes.data.cycles[0];
        setActiveCycleId(active.id);
        const adjRes = await api.get(`/api/employer/compensation/cycles/${active.id}/adjustments`);
        setAdjustments(adjRes.data.adjustments || []);
      }
    } catch (error) {
      console.error('Failed to fetch compensation data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': case 'approved': return '#10B981';
      case 'in_progress': return '#3B82F6';
      case 'planning': return '#F59E0B';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getIncreaseTypeColor = (type: string) => {
    switch (type) {
      case 'merit': return '#10B981';
      case 'promotion': return '#3B82F6';
      case 'equity': return '#8B5CF6';
      case 'market': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const handleApprove = async (adjustment: EmployeeAdjustment) => {
    try {
      await api.post(`/api/employer/compensation/adjustments/${adjustment.id}/approve`);
      fetchData();
      Alert.alert('Success', 'Adjustment approved');
    } catch (error) {
      Alert.alert('Error', 'Failed to approve');
    }
  };

  const handleReject = async (adjustment: EmployeeAdjustment) => {
    Alert.alert('Reject Adjustment', `Reject salary adjustment for ${adjustment.employee_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
        try {
          await api.post(`/api/employer/compensation/adjustments/${adjustment.id}/reject`);
          fetchData();
        } catch (error) {
          Alert.alert('Error', 'Failed to reject');
        }
      }},
    ]);
  };

  const renderCycleCard = (cycle: CompensationCycle) => {
    const budgetUsed = cycle.budget_amount > 0 ? (cycle.allocated_amount / cycle.budget_amount) * 100 : 0;
    return (
      <TouchableOpacity key={cycle.id} style={[styles.cycleCard, activeCycleId === cycle.id && styles.activeCycle]} onPress={() => setActiveCycleId(cycle.id)}>
        <View style={styles.cycleHeader}>
          <View>
            <Text style={styles.cycleName}>{cycle.name}</Text>
            <Text style={styles.cycleYear}>{cycle.year}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(cycle.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(cycle.status) }]}>{cycle.status.replace('_', ' ')}</Text>
          </View>
        </View>

        <View style={styles.budgetSection}>
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetLabel}>Budget: {formatCurrency(cycle.allocated_amount)} / {formatCurrency(cycle.budget_amount)}</Text>
            <Text style={styles.budgetPercent}>{budgetUsed.toFixed(0)}%</Text>
          </View>
          <View style={styles.budgetBar}><View style={[styles.budgetFill, { width: `${Math.min(budgetUsed, 100)}%` }]} /></View>
        </View>

        <View style={styles.cycleStats}>
          <View style={styles.cycleStat}><Text style={styles.cycleStatValue}>{cycle.employees_affected}</Text><Text style={styles.cycleStatLabel}>Employees</Text></View>
          <View style={styles.cycleStat}><Text style={[styles.cycleStatValue, { color: '#10B981' }]}>{cycle.avg_increase_percent.toFixed(1)}%</Text><Text style={styles.cycleStatLabel}>Avg Increase</Text></View>
          <View style={styles.cycleStat}><Text style={styles.cycleStatValue}>{formatDate(cycle.start_date)}</Text><Text style={styles.cycleStatLabel}>Start</Text></View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderAdjustmentCard = (adj: EmployeeAdjustment) => (
    <View key={adj.id} style={styles.adjustmentCard}>
      <View style={styles.adjHeader}>
        <View style={styles.adjInfo}>
          <Text style={styles.adjName}>{adj.employee_name}</Text>
          <Text style={styles.adjDept}>{adj.department}</Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: getIncreaseTypeColor(adj.increase_type) + '20' }]}>
          <Text style={[styles.typeText, { color: getIncreaseTypeColor(adj.increase_type) }]}>{adj.increase_type}</Text>
        </View>
      </View>

      <View style={styles.salaryRow}>
        <View style={styles.salaryItem}>
          <Text style={styles.salaryLabel}>Current</Text>
          <Text style={styles.salaryValue}>{formatCurrency(adj.current_salary)}</Text>
        </View>
        <Ionicons name="arrow-forward" size={20} color="#10B981" />
        <View style={styles.salaryItem}>
          <Text style={styles.salaryLabel}>Proposed</Text>
          <Text style={[styles.salaryValue, { color: '#10B981' }]}>{formatCurrency(adj.proposed_salary)}</Text>
        </View>
        <View style={styles.increaseBox}>
          <Text style={styles.increaseValue}>+{adj.increase_percent.toFixed(1)}%</Text>
        </View>
      </View>

      <View style={styles.approvalRow}>
        <View style={styles.approvalItem}>
          <Ionicons name={adj.manager_approved ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={adj.manager_approved ? '#10B981' : '#666'} />
          <Text style={styles.approvalText}>Manager</Text>
        </View>
        <View style={styles.approvalItem}>
          <Ionicons name={adj.hr_approved ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={adj.hr_approved ? '#10B981' : '#666'} />
          <Text style={styles.approvalText}>HR</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(adj.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(adj.status) }]}>{adj.status}</Text>
        </View>
      </View>

      {adj.status === 'pending' && (
        <View style={styles.adjActions}>
          <TouchableOpacity style={[styles.adjButton, styles.rejectButton]} onPress={() => handleReject(adj)}>
            <Ionicons name="close" size={18} color="#EF4444" />
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.adjButton, styles.approveButton]} onPress={() => handleApprove(adj)}>
            <Ionicons name="checkmark" size={18} color="#FFF" />
            <Text style={styles.approveText}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Compensation Planning</Text>
          <TouchableOpacity><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{formatCurrency(stats.remaining_budget)}</Text><Text style={styles.statLabel}>Remaining</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.avg_increase.toFixed(1)}%</Text><Text style={styles.statLabel}>Avg Increase</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pending_approvals}</Text><Text style={styles.statLabel}>Pending</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'cycles' && styles.tabActive]} onPress={() => setActiveTab('cycles')}>
          <Text style={[styles.tabText, activeTab === 'cycles' && styles.tabTextActive]}>Cycles</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'adjustments' && styles.tabActive]} onPress={() => setActiveTab('adjustments')}>
          <Text style={[styles.tabText, activeTab === 'adjustments' && styles.tabTextActive]}>Adjustments</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {activeTab === 'cycles' ? (
            cycles.length > 0 ? cycles.map(renderCycleCard) : <View style={styles.emptyState}><Ionicons name="calendar-outline" size={48} color="#666" /><Text style={styles.emptyText}>No compensation cycles</Text></View>
          ) : (
            adjustments.length > 0 ? adjustments.map(renderAdjustmentCard) : <View style={styles.emptyState}><Ionicons name="cash-outline" size={48} color="#666" /><Text style={styles.emptyText}>No adjustments</Text></View>
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
  cycleCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  activeCycle: { borderColor: '#1473FF' },
  cycleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cycleName: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  cycleYear: { fontSize: 13, color: '#666', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  budgetSection: { marginTop: 14 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  budgetLabel: { fontSize: 12, color: '#a0a0a0' },
  budgetPercent: { fontSize: 12, fontWeight: '600', color: '#10B981' },
  budgetBar: { height: 6, backgroundColor: '#2a2a4e', borderRadius: 3 },
  budgetFill: { height: '100%', backgroundColor: '#1473FF', borderRadius: 3 },
  cycleStats: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  cycleStat: { flex: 1, alignItems: 'center' },
  cycleStatValue: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  cycleStatLabel: { fontSize: 10, color: '#666', marginTop: 2 },
  adjustmentCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  adjHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  adjInfo: { flex: 1 },
  adjName: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  adjDept: { fontSize: 13, color: '#666', marginTop: 2 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  typeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  salaryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  salaryItem: { flex: 1 },
  salaryLabel: { fontSize: 11, color: '#666' },
  salaryValue: { fontSize: 16, fontWeight: '600', color: '#FFF', marginTop: 2 },
  increaseBox: { backgroundColor: '#10B98120', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  increaseValue: { fontSize: 14, fontWeight: 'bold', color: '#10B981' },
  approvalRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 16 },
  approvalItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  approvalText: { fontSize: 12, color: '#666' },
  adjActions: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 10 },
  adjButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  rejectButton: { backgroundColor: '#EF444420' },
  approveButton: { backgroundColor: '#10B981' },
  rejectText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
  approveText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
