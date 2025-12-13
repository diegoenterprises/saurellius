/**
 * EMPLOYER POLICY LIBRARY SCREEN
 * Manage company policies and procedures
 * Version control, acknowledgments, distribution
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

interface Policy {
  id: string;
  title: string;
  category: string;
  version: string;
  effective_date: string;
  review_date: string;
  status: 'active' | 'draft' | 'under_review' | 'archived';
  owner: string;
  acknowledgments_required: number;
  acknowledgments_received: number;
  last_updated: string;
  summary: string;
}

interface PolicyStats {
  total_policies: number;
  active_policies: number;
  pending_review: number;
  acknowledgment_rate: number;
}

const CATEGORIES = [
  { id: 'hr', name: 'HR Policies', icon: 'people', color: '#3B82F6' },
  { id: 'safety', name: 'Safety', icon: 'shield', color: '#EF4444' },
  { id: 'it', name: 'IT & Security', icon: 'lock-closed', color: '#8B5CF6' },
  { id: 'conduct', name: 'Code of Conduct', icon: 'ribbon', color: '#10B981' },
  { id: 'benefits', name: 'Benefits', icon: 'gift', color: '#F59E0B' },
  { id: 'compliance', name: 'Compliance', icon: 'checkmark-circle', color: '#6366F1' },
];

export default function PolicyLibraryScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [stats, setStats] = useState<PolicyStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      const [policiesRes, statsRes] = await Promise.all([
        api.get('/api/employer/policy-library', { params: { search: searchQuery || undefined, category: filterCategory !== 'all' ? filterCategory : undefined } }),
        api.get('/api/employer/policy-library/stats'),
      ]);
      setPolicies(policiesRes.data.policies || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch policies:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filterCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getCategoryInfo = (categoryId: string) => CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'draft': return '#6B7280';
      case 'under_review': return '#F59E0B';
      case 'archived': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const handleSendReminder = async (policy: Policy) => {
    try {
      await api.post(`/api/employer/policy-library/${policy.id}/remind`);
      Alert.alert('Success', 'Reminder sent to employees');
    } catch (error) {
      Alert.alert('Error', 'Failed to send reminder');
    }
  };

  const renderPolicyCard = (policy: Policy) => {
    const catInfo = getCategoryInfo(policy.category);
    const ackRate = policy.acknowledgments_required > 0 ? (policy.acknowledgments_received / policy.acknowledgments_required) * 100 : 0;
    const needsReview = new Date(policy.review_date) <= new Date();

    return (
      <View key={policy.id} style={[styles.policyCard, needsReview && styles.reviewNeeded]}>
        {needsReview && (
          <View style={styles.reviewBadge}><Ionicons name="alert-circle" size={14} color="#F59E0B" /><Text style={styles.reviewText}>Review needed</Text></View>
        )}
        <View style={styles.policyHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: catInfo.color + '20' }]}>
            <Ionicons name={catInfo.icon as any} size={22} color={catInfo.color} />
          </View>
          <View style={styles.policyInfo}>
            <Text style={styles.policyTitle}>{policy.title}</Text>
            <Text style={styles.policySummary} numberOfLines={2}>{policy.summary}</Text>
            <View style={styles.policyMeta}>
              <View style={styles.metaItem}><Ionicons name="git-branch" size={12} color="#666" /><Text style={styles.metaText}>v{policy.version}</Text></View>
              <View style={styles.metaItem}><Ionicons name="person" size={12} color="#666" /><Text style={styles.metaText}>{policy.owner}</Text></View>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(policy.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(policy.status) }]}>{policy.status.replace('_', ' ')}</Text>
          </View>
        </View>

        <View style={styles.ackSection}>
          <View style={styles.ackHeader}>
            <Text style={styles.ackLabel}>Acknowledgments</Text>
            <Text style={styles.ackValue}>{policy.acknowledgments_received}/{policy.acknowledgments_required} ({ackRate.toFixed(0)}%)</Text>
          </View>
          <View style={styles.ackBar}><View style={[styles.ackFill, { width: `${ackRate}%`, backgroundColor: ackRate >= 90 ? '#10B981' : ackRate >= 70 ? '#F59E0B' : '#EF4444' }]} /></View>
        </View>

        <View style={styles.datesRow}>
          <View style={styles.dateItem}><Ionicons name="calendar" size={14} color="#10B981" /><Text style={styles.dateLabel}>Effective:</Text><Text style={styles.dateValue}>{formatDate(policy.effective_date)}</Text></View>
          <View style={styles.dateItem}><Ionicons name="refresh" size={14} color={needsReview ? '#F59E0B' : '#666'} /><Text style={styles.dateLabel}>Review:</Text><Text style={[styles.dateValue, needsReview && { color: '#F59E0B' }]}>{formatDate(policy.review_date)}</Text></View>
        </View>

        <View style={styles.policyActions}>
          <TouchableOpacity style={styles.actionButton}><Ionicons name="eye" size={18} color="#1473FF" /><Text style={styles.viewText}>View</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}><Ionicons name="create-outline" size={18} color="#666" /></TouchableOpacity>
          {ackRate < 100 && (
            <TouchableOpacity style={[styles.actionButton, styles.remindButton]} onPress={() => handleSendReminder(policy)}>
              <Ionicons name="notifications" size={18} color="#FFF" />
              <Text style={styles.remindText}>Remind</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Policy Library</Text>
          <TouchableOpacity><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statCardValue}>{stats.total_policies}</Text><Text style={styles.statCardLabel}>Policies</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statCardValue, { color: '#10B981' }]}>{stats.active_policies}</Text><Text style={styles.statCardLabel}>Active</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statCardValue, { color: '#F59E0B' }]}>{stats.pending_review}</Text><Text style={styles.statCardLabel}>Review</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statCardValue}>{stats.acknowledgment_rate}%</Text><Text style={styles.statCardLabel}>Ack Rate</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput style={styles.searchInput} placeholder="Search policies..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={fetchData} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        <TouchableOpacity style={[styles.filterChip, filterCategory === 'all' && styles.filterChipActive]} onPress={() => { setFilterCategory('all'); setLoading(true); }}>
          <Text style={[styles.filterChipText, filterCategory === 'all' && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat.id} style={[styles.filterChip, filterCategory === cat.id && styles.filterChipActive]} onPress={() => { setFilterCategory(cat.id); setLoading(true); }}>
            <Ionicons name={cat.icon as any} size={14} color={filterCategory === cat.id ? '#FFF' : cat.color} />
            <Text style={[styles.filterChipText, filterCategory === cat.id && styles.filterChipTextActive]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {policies.length > 0 ? policies.map(renderPolicyCard) : (
            <View style={styles.emptyState}><Ionicons name="library-outline" size={48} color="#666" /><Text style={styles.emptyText}>No policies found</Text></View>
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
  statCardValue: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  statCardLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', marginHorizontal: 16, marginTop: 12, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: '#FFF' },
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1a1a2e', marginRight: 8, gap: 6, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 12, color: '#a0a0a0', fontWeight: '500' },
  filterChipTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: { padding: 16 },
  policyCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  reviewNeeded: { borderColor: '#F59E0B' },
  reviewBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#F59E0B20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 10, gap: 4 },
  reviewText: { fontSize: 11, fontWeight: '600', color: '#F59E0B' },
  policyHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  categoryIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  policyInfo: { flex: 1 },
  policyTitle: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  policySummary: { fontSize: 12, color: '#666', marginTop: 4, lineHeight: 16 },
  policyMeta: { flexDirection: 'row', marginTop: 6, gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#666' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  ackSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  ackHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  ackLabel: { fontSize: 12, color: '#a0a0a0' },
  ackValue: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  ackBar: { height: 6, backgroundColor: '#2a2a4e', borderRadius: 3 },
  ackFill: { height: '100%', borderRadius: 3 },
  datesRow: { flexDirection: 'row', marginTop: 12, gap: 20 },
  dateItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateLabel: { fontSize: 11, color: '#666' },
  dateValue: { fontSize: 11, fontWeight: '500', color: '#FFF' },
  policyActions: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#0f0f23', borderRadius: 8, gap: 6 },
  viewText: { fontSize: 13, color: '#1473FF' },
  remindButton: { flex: 1, justifyContent: 'center', backgroundColor: '#F59E0B' },
  remindText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
