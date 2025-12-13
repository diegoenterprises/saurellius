/**
 * CONTRACTOR PAYMENT HISTORY SCREEN
 * View all payments received, filter by date/status
 * Download payment details and track payment methods
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface Payment {
  id: string;
  invoice_id?: string;
  invoice_number?: string;
  payer_name: string;
  amount: number;
  payment_date: string;
  payment_method: 'ach' | 'check' | 'wire' | 'other';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reference_number?: string;
  description?: string;
}

interface PaymentStats {
  total_received: number;
  total_pending: number;
  payment_count: number;
  average_payment: number;
}

type FilterPeriod = 'all' | '30days' | '90days' | 'ytd' | 'lastyear';

export default function ContractorPaymentHistoryScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('ytd');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchPayments = useCallback(async () => {
    try {
      const [paymentsRes, statsRes] = await Promise.all([
        api.get(`/api/contractor/payments?period=${filterPeriod}&status=${filterStatus}`),
        api.get(`/api/contractor/payments/stats?period=${filterPeriod}`),
      ]);
      
      setPayments(paymentsRes.data.payments || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterPeriod, filterStatus]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'processing': return '#3B82F6';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'ach': return 'card';
      case 'check': return 'document-text';
      case 'wire': return 'flash';
      default: return 'cash';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'ach': return 'ACH Transfer';
      case 'check': return 'Check';
      case 'wire': return 'Wire Transfer';
      default: return 'Other';
    }
  };

  const handleExportPayments = async () => {
    try {
      const response = await api.get('/api/contractor/payments/export', {
        params: { period: filterPeriod, format: 'csv' },
      });
      
      if (response.data.download_url) {
        await Share.share({
          url: response.data.download_url,
          title: 'Payment History Export',
        });
      }
    } catch (error) {
      console.error('Failed to export payments:', error);
    }
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <TouchableOpacity style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentPayerInfo}>
          <Text style={styles.payerName}>{item.payer_name}</Text>
          {item.invoice_number && (
            <Text style={styles.invoiceRef}>Invoice #{item.invoice_number}</Text>
          )}
        </View>
        <View style={styles.paymentAmountContainer}>
          <Text style={styles.paymentAmount}>{formatCurrency(item.amount)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.paymentDetail}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.paymentDetailText}>{formatDate(item.payment_date)}</Text>
        </View>
        <View style={styles.paymentDetail}>
          <Ionicons name={getPaymentMethodIcon(item.payment_method) as any} size={16} color="#666" />
          <Text style={styles.paymentDetailText}>{getPaymentMethodLabel(item.payment_method)}</Text>
        </View>
        {item.reference_number && (
          <View style={styles.paymentDetail}>
            <Ionicons name="document-outline" size={16} color="#666" />
            <Text style={styles.paymentDetailText}>Ref: {item.reference_number}</Text>
          </View>
        )}
      </View>

      {item.description && (
        <Text style={styles.paymentDescription} numberOfLines={1}>{item.description}</Text>
      )}
    </TouchableOpacity>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodFilters}>
        {[
          { value: '30days', label: '30 Days' },
          { value: '90days', label: '90 Days' },
          { value: 'ytd', label: 'Year to Date' },
          { value: 'lastyear', label: 'Last Year' },
          { value: 'all', label: 'All Time' },
        ].map((period) => (
          <TouchableOpacity
            key={period.value}
            style={[styles.filterChip, filterPeriod === period.value && styles.filterChipActive]}
            onPress={() => {
              setFilterPeriod(period.value as FilterPeriod);
              setLoading(true);
            }}
          >
            <Text style={[styles.filterChipText, filterPeriod === period.value && styles.filterChipTextActive]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.statusFilters}>
        {['all', 'completed', 'pending', 'processing'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.statusFilter, filterStatus === status && styles.statusFilterActive]}
            onPress={() => {
              setFilterStatus(status);
              setLoading(true);
            }}
          >
            <Text style={[styles.statusFilterText, filterStatus === status && styles.statusFilterTextActive]}>
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

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
          <Text style={styles.headerTitle}>Payment History</Text>
          <TouchableOpacity onPress={handleExportPayments}>
            <Ionicons name="download-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Received</Text>
              <Text style={styles.statValue}>{formatCurrency(stats.total_received)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{formatCurrency(stats.total_pending)}</Text>
            </View>
          </View>
        )}

        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatValue}>{stats.payment_count}</Text>
              <Text style={styles.miniStatLabel}>Payments</Text>
            </View>
            <View style={styles.miniStatDivider} />
            <View style={styles.miniStat}>
              <Text style={styles.miniStatValue}>{formatCurrency(stats.average_payment)}</Text>
              <Text style={styles.miniStatLabel}>Avg Payment</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {renderFilters()}

      <FlatList
        data={payments}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cash-outline" size={64} color="#666" />
            <Text style={styles.emptyStateTitle}>No Payments Found</Text>
            <Text style={styles.emptyStateText}>
              Payments matching your filters will appear here
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#10B981',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 32,
  },
  miniStat: {
    alignItems: 'center',
  },
  miniStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  miniStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  miniStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  filtersContainer: {
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  periodFilters: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1a1a2e',
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
    color: '#FFF',
  },
  statusFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  statusFilter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#1a1a2e',
  },
  statusFilterActive: {
    backgroundColor: '#2a2a4e',
  },
  statusFilterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statusFilterTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: 16,
  },
  paymentCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentPayerInfo: {
    flex: 1,
  },
  payerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  invoiceRef: {
    fontSize: 12,
    color: '#1473FF',
    marginTop: 2,
  },
  paymentAmountContainer: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  paymentDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  paymentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentDetailText: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  paymentDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
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
