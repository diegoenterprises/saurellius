/**
 * EMPLOYER PAYROLL SUMMARY DASHBOARD
 * Real-time payroll overview with pay period summaries
 * Employee counts, tax liabilities, and payment schedules
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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

interface PayrollSummary {
  current_period: {
    start_date: string;
    end_date: string;
    pay_date: string;
    status: 'draft' | 'processing' | 'approved' | 'paid';
  };
  employee_counts: {
    total: number;
    hourly: number;
    salary: number;
    contractors: number;
  };
  current_totals: {
    gross_pay: number;
    net_pay: number;
    employer_taxes: number;
    employee_taxes: number;
    deductions: number;
    total_cost: number;
  };
  ytd_totals: {
    gross_pay: number;
    employer_taxes: number;
    total_payroll_cost: number;
  };
  upcoming_deadlines: {
    type: string;
    description: string;
    due_date: string;
    amount?: number;
  }[];
  recent_payrolls: {
    id: string;
    pay_date: string;
    total_net: number;
    employee_count: number;
    status: string;
  }[];
}

interface PayrollMetric {
  label: string;
  value: string;
  change?: number;
  icon: string;
  color: string;
}

export default function PayrollSummaryDashboard() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'taxes'>('overview');

  const fetchPayrollSummary = useCallback(async () => {
    try {
      const response = await api.get('/api/employer/payroll/summary');
      setSummary(response.data.summary || null);
    } catch (error) {
      console.error('Failed to fetch payroll summary:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayrollSummary();
  }, [fetchPayrollSummary]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayrollSummary();
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
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'approved': return '#3B82F6';
      case 'processing': return '#F59E0B';
      case 'draft': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const metrics: PayrollMetric[] = summary ? [
    {
      label: 'Total Employees',
      value: summary.employee_counts.total.toString(),
      icon: 'people',
      color: '#3B82F6',
    },
    {
      label: 'Hourly Workers',
      value: summary.employee_counts.hourly.toString(),
      icon: 'time',
      color: '#8B5CF6',
    },
    {
      label: 'Salaried',
      value: summary.employee_counts.salary.toString(),
      icon: 'briefcase',
      color: '#10B981',
    },
    {
      label: 'Contractors',
      value: summary.employee_counts.contractors.toString(),
      icon: 'construct',
      color: '#F59E0B',
    },
  ] : [];

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.metricsGrid}>
        {metrics.map((metric, index) => (
          <View key={index} style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: metric.color + '20' }]}>
              <Ionicons name={metric.icon as any} size={22} color={metric.color} />
            </View>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricLabel}>{metric.label}</Text>
          </View>
        ))}
      </View>

      {summary?.current_totals && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Current Pay Period</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(summary.current_period.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(summary.current_period.status) }]}>
                {summary.current_period.status.charAt(0).toUpperCase() + summary.current_period.status.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.periodDates}>
            <Text style={styles.periodDateText}>
              {formatDate(summary.current_period.start_date)} - {formatDate(summary.current_period.end_date)}
            </Text>
            <Text style={styles.payDateText}>
              Pay Date: {formatDate(summary.current_period.pay_date)}
            </Text>
          </View>

          <View style={styles.breakdownSection}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Gross Pay</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(summary.current_totals.gross_pay)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Employee Taxes</Text>
              <Text style={[styles.breakdownValue, { color: '#EF4444' }]}>
                -{formatCurrency(summary.current_totals.employee_taxes)}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Deductions</Text>
              <Text style={[styles.breakdownValue, { color: '#EF4444' }]}>
                -{formatCurrency(summary.current_totals.deductions)}
              </Text>
            </View>
            <View style={[styles.breakdownRow, styles.breakdownRowTotal]}>
              <Text style={styles.breakdownLabelTotal}>Net Pay</Text>
              <Text style={styles.breakdownValueTotal}>{formatCurrency(summary.current_totals.net_pay)}</Text>
            </View>
          </View>

          <View style={styles.employerCostSection}>
            <Text style={styles.employerCostLabel}>Employer Cost</Text>
            <View style={styles.employerCostRow}>
              <View style={styles.employerCostItem}>
                <Text style={styles.employerCostItemLabel}>Employer Taxes</Text>
                <Text style={styles.employerCostItemValue}>{formatCurrency(summary.current_totals.employer_taxes)}</Text>
              </View>
              <View style={styles.employerCostItem}>
                <Text style={styles.employerCostItemLabel}>Total Cost</Text>
                <Text style={[styles.employerCostItemValue, { color: '#1473FF' }]}>
                  {formatCurrency(summary.current_totals.total_cost)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity 
        style={styles.runPayrollButton}
        onPress={() => navigation.navigate('PayrollRun')}
      >
        <LinearGradient
          colors={['#1473FF', '#BE01FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.runPayrollGradient}
        >
          <Ionicons name="play-circle" size={24} color="#FFF" />
          <Text style={styles.runPayrollText}>Run Payroll</Text>
        </LinearGradient>
      </TouchableOpacity>

      {summary?.ytd_totals && (
        <View style={styles.ytdCard}>
          <Text style={styles.ytdTitle}>Year-to-Date Totals</Text>
          <View style={styles.ytdStats}>
            <View style={styles.ytdStat}>
              <Text style={styles.ytdStatLabel}>Gross Wages</Text>
              <Text style={styles.ytdStatValue}>{formatCurrency(summary.ytd_totals.gross_pay)}</Text>
            </View>
            <View style={styles.ytdStatDivider} />
            <View style={styles.ytdStat}>
              <Text style={styles.ytdStatLabel}>Employer Taxes</Text>
              <Text style={styles.ytdStatValue}>{formatCurrency(summary.ytd_totals.employer_taxes)}</Text>
            </View>
            <View style={styles.ytdStatDivider} />
            <View style={styles.ytdStat}>
              <Text style={styles.ytdStatLabel}>Total Cost</Text>
              <Text style={[styles.ytdStatValue, { color: '#1473FF' }]}>
                {formatCurrency(summary.ytd_totals.total_payroll_cost)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderScheduleTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Recent Payrolls</Text>
      
      {summary?.recent_payrolls && summary.recent_payrolls.length > 0 ? (
        summary.recent_payrolls.map((payroll) => (
          <TouchableOpacity key={payroll.id} style={styles.payrollHistoryItem}>
            <View style={styles.payrollHistoryLeft}>
              <View style={[styles.payrollDot, { backgroundColor: getStatusColor(payroll.status) }]} />
              <View>
                <Text style={styles.payrollHistoryDate}>{formatDate(payroll.pay_date)}</Text>
                <Text style={styles.payrollHistoryEmployees}>{payroll.employee_count} employees</Text>
              </View>
            </View>
            <View style={styles.payrollHistoryRight}>
              <Text style={styles.payrollHistoryAmount}>{formatCurrency(payroll.total_net)}</Text>
              <Text style={[styles.payrollHistoryStatus, { color: getStatusColor(payroll.status) }]}>
                {payroll.status}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color="#666" />
          <Text style={styles.emptyStateText}>No payroll history yet</Text>
        </View>
      )}

      <TouchableOpacity style={styles.viewAllButton}>
        <Text style={styles.viewAllText}>View All Payroll History</Text>
        <Ionicons name="arrow-forward" size={18} color="#1473FF" />
      </TouchableOpacity>
    </View>
  );

  const renderTaxesTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Upcoming Tax Deadlines</Text>

      {summary?.upcoming_deadlines && summary.upcoming_deadlines.length > 0 ? (
        summary.upcoming_deadlines.map((deadline, index) => {
          const daysUntil = getDaysUntil(deadline.due_date);
          const isUrgent = daysUntil <= 7;

          return (
            <View 
              key={index} 
              style={[styles.deadlineCard, isUrgent && styles.deadlineCardUrgent]}
            >
              <View style={styles.deadlineHeader}>
                <View style={[styles.deadlineIcon, isUrgent && styles.deadlineIconUrgent]}>
                  <Ionicons 
                    name={isUrgent ? "alert-circle" : "calendar"} 
                    size={24} 
                    color={isUrgent ? "#EF4444" : "#F59E0B"} 
                  />
                </View>
                <View style={styles.deadlineInfo}>
                  <Text style={styles.deadlineType}>{deadline.type}</Text>
                  <Text style={styles.deadlineDesc}>{deadline.description}</Text>
                </View>
                <View style={styles.deadlineDue}>
                  <Text style={[styles.deadlineDays, isUrgent && { color: '#EF4444' }]}>
                    {daysUntil <= 0 ? 'Due Today!' : `${daysUntil} days`}
                  </Text>
                  <Text style={styles.deadlineDate}>{formatDate(deadline.due_date)}</Text>
                </View>
              </View>
              {deadline.amount && (
                <View style={styles.deadlineAmount}>
                  <Text style={styles.deadlineAmountLabel}>Estimated Amount</Text>
                  <Text style={styles.deadlineAmountValue}>{formatCurrency(deadline.amount)}</Text>
                </View>
              )}
            </View>
          );
        })
      ) : (
        <View style={styles.noDeadlines}>
          <Ionicons name="checkmark-circle" size={48} color="#10B981" />
          <Text style={styles.noDeadlinesText}>No upcoming deadlines</Text>
          <Text style={styles.noDeadlinesSubtext}>You're all caught up!</Text>
        </View>
      )}

      <TouchableOpacity 
        style={styles.taxCenterButton}
        onPress={() => navigation.navigate('TaxCenter')}
      >
        <Ionicons name="calculator" size={20} color="#1473FF" />
        <Text style={styles.taxCenterButtonText}>Go to Tax Center</Text>
      </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Payroll Dashboard</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {summary?.current_period && (
          <View style={styles.nextPayrollCard}>
            <View style={styles.nextPayrollInfo}>
              <Text style={styles.nextPayrollLabel}>Next Payroll</Text>
              <Text style={styles.nextPayrollDate}>{formatDate(summary.current_period.pay_date)}</Text>
            </View>
            <View style={styles.nextPayrollDays}>
              <Text style={styles.nextPayrollDaysNumber}>
                {getDaysUntil(summary.current_period.pay_date)}
              </Text>
              <Text style={styles.nextPayrollDaysLabel}>days</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.tabs}>
        {(['overview', 'schedule', 'taxes'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />
        }
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'schedule' && renderScheduleTab()}
        {activeTab === 'taxes' && renderTaxesTab()}
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
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  nextPayrollCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
  },
  nextPayrollInfo: {
    flex: 1,
  },
  nextPayrollLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  nextPayrollDate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  nextPayrollDays: {
    alignItems: 'center',
    backgroundColor: '#1473FF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  nextPayrollDaysNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  nextPayrollDaysLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#1473FF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    width: (width - 42) / 2,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  metricLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  periodDates: {
    marginBottom: 16,
  },
  periodDateText: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  payDateText: {
    fontSize: 13,
    color: '#1473FF',
    marginTop: 4,
  },
  breakdownSection: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    paddingTop: 14,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
  },
  breakdownRowTotal: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    marginTop: 8,
    paddingTop: 14,
  },
  breakdownLabelTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  breakdownValueTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  employerCostSection: {
    backgroundColor: '#0f0f23',
    borderRadius: 10,
    padding: 14,
    marginTop: 14,
  },
  employerCostLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    marginBottom: 10,
  },
  employerCostRow: {
    flexDirection: 'row',
  },
  employerCostItem: {
    flex: 1,
  },
  employerCostItemLabel: {
    fontSize: 12,
    color: '#666',
  },
  employerCostItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 2,
  },
  runPayrollButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  runPayrollGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  runPayrollText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  ytdCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  ytdTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  ytdStats: {
    flexDirection: 'row',
  },
  ytdStat: {
    flex: 1,
    alignItems: 'center',
  },
  ytdStatDivider: {
    width: 1,
    backgroundColor: '#2a2a4e',
    marginHorizontal: 8,
  },
  ytdStatLabel: {
    fontSize: 11,
    color: '#a0a0a0',
    marginBottom: 4,
  },
  ytdStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  payrollHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  payrollHistoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  payrollDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  payrollHistoryDate: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFF',
  },
  payrollHistoryEmployees: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
  },
  payrollHistoryRight: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  payrollHistoryAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  payrollHistoryStatus: {
    fontSize: 11,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#a0a0a0',
    marginTop: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 8,
    gap: 6,
  },
  viewAllText: {
    fontSize: 14,
    color: '#1473FF',
    fontWeight: '500',
  },
  deadlineCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  deadlineCardUrgent: {
    borderColor: '#EF4444',
    backgroundColor: '#EF444410',
  },
  deadlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F59E0B20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deadlineIconUrgent: {
    backgroundColor: '#EF444420',
  },
  deadlineInfo: {
    flex: 1,
  },
  deadlineType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  deadlineDesc: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
  },
  deadlineDue: {
    alignItems: 'flex-end',
  },
  deadlineDays: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  deadlineDate: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  deadlineAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  deadlineAmountLabel: {
    fontSize: 13,
    color: '#a0a0a0',
  },
  deadlineAmountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  noDeadlines: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDeadlinesText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 12,
  },
  noDeadlinesSubtext: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 4,
  },
  taxCenterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1473FF20',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    gap: 8,
  },
  taxCenterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1473FF',
  },
});
