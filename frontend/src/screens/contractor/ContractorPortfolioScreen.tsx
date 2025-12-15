/**
 * CONTRACTOR PORTFOLIO SCREEN
 * Showcase work samples and projects
 * Manage portfolio items, add descriptions, share with clients
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
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import BackButton from '../../components/common/BackButton';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  category: string;
  client_name?: string;
  completion_date?: string;
  image_urls: string[];
  tags: string[];
  featured: boolean;
  views_count: number;
  public: boolean;
  created_at: string;
}

interface PortfolioStats {
  total_items: number;
  total_views: number;
  featured_count: number;
  categories_count: number;
}

const CATEGORIES = ['Web Development', 'Mobile App', 'Design', 'Marketing', 'Consulting', 'Writing', 'Other'];

export default function ContractorPortfolioScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', category: 'Web Development', client_name: '', tags: '', public: true });

  const fetchData = useCallback(async () => {
    try {
      const [itemsRes, statsRes] = await Promise.all([
        api.get('/api/contractor/portfolio'),
        api.get('/api/contractor/portfolio/stats'),
      ]);
      setItems(itemsRes.data.items || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  const handleAddItem = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      Alert.alert('Error', 'Title and description are required');
      return;
    }
    try {
      await api.post('/api/contractor/portfolio', { ...formData, tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean) });
      setShowAddModal(false);
      setFormData({ title: '', description: '', category: 'Web Development', client_name: '', tags: '', public: true });
      fetchData();
      Alert.alert('Success', 'Portfolio item added');
    } catch (error) {
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const handleShare = async (item: PortfolioItem) => {
    try {
      await Share.share({ message: `Check out my work: ${item.title}\n\n${item.description}`, title: item.title });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handleToggleFeatured = async (item: PortfolioItem) => {
    try {
      await api.post(`/api/contractor/portfolio/${item.id}/feature`);
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update');
    }
  };

  const handleDelete = (item: PortfolioItem) => {
    Alert.alert('Delete Item', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/api/contractor/portfolio/${item.id}`);
          fetchData();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete');
        }
      }},
    ]);
  };

  const renderPortfolioCard = (item: PortfolioItem) => (
    <View key={item.id} style={[styles.portfolioCard, item.featured && styles.featuredCard]}>
      {item.featured && (
        <View style={styles.featuredBanner}><Ionicons name="star" size={12} color="#F59E0B" /><Text style={styles.featuredText}>Featured</Text></View>
      )}

      <View style={styles.cardHeader}>
        <View style={styles.categoryBadge}><Text style={styles.categoryText}>{item.category}</Text></View>
        {!item.public && <Ionicons name="lock-closed" size={14} color="#666" />}
      </View>

      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.itemDescription} numberOfLines={3}>{item.description}</Text>

      {item.client_name && (
        <View style={styles.clientRow}><Ionicons name="business" size={14} color="#666" /><Text style={styles.clientName}>{item.client_name}</Text></View>
      )}

      {item.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {item.tags.slice(0, 3).map((tag, i) => (
            <View key={i} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
          ))}
          {item.tags.length > 3 && <Text style={styles.moreTags}>+{item.tags.length - 3}</Text>}
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.viewsCount}><Ionicons name="eye" size={14} color="#666" /><Text style={styles.viewsText}>{item.views_count} views</Text></View>
        {item.completion_date && <Text style={styles.dateText}>{formatDate(item.completion_date)}</Text>}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleToggleFeatured(item)}>
          <Ionicons name={item.featured ? 'star' : 'star-outline'} size={18} color={item.featured ? '#F59E0B' : '#666'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(item)}>
          <Ionicons name="share-outline" size={18} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <BackButton variant="gradient" />
          <Text style={styles.headerTitle}>Portfolio</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_items}</Text><Text style={styles.statLabel}>Items</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_views}</Text><Text style={styles.statLabel}>Views</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.featured_count}</Text><Text style={styles.statLabel}>Featured</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {items.length > 0 ? items.map(renderPortfolioCard) : (
            <View style={styles.emptyState}><Ionicons name="briefcase-outline" size={48} color="#666" /><Text style={styles.emptyText}>No portfolio items yet</Text><Text style={styles.emptySubtext}>Showcase your best work</Text></View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Add Portfolio Item</Text>
            <TouchableOpacity onPress={handleAddItem}><Text style={styles.modalSave}>Save</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Title *</Text><TextInput style={styles.input} value={formData.title} onChangeText={t => setFormData(p => ({...p, title: t}))} placeholder="Project title" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Description *</Text><TextInput style={[styles.input, styles.textArea]} value={formData.description} onChangeText={t => setFormData(p => ({...p, description: t}))} placeholder="Describe the project..." placeholderTextColor="#666" multiline numberOfLines={4} /></View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat} style={[styles.categoryOption, formData.category === cat && styles.categoryOptionActive]} onPress={() => setFormData(p => ({...p, category: cat}))}>
                    <Text style={[styles.categoryOptionText, formData.category === cat && styles.categoryOptionTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Client Name</Text><TextInput style={styles.input} value={formData.client_name} onChangeText={t => setFormData(p => ({...p, client_name: t}))} placeholder="Optional" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Tags</Text><TextInput style={styles.input} value={formData.tags} onChangeText={t => setFormData(p => ({...p, tags: t}))} placeholder="Comma-separated tags" placeholderTextColor="#666" /></View>
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
  statsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 12, padding: 14 },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 12 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  portfolioCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  featuredCard: { borderColor: '#F59E0B' },
  featuredBanner: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  featuredText: { fontSize: 11, fontWeight: '600', color: '#F59E0B' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryBadge: { backgroundColor: '#1473FF20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  categoryText: { fontSize: 11, fontWeight: '600', color: '#1473FF' },
  itemTitle: { fontSize: 18, fontWeight: '600', color: '#FFF', marginBottom: 6 },
  itemDescription: { fontSize: 14, color: '#a0a0a0', lineHeight: 20 },
  clientRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  clientName: { fontSize: 13, color: '#666' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 6 },
  tag: { backgroundColor: '#2a2a4e', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 11, color: '#a0a0a0' },
  moreTags: { fontSize: 11, color: '#666', alignSelf: 'center' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  viewsCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewsText: { fontSize: 12, color: '#666' },
  dateText: { fontSize: 12, color: '#666' },
  cardActions: { flexDirection: 'row', marginTop: 12, gap: 8 },
  actionButton: { padding: 10, backgroundColor: '#0f0f23', borderRadius: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#FFF', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#666', marginTop: 4 },
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
  categoryOption: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#2a2a4e', borderRadius: 16, marginRight: 8 },
  categoryOptionActive: { backgroundColor: '#1473FF' },
  categoryOptionText: { fontSize: 13, color: '#a0a0a0' },
  categoryOptionTextActive: { color: '#FFF' },
});
