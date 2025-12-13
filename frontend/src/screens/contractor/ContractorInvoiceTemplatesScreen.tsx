/**
 * CONTRACTOR INVOICE TEMPLATES SCREEN
 * Create and manage invoice templates
 * Customize layouts, save for reuse
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

interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  style: 'professional' | 'modern' | 'minimal' | 'creative';
  is_default: boolean;
  usage_count: number;
  last_used?: string;
  includes_logo: boolean;
  includes_payment_terms: boolean;
  payment_terms_days: number;
  tax_rate: number;
  notes_template?: string;
  created_at: string;
}

interface TemplateStats {
  total_templates: number;
  invoices_created: number;
  default_template?: string;
}

const STYLES = [
  { id: 'professional', name: 'Professional', color: '#3B82F6', icon: 'briefcase' },
  { id: 'modern', name: 'Modern', color: '#8B5CF6', icon: 'sparkles' },
  { id: 'minimal', name: 'Minimal', color: '#10B981', icon: 'remove' },
  { id: 'creative', name: 'Creative', color: '#F59E0B', icon: 'color-palette' },
];

export default function ContractorInvoiceTemplatesScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [stats, setStats] = useState<TemplateStats | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [templatesRes, statsRes] = await Promise.all([
        api.get('/api/contractor/invoice-templates'),
        api.get('/api/contractor/invoice-templates/stats'),
      ]);
      setTemplates(templatesRes.data.templates || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getStyleInfo = (styleId: string) => STYLES.find(s => s.id === styleId) || STYLES[0];

  const handleSetDefault = async (template: InvoiceTemplate) => {
    try {
      await api.post(`/api/contractor/invoice-templates/${template.id}/set-default`);
      fetchData();
      Alert.alert('Success', 'Default template updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to set default');
    }
  };

  const handleDuplicate = async (template: InvoiceTemplate) => {
    try {
      await api.post(`/api/contractor/invoice-templates/${template.id}/duplicate`);
      fetchData();
      Alert.alert('Success', 'Template duplicated');
    } catch (error) {
      Alert.alert('Error', 'Failed to duplicate');
    }
  };

  const handleDelete = (template: InvoiceTemplate) => {
    if (template.is_default) {
      Alert.alert('Cannot Delete', 'You cannot delete the default template');
      return;
    }
    Alert.alert('Delete Template', `Delete "${template.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/api/contractor/invoice-templates/${template.id}`);
          fetchData();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete');
        }
      }},
    ]);
  };

  const renderTemplateCard = (template: InvoiceTemplate) => {
    const styleInfo = getStyleInfo(template.style);
    return (
      <View key={template.id} style={[styles.templateCard, template.is_default && styles.defaultCard]}>
        {template.is_default && <View style={styles.defaultBadge}><Ionicons name="star" size={12} color="#F59E0B" /><Text style={styles.defaultText}>Default</Text></View>}
        
        <View style={styles.templateHeader}>
          <View style={[styles.styleIcon, { backgroundColor: styleInfo.color + '20' }]}>
            <Ionicons name={styleInfo.icon as any} size={24} color={styleInfo.color} />
          </View>
          <View style={styles.templateInfo}>
            <Text style={styles.templateName}>{template.name}</Text>
            <Text style={styles.templateDesc}>{template.description}</Text>
            <View style={[styles.styleBadge, { backgroundColor: styleInfo.color + '20' }]}>
              <Text style={[styles.styleText, { color: styleInfo.color }]}>{styleInfo.name}</Text>
            </View>
          </View>
        </View>

        <View style={styles.templateFeatures}>
          <View style={styles.featureItem}>
            <Ionicons name={template.includes_logo ? 'checkmark-circle' : 'close-circle'} size={16} color={template.includes_logo ? '#10B981' : '#666'} />
            <Text style={styles.featureText}>Logo</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="time" size={16} color="#3B82F6" />
            <Text style={styles.featureText}>Net {template.payment_terms_days}</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="calculator" size={16} color="#F59E0B" />
            <Text style={styles.featureText}>{template.tax_rate}% tax</Text>
          </View>
        </View>

        <View style={styles.templateStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{template.usage_count}</Text>
            <Text style={styles.statLabel}>Uses</Text>
          </View>
          {template.last_used && (
            <Text style={styles.lastUsed}>Last used {formatDate(template.last_used)}</Text>
          )}
        </View>

        <View style={styles.templateActions}>
          <TouchableOpacity style={[styles.actionButton, styles.useButton]}>
            <Ionicons name="document-text" size={18} color="#FFF" />
            <Text style={styles.useText}>Use Template</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDuplicate(template)}>
            <Ionicons name="copy-outline" size={18} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="create-outline" size={18} color="#666" />
          </TouchableOpacity>
          {!template.is_default && (
            <TouchableOpacity style={styles.actionButton} onPress={() => handleSetDefault(template)}>
              <Ionicons name="star-outline" size={18} color="#F59E0B" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Invoice Templates</Text>
          <TouchableOpacity><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statCardValue}>{stats.total_templates}</Text><Text style={styles.statCardLabel}>Templates</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statCardValue, { color: '#10B981' }]}>{stats.invoices_created}</Text><Text style={styles.statCardLabel}>Invoices</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {templates.length > 0 ? templates.map(renderTemplateCard) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>No templates yet</Text>
              <TouchableOpacity style={styles.createButton}>
                <Ionicons name="add" size={18} color="#FFF" />
                <Text style={styles.createText}>Create Template</Text>
              </TouchableOpacity>
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
  statsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 12, padding: 12 },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  statCardValue: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  statCardLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  content: { flex: 1 },
  section: { padding: 16 },
  templateCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#2a2a4e' },
  defaultCard: { borderColor: '#F59E0B' },
  defaultBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#F59E0B20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 10, gap: 4 },
  defaultText: { fontSize: 11, fontWeight: '600', color: '#F59E0B' },
  templateHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  styleIcon: { width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  templateInfo: { flex: 1 },
  templateName: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  templateDesc: { fontSize: 13, color: '#666', marginTop: 4 },
  styleBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  styleText: { fontSize: 11, fontWeight: '600' },
  templateFeatures: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureText: { fontSize: 12, color: '#a0a0a0' },
  templateStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  statItem: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 11, color: '#666' },
  lastUsed: { fontSize: 11, color: '#666' },
  templateActions: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 8 },
  actionButton: { padding: 10, backgroundColor: '#0f0f23', borderRadius: 8 },
  useButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1473FF', gap: 6 },
  useText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
  createButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1473FF', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, marginTop: 16, gap: 6 },
  createText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});
