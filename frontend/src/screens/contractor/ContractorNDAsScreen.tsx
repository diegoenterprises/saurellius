/**
 * CONTRACTOR NDAS SCREEN
 * Manage NDAs and legal agreements
 * Sign, view, and track agreements
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

interface Agreement {
  id: string;
  title: string;
  type: 'nda' | 'msa' | 'sow' | 'non_compete' | 'ip_assignment';
  client_name: string;
  status: 'pending' | 'signed' | 'expired' | 'terminated';
  effective_date?: string;
  expiration_date?: string;
  signed_date?: string;
  requires_signature: boolean;
  document_url: string;
  summary: string;
}

interface AgreementStats {
  total_agreements: number;
  pending_signature: number;
  active: number;
  expiring_soon: number;
}

const AGREEMENT_TYPES = [
  { id: 'nda', name: 'NDA', icon: 'shield', color: '#3B82F6' },
  { id: 'msa', name: 'MSA', icon: 'document-text', color: '#10B981' },
  { id: 'sow', name: 'SOW', icon: 'list', color: '#F59E0B' },
  { id: 'non_compete', name: 'Non-Compete', icon: 'ban', color: '#EF4444' },
  { id: 'ip_assignment', name: 'IP Assignment', icon: 'bulb', color: '#8B5CF6' },
];

export default function ContractorNDAsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [stats, setStats] = useState<AgreementStats | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      const [agreementsRes, statsRes] = await Promise.all([
        api.get('/api/contractor/agreements', { params: { type: filterType !== 'all' ? filterType : undefined } }),
        api.get('/api/contractor/agreements/stats'),
      ]);
      setAgreements(agreementsRes.data.agreements || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch agreements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterType]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getTypeInfo = (typeId: string) => AGREEMENT_TYPES.find(t => t.id === typeId) || AGREEMENT_TYPES[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'expired': return '#6B7280';
      case 'terminated': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const handleSign = async (agreement: Agreement) => {
    Alert.alert('Sign Agreement', `Sign "${agreement.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Review & Sign', onPress: () => navigation.navigate('SignAgreement', { agreementId: agreement.id }) },
    ]);
  };

  const handleDownload = async (agreement: Agreement) => {
    Alert.alert('Download', `Downloading ${agreement.title}...`);
  };

  const renderAgreementCard = (agreement: Agreement) => {
    const typeInfo = getTypeInfo(agreement.type);
    const isExpiringSoon = agreement.expiration_date && new Date(agreement.expiration_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return (
      <View key={agreement.id} style={[styles.agreementCard, agreement.status === 'pending' && styles.pendingCard]}>
        {isExpiringSoon && agreement.status === 'signed' && (
          <View style={styles.expiringBadge}><Ionicons name="warning" size={12} color="#F59E0B" /><Text style={styles.expiringText}>Expiring Soon</Text></View>
        )}
        
        <View style={styles.agreementHeader}>
          <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + '20' }]}>
            <Ionicons name={typeInfo.icon as any} size={22} color={typeInfo.color} />
          </View>
          <View style={styles.agreementInfo}>
            <Text style={styles.agreementTitle}>{agreement.title}</Text>
            <Text style={styles.clientName}>{agreement.client_name}</Text>
            <View style={[styles.typeBadge, { backgroundColor: typeInfo.color + '20' }]}>
              <Text style={[styles.typeText, { color: typeInfo.color }]}>{typeInfo.name}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(agreement.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(agreement.status) }]}>{agreement.status}</Text>
          </View>
        </View>

        <Text style={styles.summary} numberOfLines={2}>{agreement.summary}</Text>

        <View style={styles.datesRow}>
          {agreement.effective_date && (
            <View style={styles.dateItem}><Ionicons name="calendar" size={14} color="#10B981" /><Text style={styles.dateLabel}>Effective:</Text><Text style={styles.dateValue}>{formatDate(agreement.effective_date)}</Text></View>
          )}
          {agreement.expiration_date && (
            <View style={styles.dateItem}><Ionicons name="time" size={14} color={isExpiringSoon ? '#F59E0B' : '#666'} /><Text style={styles.dateLabel}>Expires:</Text><Text style={[styles.dateValue, isExpiringSoon && { color: '#F59E0B' }]}>{formatDate(agreement.expiration_date)}</Text></View>
          )}
          {agreement.signed_date && (
            <View style={styles.dateItem}><Ionicons name="create" size={14} color="#666" /><Text style={styles.dateLabel}>Signed:</Text><Text style={styles.dateValue}>{formatDate(agreement.signed_date)}</Text></View>
          )}
        </View>

        <View style={styles.agreementActions}>
          {agreement.requires_signature && agreement.status === 'pending' ? (
            <TouchableOpacity style={[styles.actionButton, styles.signButton]} onPress={() => handleSign(agreement)}>
              <Ionicons name="create" size={18} color="#FFF" />
              <Text style={styles.signText}>Sign Now</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.actionButton} onPress={() => handleDownload(agreement)}>
              <Ionicons name="download-outline" size={18} color="#1473FF" />
              <Text style={styles.downloadText}>Download</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionButton}><Ionicons name="eye-outline" size={18} color="#666" /></TouchableOpacity>
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
          <Text style={styles.headerTitle}>NDAs & Agreements</Text>
          <View style={{ width: 24 }} />
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_agreements}</Text><Text style={styles.statLabel}>Total</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pending_signature}</Text><Text style={styles.statLabel}>Pending</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.active}</Text><Text style={styles.statLabel}>Active</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.expiring_soon}</Text><Text style={styles.statLabel}>Expiring</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        <TouchableOpacity style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]} onPress={() => { setFilterType('all'); setLoading(true); }}>
          <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        {AGREEMENT_TYPES.map(type => (
          <TouchableOpacity key={type.id} style={[styles.filterChip, filterType === type.id && styles.filterChipActive]} onPress={() => { setFilterType(type.id); setLoading(true); }}>
            <Ionicons name={type.icon as any} size={14} color={filterType === type.id ? '#FFF' : type.color} />
            <Text style={[styles.filterChipText, filterType === type.id && styles.filterChipTextActive]}>{type.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {agreements.length > 0 ? agreements.map(renderAgreementCard) : (
            <View style={styles.emptyState}><Ionicons name="document-text-outline" size={48} color="#666" /><Text style={styles.emptyText}>No agreements</Text></View>
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
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1a1a2e', marginRight: 8, gap: 6, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 12, color: '#a0a0a0', fontWeight: '500' },
  filterChipTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  agreementCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#2a2a4e' },
  pendingCard: { borderColor: '#F59E0B' },
  expiringBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#F59E0B20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 10, gap: 4 },
  expiringText: { fontSize: 11, fontWeight: '600', color: '#F59E0B' },
  agreementHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  typeIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  agreementInfo: { flex: 1 },
  agreementTitle: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  clientName: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6 },
  typeText: { fontSize: 10, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  summary: { fontSize: 13, color: '#666', marginTop: 12, lineHeight: 18 },
  datesRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 12 },
  dateItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateLabel: { fontSize: 11, color: '#666' },
  dateValue: { fontSize: 11, fontWeight: '500', color: '#FFF' },
  agreementActions: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#0f0f23', borderRadius: 8, gap: 6 },
  signButton: { flex: 1, justifyContent: 'center', backgroundColor: '#F59E0B' },
  signText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  downloadText: { fontSize: 13, color: '#1473FF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
