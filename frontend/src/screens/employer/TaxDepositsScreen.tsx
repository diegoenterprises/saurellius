/**
 * EMPLOYER TAX DEPOSITS SCREEN
 * Track and manage federal and state tax deposits
 * View deposit schedule, history, and upcoming deadlines
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

interface TaxDeposit {
  id: string;
  type: 'federal' | 'state' | 'local';
  tax_type: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'scheduled' | 'paid' | 'late';
  payment_date?: string;
  confirmation_number?: string;
  period_start: string;
  period_end: string;
}

interface DepositSchedule {
  frequency: 'semi_weekly' | 'monthly' | 'quarterly';
  next_deposit_date: string;
  lookback_amount: number;
}

interface TaxStats {
  ytd_federal: number;
  ytd_state: number;
  pending_deposits: number;
  next_due_date: string;
  next_due_amount: number;
}

export default function TaxDepositsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deposits, setDeposits] = useState<TaxDeposit[]>([]);
  const [schedule, setSchedule] = useState<DepositSchedule | null>(null);
  const [stats, setStats] = useState<TaxStats | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

  const fetchData = useCallback(async () => {
    try {
      const [depositsRes, scheduleRes, statsRes] = await Promise.all([
        api.get('/api/employer/tax-deposits'),
        api.get('/api/employer/tax-deposits/schedule'),
        api.get('/api/employer/tax-deposits/stats'),
      ]);
      setDeposits(depositsRes.data.deposits || []);
      setSchedule(scheduleRes.data.schedule || null);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch tax deposits:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'scheduled': return '#3B82F6';
      case 'pending': return '#F59E0B';
      case 'late': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const handlePayDeposit = async (deposit: TaxDeposit) => {
    Alert.alert(
      'Make Tax Deposit',
      `Pay ${formatCurrency(deposit.amount)} for ${deposit.tax_type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now',
          onPress: async () => {
            try {
              await api.post(`/api/employer/tax-deposits/${deposit.id}/pay`);
              Alert.alert('Success', 'Tax deposit initiated');
              fetchData();
            } catch (error) {
              Alert.alert('Error', 'Failed to process deposit');
            }
          },
        },
      ]
    );
  };

  const upcomingDeposits = deposits.filter(d => d.status === 'pending' || d.status === 'scheduled');
  const paidDeposits = deposits.filter(d => d.status === 'paid' || d.status === 'late');

  const renderDepositCard = (deposit: TaxDeposit) => {
    const daysUntil = getDaysUntilDue(deposit.due_date);
    const isUrgent = daysUntil <= 3 && deposit.status === 'pending';

    return (
      <View key={deposit.id} style={[styles.depositCard, isUrgent && styles.depositCardUrgent]}>
        <View style={styles.depositHeader}>
          <View style={[styles.typeIcon, { backgroundColor: deposit.type === 'federal' ? '#3B82F620' : '#8B5CF620' }]}>
            <Ionicons 
              name={deposit.type === 'federal' ? 'flag' : 'location'} 
              size={20} 
              color={deposit.type === 'federal' ? '#3B82F6' : '#8B5CF6'} 
            />
          </View>
          <View style={styles.depositInfo}>
            <Text style={styles.depositType}>{deposit.tax_type}</Text>
            <Text style={styles.depositPeriod}>
              {formatDate(deposit.period_start)} - {formatDate(deposit.period_end)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(deposit.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(deposit.status) }]}>
              {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.depositDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>{formatCurrency(deposit.amount)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Due Date</Text>
            <Text style={[styles.detailValue, isUrgent && { color: '#EF4444' }]}>
              {formatDate(deposit.due_date)}
              {deposit.status === 'pending' && daysUntil > 0 && ` (${daysUntil} days)`}
            </Text>
          </View>
          {deposit.confirmation_number && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Confirmation</Text>
              <Text style={styles.detailValue}>{deposit.confirmation_number}</Text>
            </View>
          )}
        </View>

        {deposit.status === 'pending' && (
          <TouchableOpacity 
            style={styles.payButton}
            onPress={() => handlePayDeposit(deposit)}
          >
            <LinearGradient
              colors={['#1473FF', '#BE01FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payGradient}
            >
              <Ionicons name="card" size={18} color="#FFF" />
              <Text style={styles.payButtonText}>Pay Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1473FF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tax Deposits</Text>
          <TouchableOpacity>
            <Ionicons name="calendar-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatCurrency(stats.ytd_federal)}</Text>
              <Text style={styles.statLabel}>YTD Federal</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatCurrency(stats.ytd_state)}</Text>
              <Text style={styles.statLabel}>YTD State</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pending_deposits}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {schedule && (
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleIcon}>
            <Ionicons name="time" size={24} color="#1473FF" />
          </View>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleTitle}>Deposit Schedule: {schedule.frequency.replace('_', '-')}</Text>
            <Text style={styles.scheduleNext}>Next deposit due: {formatDate(schedule.next_deposit_date)}</Text>
          </View>
        </View>
      )}

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming ({upcomingDeposits.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History ({paidDeposits.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}
      >
        <View style={styles.section}>
          {(activeTab === 'upcoming' ? upcomingDeposits : paidDeposits).length > 0 ? (
            (activeTab === 'upcoming' ? upcomingDeposits : paidDeposits).map(renderDepositCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              <Text style={styles.emptyText}>
                {activeTab === 'upcoming' ? 'No pending deposits' : 'No deposit history'}
              </Text>
            </View>
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
  statsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 12, padding: 14 },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 10 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  scheduleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1473FF20', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 14 },
  scheduleIcon: { marginRight: 12 },
  scheduleInfo: { flex: 1 },
  scheduleTitle: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  scheduleNext: { fontSize: 12, color: '#a0a0a0', marginTop: 2 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: '#1473FF' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#a0a0a0' },
  tabTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: { padding: 16 },
  depositCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  depositCardUrgent: { borderColor: '#EF4444' },
  depositHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  typeIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  depositInfo: { flex: 1 },
  depositType: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  depositPeriod: { fontSize: 12, color: '#a0a0a0', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600' },
  depositDetails: { borderTopWidth: 1, borderTopColor: '#2a2a4e', paddingTop: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  detailLabel: { fontSize: 13, color: '#666' },
  detailValue: { fontSize: 13, color: '#FFF', fontWeight: '500' },
  payButton: { marginTop: 12, borderRadius: 10, overflow: 'hidden' },
  payGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6 },
  payButtonText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
