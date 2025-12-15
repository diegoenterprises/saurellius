/**
 * ADMIN SUBSCRIPTIONS SCREEN
 * Manage platform subscriptions, billing, and plan management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import BackButton from '../../components/common/BackButton';
import api from '../../services/api';

const COLORS = {
  background: '#0f0f23',
  card: '#1a1a2e',
  cardLight: '#252542',
  primary: '#1473FF',
  secondary: '#BE01FF',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  text: '#FFFFFF',
  textMuted: '#94A3B8',
  border: '#2a2a4e',
};

interface Subscription {
  id: string;
  company_name: string;
  email: string;
  plan: 'free' | 'starter' | 'professional' | 'business';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  mrr: number;
  start_date: string;
  next_billing: string;
}

interface PlanStats {
  plan: string;
  count: number;
  mrr: number;
  color: string;
}

export default function AdminSubscriptionsScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'cancelled'>('all');

  const planStats: PlanStats[] = [
    { plan: 'Free', count: 0, mrr: 0, color: '#6B7280' },
    { plan: 'Starter', count: 0, mrr: 0, color: '#3B82F6' },
    { plan: 'Professional', count: 0, mrr: 0, color: '#8B5CF6' },
    { plan: 'Business', count: 0, mrr: 0, color: '#F59E0B' },
  ];

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await api.get('/api/admin/subscriptions');
      if (response.data?.subscriptions) {
        setSubscriptions(response.data.subscriptions);
      } else {
        setSubscriptions([]);
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      setSubscriptions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubscriptions();
  };

  const getPlanColor = (plan: string) => {
    const colors: Record<string, string> = {
      free: '#6B7280',
      starter: '#3B82F6',
      professional: '#8B5CF6',
      business: '#F59E0B',
    };
    return colors[plan] || '#6B7280';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: COLORS.success,
      cancelled: COLORS.danger,
      past_due: COLORS.warning,
      trialing: COLORS.primary,
    };
    return colors[status] || '#6B7280';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalMRR = subscriptions.reduce((sum, sub) => sum + sub.mrr, 0);
  const activeCount = subscriptions.filter(s => s.status === 'active').length;

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return sub.status === 'active';
    if (activeTab === 'cancelled') return sub.status === 'cancelled';
    return true;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerRow}>
          <BackButton variant="gradient" />
          <Text style={styles.headerTitle}>Subscriptions</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>Manage billing & plans</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(totalMRR)}</Text>
            <Text style={styles.statLabel}>Monthly Revenue</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active Subscriptions</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['all', 'active', 'cancelled'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Subscriptions List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Subscriptions ({filteredSubscriptions.length})</Text>
          
          {filteredSubscriptions.map(sub => (
            <TouchableOpacity key={sub.id} style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <View>
                  <Text style={styles.companyName}>{sub.company_name}</Text>
                  <Text style={styles.companyEmail}>{sub.email}</Text>
                </View>
                <View style={[styles.planBadge, { backgroundColor: getPlanColor(sub.plan) + '20' }]}>
                  <Text style={[styles.planBadgeText, { color: getPlanColor(sub.plan) }]}>
                    {sub.plan.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.subscriptionDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>MRR</Text>
                  <Text style={styles.detailValue}>{formatCurrency(sub.mrr)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(sub.status) + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(sub.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(sub.status) }]}>
                      {sub.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Next Billing</Text>
                  <Text style={styles.detailValue}>{sub.next_billing}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4, textAlign: 'center' },
  content: { flex: 1 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: COLORS.card, padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: COLORS.card },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontWeight: '600' },
  tabTextActive: { color: '#FFFFFF' },
  listSection: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  subscriptionCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  subscriptionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  companyName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  companyEmail: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  planBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  planBadgeText: { fontSize: 11, fontWeight: '700' },
  subscriptionDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  detailItem: { alignItems: 'center' },
  detailLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
});
