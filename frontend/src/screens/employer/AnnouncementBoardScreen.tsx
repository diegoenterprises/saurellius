/**
 * EMPLOYER ANNOUNCEMENT BOARD SCREEN
 * Create and manage company announcements
 * Target by department, schedule posts, track views
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

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  target_audience: 'all' | 'department' | 'role';
  target_ids?: string[];
  author_name: string;
  created_at: string;
  published_at?: string;
  scheduled_for?: string;
  views_count: number;
  acknowledged_count: number;
  requires_acknowledgment: boolean;
  pinned: boolean;
}

interface AnnouncementStats {
  total: number;
  published: number;
  drafts: number;
  total_views: number;
}

export default function AnnouncementBoardScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<AnnouncementStats | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', priority: 'normal', target_audience: 'all', requires_acknowledgment: false });

  const fetchData = useCallback(async () => {
    try {
      const [announcementsRes, statsRes] = await Promise.all([
        api.get('/api/employer/announcements', { params: { status: filterStatus !== 'all' ? filterStatus : undefined } }),
        api.get('/api/employer/announcements/stats'),
      ]);
      setAnnouncements(announcementsRes.data.announcements || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'normal': return '#3B82F6';
      case 'low': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return '#10B981';
      case 'scheduled': return '#3B82F6';
      case 'draft': return '#6B7280';
      case 'archived': return '#374151';
      default: return '#6B7280';
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      Alert.alert('Error', 'Title and content are required');
      return;
    }
    try {
      await api.post('/api/employer/announcements', formData);
      setShowCreateModal(false);
      setFormData({ title: '', content: '', priority: 'normal', target_audience: 'all', requires_acknowledgment: false });
      fetchData();
      Alert.alert('Success', 'Announcement created as draft');
    } catch (error) {
      Alert.alert('Error', 'Failed to create announcement');
    }
  };

  const handlePublish = async (announcement: Announcement) => {
    Alert.alert('Publish Announcement', 'Publish this announcement now?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Publish', onPress: async () => {
        try {
          await api.post(`/api/employer/announcements/${announcement.id}/publish`);
          fetchData();
          Alert.alert('Success', 'Announcement published');
        } catch (error) {
          Alert.alert('Error', 'Failed to publish');
        }
      }},
    ]);
  };

  const handleArchive = async (announcement: Announcement) => {
    try {
      await api.post(`/api/employer/announcements/${announcement.id}/archive`);
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to archive');
    }
  };

  const handleTogglePin = async (announcement: Announcement) => {
    try {
      await api.post(`/api/employer/announcements/${announcement.id}/pin`);
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update');
    }
  };

  const renderAnnouncementCard = (announcement: Announcement) => (
    <View key={announcement.id} style={[styles.announcementCard, announcement.pinned && styles.pinnedCard]}>
      <View style={styles.cardHeader}>
        {announcement.pinned && <Ionicons name="pin" size={16} color="#F59E0B" style={styles.pinIcon} />}
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(announcement.priority) + '20' }]}>
          <Text style={[styles.priorityText, { color: getPriorityColor(announcement.priority) }]}>{announcement.priority}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(announcement.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(announcement.status) }]}>{announcement.status}</Text>
        </View>
      </View>

      <Text style={styles.announcementTitle}>{announcement.title}</Text>
      <Text style={styles.announcementContent} numberOfLines={2}>{announcement.content}</Text>

      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>By {announcement.author_name}</Text>
        <Text style={styles.metaText}>{formatDate(announcement.published_at || announcement.created_at)}</Text>
      </View>

      {announcement.status === 'published' && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}><Ionicons name="eye" size={14} color="#666" /><Text style={styles.statText}>{announcement.views_count} views</Text></View>
          {announcement.requires_acknowledgment && (
            <View style={styles.statItem}><Ionicons name="checkmark-circle" size={14} color="#10B981" /><Text style={styles.statText}>{announcement.acknowledged_count} acknowledged</Text></View>
          )}
        </View>
      )}

      <View style={styles.cardActions}>
        {announcement.status === 'draft' && (
          <TouchableOpacity style={[styles.actionButton, styles.publishButton]} onPress={() => handlePublish(announcement)}>
            <Ionicons name="send" size={16} color="#FFF" /><Text style={styles.publishText}>Publish</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton} onPress={() => handleTogglePin(announcement)}>
          <Ionicons name={announcement.pinned ? 'pin' : 'pin-outline'} size={16} color={announcement.pinned ? '#F59E0B' : '#666'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleArchive(announcement)}>
          <Ionicons name="archive-outline" size={16} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Announcements</Text>
          <TouchableOpacity onPress={() => setShowCreateModal(true)}><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total}</Text><Text style={styles.statLabel}>Total</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.published}</Text><Text style={styles.statLabel}>Published</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.drafts}</Text><Text style={styles.statLabel}>Drafts</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_views}</Text><Text style={styles.statLabel}>Views</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {['all', 'published', 'draft', 'scheduled', 'archived'].map(status => (
          <TouchableOpacity key={status} style={[styles.filterChip, filterStatus === status && styles.filterChipActive]} onPress={() => { setFilterStatus(status); setLoading(true); }}>
            <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {announcements.length > 0 ? announcements.map(renderAnnouncementCard) : (
            <View style={styles.emptyState}><Ionicons name="megaphone-outline" size={48} color="#666" /><Text style={styles.emptyText}>No announcements</Text></View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>New Announcement</Text>
            <TouchableOpacity onPress={handleCreateAnnouncement}><Text style={styles.modalSave}>Create</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Title *</Text><TextInput style={styles.input} value={formData.title} onChangeText={t => setFormData(p => ({...p, title: t}))} placeholder="Announcement title" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Content *</Text><TextInput style={[styles.input, styles.textArea]} value={formData.content} onChangeText={t => setFormData(p => ({...p, content: t}))} placeholder="Announcement content..." placeholderTextColor="#666" multiline numberOfLines={6} /></View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.priorityRow}>
                {['low', 'normal', 'high', 'urgent'].map(p => (
                  <TouchableOpacity key={p} style={[styles.priorityOption, formData.priority === p && { backgroundColor: getPriorityColor(p) }]} onPress={() => setFormData(prev => ({...prev, priority: p}))}>
                    <Text style={[styles.priorityOptionText, formData.priority === p && { color: '#FFF' }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={styles.toggleRow} onPress={() => setFormData(p => ({...p, requires_acknowledgment: !p.requires_acknowledgment}))}>
              <Ionicons name={formData.requires_acknowledgment ? 'checkbox' : 'square-outline'} size={24} color={formData.requires_acknowledgment ? '#1473FF' : '#666'} />
              <Text style={styles.toggleLabel}>Require acknowledgment</Text>
            </TouchableOpacity>
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
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 6 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
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
  announcementCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  pinnedCard: { borderColor: '#F59E0B' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  pinIcon: { marginRight: 4 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  priorityText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  announcementTitle: { fontSize: 16, fontWeight: '600', color: '#FFF', marginBottom: 6 },
  announcementContent: { fontSize: 14, color: '#a0a0a0', lineHeight: 20 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  metaText: { fontSize: 12, color: '#666' },
  statsRow: { flexDirection: 'row', marginTop: 10, gap: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: '#666' },
  cardActions: { flexDirection: 'row', marginTop: 12, gap: 8 },
  actionButton: { padding: 10, backgroundColor: '#0f0f23', borderRadius: 8 },
  publishButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1473FF', gap: 6 },
  publishText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
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
  textArea: { height: 140, textAlignVertical: 'top' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityOption: { flex: 1, paddingVertical: 10, backgroundColor: '#2a2a4e', borderRadius: 10, alignItems: 'center' },
  priorityOptionText: { fontSize: 12, color: '#a0a0a0', fontWeight: '500', textTransform: 'capitalize' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  toggleLabel: { fontSize: 15, color: '#FFF' },
});
