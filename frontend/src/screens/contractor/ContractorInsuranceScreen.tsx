/**
 * CONTRACTOR INSURANCE SCREEN
 * Manage business insurance policies
 * Track coverage, renewals, and certificates
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
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface InsurancePolicy {
  id: string;
  type: 'general_liability' | 'professional_liability' | 'workers_comp' | 'auto' | 'umbrella' | 'cyber';
  provider: string;
  policy_number: string;
  coverage_amount: number;
  deductible: number;
  premium: number;
  premium_frequency: 'monthly' | 'quarterly' | 'annual';
  start_date: string;
  end_date: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'pending';
  certificate_url?: string;
  auto_renew: boolean;
}

interface InsuranceStats {
  total_policies: number;
  active: number;
  total_coverage: number;
  annual_premium: number;
  expiring_soon: number;
}

const POLICY_TYPES = [
  { id: 'general_liability', name: 'General Liability', icon: 'shield-checkmark', color: '#3B82F6' },
  { id: 'professional_liability', name: 'Professional Liability', icon: 'briefcase', color: '#8B5CF6' },
  { id: 'workers_comp', name: 'Workers Comp', icon: 'people', color: '#10B981' },
  { id: 'auto', name: 'Commercial Auto', icon: 'car', color: '#F59E0B' },
  { id: 'umbrella', name: 'Umbrella', icon: 'umbrella', color: '#EC4899' },
  { id: 'cyber', name: 'Cyber Liability', icon: 'lock-closed', color: '#6366F1' },
];

export default function ContractorInsuranceScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [stats, setStats] = useState<InsuranceStats | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [policiesRes, statsRes] = await Promise.all([
        api.get('/api/contractor/insurance'),
        api.get('/api/contractor/insurance/stats'),
      ]);
      setPolicies(policiesRes.data.policies || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch insurance data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getDaysUntilExpiry = (endDate: string) => {
    const expiry = new Date(endDate);
    const today = new Date();
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'expiring_soon': return '#F59E0B';
      case 'expired': return '#EF4444';
      case 'pending': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getPolicyTypeInfo = (typeId: string) => POLICY_TYPES.find(t => t.id === typeId) || POLICY_TYPES[0];

  const handleShareCertificate = async (policy: InsurancePolicy) => {
    if (!policy.certificate_url) {
      Alert.alert('No Certificate', 'Certificate of insurance not available');
      return;
    }
    try {
      await Share.share({ url: policy.certificate_url, title: `${getPolicyTypeInfo(policy.type).name} Certificate` });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handleRenew = (policy: InsurancePolicy) => {
    Alert.alert('Renew Policy', `Contact ${policy.provider} to renew your ${getPolicyTypeInfo(policy.type).name} policy?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Contact', onPress: () => {} },
    ]);
  };

  const renderPolicyCard = (policy: InsurancePolicy) => {
    const typeInfo = getPolicyTypeInfo(policy.type);
    const daysUntilExpiry = getDaysUntilExpiry(policy.end_date);
    const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;

    return (
      <View key={policy.id} style={[styles.policyCard, policy.status === 'expired' && styles.expiredCard]}>
        <View style={styles.policyHeader}>
          <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + '20' }]}>
            <Ionicons name={typeInfo.icon as any} size={24} color={typeInfo.color} />
          </View>
          <View style={styles.policyInfo}>
            <Text style={styles.policyType}>{typeInfo.name}</Text>
            <Text style={styles.policyProvider}>{policy.provider}</Text>
            <Text style={styles.policyNumber}>Policy #: {policy.policy_number}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(policy.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(policy.status) }]}>{policy.status.replace('_', ' ')}</Text>
          </View>
        </View>

        <View style={styles.coverageRow}>
          <View style={styles.coverageItem}>
            <Text style={styles.coverageLabel}>Coverage</Text>
            <Text style={styles.coverageValue}>{formatCurrency(policy.coverage_amount)}</Text>
          </View>
          <View style={styles.coverageItem}>
            <Text style={styles.coverageLabel}>Deductible</Text>
            <Text style={styles.coverageValue}>{formatCurrency(policy.deductible)}</Text>
          </View>
          <View style={styles.coverageItem}>
            <Text style={styles.coverageLabel}>Premium</Text>
            <Text style={styles.coverageValue}>{formatCurrency(policy.premium)}/{policy.premium_frequency === 'monthly' ? 'mo' : policy.premium_frequency === 'quarterly' ? 'qtr' : 'yr'}</Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar" size={14} color="#666" />
            <Text style={styles.dateText}>Effective: {formatDate(policy.start_date)}</Text>
          </View>
          <View style={styles.dateItem}>
            <Ionicons name="time" size={14} color={isExpiringSoon || policy.status === 'expired' ? '#EF4444' : '#666'} />
            <Text style={[styles.dateText, (isExpiringSoon || policy.status === 'expired') && { color: '#EF4444' }]}>
              Expires: {formatDate(policy.end_date)}
            </Text>
          </View>
        </View>

        {isExpiringSoon && (
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={16} color="#F59E0B" />
            <Text style={styles.warningText}>Expires in {daysUntilExpiry} days</Text>
            {policy.auto_renew && <Text style={styles.autoRenewText}>Auto-renew enabled</Text>}
          </View>
        )}

        <View style={styles.policyActions}>
          {policy.certificate_url && (
            <TouchableOpacity style={styles.actionButton} onPress={() => handleShareCertificate(policy)}>
              <Ionicons name="document-text" size={18} color="#1473FF" />
              <Text style={styles.actionText}>Certificate</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="download-outline" size={18} color="#666" />
          </TouchableOpacity>
          {(policy.status === 'expiring_soon' || policy.status === 'expired') && (
            <TouchableOpacity style={[styles.actionButton, styles.renewButton]} onPress={() => handleRenew(policy)}>
              <Ionicons name="refresh" size={18} color="#FFF" />
              <Text style={styles.renewText}>Renew</Text>
            </TouchableOpacity>
          )}
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
          <Text style={styles.headerTitle}>Insurance</Text>
          <TouchableOpacity><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsCard}>
            <View style={styles.coverageSection}>
              <Text style={styles.totalCoverage}>{formatCurrency(stats.total_coverage)}</Text>
              <Text style={styles.coverageLabel2}>Total Coverage</Text>
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statsGrid}>
              <View style={styles.statItem}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.active}</Text><Text style={styles.statLabel}>Active</Text></View>
              <View style={styles.statItem}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.expiring_soon}</Text><Text style={styles.statLabel}>Expiring</Text></View>
              <View style={styles.statItem}><Text style={styles.statValue}>{formatCurrency(stats.annual_premium)}</Text><Text style={styles.statLabel}>Annual</Text></View>
            </View>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {policies.length > 0 ? policies.map(renderPolicyCard) : (
            <View style={styles.emptyState}>
              <Ionicons name="shield-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>No insurance policies</Text>
              <Text style={styles.emptySubtext}>Add your business insurance policies</Text>
            </View>
          )}
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Insurance Requirements</Text>
            <Text style={styles.tipText}>Many clients require contractors to maintain general liability and professional liability insurance. Keep certificates current for quick sharing.</Text>
          </View>
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
  coverageSection: { alignItems: 'center', paddingRight: 16 },
  totalCoverage: { fontSize: 24, fontWeight: 'bold', color: '#10B981' },
  coverageLabel2: { fontSize: 11, color: '#a0a0a0', marginTop: 2 },
  statsDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  statsGrid: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingLeft: 8 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  statLabel: { fontSize: 10, color: '#a0a0a0', marginTop: 2 },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  policyCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  expiredCard: { opacity: 0.7 },
  policyHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  typeIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  policyInfo: { flex: 1 },
  policyType: { fontSize: 16, fontWeight: '600', color: colors.text },
  policyProvider: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  policyNumber: { fontSize: 11, color: '#666', marginTop: 2, fontFamily: 'monospace' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  coverageRow: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  coverageItem: { flex: 1 },
  coverageLabel: { fontSize: 11, color: '#666' },
  coverageValue: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 2 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  dateItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 12, color: '#666' },
  warningBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B20', padding: 10, borderRadius: 8, marginTop: 12, gap: 8 },
  warningText: { fontSize: 12, color: '#F59E0B', fontWeight: '500', flex: 1 },
  autoRenewText: { fontSize: 10, color: '#10B981' },
  policyActions: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 10 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.background, borderRadius: 8, gap: 6 },
  actionText: { fontSize: 13, color: '#1473FF' },
  renewButton: { flex: 1, justifyContent: 'center', backgroundColor: '#F59E0B' },
  renewText: { fontSize: 13, fontWeight: '600', color: colors.text },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: colors.text, marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#666', marginTop: 4 },
  tipCard: { flexDirection: 'row', backgroundColor: '#3B82F610', marginHorizontal: 16, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#3B82F630' },
  tipContent: { flex: 1, marginLeft: 10 },
  tipTitle: { fontSize: 14, fontWeight: '600', color: '#3B82F6' },
  tipText: { fontSize: 12, color: '#a0a0a0', marginTop: 4, lineHeight: 18 },
});
