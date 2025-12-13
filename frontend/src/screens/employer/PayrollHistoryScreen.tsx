/**
 * EMPLOYER PAYROLL HISTORY SCREEN
 * Complete payroll run history with details
 * Filter, search, and export past payrolls
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

interface PayrollRun {
  id: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  status: 'draft' | 'processing' | 'approved' | 'paid' | 'voided';
  employee_count: number;
  contractor_count: number;
  totals: {
    gross_pay: number;
    net_pay: number;
    employer_taxes: number;
    employee_taxes: number;
    deductions: number;
    total_cost: number;
  };
  approved_by?: string;
  approved_at?: string;
  processed_at?: string;
}

interface PayrollStats {
  total_payrolls: number;
  ytd_gross: number;
  ytd_taxes: number;
  ytd_total_cost: number;
  average_payroll: number;
}

type FilterYear = number | 'all';
type FilterStatus = string;

export default function PayrollHistoryScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payrolls, setPayrolls] = useState<PayrollRun[]>([]);
  const [stats, setStats] = useState<PayrollStats | null>(null);
  const [filterYear, setFilterYear] = useState<FilterYear>(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [expandedPayroll, setExpandedPayroll] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2, 'all'];

  const fetchPayrolls = useCallback(async () => {
    try {
      const [payrollsRes, statsRes] = await Promise.all([
        api.get('/api/employer/payroll/history', {
          params: { 
            year: filterYear !== 'all' ? filterYear : undefined,
            status: filterStatus !== 'all' ? filterStatus : undefined,
          }
        }),
        api.get('/api/employer/payroll/stats', {
          params: { year: filterYear !== 'all' ? filterYear : undefined }
        }),
      ]);
      
      setPayrolls(payrollsRes.data.payrolls || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch payroll history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterYear, filterStatus]);

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayrolls();
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

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'approved': return '#3B82F6';
      case 'processing': return '#F59E0B';
      case 'draft': return '#6B7280';
      case 'voided': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return 'checkmark-circle';
      case 'approved': return 'thumbs-up';
      case 'processing': return 'time';
      case 'draft': return 'document';
      case 'voided': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const handleExportPayroll = async (payroll: PayrollRun) => {
    try {
      const response = await api.get(`/api/employer/payroll/${payroll.id}/export`);
      if (response.data.download_url) {
        await Share.share({
          url: response.data.download_url,
          title: `Payroll ${formatDate(payroll.pay_date)}`,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export payroll');
    }
  };

  const handleViewDetails = (payroll: PayrollRun) => {
    navigation.navigate('PayrollDetails', { payrollId: payroll.id });
  };

  const handleVoidPayroll = (payroll: PayrollRun) => {
    if (payroll.status !== 'draft') {
      Alert.alert('Cannot Void', 'Only draft payrolls can be voided');
      return;
    }

    Alert.alert(
      'Void Payroll',
      'Are you sure you want to void this payroll? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Void',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/api/employer/payroll/${payroll.id}/void`);
              fetchPayrolls();
              Alert.alert('Success', 'Payroll voided');
            } catch (error) {
              Alert.alert('Error', 'Failed to void payroll');
            }
          },
        },
      ]
    );
  };

  const renderPayrollCard = ({ item }: { item: PayrollRun }) => {
    const isExpanded = expandedPayroll === item.id;

    return (
      <View style={styles.payrollCard}>
        <TouchableOpacity 
          style={styles.payrollHeader}
          onPress={() => setExpandedPayroll(isExpanded ? null : item.id)}
        >
          <View style={styles.payrollHeaderLeft}>
            <View style={[styles.statusIcon, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Ionicons name={getStatusIcon(item.status) as any} size={20} color={getStatusColor(item.status)} />
            </View>
            <View style={styles.payrollInfo}>
              <Text style={styles.payrollDate}>Pay Date: {formatDate(item.pay_date)}</Text>
              <Text style={styles.payrollPeriod}>
                {formatShortDate(item.pay_period_start)} - {formatShortDate(item.pay_period_end)}
              </Text>
            </View>
          </View>
          <View style={styles.payrollHeaderRight}>
            <Text style={styles.payrollAmount}>{formatCurrency(item.totals.net_pay)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.payrollSummary}>
          <View style={styles.summaryItem}>
            <Ionicons name="people" size={16} color="#3B82F6" />
            <Text style={styles.summaryText}>{item.employee_count} employees</Text>
          </View>
          {item.contractor_count > 0 && (
            <View style={styles.summaryItem}>
              <Ionicons name="construct" size={16} color="#8B5CF6" />
              <Text style={styles.summaryText}>{item.contractor_count} contractors</Text>
            </View>
          )}
          <View style={styles.summaryItem}>
            <Ionicons name="cash" size={16} color="#10B981" />
            <Text style={styles.summaryText}>{formatCurrency(item.totals.total_cost)} total</Text>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.payrollExpanded}>
            <View style={styles.breakdownSection}>
              <Text style={styles.breakdownTitle}>Breakdown</Text>
              
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Gross Pay</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(item.totals.gross_pay)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Employee Taxes</Text>
                <Text style={[styles.breakdownValue, { color: '#EF4444' }]}>
                  -{formatCurrency(item.totals.employee_taxes)}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Deductions</Text>
                <Text style={[styles.breakdownValue, { color: '#EF4444' }]}>
                  -{formatCurrency(item.totals.deductions)}
                </Text>
              </View>
              <View style={[styles.breakdownRow, styles.breakdownRowTotal]}>
                <Text style={styles.breakdownLabelBold}>Net Pay</Text>
                <Text style={styles.breakdownValueBold}>{formatCurrency(item.totals.net_pay)}</Text>
              </View>

              <View style={styles.employerSection}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Employer Taxes</Text>
                  <Text style={styles.breakdownValue}>{formatCurrency(item.totals.employer_taxes)}</Text>
                </View>
                <View style={[styles.breakdownRow, styles.breakdownRowTotal]}>
                  <Text style={styles.breakdownLabelBold}>Total Cost</Text>
                  <Text style={[styles.breakdownValueBold, { color: '#1473FF' }]}>
                    {formatCurrency(item.totals.total_cost)}
                  </Text>
                </View>
              </View>
            </View>

            {item.approved_by && (
              <View style={styles.approvalInfo}>
                <Ionicons name="checkmark-done" size={16} color="#10B981" />
                <Text style={styles.approvalText}>
                  Approved by {item.approved_by} on {formatDate(item.approved_at || '')}
                </Text>
              </View>
            )}

            <View style={styles.payrollActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleViewDetails(item)}
              >
                <Ionicons name="eye-outline" size={18} color="#1473FF" />
                <Text style={styles.actionButtonText}>View Details</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleExportPayroll(item)}
              >
                <Ionicons name="download-outline" size={18} color="#1473FF" />
                <Text style={styles.actionButtonText}>Export</Text>
              </TouchableOpacity>

              {item.status === 'draft' && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.actionButtonDanger]}
                  onPress={() => handleVoidPayroll(item)}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Void</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => setExpandedPayroll(isExpanded ? null : item.id)}
        >
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>
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
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payroll History</Text>
          <TouchableOpacity>
            <Ionicons name="download-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.total_payrolls}</Text>
              <Text style={styles.statLabel}>Payrolls</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatCurrency(stats.ytd_gross)}</Text>
              <Text style={styles.statLabel}>YTD Gross</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#1473FF' }]}>{formatCurrency(stats.ytd_total_cost)}</Text>
              <Text style={styles.statLabel}>YTD Cost</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearFilters}>
          {years.map((year) => (
            <TouchableOpacity
              key={year.toString()}
              style={[styles.filterChip, filterYear === year && styles.filterChipActive]}
              onPress={() => {
                setFilterYear(year as FilterYear);
                setLoading(true);
              }}
            >
              <Text style={[styles.filterChipText, filterYear === year && styles.filterChipTextActive]}>
                {year === 'all' ? 'All Time' : year}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.statusFilters}>
          {['all', 'paid', 'approved', 'processing'].map((status) => (
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

      <FlatList
        data={payrolls}
        renderItem={renderPayrollCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#666" />
            <Text style={styles.emptyStateTitle}>No Payrolls Found</Text>
            <Text style={styles.emptyStateText}>
              {filterYear !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Your payroll history will appear here'}
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  filterBar: {
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  yearFilters: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
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
    paddingBottom: 12,
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
  payrollCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
    overflow: 'hidden',
  },
  payrollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  payrollHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  payrollInfo: {},
  payrollDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  payrollPeriod: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
  },
  payrollHeaderRight: {
    alignItems: 'flex-end',
  },
  payrollAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  payrollSummary: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryText: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  payrollExpanded: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    padding: 16,
  },
  breakdownSection: {
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  breakdownRowTotal: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    marginTop: 8,
    paddingTop: 12,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  breakdownLabelBold: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  breakdownValue: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  breakdownValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  employerSection: {
    backgroundColor: '#0f0f23',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  approvalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  approvalText: {
    fontSize: 13,
    color: '#10B981',
  },
  payrollActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1473FF20',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  actionButtonDanger: {
    backgroundColor: '#EF444420',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1473FF',
  },
  expandButton: {
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
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
