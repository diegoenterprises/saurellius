/**
 * EMPLOYEE PAY HISTORY SCREEN
 * View complete pay history, download paystubs, and track earnings
 * YTD earnings, tax withholdings, and deductions summary
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

interface PaystubSummary {
  id: string;
  pay_date: string;
  pay_period_start: string;
  pay_period_end: string;
  gross_pay: number;
  net_pay: number;
  total_deductions: number;
  total_taxes: number;
  hours_worked?: number;
  status: 'pending' | 'processed' | 'direct_deposit' | 'check_issued';
}

interface YTDSummary {
  gross_earnings: number;
  net_earnings: number;
  federal_tax: number;
  state_tax: number;
  social_security: number;
  medicare: number;
  total_deductions: number;
  retirement_contributions: number;
  health_insurance: number;
}

export default function PayHistoryScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paystubs, setPaystubs] = useState<PaystubSummary[]>([]);
  const [ytdSummary, setYtdSummary] = useState<YTDSummary | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearPicker, setShowYearPicker] = useState(false);

  const fetchPayHistory = useCallback(async () => {
    try {
      const [paystubsRes, ytdRes] = await Promise.all([
        api.get(`/api/employee/paystubs?year=${selectedYear}`),
        api.get(`/api/employee/ytd-summary?year=${selectedYear}`),
      ]);
      
      setPaystubs(paystubsRes.data.paystubs || []);
      setYtdSummary(ytdRes.data.summary || null);
    } catch (error) {
      console.error('Failed to fetch pay history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchPayHistory();
  }, [fetchPayHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayHistory();
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

  const formatPayPeriod = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const handleDownloadPaystub = async (paystubId: string) => {
    try {
      const response = await api.get(`/api/employee/paystubs/${paystubId}/download`);
      if (response.data.pdf_url) {
        await Share.share({
          url: response.data.pdf_url,
          title: 'Paystub',
        });
      }
    } catch (error) {
      console.error('Failed to download paystub:', error);
    }
  };

  const handleViewPaystub = (paystubId: string) => {
    navigation.navigate('PaystubDetail', { paystubId });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'direct_deposit': return '#10B981';
      case 'processed': return '#3B82F6';
      case 'check_issued': return '#8B5CF6';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'direct_deposit': return 'Direct Deposit';
      case 'processed': return 'Processed';
      case 'check_issued': return 'Check Issued';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  const renderPaystubItem = ({ item }: { item: PaystubSummary }) => (
    <TouchableOpacity 
      style={styles.paystubCard}
      onPress={() => handleViewPaystub(item.id)}
    >
      <View style={styles.paystubHeader}>
        <View>
          <Text style={styles.payDate}>{formatDate(item.pay_date)}</Text>
          <Text style={styles.payPeriod}>{formatPayPeriod(item.pay_period_start, item.pay_period_end)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.paystubAmounts}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Gross Pay</Text>
          <Text style={styles.amountValue}>{formatCurrency(item.gross_pay)}</Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Deductions & Taxes</Text>
          <Text style={[styles.amountValue, { color: '#EF4444' }]}>
            -{formatCurrency(item.total_deductions + item.total_taxes)}
          </Text>
        </View>
        <View style={[styles.amountRow, styles.netPayRow]}>
          <Text style={styles.netPayLabel}>Net Pay</Text>
          <Text style={styles.netPayValue}>{formatCurrency(item.net_pay)}</Text>
        </View>
      </View>

      <View style={styles.paystubActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleViewPaystub(item.id)}
        >
          <Ionicons name="eye" size={18} color="#1473FF" />
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDownloadPaystub(item.id)}
        >
          <Ionicons name="download" size={18} color="#1473FF" />
          <Text style={styles.actionButtonText}>Download</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderYTDSummary = () => {
    if (!ytdSummary) return null;

    return (
      <View style={styles.ytdCard}>
        <Text style={styles.ytdTitle}>{selectedYear} Year-to-Date Summary</Text>
        
        <View style={styles.ytdHighlights}>
          <View style={styles.ytdHighlight}>
            <Text style={styles.ytdHighlightLabel}>Gross Earnings</Text>
            <Text style={styles.ytdHighlightValue}>{formatCurrency(ytdSummary.gross_earnings)}</Text>
          </View>
          <View style={styles.ytdDivider} />
          <View style={styles.ytdHighlight}>
            <Text style={styles.ytdHighlightLabel}>Net Earnings</Text>
            <Text style={[styles.ytdHighlightValue, { color: '#10B981' }]}>
              {formatCurrency(ytdSummary.net_earnings)}
            </Text>
          </View>
        </View>

        <View style={styles.ytdDetails}>
          <Text style={styles.ytdSectionTitle}>Taxes Withheld</Text>
          <View style={styles.ytdRow}>
            <Text style={styles.ytdRowLabel}>Federal Income Tax</Text>
            <Text style={styles.ytdRowValue}>{formatCurrency(ytdSummary.federal_tax)}</Text>
          </View>
          <View style={styles.ytdRow}>
            <Text style={styles.ytdRowLabel}>State Income Tax</Text>
            <Text style={styles.ytdRowValue}>{formatCurrency(ytdSummary.state_tax)}</Text>
          </View>
          <View style={styles.ytdRow}>
            <Text style={styles.ytdRowLabel}>Social Security</Text>
            <Text style={styles.ytdRowValue}>{formatCurrency(ytdSummary.social_security)}</Text>
          </View>
          <View style={styles.ytdRow}>
            <Text style={styles.ytdRowLabel}>Medicare</Text>
            <Text style={styles.ytdRowValue}>{formatCurrency(ytdSummary.medicare)}</Text>
          </View>

          <Text style={[styles.ytdSectionTitle, { marginTop: 16 }]}>Deductions</Text>
          <View style={styles.ytdRow}>
            <Text style={styles.ytdRowLabel}>Health Insurance</Text>
            <Text style={styles.ytdRowValue}>{formatCurrency(ytdSummary.health_insurance)}</Text>
          </View>
          <View style={styles.ytdRow}>
            <Text style={styles.ytdRowLabel}>401(k) Contributions</Text>
            <Text style={styles.ytdRowValue}>{formatCurrency(ytdSummary.retirement_contributions)}</Text>
          </View>
          <View style={styles.ytdRow}>
            <Text style={styles.ytdRowLabel}>Other Deductions</Text>
            <Text style={styles.ytdRowValue}>
              {formatCurrency(ytdSummary.total_deductions - ytdSummary.health_insurance - ytdSummary.retirement_contributions)}
            </Text>
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
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pay History</Text>
          <TouchableOpacity 
            style={styles.yearButton}
            onPress={() => setShowYearPicker(!showYearPicker)}
          >
            <Text style={styles.yearButtonText}>{selectedYear}</Text>
            <Ionicons name="chevron-down" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        {ytdSummary && (
          <View style={styles.headerStats}>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatLabel}>YTD Net Pay</Text>
              <Text style={styles.headerStatValue}>{formatCurrency(ytdSummary.net_earnings)}</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatLabel}>Paychecks</Text>
              <Text style={styles.headerStatValue}>{paystubs.length}</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {showYearPicker && (
        <View style={styles.yearPicker}>
          {[2024, 2023, 2022, 2021].map((year) => (
            <TouchableOpacity
              key={year}
              style={[styles.yearOption, selectedYear === year && styles.yearOptionActive]}
              onPress={() => {
                setSelectedYear(year);
                setShowYearPicker(false);
                setLoading(true);
              }}
            >
              <Text style={[styles.yearOptionText, selectedYear === year && styles.yearOptionTextActive]}>
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={paystubs}
        renderItem={renderPaystubItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />
        }
        ListHeaderComponent={renderYTDSummary}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#666" />
            <Text style={styles.emptyStateText}>No pay history</Text>
            <Text style={styles.emptyStateSubtext}>Your paystubs will appear here after your first paycheck</Text>
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
    paddingBottom: 20,
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
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
  },
  yearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  yearButtonText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
  },
  headerStat: {
    flex: 1,
    alignItems: 'center',
  },
  headerStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  headerStatValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  yearPicker: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  yearOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#2a2a4e',
  },
  yearOptionActive: {
    backgroundColor: '#1473FF',
  },
  yearOptionText: {
    fontSize: 14,
    color: '#a0a0a0',
    fontWeight: '500',
  },
  yearOptionTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: 16,
  },
  ytdCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  ytdTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  ytdHighlights: {
    flexDirection: 'row',
    backgroundColor: '#0f0f23',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  ytdHighlight: {
    flex: 1,
    alignItems: 'center',
  },
  ytdDivider: {
    width: 1,
    backgroundColor: '#2a2a4e',
  },
  ytdHighlightLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    marginBottom: 4,
  },
  ytdHighlightValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  ytdDetails: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    paddingTop: 16,
  },
  ytdSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a0a0a0',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ytdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  ytdRowLabel: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  ytdRowValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
  },
  paystubCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  paystubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  payDate: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
  },
  payPeriod: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 2,
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
  paystubAmounts: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    paddingTop: 14,
    marginBottom: 14,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  amountLabel: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
  },
  netPayRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  netPayLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  netPayValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  paystubActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    paddingTop: 12,
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#1473FF',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
