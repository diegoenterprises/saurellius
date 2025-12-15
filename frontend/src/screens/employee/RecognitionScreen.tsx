/**
 * EMPLOYEE RECOGNITION SCREEN
 * Give and receive peer recognition
 * Track awards, badges, and appreciation
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface Recognition {
  id: string;
  type: 'given' | 'received';
  from_name?: string;
  to_name?: string;
  category: string;
  message: string;
  badge?: string;
  points: number;
  is_public: boolean;
  created_at: string;
  reactions: { emoji: string; count: number }[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned_count: number;
  last_earned?: string;
}

interface RecognitionStats {
  given_count: number;
  received_count: number;
  total_points: number;
  badges_earned: number;
}

const CATEGORIES = [
  { id: 'teamwork', name: 'Teamwork', icon: 'people', color: '#3B82F6' },
  { id: 'innovation', name: 'Innovation', icon: 'bulb', color: '#F59E0B' },
  { id: 'leadership', name: 'Leadership', icon: 'flag', color: '#8B5CF6' },
  { id: 'customer', name: 'Customer Focus', icon: 'heart', color: '#EC4899' },
  { id: 'excellence', name: 'Excellence', icon: 'star', color: '#10B981' },
];

export default function RecognitionScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recognitions, setRecognitions] = useState<Recognition[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [stats, setStats] = useState<RecognitionStats | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'badges'>('feed');
  const [filterType, setFilterType] = useState<'all' | 'given' | 'received'>('all');
  const [showGiveModal, setShowGiveModal] = useState(false);
  const [giveForm, setGiveForm] = useState({ to: '', category: 'teamwork', message: '', is_public: true });

  const fetchData = useCallback(async () => {
    try {
      const [recRes, badgesRes, statsRes] = await Promise.all([
        api.get('/api/employee/recognition', { params: { type: filterType !== 'all' ? filterType : undefined } }),
        api.get('/api/employee/recognition/badges'),
        api.get('/api/employee/recognition/stats'),
      ]);
      setRecognitions(recRes.data.recognitions || []);
      setBadges(badgesRes.data.badges || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch recognition data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterType]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getCategoryInfo = (categoryId: string) => CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];

  const handleGiveRecognition = async () => {
    if (!giveForm.to.trim() || !giveForm.message.trim()) {
      Alert.alert('Error', 'Please select a person and write a message');
      return;
    }
    try {
      await api.post('/api/employee/recognition', giveForm);
      setShowGiveModal(false);
      setGiveForm({ to: '', category: 'teamwork', message: '', is_public: true });
      fetchData();
      Alert.alert('Success', 'Recognition sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send recognition');
    }
  };

  const handleReact = async (recognition: Recognition, emoji: string) => {
    try {
      await api.post(`/api/employee/recognition/${recognition.id}/react`, { emoji });
      fetchData();
    } catch (error) {
      console.error('Failed to react');
    }
  };

  const renderRecognitionCard = (rec: Recognition) => {
    const catInfo = getCategoryInfo(rec.category);
    return (
      <View key={rec.id} style={styles.recCard}>
        <View style={styles.recHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: catInfo.color + '20' }]}>
            <Ionicons name={catInfo.icon as any} size={20} color={catInfo.color} />
          </View>
          <View style={styles.recInfo}>
            <Text style={styles.recPeople}>
              {rec.type === 'received' ? <Text style={styles.highlight}>{rec.from_name}</Text> : 'You'} recognized {rec.type === 'given' ? <Text style={styles.highlight}>{rec.to_name}</Text> : 'you'}
            </Text>
            <View style={styles.recMeta}>
              <Text style={styles.recCategory}>{catInfo.name}</Text>
              <Text style={styles.recDot}>•</Text>
              <Text style={styles.recDate}>{formatDate(rec.created_at)}</Text>
              {!rec.is_public && <><Text style={styles.recDot}>•</Text><Ionicons name="lock-closed" size={12} color="#666" /></>}
            </View>
          </View>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>+{rec.points}</Text>
          </View>
        </View>

        <Text style={styles.recMessage}>{rec.message}</Text>

        {rec.badge && (
          <View style={styles.badgeAwarded}>
            <Ionicons name="ribbon" size={16} color="#F59E0B" />
            <Text style={styles.badgeText}>{rec.badge} badge awarded</Text>
          </View>
        )}

        <View style={styles.reactionsRow}>
          {rec.reactions.map((r, i) => (
            <TouchableOpacity key={i} style={styles.reactionBadge} onPress={() => handleReact(rec, r.emoji)}>
              <Text style={styles.reactionEmoji}>{r.emoji}</Text>
              <Text style={styles.reactionCount}>{r.count}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addReaction} onPress={() => handleReact(rec, '👏')}>
            <Ionicons name="add" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderBadgeCard = (badge: Badge) => (
    <View key={badge.id} style={[styles.badgeCard, badge.earned_count === 0 && styles.badgeUnearned]}>
      <View style={[styles.badgeIcon, { backgroundColor: badge.color + '20' }]}>
        <Ionicons name={badge.icon as any} size={28} color={badge.earned_count > 0 ? badge.color : '#666'} />
      </View>
      <Text style={styles.badgeName}>{badge.name}</Text>
      <Text style={styles.badgeDesc}>{badge.description}</Text>
      {badge.earned_count > 0 ? (
        <View style={styles.earnedInfo}>
          <Text style={styles.earnedCount}>Earned {badge.earned_count}x</Text>
          {badge.last_earned && <Text style={styles.lastEarned}>Last: {formatDate(badge.last_earned)}</Text>}
        </View>
      ) : (
        <Text style={styles.notEarned}>Not earned yet</Text>
      )}
    </View>
  );

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Recognition</Text>
          <TouchableOpacity onPress={() => setShowGiveModal(true)}><Ionicons name="gift-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Ionicons name="arrow-up" size={18} color="#10B981" /><Text style={styles.statValue}>{stats.given_count}</Text><Text style={styles.statLabel}>Given</Text></View>
            <View style={styles.statCard}><Ionicons name="arrow-down" size={18} color="#3B82F6" /><Text style={styles.statValue}>{stats.received_count}</Text><Text style={styles.statLabel}>Received</Text></View>
            <View style={styles.statCard}><Ionicons name="star" size={18} color="#F59E0B" /><Text style={styles.statValue}>{stats.total_points}</Text><Text style={styles.statLabel}>Points</Text></View>
            <View style={styles.statCard}><Ionicons name="ribbon" size={18} color="#EC4899" /><Text style={styles.statValue}>{stats.badges_earned}</Text><Text style={styles.statLabel}>Badges</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'feed' && styles.tabActive]} onPress={() => setActiveTab('feed')}>
          <Text style={[styles.tabText, activeTab === 'feed' && styles.tabTextActive]}>Activity</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'badges' && styles.tabActive]} onPress={() => setActiveTab('badges')}>
          <Text style={[styles.tabText, activeTab === 'badges' && styles.tabTextActive]}>Badges</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'feed' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
          {(['all', 'received', 'given'] as const).map(type => (
            <TouchableOpacity key={type} style={[styles.filterChip, filterType === type && styles.filterChipActive]} onPress={() => { setFilterType(type); setLoading(true); }}>
              <Text style={[styles.filterChipText, filterType === type && styles.filterChipTextActive]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {activeTab === 'feed' ? (
            recognitions.length > 0 ? recognitions.map(renderRecognitionCard) : <View style={styles.emptyState}><Ionicons name="gift-outline" size={48} color="#666" /><Text style={styles.emptyText}>No recognitions yet</Text></View>
          ) : (
            <View style={styles.badgesGrid}>{badges.map(renderBadgeCard)}</View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showGiveModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowGiveModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Give Recognition</Text>
            <TouchableOpacity onPress={handleGiveRecognition}><Text style={styles.modalSave}>Send</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Recognize *</Text><TextInput style={styles.input} value={giveForm.to} onChangeText={t => setGiveForm(p => ({...p, to: t}))} placeholder="Search for a colleague..." placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat.id} style={[styles.categoryOption, giveForm.category === cat.id && styles.categoryActive]} onPress={() => setGiveForm(p => ({...p, category: cat.id}))}>
                    <Ionicons name={cat.icon as any} size={20} color={giveForm.category === cat.id ? '#FFF' : cat.color} />
                    <Text style={[styles.categoryName, giveForm.category === cat.id && styles.categoryNameActive]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Message *</Text><TextInput style={[styles.input, styles.textArea]} value={giveForm.message} onChangeText={t => setGiveForm(p => ({...p, message: t}))} placeholder="What did they do that deserves recognition?" placeholderTextColor="#666" multiline numberOfLines={4} /></View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingBottom: 16 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  statsContainer: { flexDirection: 'row', marginHorizontal: 20, gap: 8 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginTop: 4 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: '#1473FF' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#a0a0a0' },
  tabTextActive: { color: '#FFF' },
  filterBar: { paddingHorizontal: 16, paddingVertical: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1a1a2e', marginRight: 8, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 13, color: '#a0a0a0', fontWeight: '500' },
  filterChipTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  recCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  recHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  categoryIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recInfo: { flex: 1 },
  recPeople: { fontSize: 14, color: '#a0a0a0' },
  highlight: { color: '#FFF', fontWeight: '600' },
  recMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  recCategory: { fontSize: 12, color: '#666' },
  recDot: { fontSize: 12, color: '#666' },
  recDate: { fontSize: 12, color: '#666' },
  pointsBadge: { backgroundColor: '#10B98120', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  pointsText: { fontSize: 12, fontWeight: '600', color: '#10B981' },
  recMessage: { fontSize: 15, color: '#FFF', marginTop: 12, lineHeight: 22 },
  badgeAwarded: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B20', padding: 10, borderRadius: 8, marginTop: 12, gap: 8 },
  badgeText: { fontSize: 13, color: '#F59E0B' },
  reactionsRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  reactionBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a4e', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 4 },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { fontSize: 12, color: '#a0a0a0' },
  addReaction: { padding: 8, backgroundColor: '#2a2a4e', borderRadius: 20 },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeCard: { width: '47%', backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a4e' },
  badgeUnearned: { opacity: 0.5 },
  badgeIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  badgeName: { fontSize: 14, fontWeight: '600', color: '#FFF', textAlign: 'center' },
  badgeDesc: { fontSize: 11, color: '#666', textAlign: 'center', marginTop: 4 },
  earnedInfo: { marginTop: 10, alignItems: 'center' },
  earnedCount: { fontSize: 12, fontWeight: '600', color: '#10B981' },
  lastEarned: { fontSize: 10, color: '#666', marginTop: 2 },
  notEarned: { fontSize: 11, color: '#666', marginTop: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
  modalContainer: { flex: 1, backgroundColor: '#0f0f23' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  modalCancel: { fontSize: 16, color: '#a0a0a0' },
  modalSave: { fontSize: 16, fontWeight: '600', color: '#1473FF' },
  modalContent: { padding: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, color: '#a0a0a0', marginBottom: 6 },
  input: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14, fontSize: 16, color: '#FFF', borderWidth: 1, borderColor: '#2a2a4e' },
  textArea: { height: 100, textAlignVertical: 'top' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#2a2a4e', borderRadius: 10, gap: 6 },
  categoryActive: { backgroundColor: '#1473FF' },
  categoryName: { fontSize: 12, color: '#a0a0a0' },
  categoryNameActive: { color: '#FFF' },
});
