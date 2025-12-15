/**
 * EMPLOYER EXIT INTERVIEWS SCREEN
 * Manage employee exit interviews and feedback
 * Track departure reasons, analyze trends
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

interface ExitInterview {
  id: string;
  employee_name: string;
  department: string;
  position: string;
  last_day: string;
  interview_date?: string;
  status: 'pending' | 'scheduled' | 'completed' | 'declined';
  reason: string;
  satisfaction_rating?: number;
  would_recommend?: boolean;
  feedback_summary?: string;
  conducted_by?: string;
}

interface ExitStats {
  total_exits_ytd: number;
  interviews_completed: number;
  avg_satisfaction: number;
  top_reason: string;
  would_recommend_pct: number;
}

const EXIT_REASONS = [
  { id: 'compensation', name: 'Better Compensation', color: '#F59E0B' },
  { id: 'growth', name: 'Career Growth', color: '#3B82F6' },
  { id: 'management', name: 'Management Issues', color: '#EF4444' },
  { id: 'culture', name: 'Culture Fit', color: '#8B5CF6' },
  { id: 'relocation', name: 'Relocation', color: '#10B981' },
  { id: 'personal', name: 'Personal Reasons', color: '#6B7280' },
];

export default function ExitInterviewsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [interviews, setInterviews] = useState<ExitInterview[]>([]);
  const [stats, setStats] = useState<ExitStats | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      const [interviewsRes, statsRes] = await Promise.all([
        api.get('/api/employer/exit-interviews', { params: { status: filterStatus !== 'all' ? filterStatus : undefined } }),
        api.get('/api/employer/exit-interviews/stats'),
      ]);
      setInterviews(interviewsRes.data.interviews || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch exit interviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'scheduled': return '#3B82F6';
      case 'pending': return '#F59E0B';
      case 'declined': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getReasonInfo = (reasonId: string) => EXIT_REASONS.find(r => r.id === reasonId) || EXIT_REASONS[5];

  const handleSchedule = async (interview: ExitInterview) => {
    try {
      await api.post(`/api/employer/exit-interviews/${interview.id}/schedule`);
      fetchData();
      Alert.alert('Success', 'Interview scheduled');
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule');
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(<Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={14} color={i <= rating ? '#F59E0B' : '#666'} />);
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  const renderInterviewCard = (interview: ExitInterview) => {
    const reasonInfo = getReasonInfo(interview.reason);
    return (
      <View key={interview.id} style={styles.interviewCard}>
        <View style={styles.interviewHeader}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{interview.employee_name.split(' ').map(n => n[0]).join('')}</Text></View>
          <View style={styles.interviewInfo}>
            <Text style={styles.employeeName}>{interview.employee_name}</Text>
            <Text style={styles.employeePosition}>{interview.position}</Text>
            <Text style={styles.employeeDept}>{interview.department}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(interview.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(interview.status) }]}>{interview.status}</Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateItem}><Ionicons name="calendar" size={14} color="#EF4444" /><Text style={styles.dateText}>Last Day: {formatDate(interview.last_day)}</Text></View>
          {interview.interview_date && (
            <View style={styles.dateItem}><Ionicons name="time" size={14} color="#3B82F6" /><Text style={styles.dateText}>Interview: {formatDate(interview.interview_date)}</Text></View>
          )}
        </View>

        <View style={styles.reasonRow}>
          <View style={[styles.reasonBadge, { backgroundColor: reasonInfo.color + '20' }]}>
            <Text style={[styles.reasonText, { color: reasonInfo.color }]}>{reasonInfo.name}</Text>
          </View>
        </View>

        {interview.status === 'completed' && (
          <View style={styles.feedbackSection}>
            {interview.satisfaction_rating && (
              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>Satisfaction:</Text>
                {renderStars(interview.satisfaction_rating)}
              </View>
            )}
            {interview.would_recommend !== undefined && (
              <View style={styles.recommendRow}>
                <Text style={styles.recommendLabel}>Would Recommend:</Text>
                <Ionicons name={interview.would_recommend ? 'thumbs-up' : 'thumbs-down'} size={16} color={interview.would_recommend ? '#10B981' : '#EF4444'} />
              </View>
            )}
            {interview.feedback_summary && <Text style={styles.feedbackSummary} numberOfLines={2}>"{interview.feedback_summary}"</Text>}
            {interview.conducted_by && <Text style={styles.conductedBy}>Conducted by: {interview.conducted_by}</Text>}
          </View>
        )}

        <View style={styles.interviewActions}>
          {interview.status === 'pending' && (
            <TouchableOpacity style={[styles.actionButton, styles.scheduleButton]} onPress={() => handleSchedule(interview)}>
              <Ionicons name="calendar" size={18} color="#FFF" />
              <Text style={styles.scheduleText}>Schedule</Text>
            </TouchableOpacity>
          )}
          {interview.status === 'scheduled' && (
            <TouchableOpacity style={[styles.actionButton, styles.conductButton]}>
              <Ionicons name="videocam" size={18} color="#FFF" />
              <Text style={styles.conductText}>Conduct</Text>
            </TouchableOpacity>
          )}
          {interview.status === 'completed' && (
            <TouchableOpacity style={styles.actionButton}><Ionicons name="document-text" size={18} color="#1473FF" /><Text style={styles.viewText}>View Report</Text></TouchableOpacity>
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
          <Text style={styles.headerTitle}>Exit Interviews</Text>
          <TouchableOpacity><Ionicons name="analytics-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_exits_ytd}</Text><Text style={styles.statLabel}>Exits YTD</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.interviews_completed}</Text><Text style={styles.statLabel}>Interviewed</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.avg_satisfaction.toFixed(1)}</Text><Text style={styles.statLabel}>Avg Rating</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.would_recommend_pct}%</Text><Text style={styles.statLabel}>Recommend</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {['all', 'pending', 'scheduled', 'completed', 'declined'].map(status => (
          <TouchableOpacity key={status} style={[styles.filterChip, filterStatus === status && styles.filterChipActive]} onPress={() => { setFilterStatus(status); setLoading(true); }}>
            <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {interviews.length > 0 ? interviews.map(renderInterviewCard) : (
            <View style={styles.emptyState}><Ionicons name="chatbubbles-outline" size={48} color="#666" /><Text style={styles.emptyText}>No exit interviews</Text></View>
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
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1a1a2e', marginRight: 8, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 13, color: '#a0a0a0', fontWeight: '500' },
  filterChipTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  interviewCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  interviewHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  interviewInfo: { flex: 1 },
  employeeName: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  employeePosition: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  employeeDept: { fontSize: 12, color: '#666', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  dateItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 12, color: '#a0a0a0' },
  reasonRow: { marginTop: 10 },
  reasonBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  reasonText: { fontSize: 12, fontWeight: '500' },
  feedbackSection: { marginTop: 12, padding: 12, backgroundColor: '#0f0f23', borderRadius: 10 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingLabel: { fontSize: 12, color: '#666' },
  starsRow: { flexDirection: 'row', gap: 2 },
  recommendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  recommendLabel: { fontSize: 12, color: '#666' },
  feedbackSummary: { fontSize: 13, color: '#a0a0a0', fontStyle: 'italic', marginTop: 8, lineHeight: 18 },
  conductedBy: { fontSize: 11, color: '#666', marginTop: 8 },
  interviewActions: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 10 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#0f0f23', borderRadius: 8, gap: 6 },
  scheduleButton: { flex: 1, justifyContent: 'center', backgroundColor: '#F59E0B' },
  scheduleText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  conductButton: { flex: 1, justifyContent: 'center', backgroundColor: '#10B981' },
  conductText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  viewText: { fontSize: 13, color: '#1473FF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
