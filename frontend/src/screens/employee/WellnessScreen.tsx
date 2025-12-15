/**
 * EMPLOYEE WELLNESS SCREEN
 * Track wellness activities and company wellness programs
 * Log activities, view challenges, earn rewards
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

interface WellnessActivity {
  id: string;
  name: string;
  category: 'fitness' | 'nutrition' | 'mental' | 'sleep' | 'social';
  points: number;
  frequency: 'daily' | 'weekly';
  logged_today: boolean;
  streak: number;
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  goal: number;
  current: number;
  unit: string;
  reward_points: number;
  participants: number;
  status: 'active' | 'completed' | 'upcoming';
}

interface WellnessStats {
  total_points: number;
  this_month_points: number;
  current_streak: number;
  challenges_completed: number;
  rank: number;
  total_participants: number;
}

const CATEGORIES = [
  { id: 'fitness', name: 'Fitness', icon: 'barbell', color: '#EF4444' },
  { id: 'nutrition', name: 'Nutrition', icon: 'nutrition', color: '#10B981' },
  { id: 'mental', name: 'Mental', icon: 'happy', color: '#8B5CF6' },
  { id: 'sleep', name: 'Sleep', icon: 'moon', color: '#3B82F6' },
  { id: 'social', name: 'Social', icon: 'people', color: '#F59E0B' },
];

export default function WellnessScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState<WellnessActivity[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [stats, setStats] = useState<WellnessStats | null>(null);
  const [activeTab, setActiveTab] = useState<'activities' | 'challenges'>('activities');

  const fetchData = useCallback(async () => {
    try {
      const [activitiesRes, challengesRes, statsRes] = await Promise.all([
        api.get('/api/employee/wellness/activities'),
        api.get('/api/employee/wellness/challenges'),
        api.get('/api/employee/wellness/stats'),
      ]);
      setActivities(activitiesRes.data.activities || []);
      setChallenges(challengesRes.data.challenges || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch wellness data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getCategoryInfo = (categoryId: string) => CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];

  const handleLogActivity = async (activity: WellnessActivity) => {
    if (activity.logged_today) return;
    try {
      await api.post(`/api/employee/wellness/activities/${activity.id}/log`);
      fetchData();
      Alert.alert('Activity Logged!', `+${activity.points} points earned`);
    } catch (error) {
      Alert.alert('Error', 'Failed to log activity');
    }
  };

  const handleJoinChallenge = async (challenge: Challenge) => {
    try {
      await api.post(`/api/employee/wellness/challenges/${challenge.id}/join`);
      fetchData();
      Alert.alert('Joined!', `You joined "${challenge.name}"`);
    } catch (error) {
      Alert.alert('Error', 'Failed to join challenge');
    }
  };

  const renderActivityCard = (activity: WellnessActivity) => {
    const catInfo = getCategoryInfo(activity.category);
    return (
      <TouchableOpacity key={activity.id} style={[styles.activityCard, activity.logged_today && styles.activityLogged]} onPress={() => handleLogActivity(activity)} disabled={activity.logged_today}>
        <View style={[styles.categoryIcon, { backgroundColor: catInfo.color + '20' }]}>
          <Ionicons name={catInfo.icon as any} size={24} color={catInfo.color} />
        </View>
        <View style={styles.activityInfo}>
          <Text style={styles.activityName}>{activity.name}</Text>
          <View style={styles.activityMeta}>
            <Text style={styles.metaText}>{activity.frequency}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.pointsText}>+{activity.points} pts</Text>
          </View>
        </View>
        {activity.streak > 0 && (
          <View style={styles.streakBadge}><Ionicons name="flame" size={14} color="#EF4444" /><Text style={styles.streakText}>{activity.streak}</Text></View>
        )}
        <View style={[styles.logButton, activity.logged_today && styles.loggedButton]}>
          <Ionicons name={activity.logged_today ? 'checkmark' : 'add'} size={20} color={activity.logged_today ? '#10B981' : '#FFF'} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderChallengeCard = (challenge: Challenge) => {
    const progress = challenge.goal > 0 ? (challenge.current / challenge.goal) * 100 : 0;
    return (
      <View key={challenge.id} style={styles.challengeCard}>
        <View style={styles.challengeHeader}>
          <View style={[styles.statusBadge, { backgroundColor: challenge.status === 'active' ? '#10B98120' : challenge.status === 'completed' ? '#3B82F620' : '#F59E0B20' }]}>
            <Text style={[styles.statusText, { color: challenge.status === 'active' ? '#10B981' : challenge.status === 'completed' ? '#3B82F6' : '#F59E0B' }]}>{challenge.status}</Text>
          </View>
          <View style={styles.rewardBadge}><Ionicons name="gift" size={14} color="#F59E0B" /><Text style={styles.rewardText}>{challenge.reward_points} pts</Text></View>
        </View>

        <Text style={styles.challengeName}>{challenge.name}</Text>
        <Text style={styles.challengeDesc} numberOfLines={2}>{challenge.description}</Text>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>{challenge.current}/{challenge.goal} {challenge.unit}</Text>
            <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} /></View>
        </View>

        <View style={styles.challengeFooter}>
          <View style={styles.participantsRow}><Ionicons name="people" size={14} color="#666" /><Text style={styles.participantsText}>{challenge.participants} participants</Text></View>
          <Text style={styles.dateText}>{formatDate(challenge.start_date)} - {formatDate(challenge.end_date)}</Text>
        </View>

        {challenge.status === 'upcoming' && (
          <TouchableOpacity style={styles.joinButton} onPress={() => handleJoinChallenge(challenge)}>
            <Text style={styles.joinText}>Join Challenge</Text>
          </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Wellness</Text>
          <TouchableOpacity><Ionicons name="trophy-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsCard}>
            <View style={styles.pointsSection}>
              <Text style={styles.pointsValue}>{stats.total_points}</Text>
              <Text style={styles.pointsLabel}>Total Points</Text>
              <Text style={styles.monthPoints}>+{stats.this_month_points} this month</Text>
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statsGrid}>
              <View style={styles.statItem}><Ionicons name="flame" size={18} color="#EF4444" /><Text style={styles.statValue}>{stats.current_streak}</Text><Text style={styles.statLabel}>Streak</Text></View>
              <View style={styles.statItem}><Ionicons name="trophy" size={18} color="#F59E0B" /><Text style={styles.statValue}>{stats.challenges_completed}</Text><Text style={styles.statLabel}>Complete</Text></View>
              <View style={styles.statItem}><Ionicons name="podium" size={18} color="#8B5CF6" /><Text style={styles.statValue}>#{stats.rank}</Text><Text style={styles.statLabel}>Rank</Text></View>
            </View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'activities' && styles.tabActive]} onPress={() => setActiveTab('activities')}>
          <Text style={[styles.tabText, activeTab === 'activities' && styles.tabTextActive]}>Activities</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'challenges' && styles.tabActive]} onPress={() => setActiveTab('challenges')}>
          <Text style={[styles.tabText, activeTab === 'challenges' && styles.tabTextActive]}>Challenges</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {activeTab === 'activities' ? (
            activities.length > 0 ? activities.map(renderActivityCard) : (
              <View style={styles.emptyState}><Ionicons name="fitness-outline" size={48} color="#666" /><Text style={styles.emptyText}>No activities available</Text></View>
            )
          ) : (
            challenges.length > 0 ? challenges.map(renderChallengeCard) : (
              <View style={styles.emptyState}><Ionicons name="flag-outline" size={48} color="#666" /><Text style={styles.emptyText}>No challenges available</Text></View>
            )
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
  statsCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 14, padding: 16 },
  pointsSection: { alignItems: 'center', paddingRight: 20 },
  pointsValue: { fontSize: 32, fontWeight: 'bold', color: '#10B981' },
  pointsLabel: { fontSize: 12, color: '#a0a0a0' },
  monthPoints: { fontSize: 11, color: '#10B981', marginTop: 4 },
  statsDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  statsGrid: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingLeft: 10 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginTop: 4 },
  statLabel: { fontSize: 10, color: '#a0a0a0' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: '#1473FF' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#a0a0a0' },
  tabTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a4e' },
  activityLogged: { backgroundColor: '#10B98110', borderColor: '#10B98130' },
  categoryIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  activityInfo: { flex: 1 },
  activityName: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  activityMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { fontSize: 12, color: '#666', textTransform: 'capitalize' },
  metaDot: { fontSize: 12, color: '#666', marginHorizontal: 6 },
  pointsText: { fontSize: 12, fontWeight: '600', color: '#10B981' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF444420', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginRight: 10, gap: 4 },
  streakText: { fontSize: 12, fontWeight: '600', color: '#EF4444' },
  logButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center' },
  loggedButton: { backgroundColor: '#10B98120' },
  challengeCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  challengeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  rewardBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rewardText: { fontSize: 12, fontWeight: '600', color: '#F59E0B' },
  challengeName: { fontSize: 17, fontWeight: '600', color: '#FFF', marginBottom: 4 },
  challengeDesc: { fontSize: 13, color: '#a0a0a0', lineHeight: 18 },
  progressSection: { marginTop: 14 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: '#a0a0a0' },
  progressPercent: { fontSize: 12, fontWeight: '600', color: '#10B981' },
  progressBar: { height: 8, backgroundColor: '#2a2a4e', borderRadius: 4 },
  progressFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 4 },
  challengeFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  participantsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  participantsText: { fontSize: 12, color: '#666' },
  dateText: { fontSize: 12, color: '#666' },
  joinButton: { backgroundColor: '#1473FF', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  joinText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
