/**
 * EMPLOYER APPLICANT TRACKING SCREEN
 * Manage job applicants through hiring pipeline
 * Review applications, schedule interviews, make offers
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

interface Applicant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  job_title: string;
  job_id: string;
  stage: 'new' | 'screening' | 'interview' | 'assessment' | 'offer' | 'hired' | 'rejected';
  applied_date: string;
  resume_url?: string;
  rating?: number;
  notes?: string;
  source: string;
  experience_years: number;
  interview_date?: string;
}

interface PipelineStats {
  total_applicants: number;
  new_today: number;
  in_interview: number;
  offers_pending: number;
}

const STAGES = [
  { id: 'new', name: 'New', color: '#3B82F6' },
  { id: 'screening', name: 'Screening', color: '#8B5CF6' },
  { id: 'interview', name: 'Interview', color: '#F59E0B' },
  { id: 'assessment', name: 'Assessment', color: '#EC4899' },
  { id: 'offer', name: 'Offer', color: '#10B981' },
  { id: 'hired', name: 'Hired', color: '#059669' },
  { id: 'rejected', name: 'Rejected', color: '#6B7280' },
];

export default function ApplicantTrackingScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [filterStage, setFilterStage] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      const [applicantsRes, statsRes] = await Promise.all([
        api.get('/api/employer/applicants', { params: { stage: filterStage !== 'all' ? filterStage : undefined } }),
        api.get('/api/employer/applicants/stats'),
      ]);
      setApplicants(applicantsRes.data.applicants || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch applicants:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStage]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getStageInfo = (stageId: string) => STAGES.find(s => s.id === stageId) || STAGES[0];

  const handleMoveStage = async (applicant: Applicant, newStage: string) => {
    try {
      await api.post(`/api/employer/applicants/${applicant.id}/stage`, { stage: newStage });
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update stage');
    }
  };

  const handleScheduleInterview = (applicant: Applicant) => {
    Alert.alert('Schedule Interview', `Schedule interview with ${applicant.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Schedule', onPress: () => navigation.navigate('ScheduleInterview', { applicantId: applicant.id }) },
    ]);
  };

  const handleReject = (applicant: Applicant) => {
    Alert.alert('Reject Applicant', `Reject ${applicant.name}'s application?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => handleMoveStage(applicant, 'rejected') },
    ]);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(<Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={12} color={i <= rating ? '#F59E0B' : '#666'} />);
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  const renderApplicantCard = (applicant: Applicant) => {
    const stageInfo = getStageInfo(applicant.stage);
    return (
      <View key={applicant.id} style={styles.applicantCard}>
        <View style={styles.applicantHeader}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{applicant.name.split(' ').map(n => n[0]).join('')}</Text></View>
          <View style={styles.applicantInfo}>
            <Text style={styles.applicantName}>{applicant.name}</Text>
            <Text style={styles.jobTitle}>{applicant.job_title}</Text>
            {applicant.rating && renderStars(applicant.rating)}
          </View>
          <View style={[styles.stageBadge, { backgroundColor: stageInfo.color + '20' }]}>
            <Text style={[styles.stageText, { color: stageInfo.color }]}>{stageInfo.name}</Text>
          </View>
        </View>

        <View style={styles.applicantMeta}>
          <View style={styles.metaItem}><Ionicons name="briefcase" size={14} color="#666" /><Text style={styles.metaText}>{applicant.experience_years} yrs exp</Text></View>
          <View style={styles.metaItem}><Ionicons name="calendar" size={14} color="#666" /><Text style={styles.metaText}>Applied {formatDate(applicant.applied_date)}</Text></View>
          <View style={styles.metaItem}><Ionicons name="link" size={14} color="#666" /><Text style={styles.metaText}>{applicant.source}</Text></View>
        </View>

        {applicant.interview_date && (
          <View style={styles.interviewBox}>
            <Ionicons name="videocam" size={14} color="#3B82F6" />
            <Text style={styles.interviewText}>Interview: {formatDate(applicant.interview_date)}</Text>
          </View>
        )}

        <View style={styles.applicantActions}>
          {applicant.resume_url && (
            <TouchableOpacity style={styles.actionButton}><Ionicons name="document-text" size={18} color="#1473FF" /></TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionButton}><Ionicons name="mail" size={18} color="#666" /></TouchableOpacity>
          {applicant.stage !== 'interview' && applicant.stage !== 'hired' && applicant.stage !== 'rejected' && (
            <TouchableOpacity style={styles.actionButton} onPress={() => handleScheduleInterview(applicant)}><Ionicons name="calendar" size={18} color="#10B981" /></TouchableOpacity>
          )}
          {applicant.stage !== 'rejected' && applicant.stage !== 'hired' && (
            <>
              <TouchableOpacity style={[styles.actionButton, styles.advanceButton]} onPress={() => handleMoveStage(applicant, STAGES[STAGES.findIndex(s => s.id === applicant.stage) + 1]?.id || 'offer')}>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleReject(applicant)}><Ionicons name="close" size={18} color="#EF4444" /></TouchableOpacity>
            </>
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
          <Text style={styles.headerTitle}>Applicants</Text>
          <TouchableOpacity><Ionicons name="funnel-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_applicants}</Text><Text style={styles.statLabel}>Total</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.new_today}</Text><Text style={styles.statLabel}>New</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.in_interview}</Text><Text style={styles.statLabel}>Interview</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.offers_pending}</Text><Text style={styles.statLabel}>Offers</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        <TouchableOpacity style={[styles.filterChip, filterStage === 'all' && styles.filterChipActive]} onPress={() => { setFilterStage('all'); setLoading(true); }}>
          <Text style={[styles.filterChipText, filterStage === 'all' && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        {STAGES.filter(s => s.id !== 'rejected').map(stage => (
          <TouchableOpacity key={stage.id} style={[styles.filterChip, filterStage === stage.id && styles.filterChipActive, filterStage === stage.id && { backgroundColor: stage.color }]} onPress={() => { setFilterStage(stage.id); setLoading(true); }}>
            <Text style={[styles.filterChipText, filterStage === stage.id && styles.filterChipTextActive]}>{stage.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {applicants.length > 0 ? applicants.map(renderApplicantCard) : (
            <View style={styles.emptyState}><Ionicons name="people-outline" size={48} color="#666" /><Text style={styles.emptyText}>No applicants found</Text></View>
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
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1a1a2e', marginRight: 8, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 13, color: '#a0a0a0', fontWeight: '500' },
  filterChipTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: { padding: 16 },
  applicantCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  applicantHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  applicantInfo: { flex: 1 },
  applicantName: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  jobTitle: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  starsRow: { flexDirection: 'row', marginTop: 4, gap: 2 },
  stageBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  stageText: { fontSize: 11, fontWeight: '600' },
  applicantMeta: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#666' },
  interviewBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F620', padding: 10, borderRadius: 8, marginTop: 12, gap: 8 },
  interviewText: { fontSize: 13, color: '#3B82F6' },
  applicantActions: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 8 },
  actionButton: { padding: 10, backgroundColor: '#0f0f23', borderRadius: 8 },
  advanceButton: { backgroundColor: '#10B981' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
