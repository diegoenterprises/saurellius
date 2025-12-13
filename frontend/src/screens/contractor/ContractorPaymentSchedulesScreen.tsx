/**
 * CONTRACTOR PAYMENT SCHEDULES SCREEN
 * View and manage payment schedules
 * Track upcoming payments, set reminders
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

interface PaymentSchedule {
  id: string;
  client_name: string;
  project_name: string;
  amount: number;
  due_date: string;
  status: 'upcoming' | 'due_today' | 'overdue' | 'paid';
  payment_type: 'milestone' | 'recurring' | 'final' | 'retainer';
  invoice_id?: string;
  days_until_due: number;
  reminder_set: boolean;
}

interface ScheduleStats {
  total_expected: number;
  due_this_week: number;
  overdue_amount: number;
  paid_this_month: number;
}

export default function ContractorPaymentSchedulesScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [stats, setStats] = useState<ScheduleStats | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      const [schedulesRes, statsRes] = await Promise.all([
        api.get('/api/contractor/payment-schedules', { params: { status: filterStatus !== 'all' ? filterStatus : undefined } }),
        api.get('/api/contractor/payment-schedules/stats'),
      ]);
      setSchedules(schedulesRes.data.schedules || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'upcoming': return '#3B82F6';
      case 'due_today': return '#F59E0B';
      case 'overdue': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'milestone': return 'flag';
      case 'recurring': return 'repeat';
      case 'final': return 'checkmark-done';
      case 'retainer': return 'sync';
      default: return 'cash';
    }
  };

  const getDaysLabel = (days: number, status: string) => {
    if (status === 'paid') return 'Paid';
    if (days === 0) return 'Due today';
    if (days < 0) return `${Math.abs(days)}d overdue`;
    return `In ${days} days`;
  };

  const renderScheduleCard = (schedule: PaymentSchedule) => (
    <View key={schedule.id} style={[styles.scheduleCard, schedule.status === 'overdue' && styles.overdueCard, schedule.status === 'due_today' && styles.dueTodayCard]}>
      <View style={styles.scheduleHeader}>
        <View style={[styles.typeIcon, { backgroundColor: getStatusColor(schedule.status) + '20' }]}>
          <Ionicons name={getTypeIcon(schedule.payment_type) as any} size={20} color={getStatusColor(schedule.status)} />
        </View>
        <View style={styles.scheduleInfo}>
          <Text style={styles.clientName}>{schedule.client_name}</Text>
          <Text style={styles.projectName}>{schedule.project_name}</Text>
        </View>
        <View style={styles.amountSection}>
          <Text style={styles.amount}>{formatCurrency(schedule.amount)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(schedule.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(schedule.status) }]}>{schedule.status.replace('_', ' ')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.scheduleDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar" size={14} color="#666" />
          <Text style={styles.detailText}>{formatDate(schedule.due_date)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time" size={14} color={schedule.status === 'overdue' ? '#EF4444' : '#666'} />
          <Text style={[styles.detailText, schedule.status === 'overdue' && { color: '#EF4444' }]}>{getDaysLabel(schedule.days_until_due, schedule.status)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="pricetag" size={14} color="#666" />
          <Text style={styles.detailText}>{schedule.payment_type}</Text>
        </View>
      </View>

      <View style={styles.scheduleActions}>
        {schedule.status !== 'paid' && (
          <>
            {schedule.invoice_id ? (
              <TouchableOpacity style={[styles.actionButton, styles.viewInvoice]}>
                <Ionicons name="document-text" size={16} color="#1473FF" />
                <Text style={styles.viewInvoiceText}>View Invoice</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.actionButton, styles.createInvoice]}>
                <Ionicons name="add" size={16} color="#FFF" />
                <Text style={styles.createInvoiceText}>Create Invoice</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name={schedule.reminder_set ? 'notifications' : 'notifications-outline'} size={16} color={schedule.reminder_set ? '#F59E0B' : '#666'} />
            </TouchableOpacity>
          </>
        )}
        {schedule.status === 'paid' && (
          <View style={styles.paidBadge}><Ionicons name="checkmark-circle" size={18} color="#10B981" /><Text style={styles.paidText}>Payment Received</Text></View>
        )}
      </View>
    </View>
  );

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Schedules</Text>
          <TouchableOpacity><Ionicons name="calendar-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{formatCurrency(stats.total_expected)}</Text><Text style={styles.statLabel}>Expected</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3B82F6' }]}>{formatCurrency(stats.due_this_week)}</Text><Text style={styles.statLabel}>This Week</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#EF4444' }]}>{formatCurrency(stats.overdue_amount)}</Text><Text style={styles.statLabel}>Overdue</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {['all', 'upcoming', 'due_today', 'overdue', 'paid'].map(status => (
          <TouchableOpacity key={status} style={[styles.filterChip, filterStatus === status && styles.filterChipActive]} onPress={() => { setFilterStatus(status); setLoading(true); }}>
            <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>{status === 'all' ? 'All' : status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {schedules.length > 0 ? schedules.map(renderScheduleCard) : (
            <View style={styles.emptyState}><Ionicons name="calendar-outline" size={48} color="#666" /><Text style={styles.emptyText}>No payments scheduled</Text></View>
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
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 6 },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1a1a2e', marginRight: 8, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 13, color: '#a0a0a0', fontWeight: '500', textTransform: 'capitalize' },
  filterChipTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: { padding: 16 },
  scheduleCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  overdueCard: { borderColor: '#EF4444' },
  dueTodayCard: { borderColor: '#F59E0B' },
  scheduleHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  typeIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  scheduleInfo: { flex: 1 },
  clientName: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  projectName: { fontSize: 13, color: '#666', marginTop: 2 },
  amountSection: { alignItems: 'flex-end' },
  amount: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 4 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  scheduleDetails: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12, color: '#a0a0a0', textTransform: 'capitalize' },
  scheduleActions: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 8 },
  actionButton: { padding: 10, backgroundColor: '#0f0f23', borderRadius: 8 },
  viewInvoice: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  viewInvoiceText: { fontSize: 13, fontWeight: '500', color: '#1473FF' },
  createInvoice: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1473FF', gap: 6 },
  createInvoiceText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  paidBadge: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  paidText: { fontSize: 13, fontWeight: '500', color: '#10B981' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
