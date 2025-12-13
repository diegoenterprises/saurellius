/**
 * CONTRACTOR 1099 PREVIEW SCREEN
 * View and download 1099-NEC forms
 * Track tax document status and IRS filing
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

interface Form1099 {
  id: string;
  tax_year: number;
  payer_name: string;
  payer_tin: string;
  payer_address: string;
  nonemployee_compensation: number;
  federal_tax_withheld: number;
  state_tax_withheld: number;
  state: string;
  status: 'pending' | 'generated' | 'sent' | 'filed';
  generated_at?: string;
  sent_at?: string;
  filed_at?: string;
  pdf_url?: string;
}

interface TaxSummary {
  total_earnings: number;
  total_expenses: number;
  net_profit: number;
  estimated_tax_liability: number;
  quarterly_payments_made: number;
  amount_owed: number;
}

const QUARTERLY_DUE_DATES = [
  { quarter: 'Q1', period: 'Jan 1 - Mar 31', due: 'April 15' },
  { quarter: 'Q2', period: 'Apr 1 - May 31', due: 'June 15' },
  { quarter: 'Q3', period: 'Jun 1 - Aug 31', due: 'September 15' },
  { quarter: 'Q4', period: 'Sep 1 - Dec 31', due: 'January 15' },
];

export default function Contractor1099Screen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [forms1099, setForms1099] = useState<Form1099[]>([]);
  const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'forms' | 'summary' | 'quarterly'>('forms');

  const fetch1099Data = useCallback(async () => {
    try {
      const [formsRes, summaryRes] = await Promise.all([
        api.get(`/api/contractor/1099?year=${selectedYear}`),
        api.get(`/api/contractor/tax-summary?year=${selectedYear}`),
      ]);
      
      setForms1099(formsRes.data.forms || []);
      setTaxSummary(summaryRes.data.summary || null);
    } catch (error) {
      console.error('Failed to fetch 1099 data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetch1099Data();
  }, [fetch1099Data]);

  const onRefresh = () => {
    setRefreshing(true);
    fetch1099Data();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filed': return '#10B981';
      case 'sent': return '#3B82F6';
      case 'generated': return '#8B5CF6';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'filed': return 'checkmark-circle';
      case 'sent': return 'send';
      case 'generated': return 'document';
      case 'pending': return 'time';
      default: return 'ellipse';
    }
  };

  const handleDownload1099 = async (form: Form1099) => {
    if (!form.pdf_url) {
      Alert.alert('Not Available', 'This 1099 form is not yet available for download.');
      return;
    }

    try {
      await Share.share({
        url: form.pdf_url,
        title: `1099-NEC ${form.tax_year}`,
      });
    } catch (error) {
      console.error('Failed to download 1099:', error);
    }
  };

  const handleRequest1099 = async (payerName: string) => {
    Alert.alert(
      'Request 1099',
      `Would you like to request a 1099-NEC from ${payerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: async () => {
            try {
              await api.post('/api/contractor/request-1099', { payer_name: payerName });
              Alert.alert('Success', 'Your 1099 request has been sent.');
            } catch (error) {
              Alert.alert('Error', 'Failed to send request.');
            }
          },
        },
      ]
    );
  };

  const renderFormsTab = () => (
    <View style={styles.tabContent}>
      {forms1099.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color="#666" />
          <Text style={styles.emptyStateTitle}>No 1099 Forms Yet</Text>
          <Text style={styles.emptyStateText}>
            1099-NEC forms will appear here once your clients generate them (typically by January 31)
          </Text>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <Text style={styles.infoCardText}>
              You should receive a 1099-NEC from any client who paid you $600 or more during the tax year.
            </Text>
          </View>
        </View>
      ) : (
        forms1099.map((form) => (
          <View key={form.id} style={styles.form1099Card}>
            <View style={styles.formHeader}>
              <View style={styles.formYearBadge}>
                <Text style={styles.formYearText}>{form.tax_year}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(form.status) + '20' }]}>
                <Ionicons name={getStatusIcon(form.status) as any} size={14} color={getStatusColor(form.status)} />
                <Text style={[styles.statusText, { color: getStatusColor(form.status) }]}>
                  {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                </Text>
              </View>
            </View>

            <Text style={styles.payerName}>{form.payer_name}</Text>
            <Text style={styles.payerAddress}>{form.payer_address}</Text>

            <View style={styles.formAmounts}>
              <View style={styles.formAmountRow}>
                <Text style={styles.formAmountLabel}>Box 1: Nonemployee Compensation</Text>
                <Text style={styles.formAmountValue}>{formatCurrency(form.nonemployee_compensation)}</Text>
              </View>
              {form.federal_tax_withheld > 0 && (
                <View style={styles.formAmountRow}>
                  <Text style={styles.formAmountLabel}>Box 4: Federal Tax Withheld</Text>
                  <Text style={styles.formAmountValue}>{formatCurrency(form.federal_tax_withheld)}</Text>
                </View>
              )}
              {form.state_tax_withheld > 0 && (
                <View style={styles.formAmountRow}>
                  <Text style={styles.formAmountLabel}>State Tax Withheld ({form.state})</Text>
                  <Text style={styles.formAmountValue}>{formatCurrency(form.state_tax_withheld)}</Text>
                </View>
              )}
            </View>

            <View style={styles.formActions}>
              {form.status !== 'pending' && (
                <TouchableOpacity 
                  style={styles.formActionButton}
                  onPress={() => handleDownload1099(form)}
                >
                  <Ionicons name="download" size={18} color="#1473FF" />
                  <Text style={styles.formActionText}>Download PDF</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.formActionButton}>
                <Ionicons name="eye" size={18} color="#1473FF" />
                <Text style={styles.formActionText}>Preview</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity 
        style={styles.requestButton}
        onPress={() => handleRequest1099('Client')}
      >
        <Ionicons name="mail" size={20} color="#8B5CF6" />
        <Text style={styles.requestButtonText}>Request Missing 1099</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSummaryTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{selectedYear} Tax Summary</Text>
        
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total 1099 Income</Text>
            <Text style={styles.summaryValue}>{formatCurrency(taxSummary?.total_earnings || 0)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Business Expenses</Text>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
              -{formatCurrency(taxSummary?.total_expenses || 0)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowHighlight]}>
            <Text style={styles.summaryLabelBold}>Net Profit (Schedule C)</Text>
            <Text style={styles.summaryValueBold}>{formatCurrency(taxSummary?.net_profit || 0)}</Text>
          </View>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summarySectionTitle}>Estimated Tax</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Self-Employment Tax (15.3%)</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency((taxSummary?.net_profit || 0) * 0.153)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated Income Tax</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency((taxSummary?.estimated_tax_liability || 0) - (taxSummary?.net_profit || 0) * 0.153)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowHighlight]}>
            <Text style={styles.summaryLabelBold}>Total Tax Liability</Text>
            <Text style={styles.summaryValueBold}>
              {formatCurrency(taxSummary?.estimated_tax_liability || 0)}
            </Text>
          </View>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Quarterly Payments Made</Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>
              -{formatCurrency(taxSummary?.quarterly_payments_made || 0)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowFinal]}>
            <Text style={styles.summaryLabelBold}>
              {(taxSummary?.amount_owed || 0) >= 0 ? 'Amount Owed' : 'Refund Expected'}
            </Text>
            <Text style={[
              styles.summaryValueBold, 
              { color: (taxSummary?.amount_owed || 0) >= 0 ? '#EF4444' : '#10B981' }
            ]}>
              {formatCurrency(Math.abs(taxSummary?.amount_owed || 0))}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.disclaimerCard}>
        <Ionicons name="alert-circle" size={20} color="#F59E0B" />
        <Text style={styles.disclaimerText}>
          This is an estimate only. Please consult a tax professional for accurate tax advice.
        </Text>
      </View>
    </View>
  );

  const renderQuarterlyTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.quarterlyHeader}>
        <Text style={styles.quarterlyTitle}>Estimated Tax Payments</Text>
        <Text style={styles.quarterlySubtitle}>
          Self-employed individuals typically need to make quarterly estimated tax payments
        </Text>
      </View>

      {QUARTERLY_DUE_DATES.map((quarter, index) => {
        const isPast = new Date() > new Date(`${quarter.due}, ${selectedYear}`);
        const isCurrent = !isPast && index === QUARTERLY_DUE_DATES.findIndex(q => 
          new Date() <= new Date(`${q.due}, ${selectedYear}`)
        );

        return (
          <View 
            key={quarter.quarter} 
            style={[styles.quarterCard, isCurrent && styles.quarterCardCurrent]}
          >
            <View style={styles.quarterHeader}>
              <View style={[styles.quarterBadge, isPast && styles.quarterBadgePast]}>
                <Text style={[styles.quarterBadgeText, isPast && styles.quarterBadgeTextPast]}>
                  {quarter.quarter}
                </Text>
              </View>
              <View style={styles.quarterInfo}>
                <Text style={styles.quarterPeriod}>{quarter.period}</Text>
                <Text style={[styles.quarterDue, isCurrent && styles.quarterDueCurrent]}>
                  Due: {quarter.due}
                </Text>
              </View>
              {isPast ? (
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              ) : isCurrent ? (
                <TouchableOpacity style={styles.payButton}>
                  <Text style={styles.payButtonText}>Pay Now</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.quarterUpcoming}>Upcoming</Text>
              )}
            </View>

            {isCurrent && (
              <View style={styles.quarterAmount}>
                <Text style={styles.quarterAmountLabel}>Suggested Payment</Text>
                <Text style={styles.quarterAmountValue}>
                  {formatCurrency((taxSummary?.estimated_tax_liability || 0) / 4)}
                </Text>
              </View>
            )}
          </View>
        );
      })}

      <View style={styles.irsInfo}>
        <Ionicons name="information-circle" size={24} color="#3B82F6" />
        <View style={styles.irsInfoContent}>
          <Text style={styles.irsInfoTitle}>IRS Direct Pay</Text>
          <Text style={styles.irsInfoText}>
            Make federal estimated tax payments directly to the IRS at irs.gov/payments
          </Text>
        </View>
        <Ionicons name="open-outline" size={20} color="#3B82F6" />
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
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Tax Documents</Text>
            <TouchableOpacity style={styles.yearSelector}>
              <Text style={styles.yearText}>{selectedYear}</Text>
              <Ionicons name="chevron-down" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.total1099Card}>
          <Text style={styles.total1099Label}>Total 1099 Income</Text>
          <Text style={styles.total1099Value}>
            {formatCurrency(forms1099.reduce((sum, f) => sum + f.nonemployee_compensation, 0))}
          </Text>
          <Text style={styles.total1099Count}>
            {forms1099.length} form{forms1099.length !== 1 ? 's' : ''} received
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.tabs}>
        {(['forms', 'summary', 'quarterly'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'forms' ? '1099 Forms' : tab.charAt(0).toUpperCase() + tab.slice(1)}
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
        {activeTab === 'forms' && renderFormsTab()}
        {activeTab === 'summary' && renderSummaryTab()}
        {activeTab === 'quarterly' && renderQuarterlyTab()}
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  yearText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginRight: 4,
  },
  total1099Card: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  total1099Label: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  total1099Value: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  total1099Count: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#1473FF',
  },
  tabText: {
    fontSize: 13,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#3B82F620',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoCardText: {
    flex: 1,
    fontSize: 14,
    color: '#3B82F6',
    lineHeight: 20,
  },
  form1099Card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  formYearBadge: {
    backgroundColor: '#8B5CF620',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  formYearText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  payerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  payerAddress: {
    fontSize: 13,
    color: '#a0a0a0',
    marginBottom: 16,
  },
  formAmounts: {
    backgroundColor: '#0f0f23',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  formAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  formAmountLabel: {
    fontSize: 13,
    color: '#a0a0a0',
  },
  formAmountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  formActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    paddingTop: 14,
    gap: 20,
  },
  formActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  formActionText: {
    fontSize: 14,
    color: '#1473FF',
    fontWeight: '500',
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF620',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    gap: 8,
  },
  requestButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  summaryCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  summarySection: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    paddingTop: 16,
    marginTop: 16,
  },
  summarySectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a0a0a0',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryRowHighlight: {
    backgroundColor: '#0f0f23',
    marginHorizontal: -18,
    paddingHorizontal: 18,
    marginTop: 12,
    paddingVertical: 14,
  },
  summaryRowFinal: {
    backgroundColor: '#1473FF20',
    marginHorizontal: -18,
    paddingHorizontal: 18,
    marginBottom: -18,
    paddingVertical: 16,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  summaryLabelBold: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
  },
  summaryValueBold: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B20',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    color: '#F59E0B',
    lineHeight: 18,
  },
  quarterlyHeader: {
    marginBottom: 20,
  },
  quarterlyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 6,
  },
  quarterlySubtitle: {
    fontSize: 14,
    color: '#a0a0a0',
    lineHeight: 20,
  },
  quarterCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  quarterCardCurrent: {
    borderColor: '#1473FF',
    backgroundColor: '#1473FF10',
  },
  quarterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quarterBadge: {
    backgroundColor: '#1473FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 14,
  },
  quarterBadgePast: {
    backgroundColor: '#10B98120',
  },
  quarterBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  quarterBadgeTextPast: {
    color: '#10B981',
  },
  quarterInfo: {
    flex: 1,
  },
  quarterPeriod: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
  },
  quarterDue: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 2,
  },
  quarterDueCurrent: {
    color: '#F59E0B',
    fontWeight: '500',
  },
  quarterUpcoming: {
    fontSize: 12,
    color: '#666',
  },
  payButton: {
    backgroundColor: '#1473FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  payButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  quarterAmount: {
    backgroundColor: '#0f0f23',
    borderRadius: 10,
    padding: 14,
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quarterAmountLabel: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  quarterAmountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  irsInfo: {
    flexDirection: 'row',
    backgroundColor: '#3B82F620',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    alignItems: 'center',
    gap: 12,
  },
  irsInfoContent: {
    flex: 1,
  },
  irsInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  irsInfoText: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 2,
  },
});
