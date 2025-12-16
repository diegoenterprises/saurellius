/**
 * EMPLOYER BENEFITS ADMIN SCREEN
 * Manage company benefits plans and enrollments
 * Configure plans, track costs, manage open enrollment
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

interface BenefitPlan {
  id: string;
  name: string;
  type: 'health' | 'dental' | 'vision' | 'life' | '401k' | 'hsa' | 'fsa' | 'pto';
  provider: string;
  monthly_cost_employee: number;
  monthly_cost_employer: number;
  enrolled_count: number;
  eligible_count: number;
  status: 'active' | 'inactive' | 'pending';
  effective_date: string;
  plan_year: string;
}

interface BenefitsStats {
  total_plans: number;
  active_enrollments: number;
  monthly_employer_cost: number;
  open_enrollment_days?: number;
}

const PLAN_TYPES = [
  { id: 'health', name: 'Health', icon: 'medkit', color: '#EF4444' },
  { id: 'dental', name: 'Dental', icon: 'happy', color: '#3B82F6' },
  { id: 'vision', name: 'Vision', icon: 'eye', color: '#8B5CF6' },
  { id: 'life', name: 'Life', icon: 'shield', color: '#10B981' },
  { id: '401k', name: '401(k)', icon: 'trending-up', color: '#F59E0B' },
  { id: 'hsa', name: 'HSA', icon: 'wallet', color: '#EC4899' },
  { id: 'fsa', name: 'FSA', icon: 'card', color: '#6366F1' },
  { id: 'pto', name: 'PTO', icon: 'calendar', color: '#14B8A6' },
];

export default function BenefitsAdminScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [plans, setPlans] = useState<BenefitPlan[]>([]);
  const [stats, setStats] = useState<BenefitsStats | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      const [plansRes, statsRes] = await Promise.all([
        api.get('/api/employer/benefits/plans', { params: { type: filterType !== 'all' ? filterType : undefined } }),
        api.get('/api/employer/benefits/stats'),
      ]);
      setPlans(plansRes.data.plans || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch benefits:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterType]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const getTypeInfo = (typeId: string) => PLAN_TYPES.find(t => t.id === typeId) || PLAN_TYPES[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#6B7280';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const handleTogglePlan = async (plan: BenefitPlan) => {
    const newStatus = plan.status === 'active' ? 'inactive' : 'active';
    Alert.alert(`${newStatus === 'active' ? 'Activate' : 'Deactivate'} Plan`, `${newStatus === 'active' ? 'Activate' : 'Deactivate'} "${plan.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: async () => {
        try {
          await api.post(`/api/employer/benefits/plans/${plan.id}/status`, { status: newStatus });
          fetchData();
        } catch (error) {
          Alert.alert('Error', 'Failed to update plan status');
        }
      }},
    ]);
  };

  const renderPlanCard = (plan: BenefitPlan) => {
    const typeInfo = getTypeInfo(plan.type);
    const enrollmentRate = plan.eligible_count > 0 ? (plan.enrolled_count / plan.eligible_count) * 100 : 0;

    return (
      <View key={plan.id} style={styles.planCard}>
        <View style={styles.planHeader}>
          <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + '20' }]}>
            <Ionicons name={typeInfo.icon as any} size={24} color={typeInfo.color} />
          </View>
          <View style={styles.planInfo}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planProvider}>{plan.provider}</Text>
            <Text style={styles.planYear}>{plan.plan_year}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(plan.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(plan.status) }]}>{plan.status}</Text>
          </View>
        </View>

        <View style={styles.costRow}>
          <View style={styles.costItem}>
            <Text style={styles.costLabel}>Employee Cost</Text>
            <Text style={styles.costValue}>{formatCurrency(plan.monthly_cost_employee)}/mo</Text>
          </View>
          <View style={styles.costItem}>
            <Text style={styles.costLabel}>Employer Cost</Text>
            <Text style={[styles.costValue, { color: '#EF4444' }]}>{formatCurrency(plan.monthly_cost_employer)}/mo</Text>
          </View>
          <View style={styles.costItem}>
            <Text style={styles.costLabel}>Total/mo</Text>
            <Text style={styles.costValue}>{formatCurrency((plan.monthly_cost_employee + plan.monthly_cost_employer) * plan.enrolled_count)}</Text>
          </View>
        </View>

        <View style={styles.enrollmentSection}>
          <View style={styles.enrollmentHeader}>
            <Text style={styles.enrollmentLabel}>{plan.enrolled_count}/{plan.eligible_count} enrolled</Text>
            <Text style={styles.enrollmentPercent}>{enrollmentRate.toFixed(0)}%</Text>
          </View>
          <View style={styles.enrollmentBar}>
            <View style={[styles.enrollmentFill, { width: `${enrollmentRate}%`, backgroundColor: typeInfo.color }]} />
          </View>
        </View>

        <View style={styles.planActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="people" size={18} color="#1473FF" />
            <Text style={styles.actionText}>Enrollees</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="create-outline" size={18} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleTogglePlan(plan)}>
            <Ionicons name={plan.status === 'active' ? 'pause' : 'play'} size={18} color={plan.status === 'active' ? '#F59E0B' : '#10B981'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Benefits Admin</Text>
          <TouchableOpacity><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsCard}>
            <View style={styles.statSection}>
              <Text style={styles.statMainValue}>{formatCurrency(stats.monthly_employer_cost)}</Text>
              <Text style={styles.statMainLabel}>Monthly Cost</Text>
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statsGrid}>
              <View style={styles.statItem}><Text style={styles.statValue}>{stats.total_plans}</Text><Text style={styles.statLabel}>Plans</Text></View>
              <View style={styles.statItem}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.active_enrollments}</Text><Text style={styles.statLabel}>Enrolled</Text></View>
              {stats.open_enrollment_days && <View style={styles.statItem}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.open_enrollment_days}d</Text><Text style={styles.statLabel}>Open Enroll</Text></View>}
            </View>
          </View>
        )}
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        <TouchableOpacity style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]} onPress={() => { setFilterType('all'); setLoading(true); }}>
          <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        {PLAN_TYPES.map(type => (
          <TouchableOpacity key={type.id} style={[styles.filterChip, filterType === type.id && styles.filterChipActive]} onPress={() => { setFilterType(type.id); setLoading(true); }}>
            <Ionicons name={type.icon as any} size={14} color={filterType === type.id ? '#FFF' : type.color} />
            <Text style={[styles.filterChipText, filterType === type.id && styles.filterChipTextActive]}>{type.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {plans.length > 0 ? plans.map(renderPlanCard) : (
            <View style={styles.emptyState}><Ionicons name="medkit-outline" size={48} color="#666" /><Text style={styles.emptyText}>No benefit plans</Text></View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingBottom: 16 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  statsCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 14, padding: 16 },
  statSection: { alignItems: 'center', paddingRight: 16 },
  statMainValue: { fontSize: 24, fontWeight: 'bold', color: '#EF4444' },
  statMainLabel: { fontSize: 11, color: '#a0a0a0', marginTop: 2 },
  statsDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  statsGrid: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingLeft: 8 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  statLabel: { fontSize: 10, color: '#a0a0a0', marginTop: 2 },
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.card, marginRight: 8, gap: 6, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 12, color: '#a0a0a0', fontWeight: '500' },
  filterChipTextActive: { color: colors.text },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  planCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  planHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  typeIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  planInfo: { flex: 1 },
  planName: { fontSize: 16, fontWeight: '600', color: colors.text },
  planProvider: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  planYear: { fontSize: 11, color: '#666', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  costRow: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  costItem: { flex: 1 },
  costLabel: { fontSize: 11, color: '#666' },
  costValue: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 2 },
  enrollmentSection: { marginTop: 12 },
  enrollmentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  enrollmentLabel: { fontSize: 12, color: '#a0a0a0' },
  enrollmentPercent: { fontSize: 12, fontWeight: '600', color: '#10B981' },
  enrollmentBar: { height: 6, backgroundColor: '#2a2a4e', borderRadius: 3 },
  enrollmentFill: { height: '100%', borderRadius: 3 },
  planActions: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 10 },
  actionButton: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: colors.background, borderRadius: 8, gap: 6 },
  actionText: { fontSize: 13, color: '#1473FF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
