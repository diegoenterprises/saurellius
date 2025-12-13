/**
 * EMPLOYEE DOCUGINUITY TAX SCREEN
 * Access W-2s, 1095-Cs, and other tax forms
 * Download and view historical tax documents
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
  type: 'w2' | '1095c' | '1099' | 'w4' | 'other';
  year: number;
  description: string;
  status: 'available' | 'processing' | 'corrected';
  generated_at: string;
  download_url?: string;
  employer_name?: string;
  has_correction?: boolean;
}

interface TaxSummary {
  federal_wages: number;
  federal_tax_withheld: number;
  state_wages: number;
  state_tax_withheld: number;
  social_security_wages: number;
  social_security_tax: number;
  medicare_wages: number;
  medicare_tax: number;
}

interface YearData {
  year: number;
  documents: TaxDocument[];
  summary?: TaxSummary;
}

const DOCUMENT_TYPES = {
  w2: { label: 'W-2', description: 'Wage and Tax Statement', icon: 'document-text', color: '#3B82F6' },
  '1095c': { label: '1095-C', description: 'Health Coverage', icon: 'heart', color: '#10B981' },
  '1099': { label: '1099', description: 'Miscellaneous Income', icon: 'cash', color: '#F59E0B' },
  w4: { label: 'W-4', description: 'Withholding Certificate', icon: 'create', color: '#8B5CF6' },
  other: { label: 'Other', description: 'Tax Document', icon: 'document', color: '#6B7280' },
};

export default function TaxDocumentsScreen() {
  const navigation = useNavigation<any>();
  const { colors, gradients } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [yearData, setYearData] = useState<YearData[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 1);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - 1 - i);

  const fetchTaxDocuments = useCallback(async () => {
    try {
      const response = await api.get('/api/employee/tax-documents', {
        params: { year: selectedYear }
      });
      
      setYearData(response.data.years || []);
    } catch (error) {
      console.error('Failed to fetch tax documents:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchTaxDocuments();
  }, [fetchTaxDocuments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTaxDocuments();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDownload = async (doc: TaxDocument) => {
    if (!doc.download_url) {
      Alert.alert('Not Available', 'This document is not yet available for download');
      return;
    }

    try {
      await Share.share({
        url: doc.download_url,
        title: `${DOCUMENT_TYPES[doc.type].label} ${doc.year}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to download document');
    }
  };

  const handleRequestCorrection = (doc: TaxDocument) => {
    Alert.alert(
      'Request Correction',
      `Request a corrected ${DOCUMENT_TYPES[doc.type].label} for ${doc.year}?\n\nYour employer will be notified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: async () => {
            try {
              await api.post(`/api/employee/tax-documents/${doc.id}/correction-request`);
              Alert.alert('Success', 'Correction request submitted');
            } catch (error) {
              Alert.alert('Error', 'Failed to submit request');
            }
          },
        },
      ]
    );
  };

  const currentYearData = yearData.find(y => y.year === selectedYear);

  const renderDocumentCard = (doc: TaxDocument) => {
    const typeInfo = DOCUMENT_TYPES[doc.type];
    const isExpanded = expandedDoc === doc.id;

    return (
      <View key={doc.id} style={styles.documentCard}>
        <TouchableOpacity 
          style={styles.documentHeader}
          onPress={() => setExpandedDoc(isExpanded ? null : doc.id)}
        >
          <View style={[styles.documentIcon, { backgroundColor: typeInfo.color + '20' }]}>
            <Ionicons name={typeInfo.icon as any} size={24} color={typeInfo.color} />
          </View>
          <View style={styles.documentInfo}>
            <View style={styles.documentTitleRow}>
              <Text style={styles.documentTitle}>{typeInfo.label}</Text>
              {doc.has_correction && (
                <View style={styles.correctedBadge}>
                  <Text style={styles.correctedText}>Corrected</Text>
                </View>
              )}
            </View>
            <Text style={styles.documentDesc}>{typeInfo.description}</Text>
            {doc.employer_name && (
              <Text style={styles.employerName}>{doc.employer_name}</Text>
            )}
          </View>
          <View style={styles.documentStatus}>
            {doc.status === 'available' ? (
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            ) : doc.status === 'processing' ? (
              <ActivityIndicator size="small" color="#F59E0B" />
            ) : (
              <Ionicons name="alert-circle" size={24} color="#F59E0B" />
            )}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.documentExpanded}>
            <View style={styles.documentMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Tax Year</Text>
                <Text style={styles.metaValue}>{doc.year}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Generated</Text>
                <Text style={styles.metaValue}>{formatDate(doc.generated_at)}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Status</Text>
                <Text style={[styles.metaValue, { color: doc.status === 'available' ? '#10B981' : '#F59E0B' }]}>
                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.documentActions}>
              <TouchableOpacity 
                style={[styles.actionButton, doc.status !== 'available' && styles.actionButtonDisabled]}
                onPress={() => handleDownload(doc)}
                disabled={doc.status !== 'available'}
              >
                <Ionicons name="download-outline" size={20} color={doc.status === 'available' ? '#1473FF' : '#666'} />
                <Text style={[styles.actionButtonText, doc.status !== 'available' && { color: '#666' }]}>
                  Download PDF
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleRequestCorrection(doc)}
              >
                <Ionicons name="create-outline" size={20} color="#F59E0B" />
                <Text style={[styles.actionButtonText, { color: '#F59E0B' }]}>Request Correction</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderSummary = () => {
    if (!currentYearData?.summary) return null;
    const summary = currentYearData.summary;

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Tax Summary for {selectedYear}</Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Federal Wages</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.federal_wages)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Federal Tax Withheld</Text>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{formatCurrency(summary.federal_tax_withheld)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>State Wages</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.state_wages)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>State Tax Withheld</Text>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{formatCurrency(summary.state_tax_withheld)}</Text>
          </View>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Social Security</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.social_security_tax)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Medicare</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.medicare_tax)}</Text>
          </View>
        </View>
      </View>
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
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>DocuGinuity Tax</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.yearSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableYears.map((year) => (
              <TouchableOpacity
                key={year}
                style={[styles.yearChip, selectedYear === year && styles.yearChipActive]}
                onPress={() => {
                  setSelectedYear(year);
                  setLoading(true);
                }}
              >
                <Text style={[styles.yearChipText, selectedYear === year && styles.yearChipTextActive]}>
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />
        }
      >
        {renderSummary()}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Documents</Text>
          
          {currentYearData?.documents && currentYearData.documents.length > 0 ? (
            currentYearData.documents.map(renderDocumentCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#666" />
              <Text style={styles.emptyStateTitle}>No Documents</Text>
              <Text style={styles.emptyStateText}>
                Tax documents for {selectedYear} will appear here when available
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>When will my W-2 be available?</Text>
            <Text style={styles.infoText}>
              Employers must provide W-2 forms by January 31st for the previous tax year. 
              You'll receive a notification when your documents are ready.
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.updateW4Button}
          onPress={() => navigation.navigate('W4Wizard')}
        >
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.updateW4Gradient}
          >
            <Ionicons name="create" size={20} color="#FFF" />
            <Text style={styles.updateW4Text}>Update W-4 Withholding</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  yearSelector: {
    paddingHorizontal: 16,
  },
  yearChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 10,
  },
  yearChipActive: {
    backgroundColor: '#1473FF',
  },
  yearChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  yearChipTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#1a1a2e',
    margin: 16,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  summaryItem: {
    width: '50%',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 2,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#2a2a4e',
    marginVertical: 12,
  },
  documentCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
    overflow: 'hidden',
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  correctedBadge: {
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  correctedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F59E0B',
  },
  documentDesc: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 2,
  },
  employerName: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  documentStatus: {
    marginLeft: 10,
  },
  documentExpanded: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    padding: 16,
  },
  documentMeta: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    color: '#666',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
    marginTop: 2,
  },
  documentActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1473FF20',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  actionButtonDisabled: {
    backgroundColor: '#2a2a4e',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1473FF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 12,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#3B82F620',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#a0a0a0',
    lineHeight: 18,
  },
  updateW4Button: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  updateW4Gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  updateW4Text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
