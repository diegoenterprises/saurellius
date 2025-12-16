/**
 * EMPLOYEE RESOURCE LIBRARY SCREEN
 * Access company resources, guides, and materials
 * Documents, videos, links, FAQs
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'document' | 'video' | 'link' | 'guide' | 'faq';
  file_url?: string;
  file_size?: string;
  duration?: string;
  views_count: number;
  is_featured: boolean;
  is_new: boolean;
  last_updated: string;
  tags: string[];
}

interface ResourceStats {
  total_resources: number;
  categories: number;
  new_this_month: number;
  bookmarked: number;
}

const CATEGORIES = [
  { id: 'onboarding', name: 'Onboarding', icon: 'person-add', color: '#10B981' },
  { id: 'benefits', name: 'Benefits', icon: 'gift', color: '#3B82F6' },
  { id: 'policies', name: 'Policies', icon: 'document-text', color: '#8B5CF6' },
  { id: 'training', name: 'Training', icon: 'school', color: '#F59E0B' },
  { id: 'it', name: 'IT & Tools', icon: 'desktop', color: '#EC4899' },
  { id: 'wellness', name: 'Wellness', icon: 'heart', color: '#EF4444' },
];

export default function ResourceLibraryScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [stats, setStats] = useState<ResourceStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      const [resourcesRes, statsRes] = await Promise.all([
        api.get('/api/employee/resource-library', { params: { search: searchQuery || undefined, category: filterCategory !== 'all' ? filterCategory : undefined } }),
        api.get('/api/employee/resource-library/stats'),
      ]);
      setResources(resourcesRes.data.resources || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filterCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getCategoryInfo = (categoryId: string) => CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return 'document';
      case 'video': return 'videocam';
      case 'link': return 'link';
      case 'guide': return 'book';
      case 'faq': return 'help-circle';
      default: return 'document';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return '#3B82F6';
      case 'video': return '#EF4444';
      case 'link': return '#10B981';
      case 'guide': return '#8B5CF6';
      case 'faq': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const renderResourceCard = (resource: Resource) => {
    const catInfo = getCategoryInfo(resource.category);
    return (
      <TouchableOpacity key={resource.id} style={styles.resourceCard}>
        {resource.is_featured && <View style={styles.featuredBadge}><Ionicons name="star" size={12} color="#F59E0B" /></View>}
        {resource.is_new && <View style={styles.newBadge}><Text style={styles.newText}>NEW</Text></View>}
        
        <View style={styles.resourceHeader}>
          <View style={[styles.typeIcon, { backgroundColor: getTypeColor(resource.type) + '20' }]}>
            <Ionicons name={getTypeIcon(resource.type) as any} size={22} color={getTypeColor(resource.type)} />
          </View>
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceTitle}>{resource.title}</Text>
            <Text style={styles.resourceDesc} numberOfLines={2}>{resource.description}</Text>
            <View style={styles.resourceMeta}>
              <View style={[styles.categoryTag, { backgroundColor: catInfo.color + '20' }]}>
                <Ionicons name={catInfo.icon as any} size={10} color={catInfo.color} />
                <Text style={[styles.categoryTagText, { color: catInfo.color }]}>{catInfo.name}</Text>
              </View>
              {resource.file_size && <Text style={styles.metaText}>{resource.file_size}</Text>}
              {resource.duration && <Text style={styles.metaText}>{resource.duration}</Text>}
            </View>
          </View>
          <TouchableOpacity style={styles.bookmarkButton}><Ionicons name="bookmark-outline" size={20} color="#666" /></TouchableOpacity>
        </View>

        <View style={styles.resourceFooter}>
          <View style={styles.footerInfo}>
            <Ionicons name="eye" size={14} color="#666" />
            <Text style={styles.footerText}>{resource.views_count} views</Text>
            <Text style={styles.footerDot}>•</Text>
            <Text style={styles.footerText}>Updated {formatDate(resource.last_updated)}</Text>
          </View>
          <TouchableOpacity style={styles.openButton}>
            <Text style={styles.openText}>Open</Text>
            <Ionicons name="open-outline" size={14} color="#1473FF" />
          </TouchableOpacity>
        </View>

        {resource.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {resource.tags.slice(0, 3).map((tag, i) => (
              <View key={i} style={styles.tag}><Text style={styles.tagText}>#{tag}</Text></View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Resource Library</Text>
          <TouchableOpacity><Ionicons name="bookmark-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_resources}</Text><Text style={styles.statLabel}>Resources</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.categories}</Text><Text style={styles.statLabel}>Categories</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.new_this_month}</Text><Text style={styles.statLabel}>New</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.bookmarked}</Text><Text style={styles.statLabel}>Saved</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput style={styles.searchInput} placeholder="Search resources..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={fetchData} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        <TouchableOpacity style={[styles.filterChip, filterCategory === 'all' && styles.filterChipActive]} onPress={() => { setFilterCategory('all'); setLoading(true); }}>
          <Text style={[styles.filterChipText, filterCategory === 'all' && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat.id} style={[styles.filterChip, filterCategory === cat.id && styles.filterChipActive]} onPress={() => { setFilterCategory(cat.id); setLoading(true); }}>
            <Ionicons name={cat.icon as any} size={14} color={filterCategory === cat.id ? '#FFF' : cat.color} />
            <Text style={[styles.filterChipText, filterCategory === cat.id && styles.filterChipTextActive]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {resources.length > 0 ? resources.map(renderResourceCard) : (
            <View style={styles.emptyState}><Ionicons name="library-outline" size={48} color="#666" /><Text style={styles.emptyText}>No resources found</Text></View>
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
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, marginHorizontal: 16, marginTop: 12, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: colors.text },
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.card, marginRight: 8, gap: 6, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 12, color: '#a0a0a0', fontWeight: '500' },
  filterChipTextActive: { color: colors.text },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  resourceCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  featuredBadge: { position: 'absolute', top: 12, right: 12 },
  newBadge: { position: 'absolute', top: -8, left: 16, backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  newText: { fontSize: 9, fontWeight: 'bold', color: colors.text },
  resourceHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  typeIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  resourceInfo: { flex: 1 },
  resourceTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  resourceDesc: { fontSize: 12, color: '#666', marginTop: 4, lineHeight: 16 },
  resourceMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  categoryTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4 },
  categoryTagText: { fontSize: 10, fontWeight: '600' },
  metaText: { fontSize: 11, color: '#666' },
  bookmarkButton: { padding: 4 },
  resourceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, color: '#666' },
  footerDot: { fontSize: 11, color: '#666' },
  openButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  openText: { fontSize: 13, fontWeight: '500', color: '#1473FF' },
  tagsRow: { flexDirection: 'row', marginTop: 10, gap: 6 },
  tag: { backgroundColor: '#2a2a4e', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 10, color: '#a0a0a0' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
