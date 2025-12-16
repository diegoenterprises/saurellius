/**
 * CONTRACTOR CONTRACTS MANAGEMENT SCREEN
 * View and manage active contracts with clients
 * Contract terms, renewal dates, and documentation
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
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface Contract {
  id: string;
  client_name: string;
  client_logo?: string;
  title: string;
  description?: string;
  contract_type: 'fixed_price' | 'hourly' | 'retainer' | 'milestone';
  status: 'draft' | 'pending' | 'active' | 'completed' | 'terminated';
  start_date: string;
  end_date?: string;
  value: number;
  hourly_rate?: number;
  total_hours?: number;
  hours_worked?: number;
  total_billed: number;
  payment_terms: string;
  documents: {
    id: string;
    name: string;
    type: string;
  }[];
  milestones?: {
    id: string;
    name: string;
    amount: number;
    due_date: string;
    status: 'pending' | 'completed' | 'paid';
  }[];
  auto_renew: boolean;
  renewal_date?: string;
}

interface ContractStats {
  active_contracts: number;
  total_value: number;
  total_billed: number;
  pending_renewals: number;
}

export default function ContractorContractsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedContract, setExpandedContract] = useState<string | null>(null);

  const fetchContracts = useCallback(async () => {
    try {
      const [contractsRes, statsRes] = await Promise.all([
        api.get(`/api/contractor/contracts?status=${filterStatus}`),
        api.get('/api/contractor/contracts/stats'),
      ]);
      
      setContracts(contractsRes.data.contracts || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchContracts();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'completed': return '#3B82F6';
      case 'terminated': return '#EF4444';
      case 'draft': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getContractTypeLabel = (type: string) => {
    switch (type) {
      case 'fixed_price': return 'Fixed Price';
      case 'hourly': return 'Hourly';
      case 'retainer': return 'Retainer';
      case 'milestone': return 'Milestone-based';
      default: return type;
    }
  };

  const handleViewDocument = async (doc: { id: string; name: string }) => {
    try {
      const response = await api.get(`/api/contractor/contracts/documents/${doc.id}`);
      if (response.data.download_url) {
        await Share.share({
          url: response.data.download_url,
          title: doc.name,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to download document');
    }
  };

  const handleRenewalAction = (contract: Contract) => {
    Alert.alert(
      'Contract Renewal',
      `Would you like to renew your contract with ${contract.client_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Renewal',
          onPress: async () => {
            try {
              await api.post(`/api/contractor/contracts/${contract.id}/request-renewal`);
              Alert.alert('Success', 'Renewal request sent to client');
            } catch (error) {
              Alert.alert('Error', 'Failed to send renewal request');
            }
          },
        },
      ]
    );
  };

  const renderContractCard = ({ item }: { item: Contract }) => {
    const isExpanded = expandedContract === item.id;
    const daysRemaining = item.end_date ? getDaysRemaining(item.end_date) : null;
    const progress = item.contract_type === 'hourly' && item.total_hours 
      ? ((item.hours_worked || 0) / item.total_hours) * 100 
      : (item.total_billed / item.value) * 100;

    return (
      <View style={styles.contractCard}>
        <TouchableOpacity 
          style={styles.contractHeader}
          onPress={() => setExpandedContract(isExpanded ? null : item.id)}
        >
          <View style={styles.contractHeaderLeft}>
            <View style={styles.clientAvatar}>
              <Text style={styles.clientInitial}>{item.client_name[0]}</Text>
            </View>
            <View style={styles.contractInfo}>
              <Text style={styles.clientName}>{item.client_name}</Text>
              <Text style={styles.contractTitle} numberOfLines={1}>{item.title}</Text>
            </View>
          </View>
          <View style={styles.contractHeaderRight}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#666" 
            />
          </View>
        </TouchableOpacity>

        <View style={styles.contractSummary}>
          <View style={styles.contractMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Type</Text>
              <Text style={styles.metaValue}>{getContractTypeLabel(item.contract_type)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Value</Text>
              <Text style={styles.metaValue}>{formatCurrency(item.value)}</Text>
            </View>
            {daysRemaining !== null && daysRemaining > 0 && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Ends In</Text>
                <Text style={[
                  styles.metaValue, 
                  daysRemaining <= 30 && { color: '#F59E0B' }
                ]}>
                  {daysRemaining} days
                </Text>
              </View>
            )}
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                {item.contract_type === 'hourly' ? 'Hours Used' : 'Billed'}
              </Text>
              <Text style={styles.progressValue}>
                {item.contract_type === 'hourly' 
                  ? `${item.hours_worked || 0}/${item.total_hours || 0}h`
                  : `${formatCurrency(item.total_billed)} / ${formatCurrency(item.value)}`
                }
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
            </View>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.contractExpanded}>
            <View style={styles.expandedSection}>
              <Text style={styles.expandedSectionTitle}>Contract Period</Text>
              <Text style={styles.expandedText}>
                {formatDate(item.start_date)} - {item.end_date ? formatDate(item.end_date) : 'Ongoing'}
              </Text>
            </View>

            <View style={styles.expandedSection}>
              <Text style={styles.expandedSectionTitle}>Payment Terms</Text>
              <Text style={styles.expandedText}>{item.payment_terms}</Text>
            </View>

            {item.hourly_rate && (
              <View style={styles.expandedSection}>
                <Text style={styles.expandedSectionTitle}>Hourly Rate</Text>
                <Text style={styles.expandedText}>{formatCurrency(item.hourly_rate)}/hour</Text>
              </View>
            )}

            {item.milestones && item.milestones.length > 0 && (
              <View style={styles.expandedSection}>
                <Text style={styles.expandedSectionTitle}>Milestones</Text>
                {item.milestones.map((milestone) => (
                  <View key={milestone.id} style={styles.milestoneItem}>
                    <View style={styles.milestoneInfo}>
                      <Text style={styles.milestoneName}>{milestone.name}</Text>
                      <Text style={styles.milestoneDue}>Due: {formatDate(milestone.due_date)}</Text>
                    </View>
                    <View style={styles.milestoneRight}>
                      <Text style={styles.milestoneAmount}>{formatCurrency(milestone.amount)}</Text>
                      <View style={[
                        styles.milestoneStatus, 
                        { backgroundColor: milestone.status === 'paid' ? '#10B981' : milestone.status === 'completed' ? '#3B82F6' : '#F59E0B' }
                      ]}>
                        <Text style={styles.milestoneStatusText}>
                          {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {item.documents.length > 0 && (
              <View style={styles.expandedSection}>
                <Text style={styles.expandedSectionTitle}>Documents</Text>
                {item.documents.map((doc) => (
                  <TouchableOpacity 
                    key={doc.id} 
                    style={styles.documentItem}
                    onPress={() => handleViewDocument(doc)}
                  >
                    <Ionicons name="document-text" size={18} color="#1473FF" />
                    <Text style={styles.documentName}>{doc.name}</Text>
                    <Ionicons name="download-outline" size={18} color="#666" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.contractActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={18} color="#1473FF" />
                <Text style={styles.actionButtonText}>Message Client</Text>
              </TouchableOpacity>
              
              {item.status === 'active' && daysRemaining && daysRemaining <= 60 && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.actionButtonPrimary]}
                  onPress={() => handleRenewalAction(item)}
                >
                  <Ionicons name="refresh" size={18} color="#FFF" />
                  <Text style={[styles.actionButtonText, { color: colors.text }]}>Request Renewal</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
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
          <Text style={styles.headerTitle}>My Contracts</Text>
          <View style={{ width: 24 }} />
        </View>

        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.active_contracts}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatCurrency(stats.total_value)}</Text>
              <Text style={styles.statLabel}>Total Value</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>{formatCurrency(stats.total_billed)}</Text>
              <Text style={styles.statLabel}>Billed</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'active', 'pending', 'completed'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
              onPress={() => {
                setFilterStatus(status);
                setLoading(true);
              }}
            >
              <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>
                {status === 'all' ? 'All Contracts' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={contracts}
        renderItem={renderContractCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color="#666" />
            <Text style={styles.emptyStateTitle}>No Contracts Found</Text>
            <Text style={styles.emptyStateText}>
              Your contracts will appear here once you start working with clients
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
    backgroundColor: colors.background,
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
    color: colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 14,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  filterChipActive: {
    backgroundColor: '#1473FF',
    borderColor: '#1473FF',
  },
  filterChipText: {
    fontSize: 13,
    color: '#a0a0a0',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.text,
  },
  listContent: {
    padding: 16,
  },
  contractCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
    overflow: 'hidden',
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  contractHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1473FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  contractInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  contractTitle: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 2,
  },
  contractHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  contractSummary: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  contractMeta: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  metaItem: {
    marginRight: 24,
  },
  metaLabel: {
    fontSize: 11,
    color: '#666',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  progressContainer: {},
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  progressValue: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2a2a4e',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1473FF',
    borderRadius: 3,
  },
  contractExpanded: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    padding: 16,
  },
  expandedSection: {
    marginBottom: 16,
  },
  expandedSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a0a0a0',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expandedText: {
    fontSize: 14,
    color: colors.text,
  },
  milestoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  milestoneDue: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  milestoneRight: {
    alignItems: 'flex-end',
  },
  milestoneAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  milestoneStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  milestoneStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  documentName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  contractActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a4e',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  actionButtonPrimary: {
    backgroundColor: '#1473FF',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1473FF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
