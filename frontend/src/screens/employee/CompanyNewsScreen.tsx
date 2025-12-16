/**
 * EMPLOYEE COMPANY NEWS SCREEN
 * View company announcements and news
 * Acknowledge important updates, bookmark articles
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
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category: 'announcement' | 'policy' | 'event' | 'recognition' | 'general';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  author_name: string;
  published_at: string;
  image_url?: string;
  requires_acknowledgment: boolean;
  acknowledged: boolean;
  bookmarked: boolean;
  pinned: boolean;
}

interface NewsStats {
  total_unread: number;
  pending_acknowledgments: number;
}

const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'newspaper', color: '#1473FF' },
  { id: 'announcement', name: 'Announcements', icon: 'megaphone', color: '#3B82F6' },
  { id: 'policy', name: 'Policies', icon: 'document-text', color: '#8B5CF6' },
  { id: 'event', name: 'Events', icon: 'calendar', color: '#10B981' },
  { id: 'recognition', name: 'Recognition', icon: 'trophy', color: '#F59E0B' },
];

export default function CompanyNewsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [stats, setStats] = useState<NewsStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [newsRes, statsRes] = await Promise.all([
        api.get('/api/employee/news', { params: { category: selectedCategory !== 'all' ? selectedCategory : undefined } }),
        api.get('/api/employee/news/stats'),
      ]);
      setNews(newsRes.data.news || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'normal': return '#3B82F6';
      case 'low': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getCategoryInfo = (category: string) => CATEGORIES.find(c => c.id === category) || CATEGORIES[0];

  const handleAcknowledge = async (item: NewsItem) => {
    try {
      await api.post(`/api/employee/news/${item.id}/acknowledge`);
      fetchData();
    } catch (error) {
      console.error('Failed to acknowledge:', error);
    }
  };

  const handleBookmark = async (item: NewsItem) => {
    try {
      await api.post(`/api/employee/news/${item.id}/bookmark`);
      fetchData();
    } catch (error) {
      console.error('Failed to bookmark:', error);
    }
  };

  const handleShare = async (item: NewsItem) => {
    try {
      await Share.share({ message: `${item.title}\n\n${item.summary || item.content.substring(0, 200)}...` });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const renderNewsCard = (item: NewsItem) => {
    const isExpanded = expandedItem === item.id;
    const categoryInfo = getCategoryInfo(item.category);

    return (
      <View key={item.id} style={[styles.newsCard, item.pinned && styles.pinnedCard]}>
        {item.pinned && (
          <View style={styles.pinnedBanner}>
            <Ionicons name="pin" size={12} color="#F59E0B" />
            <Text style={styles.pinnedText}>Pinned</Text>
          </View>
        )}

        <TouchableOpacity style={styles.newsHeader} onPress={() => setExpandedItem(isExpanded ? null : item.id)}>
          <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
            <Ionicons name={categoryInfo.icon as any} size={20} color={categoryInfo.color} />
          </View>
          <View style={styles.newsInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.newsTitle} numberOfLines={isExpanded ? undefined : 2}>{item.title}</Text>
              {item.priority !== 'normal' && item.priority !== 'low' && (
                <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
              )}
            </View>
            <View style={styles.newsMeta}>
              <Text style={styles.metaText}>{item.author_name}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>{formatDate(item.published_at)}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {!isExpanded && item.summary && (
          <Text style={styles.newsSummary} numberOfLines={2}>{item.summary}</Text>
        )}

        {isExpanded && (
          <View style={styles.newsExpanded}>
            <Text style={styles.newsContent}>{item.content}</Text>
          </View>
        )}

        <View style={styles.newsActions}>
          {item.requires_acknowledgment && !item.acknowledged && (
            <TouchableOpacity style={styles.ackButton} onPress={() => handleAcknowledge(item)}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.ackGradient}>
                <Ionicons name="checkmark" size={16} color="#FFF" />
                <Text style={styles.ackText}>Acknowledge</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          {item.acknowledged && (
            <View style={styles.acknowledgedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.acknowledgedText}>Acknowledged</Text>
            </View>
          )}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleBookmark(item)}>
              <Ionicons name={item.bookmarked ? 'bookmark' : 'bookmark-outline'} size={20} color={item.bookmarked ? '#F59E0B' : '#666'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(item)}>
              <Ionicons name="share-outline" size={20} color="#666" />
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
          <Text style={styles.headerTitle}>Company News</Text>
          <TouchableOpacity><Ionicons name="bookmark-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>

        {stats && (stats.total_unread > 0 || stats.pending_acknowledgments > 0) && (
          <View style={styles.alertBar}>
            {stats.pending_acknowledgments > 0 && (
              <View style={styles.alertItem}>
                <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                <Text style={styles.alertText}>{stats.pending_acknowledgments} require acknowledgment</Text>
              </View>
            )}
          </View>
        )}
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat.id} style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]} onPress={() => { setSelectedCategory(cat.id); setLoading(true); }}>
            <Ionicons name={cat.icon as any} size={14} color={selectedCategory === cat.id ? '#FFF' : cat.color} />
            <Text style={[styles.categoryChipText, selectedCategory === cat.id && styles.categoryChipTextActive]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {news.length > 0 ? news.map(renderNewsCard) : (
            <View style={styles.emptyState}><Ionicons name="newspaper-outline" size={48} color="#666" /><Text style={styles.emptyText}>No news available</Text></View>
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
  header: { paddingBottom: 12 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  alertBar: { marginHorizontal: 20, backgroundColor: '#F59E0B20', borderRadius: 10, padding: 10 },
  alertItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertText: { fontSize: 13, color: '#F59E0B' },
  categoryFilter: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.card, marginRight: 8, gap: 6, borderWidth: 1, borderColor: '#2a2a4e' },
  categoryChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  categoryChipText: { fontSize: 12, color: '#a0a0a0', fontWeight: '500' },
  categoryChipTextActive: { color: colors.text },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  newsCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  pinnedCard: { borderColor: '#F59E0B' },
  pinnedBanner: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  pinnedText: { fontSize: 11, color: '#F59E0B', fontWeight: '600' },
  newsHeader: { flexDirection: 'row' },
  categoryIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  newsInfo: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  newsTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text, lineHeight: 22 },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8, marginTop: 6 },
  newsMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaText: { fontSize: 12, color: '#666' },
  metaDot: { fontSize: 12, color: '#666', marginHorizontal: 6 },
  newsSummary: { fontSize: 14, color: '#a0a0a0', marginTop: 10, lineHeight: 20 },
  newsExpanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  newsContent: { fontSize: 14, color: '#a0a0a0', lineHeight: 22 },
  newsActions: { flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  ackButton: { flex: 1, borderRadius: 10, overflow: 'hidden', marginRight: 10 },
  ackGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 6 },
  ackText: { fontSize: 13, fontWeight: '600', color: colors.text },
  acknowledgedBadge: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  acknowledgedText: { fontSize: 13, color: '#10B981' },
  actionButtons: { flexDirection: 'row', gap: 8 },
  actionButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
