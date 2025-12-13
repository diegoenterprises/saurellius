/**
 * EMPLOYEE DOCUMENT CENTER SCREEN
 * Access and manage employment documents
 * Tax forms, paystubs, benefits documents, company policies
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

interface Document {
  id: string;
  name: string;
  type: 'tax_form' | 'paystub' | 'benefits' | 'policy' | 'onboarding' | 'other';
  category: string;
  description?: string;
  file_size: number;
  file_type: string;
  created_at: string;
  year?: number;
  requires_signature?: boolean;
  signed?: boolean;
  download_url?: string;
}

interface DocumentCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
}

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  { id: 'tax_form', name: 'Tax Forms', icon: 'document-text', color: '#3B82F6', count: 0 },
  { id: 'paystub', name: 'Pay Stubs', icon: 'receipt', color: '#10B981', count: 0 },
  { id: 'benefits', name: 'Benefits', icon: 'heart', color: '#F59E0B', count: 0 },
  { id: 'policy', name: 'Policies', icon: 'shield-checkmark', color: '#8B5CF6', count: 0 },
  { id: 'onboarding', name: 'Onboarding', icon: 'person-add', color: '#EC4899', count: 0 },
  { id: 'other', name: 'Other', icon: 'folder', color: '#6B7280', count: 0 },
];

export default function DocumentCenterScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>(DOCUMENT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await api.get('/api/employee/documents');
      const docs = response.data.documents || [];
      setDocuments(docs);
      
      const updatedCategories = DOCUMENT_CATEGORIES.map(cat => ({
        ...cat,
        count: docs.filter((d: Document) => d.type === cat.id).length
      }));
      setCategories(updatedCategories);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDocuments();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDownload = async (doc: Document) => {
    if (!doc.download_url) {
      Alert.alert('Error', 'Document is not available for download');
      return;
    }

    try {
      await Share.share({
        url: doc.download_url,
        title: doc.name,
      });
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  };

  const handleSign = async (doc: Document) => {
    Alert.alert(
      'Sign Document',
      `Are you sure you want to electronically sign "${doc.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign',
          onPress: async () => {
            try {
              await api.post(`/api/employee/documents/${doc.id}/sign`);
              fetchDocuments();
              Alert.alert('Success', 'Document signed successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign document');
            }
          },
        },
      ]
    );
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return 'document';
    if (fileType.includes('image')) return 'image';
    if (fileType.includes('word') || fileType.includes('doc')) return 'document-text';
    if (fileType.includes('excel') || fileType.includes('sheet')) return 'grid';
    return 'document-attach';
  };

  const filteredDocuments = documents.filter(doc => {
    if (selectedCategory && doc.type !== selectedCategory) return false;
    if (searchQuery && !doc.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const renderCategoryCard = (category: DocumentCategory) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryCard,
        selectedCategory === category.id && styles.categoryCardSelected
      ]}
      onPress={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
    >
      <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
        <Ionicons name={category.icon as any} size={24} color={category.color} />
      </View>
      <Text style={styles.categoryName}>{category.name}</Text>
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryCount}>{category.count}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderDocumentItem = ({ item }: { item: Document }) => {
    const category = categories.find(c => c.id === item.type);

    return (
      <TouchableOpacity style={styles.documentCard}>
        <View style={styles.documentHeader}>
          <View style={[styles.documentIcon, { backgroundColor: (category?.color || '#6B7280') + '20' }]}>
            <Ionicons 
              name={getFileIcon(item.file_type) as any} 
              size={22} 
              color={category?.color || '#6B7280'} 
            />
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.documentMeta}>
              <Text style={styles.documentMetaText}>{formatDate(item.created_at)}</Text>
              <Text style={styles.documentMetaDot}>•</Text>
              <Text style={styles.documentMetaText}>{formatFileSize(item.file_size)}</Text>
              {item.year && (
                <>
                  <Text style={styles.documentMetaDot}>•</Text>
                  <Text style={styles.documentMetaText}>{item.year}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {item.description && (
          <Text style={styles.documentDescription} numberOfLines={2}>{item.description}</Text>
        )}

        {item.requires_signature && !item.signed && (
          <View style={styles.signatureRequired}>
            <Ionicons name="alert-circle" size={16} color="#F59E0B" />
            <Text style={styles.signatureRequiredText}>Signature Required</Text>
          </View>
        )}

        <View style={styles.documentActions}>
          <TouchableOpacity 
            style={styles.documentAction}
            onPress={() => handleDownload(item)}
          >
            <Ionicons name="download-outline" size={18} color="#1473FF" />
            <Text style={styles.documentActionText}>Download</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.documentAction}>
            <Ionicons name="eye-outline" size={18} color="#1473FF" />
            <Text style={styles.documentActionText}>View</Text>
          </TouchableOpacity>

          {item.requires_signature && !item.signed && (
            <TouchableOpacity 
              style={styles.documentAction}
              onPress={() => handleSign(item)}
            >
              <Ionicons name="create-outline" size={18} color="#10B981" />
              <Text style={[styles.documentActionText, { color: '#10B981' }]}>Sign</Text>
            </TouchableOpacity>
          )}

          {item.signed && (
            <View style={styles.signedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.signedText}>Signed</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1473FF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Document Center</Text>
          <TouchableOpacity>
            <Ionicons name="search" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{documents.length}</Text>
            <Text style={styles.statLabel}>Total Documents</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {documents.filter(d => d.requires_signature && !d.signed).length}
            </Text>
            <Text style={styles.statLabel}>Needs Signature</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map(renderCategoryCard)}
      </ScrollView>

      {selectedCategory && (
        <View style={styles.filterBar}>
          <Text style={styles.filterText}>
            Showing: {categories.find(c => c.id === selectedCategory)?.name}
          </Text>
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <Ionicons name="close-circle" size={20} color="#1473FF" />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredDocuments}
        renderItem={renderDocumentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color="#666" />
            <Text style={styles.emptyStateTitle}>No Documents Found</Text>
            <Text style={styles.emptyStateText}>
              {selectedCategory 
                ? 'No documents in this category'
                : 'Your documents will appear here'}
            </Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 40 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  categoriesContainer: {
    maxHeight: 100,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  categoryCardSelected: {
    borderColor: '#1473FF',
    backgroundColor: '#1473FF20',
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  categoryName: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: '#2a2a4e',
    borderRadius: 10,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a0a0a0',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1473FF20',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  filterText: {
    fontSize: 13,
    color: '#1473FF',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  documentCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  documentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentMetaText: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  documentMetaDot: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 6,
  },
  documentDescription: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 10,
    lineHeight: 18,
  },
  signatureRequired: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B20',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  signatureRequiredText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F59E0B',
  },
  documentActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    paddingTop: 12,
    marginTop: 12,
    gap: 20,
  },
  documentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  documentActionText: {
    fontSize: 13,
    color: '#1473FF',
    fontWeight: '500',
  },
  signedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  signedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
});
