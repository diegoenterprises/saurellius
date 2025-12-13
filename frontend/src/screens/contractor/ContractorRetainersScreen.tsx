/**
 * CONTRACTOR RETAINER MANAGEMENT SCREEN
 * Manage retainer agreements with clients
 * Track usage, billing cycles, and renewals
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

interface Retainer {
  id: string;
  client_name: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  hours_included: number;
  hours_used: number;
  hours_remaining: number;
  rollover_enabled: boolean;
  rollover_hours: number;
  status: 'active' | 'paused' | 'expired';
  start_date: string;
  renewal_date: string;
  auto_renew: boolean;
  billing_day: number;
  last_invoiced?: string;
}

interface RetainerStats {
  total_retainers: number;
  monthly_revenue: number;
  hours_available: number;
  utilization_rate: number;
}

export default function ContractorRetainersScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retainers, setRetainers] = useState<Retainer[]>([]);
  const [stats, setStats] = useState<RetainerStats | null>(null);
  const [expandedRetainer, setExpandedRetainer] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [retainersRes, statsRes] = await Promise.all([
        api.get('/api/contractor/retainers'),
        api.get('/api/contractor/retainers/stats'),
      ]);
      setRetainers(retainersRes.data.retainers || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch retainers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'paused': return '#F59E0B';
      case 'expired': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getDaysUntilRenewal = (renewalDate: string) => {
    const renewal = new Date(renewalDate);
    const today = new Date();
    return Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleLogTime = (retainer: Retainer) => {
    navigation.navigate('ContractorTimeTracker', { retainerId: retainer.id, clientName: retainer.client_name });
  };

  const handleInvoice = (retainer: Retainer) => {
    navigation.navigate('ContractorInvoices', { retainerId: retainer.id });
  };

  const handleTogglePause = async (retainer: Retainer) => {
    const action = retainer.status === 'paused' ? 'resume' : 'pause';
    Alert.alert(`${action.charAt(0).toUpperCase() + action.slice(1)} Retainer`, `${action} retainer with ${retainer.client_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: async () => {
        try {
          await api.post(`/api/contractor/retainers/${retainer.id}/${action}`);
          fetchData();
        } catch (error) {
          Alert.alert('Error', `Failed to ${action} retainer`);
        }
      }},
    ]);
  };

  const renderRetainerCard = (retainer: Retainer) => {
    const isExpanded = expandedRetainer === retainer.id;
    const daysUntilRenewal = getDaysUntilRenewal(retainer.renewal_date);
    const usagePercent = (retainer.hours_used / retainer.hours_included) * 100;

    return (
      <View key={retainer.id} style={styles.retainerCard}>
        <TouchableOpacity style={styles.retainerHeader} onPress={() => setExpandedRetainer(isExpanded ? null : retainer.id)}>
          <View style={styles.clientAvatar}><Text style={styles.clientInitial}>{retainer.client_name[0]}</Text></View>
          <View style={styles.retainerInfo}>
            <Text style={styles.clientName}>{retainer.client_name}</Text>
            <Text style={styles.retainerAmount}>{formatCurrency(retainer.amount)}/{retainer.frequency}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(retainer.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(retainer.status) }]}>{retainer.status}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.usageSection}>
          <View style={styles.usageHeader}>
            <Text style={styles.usageLabel}>Hours Used</Text>
            <Text style={styles.usageValue}>{retainer.hours_used}/{retainer.hours_included}h</Text>
          </View>
          <View style={styles.usageBar}>
            <View style={[styles.usageFill, { width: `${Math.min(usagePercent, 100)}%`, backgroundColor: usagePercent > 90 ? '#EF4444' : usagePercent > 75 ? '#F59E0B' : '#10B981' }]} />
          </View>
          {retainer.rollover_hours > 0 && <Text style={styles.rolloverText}>+{retainer.rollover_hours}h rollover available</Text>}
        </View>

        {daysUntilRenewal <= 14 && retainer.status === 'active' && (
          <View style={styles.renewalAlert}>
            <Ionicons name="time" size={16} color="#F59E0B" />
            <Text style={styles.renewalText}>Renews in {daysUntilRenewal} days</Text>
            {retainer.auto_renew && <View style={styles.autoRenewBadge}><Text style={styles.autoRenewText}>Auto</Text></View>}
          </View>
        )}

        {isExpanded && (
          <View style={styles.retainerExpanded}>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Start Date</Text><Text style={styles.detailValue}>{formatDate(retainer.start_date)}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Renewal Date</Text><Text style={styles.detailValue}>{formatDate(retainer.renewal_date)}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Billing Day</Text><Text style={styles.detailValue}>{retainer.billing_day}th of month</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Rollover</Text><Text style={styles.detailValue}>{retainer.rollover_enabled ? 'Enabled' : 'Disabled'}</Text></View>
            {retainer.last_invoiced && <View style={styles.detailRow}><Text style={styles.detailLabel}>Last Invoiced</Text><Text style={styles.detailValue}>{formatDate(retainer.last_invoiced)}</Text></View>}

            <View style={styles.retainerActions}>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleLogTime(retainer)}>
                <Ionicons name="time" size={18} color="#1473FF" />
                <Text style={styles.actionButtonText}>Log Time</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleInvoice(retainer)}>
                <Ionicons name="receipt" size={18} color="#10B981" />
                <Text style={[styles.actionButtonText, { color: '#10B981' }]}>Invoice</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#F59E0B20' }]} onPress={() => handleTogglePause(retainer)}>
                <Ionicons name={retainer.status === 'paused' ? 'play' : 'pause'} size={18} color="#F59E0B" />
                <Text style={[styles.actionButtonText, { color: '#F59E0B' }]}>{retainer.status === 'paused' ? 'Resume' : 'Pause'}</Text>
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
          <Text style={styles.headerTitle}>Retainers</Text>
          <TouchableOpacity><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_retainers}</Text><Text style={styles.statLabel}>Active</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{formatCurrency(stats.monthly_revenue)}</Text><Text style={styles.statLabel}>Monthly</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.hours_available}h</Text><Text style={styles.statLabel}>Available</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.utilization_rate}%</Text><Text style={styles.statLabel}>Utilized</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {retainers.length > 0 ? retainers.map(renderRetainerCard) : (
            <View style={styles.emptyState}><Ionicons name="repeat-outline" size={48} color="#666" /><Text style={styles.emptyText}>No retainer agreements</Text></View>
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
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  content: { flex: 1 },
  section: { padding: 16 },
  retainerCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  retainerHeader: { flexDirection: 'row', alignItems: 'center' },
  clientAvatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  clientInitial: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  retainerInfo: { flex: 1 },
  clientName: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  retainerAmount: { fontSize: 14, color: '#10B981', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  usageSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  usageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  usageLabel: { fontSize: 12, color: '#a0a0a0' },
  usageValue: { fontSize: 12, color: '#FFF', fontWeight: '600' },
  usageBar: { height: 8, backgroundColor: '#2a2a4e', borderRadius: 4 },
  usageFill: { height: '100%', borderRadius: 4 },
  rolloverText: { fontSize: 11, color: '#3B82F6', marginTop: 6 },
  renewalAlert: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B20', padding: 10, borderRadius: 8, marginTop: 12, gap: 6 },
  renewalText: { flex: 1, fontSize: 12, color: '#F59E0B' },
  autoRenewBadge: { backgroundColor: '#F59E0B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  autoRenewText: { fontSize: 10, fontWeight: '600', color: '#FFF' },
  retainerExpanded: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  detailLabel: { fontSize: 13, color: '#666' },
  detailValue: { fontSize: 13, color: '#FFF' },
  retainerActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1473FF20', borderRadius: 10, paddingVertical: 10, gap: 4 },
  actionButtonText: { fontSize: 12, fontWeight: '500', color: '#1473FF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
