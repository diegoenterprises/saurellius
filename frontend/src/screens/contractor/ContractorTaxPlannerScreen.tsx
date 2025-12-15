/**
 * CONTRACTOR TAX PLANNER SCREEN
 * Plan and estimate quarterly taxes
 * Track deductions, estimated payments, and liability
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
import BackButton from '../../components/common/BackButton';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface TaxEstimate {
  year: number;
  gross_income: number;
  total_deductions: number;
  taxable_income: number;
  estimated_federal: number;
  estimated_state: number;
  estimated_self_employment: number;
  total_estimated_tax: number;
  effective_rate: number;
}

interface QuarterlyPayment {
  quarter: number;
  year: number;
  due_date: string;
  estimated_amount: number;
  paid_amount: number;
  status: 'upcoming' | 'due' | 'paid' | 'overdue';
}

interface Deduction {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  receipt_attached: boolean;
}

interface TaxStats {
  ytd_income: number;
  ytd_deductions: number;
  quarterly_payments_made: number;
  next_payment_due: string;
  tax_savings: number;
}

const DEDUCTION_CATEGORIES = [
  { id: 'office', name: 'Home Office', icon: 'home' },
  { id: 'equipment', name: 'Equipment', icon: 'hardware-chip' },
  { id: 'travel', name: 'Travel', icon: 'airplane' },
  { id: 'professional', name: 'Professional Services', icon: 'briefcase' },
  { id: 'insurance', name: 'Insurance', icon: 'shield' },
  { id: 'education', name: 'Education', icon: 'school' },
];

export default function ContractorTaxPlannerScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [estimate, setEstimate] = useState<TaxEstimate | null>(null);
  const [payments, setPayments] = useState<QuarterlyPayment[]>([]);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [stats, setStats] = useState<TaxStats | null>(null);
  const [activeTab, setActiveTab] = useState<'estimate' | 'payments' | 'deductions'>('estimate');

  const fetchData = useCallback(async () => {
    try {
      const [estimateRes, paymentsRes, deductionsRes, statsRes] = await Promise.all([
        api.get('/api/contractor/tax/estimate'),
        api.get('/api/contractor/tax/payments'),
        api.get('/api/contractor/tax/deductions'),
        api.get('/api/contractor/tax/stats'),
      ]);
      setEstimate(estimateRes.data.estimate || null);
      setPayments(paymentsRes.data.payments || []);
      setDeductions(deductionsRes.data.deductions || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch tax data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'upcoming': return '#3B82F6';
      case 'due': return '#F59E0B';
      case 'overdue': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const handleMarkPaid = async (payment: QuarterlyPayment) => {
    Alert.alert('Mark as Paid', `Record Q${payment.quarter} payment of ${formatCurrency(payment.estimated_amount)}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark Paid', onPress: async () => {
        try {
          await api.post(`/api/contractor/tax/payments/${payment.quarter}/paid`, { amount: payment.estimated_amount });
          fetchData();
          Alert.alert('Success', 'Payment recorded');
        } catch (error) {
          Alert.alert('Error', 'Failed to record payment');
        }
      }},
    ]);
  };

  const renderEstimateView = () => (
    <>
      {estimate && (
        <View style={styles.estimateCard}>
          <Text style={styles.estimateTitle}>{estimate.year} Tax Estimate</Text>
          
          <View style={styles.incomeSection}>
            <View style={styles.incomeRow}>
              <Text style={styles.incomeLabel}>Gross Income</Text>
              <Text style={styles.incomeValue}>{formatCurrency(estimate.gross_income)}</Text>
            </View>
            <View style={styles.incomeRow}>
              <Text style={styles.incomeLabel}>Total Deductions</Text>
              <Text style={[styles.incomeValue, { color: '#10B981' }]}>-{formatCurrency(estimate.total_deductions)}</Text>
            </View>
            <View style={[styles.incomeRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Taxable Income</Text>
              <Text style={styles.totalValue}>{formatCurrency(estimate.taxable_income)}</Text>
            </View>
          </View>

          <View style={styles.taxBreakdown}>
            <Text style={styles.breakdownTitle}>Estimated Tax Breakdown</Text>
            <View style={styles.taxRow}>
              <Text style={styles.taxLabel}>Federal Income Tax</Text>
              <Text style={styles.taxValue}>{formatCurrency(estimate.estimated_federal)}</Text>
            </View>
            <View style={styles.taxRow}>
              <Text style={styles.taxLabel}>State Tax</Text>
              <Text style={styles.taxValue}>{formatCurrency(estimate.estimated_state)}</Text>
            </View>
            <View style={styles.taxRow}>
              <Text style={styles.taxLabel}>Self-Employment Tax</Text>
              <Text style={styles.taxValue}>{formatCurrency(estimate.estimated_self_employment)}</Text>
            </View>
            <View style={[styles.taxRow, styles.totalTaxRow]}>
              <Text style={styles.totalTaxLabel}>Total Estimated Tax</Text>
              <Text style={styles.totalTaxValue}>{formatCurrency(estimate.total_estimated_tax)}</Text>
            </View>
          </View>

          <View style={styles.rateBox}>
            <Text style={styles.rateLabel}>Effective Tax Rate</Text>
            <Text style={styles.rateValue}>{estimate.effective_rate.toFixed(1)}%</Text>
          </View>
        </View>
      )}
    </>
  );

  const renderPaymentsView = () => (
    <>
      {payments.map(payment => (
        <View key={`${payment.year}-Q${payment.quarter}`} style={styles.paymentCard}>
          <View style={styles.paymentHeader}>
            <View style={styles.quarterBox}>
              <Text style={styles.quarterText}>Q{payment.quarter}</Text>
              <Text style={styles.quarterYear}>{payment.year}</Text>
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentAmount}>{formatCurrency(payment.estimated_amount)}</Text>
              <Text style={styles.paymentDue}>Due: {formatDate(payment.due_date)}</Text>
            </View>
            <View style={[styles.paymentStatus, { backgroundColor: getPaymentStatusColor(payment.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getPaymentStatusColor(payment.status) }]}>{payment.status}</Text>
            </View>
          </View>

          {payment.paid_amount > 0 && (
            <View style={styles.paidInfo}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.paidText}>Paid: {formatCurrency(payment.paid_amount)}</Text>
            </View>
          )}

          {payment.status !== 'paid' && (
            <TouchableOpacity style={styles.payButton} onPress={() => handleMarkPaid(payment)}>
              <Ionicons name="checkmark" size={18} color="#FFF" />
              <Text style={styles.payButtonText}>Mark as Paid</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </>
  );

  const renderDeductionsView = () => (
    <>
      {DEDUCTION_CATEGORIES.map(cat => {
        const catDeductions = deductions.filter(d => d.category === cat.id);
        const catTotal = catDeductions.reduce((sum, d) => sum + d.amount, 0);
        if (catDeductions.length === 0) return null;
        return (
          <View key={cat.id} style={styles.deductionCategory}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryIcon}><Ionicons name={cat.icon as any} size={20} color="#1473FF" /></View>
              <Text style={styles.categoryName}>{cat.name}</Text>
              <Text style={styles.categoryTotal}>{formatCurrency(catTotal)}</Text>
            </View>
            {catDeductions.slice(0, 3).map(ded => (
              <View key={ded.id} style={styles.deductionRow}>
                <Text style={styles.deductionDesc}>{ded.description}</Text>
                <Text style={styles.deductionAmount}>{formatCurrency(ded.amount)}</Text>
              </View>
            ))}
            {catDeductions.length > 3 && <Text style={styles.moreText}>+{catDeductions.length - 3} more</Text>}
          </View>
        );
      })}
      <TouchableOpacity style={styles.addDeductionButton}>
        <Ionicons name="add-circle" size={20} color="#1473FF" />
        <Text style={styles.addDeductionText}>Add Deduction</Text>
      </TouchableOpacity>
    </>
  );

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <BackButton variant="gradient" />
          <Text style={styles.headerTitle}>Tax Planner</Text>
          <TouchableOpacity><Ionicons name="calculator-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{formatCurrency(stats.ytd_income)}</Text><Text style={styles.statLabel}>Income YTD</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{formatCurrency(stats.ytd_deductions)}</Text><Text style={styles.statLabel}>Deductions</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{formatCurrency(stats.tax_savings)}</Text><Text style={styles.statLabel}>Tax Saved</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'estimate' && styles.tabActive]} onPress={() => setActiveTab('estimate')}>
          <Text style={[styles.tabText, activeTab === 'estimate' && styles.tabTextActive]}>Estimate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'payments' && styles.tabActive]} onPress={() => setActiveTab('payments')}>
          <Text style={[styles.tabText, activeTab === 'payments' && styles.tabTextActive]}>Quarterly</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'deductions' && styles.tabActive]} onPress={() => setActiveTab('deductions')}>
          <Text style={[styles.tabText, activeTab === 'deductions' && styles.tabTextActive]}>Deductions</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {activeTab === 'estimate' && renderEstimateView()}
          {activeTab === 'payments' && renderPaymentsView()}
          {activeTab === 'deductions' && renderDeductionsView()}
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
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: '#1473FF' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#a0a0a0' },
  tabTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  estimateCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#2a2a4e' },
  estimateTitle: { fontSize: 18, fontWeight: '600', color: '#FFF', marginBottom: 16 },
  incomeSection: { borderBottomWidth: 1, borderBottomColor: '#2a2a4e', paddingBottom: 14, marginBottom: 14 },
  incomeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  incomeLabel: { fontSize: 14, color: '#a0a0a0' },
  incomeValue: { fontSize: 14, fontWeight: '500', color: '#FFF' },
  totalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  totalLabel: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  taxBreakdown: { marginBottom: 14 },
  breakdownTitle: { fontSize: 14, fontWeight: '600', color: '#a0a0a0', marginBottom: 10 },
  taxRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  taxLabel: { fontSize: 14, color: '#a0a0a0' },
  taxValue: { fontSize: 14, color: '#EF4444' },
  totalTaxRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  totalTaxLabel: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  totalTaxValue: { fontSize: 18, fontWeight: 'bold', color: '#EF4444' },
  rateBox: { backgroundColor: '#0f0f23', padding: 14, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rateLabel: { fontSize: 14, color: '#a0a0a0' },
  rateValue: { fontSize: 20, fontWeight: 'bold', color: '#F59E0B' },
  paymentCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  paymentHeader: { flexDirection: 'row', alignItems: 'center' },
  quarterBox: { width: 50, height: 50, backgroundColor: '#1473FF', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  quarterText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  quarterYear: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  paymentInfo: { flex: 1 },
  paymentAmount: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  paymentDue: { fontSize: 13, color: '#666', marginTop: 2 },
  paymentStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  paidInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  paidText: { fontSize: 13, color: '#10B981' },
  payButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 10, marginTop: 12, gap: 6 },
  payButtonText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  deductionCategory: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  categoryIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1473FF20', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  categoryName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#FFF' },
  categoryTotal: { fontSize: 15, fontWeight: '600', color: '#10B981' },
  deductionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  deductionDesc: { fontSize: 13, color: '#a0a0a0', flex: 1 },
  deductionAmount: { fontSize: 13, fontWeight: '500', color: '#FFF' },
  moreText: { fontSize: 12, color: '#666', marginTop: 6 },
  addDeductionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1473FF20', paddingVertical: 14, borderRadius: 10, gap: 8 },
  addDeductionText: { fontSize: 14, fontWeight: '600', color: '#1473FF' },
});
