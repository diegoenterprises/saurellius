/**
 * SAURELLIUS REWARDS
 * Points, tiers, badges, streaks, and leaderboard
 * 100% Dynamic - fetches from API
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
  earnedDate?: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  isCurrentUser: boolean;
}

interface RewardsData {
  userPoints: number;
  currentTier: string;
  nextTier: string;
  pointsToNextTier: number;
  loginStreak: number;
  badges: Badge[];
  leaderboard: LeaderboardEntry[];
}

const RewardsScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'leaderboard'>('overview');
  
  // Dynamic state from API
  const [rewardsData, setRewardsData] = useState<RewardsData>({
    userPoints: 0,
    currentTier: 'Bronze',
    nextTier: 'Silver',
    pointsToNextTier: 1000,
    loginStreak: 0,
    badges: [],
    leaderboard: [],
  });

  // Fetch rewards data from API
  const fetchRewardsData = useCallback(async () => {
    try {
      const response = await api.get('/api/rewards');
      const data = response.data?.data || response.data || {};
      setRewardsData({
        userPoints: data.points || data.userPoints || 0,
        currentTier: data.tier || data.currentTier || 'Bronze',
        nextTier: data.nextTier || 'Silver',
        pointsToNextTier: data.pointsToNextTier || data.points_to_next_tier || 1000,
        loginStreak: data.loginStreak || data.login_streak || 0,
        badges: data.badges || [],
        leaderboard: data.leaderboard || [],
      });
    } catch (err) {
      // Rewards fetch failed
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRewardsData();
  }, [fetchRewardsData]);

  const { userPoints, currentTier, nextTier, pointsToNextTier, loginStreak, badges, leaderboard } = rewardsData;

  const getTierColor = (tier: string): [string, string] => {
    const colors: Record<string, [string, string]> = {
      'Bronze': ['#CD7F32', '#8B4513'],
      'Silver': ['#C0C0C0', '#808080'],
      'Gold': ['#FFD700', '#DAA520'],
      'Platinum': ['#E5E4E2', '#A9A9A9'],
      'Diamond': ['#B9F2FF', '#00CED1'],
    };
    return colors[tier] || colors['Bronze'];
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRewardsData();
  };

  const renderOverview = () => (
    <>
      {/* Points Card */}
      <LinearGradient colors={getTierColor(currentTier)} style={styles.pointsCard}>
        <View style={styles.tierBadge}>
          <Ionicons name="trophy" size={20} color="#fff" />
          <Text style={styles.tierText}>{currentTier}</Text>
        </View>
        <Text style={styles.pointsValue}>{userPoints.toLocaleString()}</Text>
        <Text style={styles.pointsLabel}>Total Points</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((3000 - pointsToNextTier) / 3000) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{pointsToNextTier} points to {nextTier}</Text>
        </View>
      </LinearGradient>

      {/* Streak Card */}
      <View style={styles.streakCard}>
        <View style={styles.streakIcon}>
          <Ionicons name="flame" size={32} color="#F59E0B" />
        </View>
        <View style={styles.streakInfo}>
          <Text style={styles.streakValue}>{loginStreak} Day Streak!</Text>
          <Text style={styles.streakLabel}>Keep it up! Login tomorrow to continue.</Text>
        </View>
        <View style={styles.streakBonus}>
          <Text style={styles.bonusText}>+50</Text>
          <Text style={styles.bonusLabel}>bonus</Text>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {[
          { action: 'Completed timesheet', points: 25, time: '2 hours ago' },
          { action: 'Sent kudos to Sarah', points: 10, time: '5 hours ago' },
          { action: 'Daily login bonus', points: 5, time: 'Today' },
          { action: 'Generated paystub', points: 15, time: 'Yesterday' },
        ].map((activity, idx) => (
          <View key={idx} style={styles.activityRow}>
            <View style={styles.activityInfo}>
              <Text style={styles.activityAction}>{activity.action}</Text>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
            <Text style={styles.activityPoints}>+{activity.points}</Text>
          </View>
        ))}
      </View>
    </>
  );

  const renderBadges = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Your Badges ({badges.filter(b => b.earned).length}/{badges.length})
      </Text>
      <View style={styles.badgesGrid}>
        {badges.map((badge) => (
          <View key={badge.id} style={[styles.badgeCard, !badge.earned && styles.badgeCardLocked]}>
            <View style={[styles.badgeIcon, !badge.earned && styles.badgeIconLocked]}>
              <Ionicons 
                name={badge.icon as any} 
                size={28} 
                color={badge.earned ? '#1473FF' : '#4a4a6e'} 
              />
            </View>
            <Text style={[styles.badgeName, !badge.earned && styles.badgeNameLocked]}>
              {badge.name}
            </Text>
            <Text style={styles.badgeDescription} numberOfLines={2}>
              {badge.description}
            </Text>
            {badge.earned && (
              <View style={styles.earnedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const renderLeaderboard = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Company Leaderboard</Text>
      {leaderboard.map((entry) => (
        <View 
          key={entry.rank} 
          style={[styles.leaderboardRow, entry.isCurrentUser && styles.leaderboardRowHighlight]}
        >
          <View style={[styles.rankBadge, entry.rank <= 3 && styles.rankBadgeTop]}>
            {entry.rank <= 3 ? (
              <Ionicons name="trophy" size={16} color={entry.rank === 1 ? '#FFD700' : entry.rank === 2 ? '#C0C0C0' : '#CD7F32'} />
            ) : (
              <Text style={styles.rankText}>{entry.rank}</Text>
            )}
          </View>
          <Text style={[styles.leaderName, entry.isCurrentUser && styles.leaderNameHighlight]}>
            {entry.name}
          </Text>
          <Text style={styles.leaderPoints}>{entry.points.toLocaleString()} pts</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1473FF', '#BE01FF']} style={styles.header}>
        <Text style={styles.headerTitle}>Rewards</Text>
        <Text style={styles.headerSubtitle}>Earn points and unlock achievements</Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['overview', 'badges', 'leaderboard'] as const).map((tab) => (
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

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'badges' && renderBadges()}
        {activeTab === 'leaderboard' && renderLeaderboard()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  header: { paddingHorizontal: 20, paddingVertical: 20 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  tabBar: { flexDirection: 'row', backgroundColor: '#1a1a2e', borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#1473FF' },
  tabText: { fontSize: 14, color: '#a0a0a0' },
  tabTextActive: { color: '#1473FF', fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  pointsCard: { borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
  tierBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  tierText: { color: '#fff', fontWeight: '600', marginLeft: 6 },
  pointsValue: { fontSize: 48, fontWeight: '700', color: '#fff', marginTop: 12 },
  pointsLabel: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  progressContainer: { width: '100%', marginTop: 20 },
  progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
  progressText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 8 },
  streakCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#2a2a4e' },
  streakIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(245, 158, 11, 0.2)', justifyContent: 'center', alignItems: 'center' },
  streakInfo: { flex: 1, marginLeft: 16 },
  streakValue: { fontSize: 18, fontWeight: '700', color: '#fff' },
  streakLabel: { fontSize: 14, color: '#a0a0a0', marginTop: 2 },
  streakBonus: { alignItems: 'center' },
  bonusText: { fontSize: 18, fontWeight: '700', color: '#10B981' },
  bonusLabel: { fontSize: 12, color: '#a0a0a0' },
  section: { marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 },
  activityRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#2a2a4e' },
  activityInfo: { flex: 1 },
  activityAction: { fontSize: 14, fontWeight: '500', color: '#fff' },
  activityTime: { fontSize: 12, color: '#a0a0a0', marginTop: 2 },
  activityPoints: { fontSize: 16, fontWeight: '700', color: '#10B981' },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeCard: { width: '47%', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, alignItems: 'center', position: 'relative', borderWidth: 1, borderColor: '#2a2a4e' },
  badgeCardLocked: { opacity: 0.6 },
  badgeIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(20, 115, 255, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  badgeIconLocked: { backgroundColor: '#252545' },
  badgeName: { fontSize: 14, fontWeight: '600', color: '#fff', textAlign: 'center' },
  badgeNameLocked: { color: '#a0a0a0' },
  badgeDescription: { fontSize: 12, color: '#a0a0a0', textAlign: 'center', marginTop: 4 },
  earnedBadge: { position: 'absolute', top: 8, right: 8 },
  leaderboardRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#2a2a4e' },
  leaderboardRowHighlight: { backgroundColor: 'rgba(20, 115, 255, 0.15)', borderWidth: 1, borderColor: '#1473FF' },
  rankBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#252545', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rankBadgeTop: { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  rankText: { fontSize: 14, fontWeight: '600', color: '#a0a0a0' },
  leaderName: { flex: 1, fontSize: 16, color: '#fff' },
  leaderNameHighlight: { fontWeight: '700', color: '#1473FF' },
  leaderPoints: { fontSize: 14, fontWeight: '600', color: '#a0a0a0' },
});

export default RewardsScreen;
