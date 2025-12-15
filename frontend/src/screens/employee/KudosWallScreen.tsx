/**
 * EMPLOYEE KUDOS WALL SCREEN
 * Public recognition wall for company-wide appreciation
 * Celebrate wins, milestones, and achievements
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

interface Kudos {
  id: string;
  from_name: string;
  from_department: string;
  to_name: string;
  to_department: string;
  message: string;
  category: string;
  created_at: string;
  likes_count: number;
  has_liked: boolean;
  comments_count: number;
  is_featured: boolean;
}

interface KudosStats {
  kudos_given_this_month: number;
  kudos_received_this_month: number;
  total_company_kudos: number;
  top_giver: string;
  top_receiver: string;
}

const KUDOS_CATEGORIES = [
  { id: 'teamwork', name: 'Teamwork', emoji: '🤝', color: '#3B82F6' },
  { id: 'innovation', name: 'Innovation', emoji: '💡', color: '#F59E0B' },
  { id: 'leadership', name: 'Leadership', emoji: '⭐', color: '#8B5CF6' },
  { id: 'helping', name: 'Helping Hand', emoji: '🙌', color: '#10B981' },
  { id: 'milestone', name: 'Milestone', emoji: '🎯', color: '#EC4899' },
  { id: 'excellence', name: 'Excellence', emoji: '🏆', color: '#EF4444' },
];

export default function KudosWallScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kudos, setKudos] = useState<Kudos[]>([]);
  const [stats, setStats] = useState<KudosStats | null>(null);
  const [showGiveModal, setShowGiveModal] = useState(false);
  const [formData, setFormData] = useState({ to: '', message: '', category: 'teamwork' });

  const fetchData = useCallback(async () => {
    try {
      const [kudosRes, statsRes] = await Promise.all([
        api.get('/api/employee/kudos-wall'),
        api.get('/api/employee/kudos-wall/stats'),
      ]);
      setKudos(kudosRes.data.kudos || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch kudos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getCategoryInfo = (categoryId: string) => KUDOS_CATEGORIES.find(c => c.id === categoryId) || KUDOS_CATEGORIES[0];

  const handleLike = async (kudosItem: Kudos) => {
    try {
      await api.post(`/api/employee/kudos-wall/${kudosItem.id}/like`);
      fetchData();
    } catch (error) {
      console.error('Failed to like');
    }
  };

  const handleGiveKudos = async () => {
    if (!formData.to.trim() || !formData.message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      await api.post('/api/employee/kudos-wall', formData);
      setShowGiveModal(false);
      setFormData({ to: '', message: '', category: 'teamwork' });
      fetchData();
      Alert.alert('Success', 'Kudos sent! 🎉');
    } catch (error) {
      Alert.alert('Error', 'Failed to send kudos');
    }
  };

  const renderKudosCard = (item: Kudos) => {
    const catInfo = getCategoryInfo(item.category);
    return (
      <View key={item.id} style={[styles.kudosCard, item.is_featured && styles.featuredCard]}>
        {item.is_featured && (
          <View style={styles.featuredBadge}><Ionicons name="star" size={12} color="#F59E0B" /><Text style={styles.featuredText}>Featured</Text></View>
        )}
        <View style={styles.kudosHeader}>
          <View style={styles.fromInfo}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{item.from_name.split(' ').map(n => n[0]).join('')}</Text></View>
            <View>
              <Text style={styles.fromName}>{item.from_name}</Text>
              <Text style={styles.fromDept}>{item.from_department}</Text>
            </View>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: catInfo.color + '20' }]}>
            <Text style={styles.categoryEmoji}>{catInfo.emoji}</Text>
            <Text style={[styles.categoryName, { color: catInfo.color }]}>{catInfo.name}</Text>
          </View>
        </View>

        <View style={styles.toSection}>
          <Ionicons name="arrow-forward" size={16} color="#666" />
          <View style={styles.toAvatar}><Text style={styles.toAvatarText}>{item.to_name.split(' ').map(n => n[0]).join('')}</Text></View>
          <View>
            <Text style={styles.toName}>{item.to_name}</Text>
            <Text style={styles.toDept}>{item.to_department}</Text>
          </View>
        </View>

        <Text style={styles.kudosMessage}>"{item.message}"</Text>

        <View style={styles.kudosFooter}>
          <Text style={styles.kudosTime}>{formatDate(item.created_at)}</Text>
          <View style={styles.kudosActions}>
            <TouchableOpacity style={[styles.likeButton, item.has_liked && styles.likedButton]} onPress={() => handleLike(item)}>
              <Ionicons name={item.has_liked ? 'heart' : 'heart-outline'} size={18} color={item.has_liked ? '#EF4444' : '#666'} />
              <Text style={[styles.likeCount, item.has_liked && styles.likedCount]}>{item.likes_count}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.commentButton}>
              <Ionicons name="chatbubble-outline" size={16} color="#666" />
              <Text style={styles.commentCount}>{item.comments_count}</Text>
            </TouchableOpacity>
          </View>
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
          <Text style={styles.headerTitle}>Kudos Wall 🎉</Text>
          <TouchableOpacity onPress={() => setShowGiveModal(true)}><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.kudos_given_this_month}</Text><Text style={styles.statLabel}>Given</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.kudos_received_this_month}</Text><Text style={styles.statLabel}>Received</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_company_kudos}</Text><Text style={styles.statLabel}>Company</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {kudos.length > 0 ? kudos.map(renderKudosCard) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyText}>No kudos yet</Text>
              <Text style={styles.emptySubtext}>Be the first to recognize a colleague!</Text>
            </View>
          )}
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>

      <TouchableOpacity style={styles.giveButton} onPress={() => setShowGiveModal(true)}>
        <Ionicons name="heart" size={24} color="#FFF" />
        <Text style={styles.giveButtonText}>Give Kudos</Text>
      </TouchableOpacity>

      <Modal visible={showGiveModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowGiveModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Give Kudos 🎉</Text>
            <TouchableOpacity onPress={handleGiveKudos}><Text style={styles.modalSave}>Send</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Who deserves kudos? *</Text><TextInput style={styles.input} value={formData.to} onChangeText={t => setFormData(p => ({...p, to: t}))} placeholder="Search for a colleague..." placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {KUDOS_CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat.id} style={[styles.categoryOption, formData.category === cat.id && styles.categoryActive]} onPress={() => setFormData(p => ({...p, category: cat.id}))}>
                    <Text style={styles.categoryOptionEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.categoryOptionText, formData.category === cat.id && styles.categoryOptionTextActive]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Your message *</Text><TextInput style={[styles.input, styles.textArea]} value={formData.message} onChangeText={t => setFormData(p => ({...p, message: t}))} placeholder="What did they do that was awesome?" placeholderTextColor="#666" multiline numberOfLines={4} /></View>
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
  statsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 12, padding: 12 },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  kudosCard: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#2a2a4e' },
  featuredCard: { borderColor: '#F59E0B', backgroundColor: '#F59E0B08' },
  featuredBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#F59E0B20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 10, gap: 4 },
  featuredText: { fontSize: 11, fontWeight: '600', color: '#F59E0B' },
  kudosHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  fromInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
  fromName: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  fromDept: { fontSize: 11, color: '#666' },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 4 },
  categoryEmoji: { fontSize: 14 },
  categoryName: { fontSize: 11, fontWeight: '600' },
  toSection: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 10 },
  toAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
  toAvatarText: { fontSize: 12, fontWeight: 'bold', color: '#FFF' },
  toName: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  toDept: { fontSize: 11, color: '#666' },
  kudosMessage: { fontSize: 15, color: '#FFF', marginTop: 14, lineHeight: 22, fontStyle: 'italic' },
  kudosFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  kudosTime: { fontSize: 12, color: '#666' },
  kudosActions: { flexDirection: 'row', gap: 16 },
  likeButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likedButton: {},
  likeCount: { fontSize: 13, color: '#666' },
  likedCount: { color: '#EF4444' },
  commentButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentCount: { fontSize: 13, color: '#666' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, color: '#FFF', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#666', marginTop: 4 },
  giveButton: { position: 'absolute', bottom: 30, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EC4899', paddingVertical: 16, borderRadius: 14, gap: 8, shadowColor: '#EC4899', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  giveButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  modalContainer: { flex: 1, backgroundColor: '#0f0f23' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  modalCancel: { fontSize: 16, color: '#a0a0a0' },
  modalSave: { fontSize: 16, fontWeight: '600', color: '#EC4899' },
  modalContent: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, color: '#a0a0a0', marginBottom: 8 },
  input: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, fontSize: 16, color: '#FFF', borderWidth: 1, borderColor: '#2a2a4e' },
  textArea: { height: 120, textAlignVertical: 'top' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#2a2a4e', borderRadius: 12, gap: 6 },
  categoryActive: { backgroundColor: '#EC4899' },
  categoryOptionEmoji: { fontSize: 16 },
  categoryOptionText: { fontSize: 13, color: '#a0a0a0' },
  categoryOptionTextActive: { color: '#FFF' },
});
