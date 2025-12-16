/**
 * EMPLOYEE PULSE SURVEYS SCREEN
 * Participate in company pulse surveys
 * View results, track engagement
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

interface Survey {
  id: string;
  title: string;
  description: string;
  questions_count: number;
  estimated_minutes: number;
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  due_date: string;
  is_anonymous: boolean;
  category: string;
  completion_rate?: number;
  your_responses?: number;
}

interface SurveyResult {
  id: string;
  survey_title: string;
  completed_date: string;
  participation_rate: number;
  avg_score: number;
  highlights: { question: string; score: number }[];
}

interface SurveyStats {
  pending_surveys: number;
  completed_this_quarter: number;
  participation_rate: number;
  company_engagement_score: number;
}

export default function PulseSurveysScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [results, setResults] = useState<SurveyResult[]>([]);
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'results'>('pending');

  const fetchData = useCallback(async () => {
    try {
      const [surveysRes, resultsRes, statsRes] = await Promise.all([
        api.get('/api/employee/pulse-surveys'),
        api.get('/api/employee/pulse-surveys/results'),
        api.get('/api/employee/pulse-surveys/stats'),
      ]);
      setSurveys(surveysRes.data.surveys || []);
      setResults(resultsRes.data.results || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch pulse surveys:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'in_progress': return '#3B82F6';
      case 'completed': return '#10B981';
      case 'expired': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const handleStartSurvey = (survey: Survey) => {
    navigation.navigate('TakeSurvey', { surveyId: survey.id });
  };

  const renderSurveyCard = (survey: Survey) => {
    const daysRemaining = getDaysRemaining(survey.due_date);
    const isUrgent = daysRemaining <= 2 && survey.status !== 'completed';

    return (
      <View key={survey.id} style={[styles.surveyCard, isUrgent && styles.urgentCard]}>
        <View style={styles.surveyHeader}>
          <View style={styles.surveyInfo}>
            <Text style={styles.surveyTitle}>{survey.title}</Text>
            <Text style={styles.surveyDesc} numberOfLines={2}>{survey.description}</Text>
            <View style={styles.surveyMeta}>
              <View style={styles.metaItem}><Ionicons name="help-circle" size={14} color="#666" /><Text style={styles.metaText}>{survey.questions_count} questions</Text></View>
              <View style={styles.metaItem}><Ionicons name="time" size={14} color="#666" /><Text style={styles.metaText}>~{survey.estimated_minutes} min</Text></View>
              {survey.is_anonymous && <View style={styles.anonymousBadge}><Ionicons name="eye-off" size={12} color="#8B5CF6" /><Text style={styles.anonymousText}>Anonymous</Text></View>}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(survey.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(survey.status) }]}>{survey.status.replace('_', ' ')}</Text>
          </View>
        </View>

        {survey.status !== 'completed' && (
          <View style={[styles.dueRow, isUrgent && styles.urgentDue]}>
            <Ionicons name="calendar" size={14} color={isUrgent ? '#EF4444' : '#666'} />
            <Text style={[styles.dueText, isUrgent && styles.urgentText]}>
              {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Due today'}
            </Text>
          </View>
        )}

        {survey.status === 'in_progress' && survey.your_responses !== undefined && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Your progress</Text>
              <Text style={styles.progressValue}>{survey.your_responses}/{survey.questions_count}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(survey.your_responses / survey.questions_count) * 100}%` }]} />
            </View>
          </View>
        )}

        <View style={styles.surveyActions}>
          {survey.status === 'pending' && (
            <TouchableOpacity style={[styles.actionButton, styles.startButton]} onPress={() => handleStartSurvey(survey)}>
              <Ionicons name="play" size={18} color="#FFF" />
              <Text style={styles.startText}>Start Survey</Text>
            </TouchableOpacity>
          )}
          {survey.status === 'in_progress' && (
            <TouchableOpacity style={[styles.actionButton, styles.continueButton]} onPress={() => handleStartSurvey(survey)}>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
              <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
          )}
          {survey.status === 'completed' && (
            <View style={styles.completedRow}><Ionicons name="checkmark-circle" size={18} color="#10B981" /><Text style={styles.completedText}>Completed</Text></View>
          )}
        </View>
      </View>
    );
  };

  const renderResultCard = (result: SurveyResult) => (
    <View key={result.id} style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>{result.survey_title}</Text>
        <Text style={styles.resultDate}>{formatDate(result.completed_date)}</Text>
      </View>

      <View style={styles.resultStats}>
        <View style={styles.resultStat}>
          <Text style={styles.resultStatValue}>{result.participation_rate}%</Text>
          <Text style={styles.resultStatLabel}>Participation</Text>
        </View>
        <View style={styles.resultStat}>
          <Text style={[styles.resultStatValue, { color: result.avg_score >= 4 ? '#10B981' : result.avg_score >= 3 ? '#F59E0B' : '#EF4444' }]}>{result.avg_score.toFixed(1)}/5</Text>
          <Text style={styles.resultStatLabel}>Avg Score</Text>
        </View>
      </View>

      {result.highlights.length > 0 && (
        <View style={styles.highlightsSection}>
          <Text style={styles.highlightsTitle}>Highlights</Text>
          {result.highlights.slice(0, 2).map((h, i) => (
            <View key={i} style={styles.highlightRow}>
              <Text style={styles.highlightQuestion} numberOfLines={1}>{h.question}</Text>
              <View style={styles.highlightScore}>
                <Text style={styles.highlightValue}>{h.score.toFixed(1)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Pulse Surveys</Text>
          <View style={{ width: 24 }} />
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pending_surveys}</Text><Text style={styles.statLabel}>Pending</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.completed_this_quarter}</Text><Text style={styles.statLabel}>Completed</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.participation_rate}%</Text><Text style={styles.statLabel}>Your Rate</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.company_engagement_score}</Text><Text style={styles.statLabel}>Engagement</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'pending' && styles.tabActive]} onPress={() => setActiveTab('pending')}>
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>Surveys</Text>
          {stats && stats.pending_surveys > 0 && <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{stats.pending_surveys}</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'results' && styles.tabActive]} onPress={() => setActiveTab('results')}>
          <Text style={[styles.tabText, activeTab === 'results' && styles.tabTextActive]}>Results</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {activeTab === 'pending' ? (
            surveys.length > 0 ? surveys.map(renderSurveyCard) : <View style={styles.emptyState}><Ionicons name="clipboard-outline" size={48} color="#666" /><Text style={styles.emptyText}>No surveys</Text></View>
          ) : (
            results.length > 0 ? results.map(renderResultCard) : <View style={styles.emptyState}><Ionicons name="bar-chart-outline" size={48} color="#666" /><Text style={styles.emptyText}>No results yet</Text></View>
          )}
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
  statsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 12, padding: 12 },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 6 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  tabActive: { backgroundColor: '#1473FF' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#a0a0a0' },
  tabTextActive: { color: colors.text },
  tabBadge: { backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  tabBadgeText: { fontSize: 10, fontWeight: 'bold', color: colors.text },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  surveyCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  urgentCard: { borderColor: '#EF4444' },
  surveyHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  surveyInfo: { flex: 1 },
  surveyTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  surveyDesc: { fontSize: 13, color: '#a0a0a0', marginTop: 4, lineHeight: 18 },
  surveyMeta: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#666' },
  anonymousBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  anonymousText: { fontSize: 11, color: '#8B5CF6' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginLeft: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  dueRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  urgentDue: { backgroundColor: '#EF444420', padding: 8, borderRadius: 8, marginTop: 12 },
  dueText: { fontSize: 12, color: '#666' },
  urgentText: { color: '#EF4444', fontWeight: '500' },
  progressSection: { marginTop: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: '#a0a0a0' },
  progressValue: { fontSize: 12, fontWeight: '600', color: '#3B82F6' },
  progressBar: { height: 6, backgroundColor: '#2a2a4e', borderRadius: 3 },
  progressFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 3 },
  surveyActions: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  startButton: { backgroundColor: '#1473FF' },
  startText: { fontSize: 14, fontWeight: '600', color: colors.text },
  continueButton: { backgroundColor: '#3B82F6' },
  continueText: { fontSize: 14, fontWeight: '600', color: colors.text },
  completedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  completedText: { fontSize: 14, fontWeight: '500', color: '#10B981' },
  resultCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  resultTitle: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
  resultDate: { fontSize: 12, color: '#666' },
  resultStats: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  resultStat: { flex: 1, alignItems: 'center' },
  resultStatValue: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  resultStatLabel: { fontSize: 11, color: '#666', marginTop: 2 },
  highlightsSection: { marginTop: 14 },
  highlightsTitle: { fontSize: 12, fontWeight: '600', color: '#a0a0a0', marginBottom: 8 },
  highlightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  highlightQuestion: { fontSize: 13, color: '#a0a0a0', flex: 1 },
  highlightScore: { backgroundColor: '#2a2a4e', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  highlightValue: { fontSize: 12, fontWeight: '600', color: colors.text },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
