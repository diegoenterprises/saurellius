/**
 * CONTRACTOR TAX DOCUMENTS SCREEN
 * Manage and access tax documents
 * 1099s, W-9s, receipts, deduction records
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

interface TaxDocument {
  id: string;
  name: string;
  type: '1099' | 'w9' | 'receipt' | 'deduction' | 'quarterly' | 'annual';
  year: number;
  client_name?: string;
  amount?: number;
  file_url: string;
  file_size: string;
  uploaded_at: string;
  status: 'available' | 'pending' | 'processing';
}

interface TaxDocStats {
  documents_this_year: number;
  total_1099_income: number;
  total_deductions: number;
  pending_documents: number;
}

const DOC_TYPES = [
  { id: '1099', name: '1099-NEC', icon: 'document-text', color: '#3B82F6' },
  { id: 'w9', name: 'W-9', icon: 'document', color: '#8B5CF6' },
  { id: 'receipt', name: 'Receipts', icon: 'receipt', color: '#10B981' },
  { id: 'deduction', name: 'Deductions', icon: 'calculator', color: '#F59E0B' },
  { id: 'quarterly', name: 'Quarterly', icon: 'calendar', color: '#EC4899' },
  { id: 'annual', name: 'Annual', icon: 'folder', color: '#6366F1' },
];

export default function ContractorTaxDocumentsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [documents, setDocuments] = useState<TaxDocument[]>([]);
  const [stats, setStats] = useState<TaxDocStats | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const fetchData = useCallback(async () => {
    try {
      const [docsRes, statsRes] = await Promise.all([
        api.get('/api/contractor/tax-documents', { params: { type: filterType !== 'all' ? filterType : undefined, year: selectedYear } }),
        api.get('/api/contractor/tax-documents/stats', { params: { year: selectedYear } }),
      ]);
      setDocuments(docsRes.data.documents || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch tax documents:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterType, selectedYear]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getTypeInfo = (typeId: string) => DOC_TYPES.find(t => t.id === typeId) || DOC_TYPES[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'processing': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const handleDownload = async (doc: TaxDocument) => {
    try {
      Alert.alert('Download', `Downloading ${doc.name}...`);
    } catch (error) {
      Alert.alert('Error', 'Failed to download');
    }
  };

  const handleUpload = () => {
    navigation.navigate('UploadTaxDocument');
  };

  const renderDocumentCard = (doc: TaxDocument) => {
    const typeInfo = getTypeInfo(doc.type);
    return (
      <TouchableOpacity key={doc.id} style={styles.documentCard} onPress={() => handleDownload(doc)}>
        <View style={styles.documentHeader}>
          <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + '20' }]}>
            <Ionicons name={typeInfo.icon as any} size={22} color={typeInfo.color} />
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentName}>{doc.name}</Text>
            {doc.client_name && <Text style={styles.clientName}>{doc.client_name}</Text>}
            <View style={styles.documentMeta}>
              <Text style={styles.metaText}>{typeInfo.name}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>{doc.year}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>{doc.file_size}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(doc.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(doc.status) }]}>{doc.status}</Text>
          </View>
        </View>

        {doc.amount !== undefined && (
          <View style={styles.amountRow}>
            <Ionicons name="cash" size={14} color="#10B981" />
            <Text style={styles.amountText}>{formatCurrency(doc.amount)}</Text>
          </View>
        )}

        <View style={styles.documentFooter}>
          <Text style={styles.uploadedDate}>Uploaded {formatDate(doc.uploaded_at)}</Text>
          <View style={styles.documentActions}>
            <TouchableOpacity style={styles.actionIcon}><Ionicons name="eye-outline" size={18} color="#666" /></TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon} onPress={() => handleDownload(doc)}><Ionicons name="download-outline" size={18} color="#1473FF" /></TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const years = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Tax Documents</Text>
          <TouchableOpacity onPress={handleUpload}><Ionicons name="cloud-upload-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        <View style={styles.yearSelector}>
          {years.map(year => (
            <TouchableOpacity key={year} style={[styles.yearOption, selectedYear === year && styles.yearOptionActive]} onPress={() => { setSelectedYear(year); setLoading(true); }}>
              <Text style={[styles.yearText, selectedYear === year && styles.yearTextActive]}>{year}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.documents_this_year}</Text><Text style={styles.statLabel}>Documents</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{formatCurrency(stats.total_1099_income)}</Text><Text style={styles.statLabel}>1099 Income</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{formatCurrency(stats.total_deductions)}</Text><Text style={styles.statLabel}>Deductions</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        <TouchableOpacity style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]} onPress={() => { setFilterType('all'); setLoading(true); }}>
          <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        {DOC_TYPES.map(type => (
          <TouchableOpacity key={type.id} style={[styles.filterChip, filterType === type.id && styles.filterChipActive]} onPress={() => { setFilterType(type.id); setLoading(true); }}>
            <Ionicons name={type.icon as any} size={14} color={filterType === type.id ? '#FFF' : type.color} />
            <Text style={[styles.filterChipText, filterType === type.id && styles.filterChipTextActive]}>{type.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {documents.length > 0 ? documents.map(renderDocumentCard) : (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>No documents for {selectedYear}</Text>
              <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
                <Ionicons name="cloud-upload" size={18} color="#FFF" />
                <Text style={styles.uploadText}>Upload Document</Text>
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
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  yearSelector: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 4 },
  yearOption: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  yearOptionActive: { backgroundColor: '#1473FF' },
  yearText: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  yearTextActive: { color: '#FFF', fontWeight: '600' },
  statsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 12, padding: 12 },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 6 },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1a1a2e', marginRight: 8, gap: 6, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 12, color: '#a0a0a0', fontWeight: '500' },
  filterChipTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: { padding: 16 },
  documentCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  documentHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  typeIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  documentInfo: { flex: 1 },
  documentName: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  clientName: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  documentMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  metaText: { fontSize: 11, color: '#666' },
  metaDot: { fontSize: 11, color: '#666' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  amountRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  amountText: { fontSize: 15, fontWeight: '600', color: '#10B981' },
  documentFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  uploadedDate: { fontSize: 11, color: '#666' },
  documentActions: { flexDirection: 'row', gap: 10 },
  actionIcon: { padding: 6 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
  uploadButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1473FF', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, marginTop: 16, gap: 6 },
  uploadText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});
