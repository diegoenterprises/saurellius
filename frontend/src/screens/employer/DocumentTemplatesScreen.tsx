/**
 * EMPLOYER DOCUGINUITY TEMPLATES SCREEN
 * Manage HR DocuGinuity templates
 * Create, edit, and share standardized documents
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  version: string;
  last_updated: string;
  updated_by: string;
  usage_count: number;
  is_active: boolean;
  file_type: 'pdf' | 'docx' | 'xlsx';
  required_fields: string[];
}

interface TemplateStats {
  total_templates: number;
  active_templates: number;
  documents_generated: number;
  categories: number;
}

const CATEGORIES = [
  { id: 'onboarding', name: 'Onboarding', icon: 'person-add', color: '#10B981' },
  { id: 'contracts', name: 'Contracts', icon: 'document-text', color: '#3B82F6' },
  { id: 'policies', name: 'Policies', icon: 'shield', color: '#8B5CF6' },
  { id: 'performance', name: 'Performance', icon: 'trending-up', color: '#F59E0B' },
  { id: 'offboarding', name: 'Offboarding', icon: 'exit', color: '#EF4444' },
  { id: 'compliance', name: 'Compliance', icon: 'checkmark-circle', color: '#6366F1' },
];

export default function DocumentTemplatesScreen() {
  const navigation = useNavigation<any>();
  const { colors, gradients } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      const [templatesRes, statsRes] = await Promise.all([
        api.get('/api/employer/document-templates', { params: { search: searchQuery || undefined, category: filterCategory !== 'all' ? filterCategory : undefined } }),
        api.get('/api/employer/document-templates/stats'),
      ]);
      setTemplates(templatesRes.data.templates || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filterCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getCategoryInfo = (categoryId: string) => CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf': return 'document';
      case 'docx': return 'document-text';
      case 'xlsx': return 'grid';
      default: return 'document';
    }
  };

  const handleUseTemplate = async (template: DocumentTemplate) => {
    navigation.navigate('GenerateDocument', { templateId: template.id });
  };

  const handleDuplicate = async (template: DocumentTemplate) => {
    try {
      await api.post(`/api/employer/document-templates/${template.id}/duplicate`);
      fetchData();
      Alert.alert('Success', 'Template duplicated');
    } catch (error) {
      Alert.alert('Error', 'Failed to duplicate');
    }
  };

  const renderTemplateCard = (template: DocumentTemplate) => {
    const catInfo = getCategoryInfo(template.category);
    return (
      <View key={template.id} style={[styles.templateCard, !template.is_active && styles.inactiveCard]}>
        <View style={styles.templateHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: catInfo.color + '20' }]}>
            <Ionicons name={catInfo.icon as any} size={22} color={catInfo.color} />
          </View>
          <View style={styles.templateInfo}>
            <Text style={styles.templateName}>{template.name}</Text>
            <Text style={styles.templateDesc} numberOfLines={1}>{template.description}</Text>
            <View style={styles.templateMeta}>
              <View style={styles.metaItem}><Ionicons name={getFileIcon(template.file_type)} size={12} color="#666" /><Text style={styles.metaText}>{template.file_type.toUpperCase()}</Text></View>
              <View style={styles.metaItem}><Ionicons name="git-branch" size={12} color="#666" /><Text style={styles.metaText}>v{template.version}</Text></View>
            </View>
          </View>
          {!template.is_active && (
            <View style={styles.inactiveBadge}><Text style={styles.inactiveText}>Inactive</Text></View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="copy" size={14} color="#3B82F6" />
            <Text style={styles.statValue}>{template.usage_count}</Text>
            <Text style={styles.statLabel}>Uses</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="list" size={14} color="#F59E0B" />
            <Text style={styles.statValue}>{template.required_fields.length}</Text>
            <Text style={styles.statLabel}>Fields</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time" size={14} color="#666" />
            <Text style={styles.statValue}>{formatDate(template.last_updated)}</Text>
            <Text style={styles.statLabel}>Updated</Text>
          </View>
        </View>

        <View style={styles.templateActions}>
          <TouchableOpacity style={[styles.actionButton, styles.useButton]} onPress={() => handleUseTemplate(template)}>
            <Ionicons name="create" size={18} color="#FFF" />
            <Text style={styles.useText}>Use Template</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDuplicate(template)}>
            <Ionicons name="copy-outline" size={18} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="ellipsis-vertical" size={18} color="#666" />
          </TouchableOpacity>
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
          <Text style={styles.headerTitle}>DocuGinuity Templates</Text>
          <TouchableOpacity><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statCardValue}>{stats.total_templates}</Text><Text style={styles.statCardLabel}>Templates</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statCardValue, { color: '#10B981' }]}>{stats.active_templates}</Text><Text style={styles.statCardLabel}>Active</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statCardValue}>{stats.documents_generated}</Text><Text style={styles.statCardLabel}>Generated</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput style={styles.searchInput} placeholder="Search templates..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={fetchData} />
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
          {templates.length > 0 ? templates.map(renderTemplateCard) : (
            <View style={styles.emptyState}><Ionicons name="document-outline" size={48} color="#666" /><Text style={styles.emptyText}>No templates found</Text></View>
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
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  statCardValue: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  statCardLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', marginHorizontal: 16, marginTop: 12, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: '#FFF' },
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1a1a2e', marginRight: 8, gap: 6, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 12, color: '#a0a0a0', fontWeight: '500' },
  filterChipTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: { padding: 16 },
  templateCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  inactiveCard: { opacity: 0.6 },
  templateHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  categoryIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  templateInfo: { flex: 1 },
  templateName: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  templateDesc: { fontSize: 13, color: '#666', marginTop: 2 },
  templateMeta: { flexDirection: 'row', marginTop: 6, gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#666' },
  inactiveBadge: { backgroundColor: '#6B728020', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  inactiveText: { fontSize: 10, color: '#6B7280' },
  statsRow: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValue: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  statLabel: { fontSize: 11, color: '#666' },
  templateActions: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 8 },
  actionButton: { padding: 10, backgroundColor: '#0f0f23', borderRadius: 8 },
  useButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1473FF', gap: 6 },
  useText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
