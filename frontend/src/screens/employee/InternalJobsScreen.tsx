/**
 * EMPLOYEE INTERNAL JOBS SCREEN
 * Browse and apply for internal job postings
 * Track applications, view opportunities
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

interface InternalJob {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full_time' | 'part_time' | 'contract';
  salary_range?: { min: number; max: number };
  description: string;
  requirements: string[];
  posted_date: string;
  closes_date?: string;
  hiring_manager: string;
  applicants_count: number;
  has_applied: boolean;
  is_recommended: boolean;
  match_score?: number;
}

interface JobStats {
  total_openings: number;
  recommended_for_you: number;
  applications_submitted: number;
  interviews_scheduled: number;
}

export default function InternalJobsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState<InternalJob[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'recommended' | 'applied'>('all');

  const fetchData = useCallback(async () => {
    try {
      const [jobsRes, statsRes] = await Promise.all([
        api.get('/api/employee/internal-jobs', { params: { search: searchQuery || undefined, filter: activeTab !== 'all' ? activeTab : undefined } }),
        api.get('/api/employee/internal-jobs/stats'),
      ]);
      setJobs(jobsRes.data.jobs || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch internal jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'full_time': return 'Full-time';
      case 'part_time': return 'Part-time';
      case 'contract': return 'Contract';
      default: return type;
    }
  };

  const handleApply = async (job: InternalJob) => {
    Alert.alert('Apply for Position', `Apply for "${job.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Apply', onPress: async () => {
        try {
          await api.post(`/api/employee/internal-jobs/${job.id}/apply`);
          fetchData();
          Alert.alert('Success', 'Application submitted');
        } catch (error) {
          Alert.alert('Error', 'Failed to submit application');
        }
      }},
    ]);
  };

  const renderJobCard = (job: InternalJob) => (
    <View key={job.id} style={styles.jobCard}>
      <View style={styles.jobHeader}>
        {job.is_recommended && (
          <View style={styles.recommendedBadge}><Ionicons name="star" size={12} color="#F59E0B" /><Text style={styles.recommendedText}>Recommended</Text></View>
        )}
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.jobDept}>{job.department}</Text>
          <View style={styles.jobMeta}>
            <View style={styles.metaItem}><Ionicons name="location" size={12} color="#666" /><Text style={styles.metaText}>{job.location}</Text></View>
            <View style={styles.metaItem}><Ionicons name="briefcase" size={12} color="#666" /><Text style={styles.metaText}>{getTypeLabel(job.type)}</Text></View>
          </View>
        </View>
        {job.match_score && (
          <View style={styles.matchScore}><Text style={styles.matchValue}>{job.match_score}%</Text><Text style={styles.matchLabel}>Match</Text></View>
        )}
      </View>

      {job.salary_range && (
        <View style={styles.salaryRow}>
          <Ionicons name="cash" size={14} color="#10B981" />
          <Text style={styles.salaryText}>{formatCurrency(job.salary_range.min)} - {formatCurrency(job.salary_range.max)}</Text>
        </View>
      )}

      <Text style={styles.jobDesc} numberOfLines={2}>{job.description}</Text>

      <View style={styles.requirementsRow}>
        {job.requirements.slice(0, 3).map((req, i) => (
          <View key={i} style={styles.reqTag}><Text style={styles.reqText}>{req}</Text></View>
        ))}
        {job.requirements.length > 3 && <Text style={styles.moreReqs}>+{job.requirements.length - 3}</Text>}
      </View>

      <View style={styles.jobFooter}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>Posted {formatDate(job.posted_date)}</Text>
          <Text style={styles.footerDot}>•</Text>
          <Text style={styles.footerText}>{job.applicants_count} applicants</Text>
        </View>
        {job.has_applied ? (
          <View style={styles.appliedBadge}><Ionicons name="checkmark-circle" size={16} color="#10B981" /><Text style={styles.appliedText}>Applied</Text></View>
        ) : (
          <TouchableOpacity style={styles.applyButton} onPress={() => handleApply(job)}>
            <Text style={styles.applyText}>Apply</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFF" />
          </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Internal Jobs</Text>
          <TouchableOpacity><Ionicons name="notifications-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_openings}</Text><Text style={styles.statLabel}>Open</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.recommended_for_you}</Text><Text style={styles.statLabel}>For You</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.applications_submitted}</Text><Text style={styles.statLabel}>Applied</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.interviews_scheduled}</Text><Text style={styles.statLabel}>Interviews</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput style={styles.searchInput} placeholder="Search jobs..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={fetchData} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'all' && styles.tabActive]} onPress={() => { setActiveTab('all'); setLoading(true); }}>
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>All Jobs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'recommended' && styles.tabActive]} onPress={() => { setActiveTab('recommended'); setLoading(true); }}>
          <Text style={[styles.tabText, activeTab === 'recommended' && styles.tabTextActive]}>For You</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'applied' && styles.tabActive]} onPress={() => { setActiveTab('applied'); setLoading(true); }}>
          <Text style={[styles.tabText, activeTab === 'applied' && styles.tabTextActive]}>Applied</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {jobs.length > 0 ? jobs.map(renderJobCard) : (
            <View style={styles.emptyState}><Ionicons name="briefcase-outline" size={48} color="#666" /><Text style={styles.emptyText}>No jobs found</Text></View>
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
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', marginHorizontal: 16, marginTop: 12, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: '#FFF' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: '#1473FF' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#a0a0a0' },
  tabTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: { padding: 16 },
  jobCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  jobHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  recommendedBadge: { position: 'absolute', top: -8, left: -8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4, zIndex: 1 },
  recommendedText: { fontSize: 10, fontWeight: '600', color: '#F59E0B' },
  jobInfo: { flex: 1 },
  jobTitle: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  jobDept: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  jobMeta: { flexDirection: 'row', marginTop: 6, gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#666' },
  matchScore: { alignItems: 'center', backgroundColor: '#10B98120', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  matchValue: { fontSize: 16, fontWeight: 'bold', color: '#10B981' },
  matchLabel: { fontSize: 9, color: '#10B981' },
  salaryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  salaryText: { fontSize: 14, fontWeight: '500', color: '#10B981' },
  jobDesc: { fontSize: 13, color: '#a0a0a0', marginTop: 10, lineHeight: 18 },
  requirementsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 6 },
  reqTag: { backgroundColor: '#2a2a4e', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  reqText: { fontSize: 11, color: '#a0a0a0' },
  moreReqs: { fontSize: 11, color: '#666', alignSelf: 'center' },
  jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  footerInfo: { flexDirection: 'row', alignItems: 'center' },
  footerText: { fontSize: 12, color: '#666' },
  footerDot: { fontSize: 12, color: '#666', marginHorizontal: 6 },
  appliedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  appliedText: { fontSize: 13, fontWeight: '500', color: '#10B981' },
  applyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1473FF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, gap: 6 },
  applyText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
