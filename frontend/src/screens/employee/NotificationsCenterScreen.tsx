/**
 * EMPLOYEE NOTIFICATIONS CENTER SCREEN
 * View and manage all notifications
 * Mark as read, filter by type, and manage preferences
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

interface Notification {
  id: string;
  type: 'payroll' | 'benefits' | 'time_off' | 'document' | 'training' | 'announcement' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

interface NotificationStats {
  total: number;
  unread: number;
  high_priority: number;
}

const NOTIFICATION_TYPES = [
  { id: 'all', name: 'All', icon: 'notifications', color: '#1473FF' },
  { id: 'payroll', name: 'Payroll', icon: 'cash', color: '#10B981' },
  { id: 'benefits', name: 'Benefits', icon: 'heart', color: '#EC4899' },
  { id: 'time_off', name: 'Time Off', icon: 'calendar', color: '#F59E0B' },
  { id: 'document', name: 'Documents', icon: 'document', color: '#3B82F6' },
  { id: 'training', name: 'Training', icon: 'school', color: '#8B5CF6' },
  { id: 'announcement', name: 'News', icon: 'megaphone', color: '#6366F1' },
];

export default function NotificationsCenterScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterUnread, setFilterUnread] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [notifRes, statsRes] = await Promise.all([
        api.get('/api/employee/notifications'),
        api.get('/api/employee/notifications/stats'),
      ]);
      setNotifications(notifRes.data.notifications || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTypeInfo = (type: string) => NOTIFICATION_TYPES.find(t => t.id === type) || NOTIFICATION_TYPES[0];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'normal': return '#3B82F6';
      case 'low': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.read) return;
    try {
      await api.put(`/api/employee/notifications/${notification.id}/read`);
      fetchData();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    Alert.alert('Mark All Read', 'Mark all notifications as read?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: async () => {
        try {
          await api.post('/api/employee/notifications/read-all');
          fetchData();
        } catch (error) {
          Alert.alert('Error', 'Failed to mark all as read');
        }
      }},
    ]);
  };

  const handleNotificationPress = (notification: Notification) => {
    handleMarkAsRead(notification);
    if (notification.action_url) {
      // Navigate based on action_url
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filterType !== 'all' && n.type !== filterType) return false;
    if (filterUnread && n.read) return false;
    return true;
  });

  const renderNotificationCard = (notification: Notification) => {
    const typeInfo = getTypeInfo(notification.type);
    return (
      <TouchableOpacity key={notification.id} style={[styles.notifCard, !notification.read && styles.notifCardUnread]} onPress={() => handleNotificationPress(notification)}>
        <View style={[styles.notifIcon, { backgroundColor: typeInfo.color + '20' }]}>
          <Ionicons name={typeInfo.icon as any} size={20} color={typeInfo.color} />
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifHeader}>
            <Text style={styles.notifTitle} numberOfLines={1}>{notification.title}</Text>
            {notification.priority !== 'normal' && notification.priority !== 'low' && (
              <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(notification.priority) }]} />
            )}
          </View>
          <Text style={styles.notifMessage} numberOfLines={2}>{notification.message}</Text>
          <View style={styles.notifMeta}>
            <Text style={styles.notifTime}>{formatTimeAgo(notification.created_at)}</Text>
            <Text style={styles.notifType}>{typeInfo.name}</Text>
          </View>
        </View>
        {!notification.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={() => navigation.navigate('NotificationSettings')}><Ionicons name="settings-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}><Text style={styles.statValue}>{stats.total}</Text><Text style={styles.statLabel}>Total</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}><Text style={[styles.statValue, { color: '#1473FF' }]}>{stats.unread}</Text><Text style={styles.statLabel}>Unread</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}><Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.high_priority}</Text><Text style={styles.statLabel}>Urgent</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {NOTIFICATION_TYPES.map(type => (
          <TouchableOpacity key={type.id} style={[styles.filterChip, filterType === type.id && styles.filterChipActive]} onPress={() => setFilterType(type.id)}>
            <Ionicons name={type.icon as any} size={14} color={filterType === type.id ? '#FFF' : type.color} />
            <Text style={[styles.filterChipText, filterType === type.id && styles.filterChipTextActive]}>{type.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity style={[styles.unreadToggle, filterUnread && styles.unreadToggleActive]} onPress={() => setFilterUnread(!filterUnread)}>
          <Ionicons name={filterUnread ? 'checkbox' : 'square-outline'} size={18} color={filterUnread ? '#1473FF' : '#666'} />
          <Text style={[styles.unreadToggleText, filterUnread && styles.unreadToggleTextActive]}>Unread only</Text>
        </TouchableOpacity>
        {stats && stats.unread > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllRead}>
            <Ionicons name="checkmark-done" size={18} color="#1473FF" />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {filteredNotifications.length > 0 ? filteredNotifications.map(renderNotificationCard) : (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>{filterUnread ? 'No unread notifications' : 'No notifications'}</Text>
            </View>
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
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 12, padding: 14 },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 12 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1a1a2e', marginRight: 8, gap: 6, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 12, color: '#a0a0a0', fontWeight: '500' },
  filterChipTextActive: { color: '#FFF' },
  actionBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  unreadToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unreadToggleActive: {},
  unreadToggleText: { fontSize: 13, color: '#666' },
  unreadToggleTextActive: { color: '#1473FF' },
  markAllButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  markAllText: { fontSize: 13, color: '#1473FF', fontWeight: '500' },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a4e' },
  notifCardUnread: { backgroundColor: '#1473FF10', borderColor: '#1473FF30' },
  notifIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notifTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#FFF' },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  notifMessage: { fontSize: 13, color: '#a0a0a0', marginTop: 4, lineHeight: 18 },
  notifMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  notifTime: { fontSize: 11, color: '#666' },
  notifType: { fontSize: 11, color: '#666', backgroundColor: '#2a2a4e', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1473FF', marginLeft: 8, marginTop: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
