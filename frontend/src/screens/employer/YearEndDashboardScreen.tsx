/**
 * EMPLOYER YEAR-END DASHBOARD SCREEN
 * Comprehensive year-end tax reporting and compliance dashboard
 * W-2/1099 generation, tax filing status, and year-end checklist
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

interface YearEndStats {
  total_w2_employees: number;
  total_1099_contractors: number;
  total_wages_paid: number;
  total_federal_tax_withheld: number;
  total_state_tax_withheld: number;
  total_social_security: number;
  total_medicare: number;
  total_contractor_payments: number;
}

interface W2Status {
  employee_id: string;
  employee_name: string;
  status: 'pending' | 'generated' | 'sent' | 'filed';
  total_wages: number;
  federal_withheld: number;
}

interface Form1099Status {
  contractor_id: string;
  contractor_name: string;
  status: 'pending' | 'generated' | 'sent' | 'filed';
  total_paid: number;
  tin_on_file: boolean;
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'complete';
  due_date?: string;
  action?: string;
}

const YEAR_END_CHECKLIST: ChecklistItem[] = [
  { id: '1', title: 'Verify Employee Information', description: 'Confirm SSN, addresses, and names for all employees', status: 'pending', due_date: 'Dec 15' },
  { id: '2', title: 'Collect W-9s from Contractors', description: 'Ensure W-9 forms are on file for all 1099 contractors', status: 'pending', due_date: 'Dec 31' },
  { id: '3', title: 'Review Payroll Records', description: 'Verify all payroll transactions are accurate', status: 'pending', due_date: 'Dec 31' },
  { id: '4', title: 'Process Final Payroll', description: 'Run final payroll for the year', status: 'pending', due_date: 'Dec 31' },
  { id: '5', title: 'Generate W-2 Forms', description: 'Create W-2 forms for all employees', status: 'pending', due_date: 'Jan 15', action: 'generate_w2' },
  { id: '6', title: 'Generate 1099-NEC Forms', description: 'Create 1099-NEC forms for contractors paid $600+', status: 'pending', due_date: 'Jan 15', action: 'generate_1099' },
  { id: '7', title: 'Distribute W-2s to Employees', description: 'Send W-2 copies to employees', status: 'pending', due_date: 'Jan 31' },
  { id: '8', title: 'Distribute 1099s to Contractors', description: 'Send 1099 copies to contractors', status: 'pending', due_date: 'Jan 31' },
  { id: '9', title: 'File W-2s with SSA', description: 'Submit W-2 Copy A to Social Security Administration', status: 'pending', due_date: 'Jan 31', action: 'file_w2' },
  { id: '10', title: 'File 1099s with IRS', description: 'Submit 1099-NEC Copy A to IRS', status: 'pending', due_date: 'Jan 31', action: 'file_1099' },
  { id: '11', title: 'File Form 940 (FUTA)', description: 'Annual Federal Unemployment Tax return', status: 'pending', due_date: 'Jan 31' },
  { id: '12', title: 'File Form 941 (Q4)', description: 'Quarterly Federal Tax Return', status: 'pending', due_date: 'Jan 31' },
];

export default function YearEndDashboardScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState<YearEndStats | null>(null);
  const [w2Statuses, setW2Statuses] = useState<W2Status[]>([]);
  const [form1099Statuses, setForm1099Statuses] = useState<Form1099Status[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(YEAR_END_CHECKLIST);
  const [activeTab, setActiveTab] = useState<'overview' | 'w2' | '1099' | 'checklist'>('overview');

  const fetchYearEndData = useCallback(async () => {
    try {
      const [statsRes, w2Res, form1099Res] = await Promise.all([
        api.get(`/api/yearend/stats?year=${selectedYear}`),
        api.get(`/api/yearend/w2-status?year=${selectedYear}`),
        api.get(`/api/yearend/1099-status?year=${selectedYear}`),
      ]);
      
      setStats(statsRes.data.stats || null);
      setW2Statuses(w2Res.data.w2_statuses || []);
      setForm1099Statuses(form1099Res.data.form1099_statuses || []);
    } catch (error) {
      console.error('Failed to fetch year-end data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchYearEndData();
  }, [fetchYearEndData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchYearEndData();
  };

  const handleGenerateW2s = async () => {
    Alert.alert(
      'Generate W-2 Forms',
      `This will generate W-2 forms for all ${stats?.total_w2_employees || 0} employees for ${selectedYear}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            try {
              const response = await api.post('/api/yearend/generate-w2s', { year: selectedYear });
              if (response.data.success) {
                Alert.alert('Success', `Generated ${response.data.count} W-2 forms`);
                fetchYearEndData();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to generate W-2 forms');
            }
          },
        },
      ]
    );
  };

  const handleGenerate1099s = async () => {
    Alert.alert(
      'Generate 1099-NEC Forms',
      `This will generate 1099-NEC forms for contractors paid $600 or more in ${selectedYear}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            try {
              const response = await api.post('/api/yearend/generate-1099s', { year: selectedYear });
              if (response.data.success) {
                Alert.alert('Success', `Generated ${response.data.count} 1099-NEC forms`);
                fetchYearEndData();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to generate 1099-NEC forms');
            }
          },
        },
      ]
    );
  };

  const handleFileW2s = async () => {
    Alert.alert(
      'File W-2s with SSA',
      'This will electronically file all W-2 forms with the Social Security Administration. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'File Now',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.post('/api/yearend/file-w2s', { year: selectedYear });
              if (response.data.success) {
                Alert.alert('Success', 'W-2 forms have been filed with the SSA');
                fetchYearEndData();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to file W-2 forms');
            }
          },
        },
      ]
    );
  };

  const handleFile1099s = async () => {
    Alert.alert(
      'File 1099s with IRS',
      'This will electronically file all 1099-NEC forms with the IRS. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'File Now',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.post('/api/yearend/file-1099s', { year: selectedYear });
              if (response.data.success) {
                Alert.alert('Success', '1099-NEC forms have been filed with the IRS');
                fetchYearEndData();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to file 1099-NEC forms');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
      case 'filed': return '#10B981';
      case 'in_progress':
      case 'generated':
      case 'sent': return '#3B82F6';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getCompletedCount = () => checklist.filter(item => item.status === 'complete').length;

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#3B82F620' }]}>
            <Ionicons name="people" size={24} color="#3B82F6" />
          </View>
          <Text style={styles.statValue}>{stats?.total_w2_employees || 0}</Text>
          <Text style={styles.statLabel}>W-2 Employees</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#8B5CF620' }]}>
            <Ionicons name="briefcase" size={24} color="#8B5CF6" />
          </View>
          <Text style={styles.statValue}>{stats?.total_1099_contractors || 0}</Text>
          <Text style={styles.statLabel}>1099 Contractors</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Year-End Totals</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Wages Paid</Text>
          <Text style={styles.summaryValue}>{formatCurrency(stats?.total_wages_paid || 0)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Federal Tax Withheld</Text>
          <Text style={styles.summaryValue}>{formatCurrency(stats?.total_federal_tax_withheld || 0)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>State Tax Withheld</Text>
          <Text style={styles.summaryValue}>{formatCurrency(stats?.total_state_tax_withheld || 0)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Social Security</Text>
          <Text style={styles.summaryValue}>{formatCurrency(stats?.total_social_security || 0)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Medicare</Text>
          <Text style={styles.summaryValue}>{formatCurrency(stats?.total_medicare || 0)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryRowHighlight]}>
          <Text style={styles.summaryLabel}>Contractor Payments</Text>
          <Text style={styles.summaryValue}>{formatCurrency(stats?.total_contractor_payments || 0)}</Text>
        </View>
      </View>

      <View style={styles.actionCards}>
        <TouchableOpacity style={styles.actionCard} onPress={handleGenerateW2s}>
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8']}
            style={styles.actionCardGradient}
          >
            <Ionicons name="document-text" size={32} color="#FFF" />
            <Text style={styles.actionCardTitle}>Generate W-2s</Text>
            <Text style={styles.actionCardSubtitle}>{stats?.total_w2_employees || 0} employees</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={handleGenerate1099s}>
          <LinearGradient
            colors={['#8B5CF6', '#6D28D9']}
            style={styles.actionCardGradient}
          >
            <Ionicons name="document" size={32} color="#FFF" />
            <Text style={styles.actionCardTitle}>Generate 1099s</Text>
            <Text style={styles.actionCardSubtitle}>{stats?.total_1099_contractors || 0} contractors</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderW2Tab = () => (
    <View style={styles.tabContent}>
      <View style={styles.bulkActions}>
        <TouchableOpacity style={styles.bulkActionButton} onPress={handleGenerateW2s}>
          <Ionicons name="create" size={18} color="#3B82F6" />
          <Text style={styles.bulkActionText}>Generate All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bulkActionButton}>
          <Ionicons name="send" size={18} color="#10B981" />
          <Text style={[styles.bulkActionText, { color: '#10B981' }]}>Send All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bulkActionButton} onPress={handleFileW2s}>
          <Ionicons name="cloud-upload" size={18} color="#8B5CF6" />
          <Text style={[styles.bulkActionText, { color: '#8B5CF6' }]}>File with SSA</Text>
        </TouchableOpacity>
      </View>

      {w2Statuses.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color="#666" />
          <Text style={styles.emptyStateText}>No W-2 data available</Text>
          <Text style={styles.emptyStateSubtext}>Generate W-2 forms after closing payroll</Text>
        </View>
      ) : (
        w2Statuses.map((w2) => (
          <View key={w2.employee_id} style={styles.formCard}>
            <View style={styles.formCardHeader}>
              <View>
                <Text style={styles.formCardName}>{w2.employee_name}</Text>
                <Text style={styles.formCardSubtext}>Total Wages: {formatCurrency(w2.total_wages)}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(w2.status) + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: getStatusColor(w2.status) }]}>
                  {w2.status.charAt(0).toUpperCase() + w2.status.slice(1)}
                </Text>
              </View>
            </View>
            <View style={styles.formCardActions}>
              <TouchableOpacity style={styles.formAction}>
                <Ionicons name="eye" size={16} color="#1473FF" />
                <Text style={styles.formActionText}>Preview</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.formAction}>
                <Ionicons name="download" size={16} color="#1473FF" />
                <Text style={styles.formActionText}>Download</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.formAction}>
                <Ionicons name="send" size={16} color="#1473FF" />
                <Text style={styles.formActionText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const render1099Tab = () => (
    <View style={styles.tabContent}>
      <View style={styles.bulkActions}>
        <TouchableOpacity style={styles.bulkActionButton} onPress={handleGenerate1099s}>
          <Ionicons name="create" size={18} color="#3B82F6" />
          <Text style={styles.bulkActionText}>Generate All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bulkActionButton}>
          <Ionicons name="send" size={18} color="#10B981" />
          <Text style={[styles.bulkActionText, { color: '#10B981' }]}>Send All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bulkActionButton} onPress={handleFile1099s}>
          <Ionicons name="cloud-upload" size={18} color="#8B5CF6" />
          <Text style={[styles.bulkActionText, { color: '#8B5CF6' }]}>File with IRS</Text>
        </TouchableOpacity>
      </View>

      {form1099Statuses.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={64} color="#666" />
          <Text style={styles.emptyStateText}>No 1099-NEC data available</Text>
          <Text style={styles.emptyStateSubtext}>Contractors paid $600+ will appear here</Text>
        </View>
      ) : (
        form1099Statuses.map((form) => (
          <View key={form.contractor_id} style={styles.formCard}>
            <View style={styles.formCardHeader}>
              <View>
                <Text style={styles.formCardName}>{form.contractor_name}</Text>
                <Text style={styles.formCardSubtext}>Total Paid: {formatCurrency(form.total_paid)}</Text>
              </View>
              <View style={styles.formCardBadges}>
                {!form.tin_on_file && (
                  <View style={[styles.statusBadge, { backgroundColor: '#EF444420', marginRight: 8 }]}>
                    <Text style={[styles.statusBadgeText, { color: '#EF4444' }]}>Missing W-9</Text>
                  </View>
                )}
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(form.status) + '20' }]}>
                  <Text style={[styles.statusBadgeText, { color: getStatusColor(form.status) }]}>
                    {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.formCardActions}>
              <TouchableOpacity style={styles.formAction}>
                <Ionicons name="eye" size={16} color="#1473FF" />
                <Text style={styles.formActionText}>Preview</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.formAction}>
                <Ionicons name="download" size={16} color="#1473FF" />
                <Text style={styles.formActionText}>Download</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.formAction}>
                <Ionicons name="send" size={16} color="#1473FF" />
                <Text style={styles.formActionText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderChecklistTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.checklistProgress}>
        <View style={styles.checklistProgressBar}>
          <View 
            style={[
              styles.checklistProgressFill, 
              { width: `${(getCompletedCount() / checklist.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.checklistProgressText}>
          {getCompletedCount()} of {checklist.length} tasks complete
        </Text>
      </View>

      {checklist.map((item) => (
        <TouchableOpacity 
          key={item.id} 
          style={styles.checklistItem}
          onPress={() => {
            if (item.action === 'generate_w2') handleGenerateW2s();
            else if (item.action === 'generate_1099') handleGenerate1099s();
            else if (item.action === 'file_w2') handleFileW2s();
            else if (item.action === 'file_1099') handleFile1099s();
          }}
        >
          <View style={[styles.checklistIcon, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Ionicons 
              name={item.status === 'complete' ? 'checkmark-circle' : item.status === 'in_progress' ? 'time' : 'ellipse-outline'} 
              size={24} 
              color={getStatusColor(item.status)} 
            />
          </View>
          <View style={styles.checklistContent}>
            <Text style={[styles.checklistTitle, item.status === 'complete' && styles.checklistTitleComplete]}>
              {item.title}
            </Text>
            <Text style={styles.checklistDescription}>{item.description}</Text>
            {item.due_date && (
              <Text style={styles.checklistDueDate}>Due: {item.due_date}</Text>
            )}
          </View>
          {item.action && (
            <Ionicons name="chevron-forward" size={20} color="#666" />
          )}
        </TouchableOpacity>
      ))}
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
            <Text style={styles.headerTitle}>Year-End</Text>
            <TouchableOpacity style={styles.yearSelector}>
              <Text style={styles.yearText}>{selectedYear}</Text>
              <Ionicons name="chevron-down" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity>
            <Ionicons name="help-circle-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Year-End Checklist</Text>
            <Text style={styles.progressPercent}>
              {Math.round((getCompletedCount() / checklist.length) * 100)}%
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${(getCompletedCount() / checklist.length) * 100}%` }]} />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabs}>
        {(['overview', 'w2', '1099', 'checklist'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'w2' ? 'W-2' : tab === '1099' ? '1099' : tab.charAt(0).toUpperCase() + tab.slice(1)}
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
        {activeTab === 'w2' && renderW2Tab()}
        {activeTab === '1099' && render1099Tab()}
        {activeTab === 'checklist' && renderChecklistTab()}
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
  progressCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  tab: {
    paddingHorizontal: 16,
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
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  summaryRowHighlight: {
    backgroundColor: '#8B5CF610',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderBottomWidth: 0,
    marginTop: 8,
    marginBottom: -16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  actionCards: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionCardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 12,
  },
  actionCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  bulkActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  bulkActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  bulkActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3B82F6',
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
  },
  formCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  formCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  formCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  formCardSubtext: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 4,
  },
  formCardBadges: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  formCardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    paddingTop: 12,
    gap: 16,
  },
  formAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  formActionText: {
    fontSize: 13,
    color: '#1473FF',
    fontWeight: '500',
  },
  checklistProgress: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  checklistProgressBar: {
    height: 8,
    backgroundColor: '#2a2a4e',
    borderRadius: 4,
    marginBottom: 8,
  },
  checklistProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  checklistProgressText: {
    fontSize: 13,
    color: '#a0a0a0',
    textAlign: 'center',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  checklistIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checklistContent: {
    flex: 1,
  },
  checklistTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFF',
  },
  checklistTitleComplete: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  checklistDescription: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
  },
  checklistDueDate: {
    fontSize: 11,
    color: '#F59E0B',
    marginTop: 4,
  },
});
