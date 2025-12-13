/**
 * EMPLOYEE MENTORSHIP SCREEN
 * Connect with mentors and mentees
 * Schedule sessions, track progress, share feedback
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

interface MentorshipRelation {
  id: string;
  type: 'mentor' | 'mentee';
  partner_name: string;
  partner_title: string;
  partner_department: string;
  focus_areas: string[];
  start_date: string;
  status: 'active' | 'paused' | 'completed';
  sessions_completed: number;
  next_session?: string;
  goals: { id: string; title: string; completed: boolean }[];
}

interface MentorMatch {
  id: string;
  name: string;
  title: string;
  department: string;
  expertise: string[];
  match_score: number;
  available_slots: number;
}

interface MentorshipStats {
  active_relationships: number;
  sessions_this_month: number;
  goals_achieved: number;
  hours_invested: number;
}

export default function MentorshipScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [relations, setRelations] = useState<MentorshipRelation[]>([]);
  const [matches, setMatches] = useState<MentorMatch[]>([]);
  const [stats, setStats] = useState<MentorshipStats | null>(null);
  const [activeTab, setActiveTab] = useState<'relationships' | 'discover'>('relationships');

  const fetchData = useCallback(async () => {
    try {
      const [relRes, matchesRes, statsRes] = await Promise.all([
        api.get('/api/employee/mentorship/relationships'),
        api.get('/api/employee/mentorship/matches'),
        api.get('/api/employee/mentorship/stats'),
      ]);
      setRelations(relRes.data.relationships || []);
      setMatches(matchesRes.data.matches || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch mentorship data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'paused': return '#F59E0B';
      case 'completed': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const handleRequestMentor = async (match: MentorMatch) => {
    Alert.alert('Request Mentor', `Send mentorship request to ${match.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Request', onPress: async () => {
        try {
          await api.post('/api/employee/mentorship/request', { mentor_id: match.id });
          Alert.alert('Success', 'Mentorship request sent');
          fetchData();
        } catch (error) {
          Alert.alert('Error', 'Failed to send request');
        }
      }},
    ]);
  };

  const handleScheduleSession = (relation: MentorshipRelation) => {
    navigation.navigate('ScheduleMentorSession', { relationshipId: relation.id });
  };

  const renderRelationCard = (relation: MentorshipRelation) => {
    const goalsCompleted = relation.goals.filter(g => g.completed).length;
    return (
      <View key={relation.id} style={styles.relationCard}>
        <View style={styles.relationHeader}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{relation.partner_name.split(' ').map(n => n[0]).join('')}</Text></View>
          <View style={styles.relationInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.partnerName}>{relation.partner_name}</Text>
              <View style={[styles.typeBadge, { backgroundColor: relation.type === 'mentor' ? '#8B5CF620' : '#3B82F620' }]}>
                <Text style={[styles.typeText, { color: relation.type === 'mentor' ? '#8B5CF6' : '#3B82F6' }]}>Your {relation.type}</Text>
              </View>
            </View>
            <Text style={styles.partnerTitle}>{relation.partner_title}</Text>
            <Text style={styles.partnerDept}>{relation.partner_department}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(relation.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(relation.status) }]}>{relation.status}</Text>
          </View>
        </View>

        <View style={styles.focusAreas}>
          {relation.focus_areas.map((area, i) => (
            <View key={i} style={styles.focusTag}><Text style={styles.focusText}>{area}</Text></View>
          ))}
        </View>

        <View style={styles.progressRow}>
          <View style={styles.progressItem}>
            <Ionicons name="videocam" size={16} color="#1473FF" />
            <Text style={styles.progressValue}>{relation.sessions_completed}</Text>
            <Text style={styles.progressLabel}>Sessions</Text>
          </View>
          <View style={styles.progressItem}>
            <Ionicons name="flag" size={16} color="#10B981" />
            <Text style={styles.progressValue}>{goalsCompleted}/{relation.goals.length}</Text>
            <Text style={styles.progressLabel}>Goals</Text>
          </View>
          {relation.next_session && (
            <View style={styles.progressItem}>
              <Ionicons name="calendar" size={16} color="#F59E0B" />
              <Text style={styles.progressValue}>{formatDate(relation.next_session)}</Text>
              <Text style={styles.progressLabel}>Next</Text>
            </View>
          )}
        </View>

        {relation.goals.length > 0 && (
          <View style={styles.goalsSection}>
            <Text style={styles.goalsTitle}>Goals</Text>
            {relation.goals.slice(0, 3).map(goal => (
              <View key={goal.id} style={styles.goalRow}>
                <Ionicons name={goal.completed ? 'checkbox' : 'square-outline'} size={18} color={goal.completed ? '#10B981' : '#666'} />
                <Text style={[styles.goalText, goal.completed && styles.goalCompleted]}>{goal.title}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.relationActions}>
          <TouchableOpacity style={styles.actionButton}><Ionicons name="chatbubble" size={18} color="#1473FF" /></TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.scheduleButton]} onPress={() => handleScheduleSession(relation)}>
            <Ionicons name="calendar" size={18} color="#FFF" />
            <Text style={styles.scheduleText}>Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderMatchCard = (match: MentorMatch) => (
    <View key={match.id} style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{match.name.split(' ').map(n => n[0]).join('')}</Text></View>
        <View style={styles.matchInfo}>
          <Text style={styles.matchName}>{match.name}</Text>
          <Text style={styles.matchTitle}>{match.title}</Text>
          <Text style={styles.matchDept}>{match.department}</Text>
        </View>
        <View style={styles.matchScore}>
          <Text style={styles.scoreValue}>{match.match_score}%</Text>
          <Text style={styles.scoreLabel}>Match</Text>
        </View>
      </View>

      <View style={styles.expertiseRow}>
        {match.expertise.slice(0, 3).map((exp, i) => (
          <View key={i} style={styles.expertiseTag}><Text style={styles.expertiseText}>{exp}</Text></View>
        ))}
      </View>

      <View style={styles.availabilityRow}>
        <Ionicons name="time" size={14} color="#10B981" />
        <Text style={styles.availabilityText}>{match.available_slots} slots available</Text>
      </View>

      <TouchableOpacity style={styles.requestButton} onPress={() => handleRequestMentor(match)}>
        <Ionicons name="person-add" size={18} color="#FFF" />
        <Text style={styles.requestText}>Request Mentorship</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Mentorship</Text>
          <View style={{ width: 24 }} />
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.active_relationships}</Text><Text style={styles.statLabel}>Active</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.sessions_this_month}</Text><Text style={styles.statLabel}>Sessions</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.goals_achieved}</Text><Text style={styles.statLabel}>Goals</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.hours_invested}h</Text><Text style={styles.statLabel}>Invested</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'relationships' && styles.tabActive]} onPress={() => setActiveTab('relationships')}>
          <Text style={[styles.tabText, activeTab === 'relationships' && styles.tabTextActive]}>My Mentorships</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'discover' && styles.tabActive]} onPress={() => setActiveTab('discover')}>
          <Text style={[styles.tabText, activeTab === 'discover' && styles.tabTextActive]}>Find Mentors</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {activeTab === 'relationships' ? (
            relations.length > 0 ? relations.map(renderRelationCard) : <View style={styles.emptyState}><Ionicons name="people-outline" size={48} color="#666" /><Text style={styles.emptyText}>No active mentorships</Text></View>
          ) : (
            matches.length > 0 ? matches.map(renderMatchCard) : <View style={styles.emptyState}><Ionicons name="search-outline" size={48} color="#666" /><Text style={styles.emptyText}>No mentor matches found</Text></View>
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
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: '#1473FF' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#a0a0a0' },
  tabTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: { padding: 16 },
  relationCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  relationHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  relationInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  partnerName: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: '600' },
  partnerTitle: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  partnerDept: { fontSize: 12, color: '#666', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  focusAreas: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 6 },
  focusTag: { backgroundColor: '#2a2a4e', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  focusText: { fontSize: 11, color: '#a0a0a0' },
  progressRow: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 20 },
  progressItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressValue: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  progressLabel: { fontSize: 11, color: '#666' },
  goalsSection: { marginTop: 12 },
  goalsTitle: { fontSize: 12, fontWeight: '600', color: '#a0a0a0', marginBottom: 8 },
  goalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  goalText: { flex: 1, fontSize: 13, color: '#FFF' },
  goalCompleted: { color: '#666', textDecorationLine: 'line-through' },
  relationActions: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 10 },
  actionButton: { padding: 10, backgroundColor: '#0f0f23', borderRadius: 8 },
  scheduleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1473FF', gap: 6 },
  scheduleText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  matchCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  matchHeader: { flexDirection: 'row', alignItems: 'center' },
  matchInfo: { flex: 1 },
  matchName: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  matchTitle: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  matchDept: { fontSize: 12, color: '#666', marginTop: 2 },
  matchScore: { alignItems: 'center', backgroundColor: '#10B98120', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  scoreValue: { fontSize: 16, fontWeight: 'bold', color: '#10B981' },
  scoreLabel: { fontSize: 10, color: '#10B981' },
  expertiseRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 6 },
  expertiseTag: { backgroundColor: '#1473FF20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  expertiseText: { fontSize: 11, color: '#1473FF' },
  availabilityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  availabilityText: { fontSize: 13, color: '#10B981' },
  requestButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1473FF', paddingVertical: 12, borderRadius: 10, marginTop: 14, gap: 6 },
  requestText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
