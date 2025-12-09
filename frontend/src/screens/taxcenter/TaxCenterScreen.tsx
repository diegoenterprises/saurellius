/**
 * TAX CENTER SCREEN
 * W-2/W-3, Form 940/941, Tax Deposits, Filing Calendar
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'overview' | 'filings' | 'deposits' | 'w2';

interface TaxFiling {
  id: string;
  formType: string;
  period: string;
  dueDate: string;
  status: string;
  amount: number;
}

interface TaxDeposit {
  id: string;
  type: string;
  amount: number;
  depositDate: string;
  status: string;
  period: string;
}

const MOCK_FILINGS: TaxFiling[] = [
  { id: '1', formType: '941', period: 'Q4 2024', dueDate: '2025-01-31', status: 'pending', amount: 45000 },
  { id: '2', formType: '941', period: 'Q3 2024', dueDate: '2024-10-31', status: 'filed', amount: 42500 },
  { id: '3', formType: '940', period: '2024', dueDate: '2025-01-31', status: 'pending', amount: 4200 },
  { id: '4', formType: '941', period: 'Q2 2024', dueDate: '2024-07-31', status: 'filed', amount: 41000 },
];

const MOCK_DEPOSITS: TaxDeposit[] = [
  { id: '1', type: 'Federal 941', amount: 15000, depositDate: '2024-12-15', status: 'completed', period: 'Dec 1-15' },
  { id: '2', type: 'Federal 941', amount: 14500, depositDate: '2024-12-01', status: 'completed', period: 'Nov 16-30' },
  { id: '3', type: 'State', amount: 3200, depositDate: '2024-12-15', status: 'completed', period: 'Nov 2024' },
  { id: '4', type: 'FUTA', amount: 420, depositDate: '2024-12-15', status: 'completed', period: 'Q4 2024' },
];

export default function TaxCenterScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showDepositModal, setShowDepositModal] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      filed: '#10B981',
      pending: '#F59E0B',
      overdue: '#EF4444',
      completed: '#10B981',
      scheduled: '#3B82F6',
    };
    return colors[status] || '#6B7280';
  };

  const upcomingDeadlines = [
    { form: 'W-2/W-3', date: 'Jan 31, 2025', description: 'Employee W-2s and W-3 transmittal' },
    { form: '941 Q4', date: 'Jan 31, 2025', description: 'Quarterly federal tax return' },
    { form: '940', date: 'Jan 31, 2025', description: 'Annual FUTA tax return' },
    { form: '1099-NEC', date: 'Jan 31, 2025', description: 'Contractor 1099 forms' },
  ];

  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Tax Liability Summary */}
      <View style={styles.liabilityCard}>
        <LinearGradient
          colors={['#1473FF', '#BE01FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.liabilityGradient}
        >
          <Text style={styles.liabilityLabel}>Current Tax Liability</Text>
          <Text style={styles.liabilityAmount}>$49,200</Text>
          <Text style={styles.liabilityPeriod}>Q4 2024</Text>
          
          <View style={styles.liabilityBreakdown}>
            <View style={styles.liabilityItem}>
              <Text style={styles.liabilityItemLabel}>Federal</Text>
              <Text style={styles.liabilityItemValue}>$45,000</Text>
            </View>
            <View style={styles.liabilityItem}>
              <Text style={styles.liabilityItemLabel}>FUTA</Text>
              <Text style={styles.liabilityItemValue}>$4,200</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Deposit Schedule */}
      <View style={styles.scheduleCard}>
        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleTitle}>Your Deposit Schedule</Text>
          <View style={styles.scheduleBadge}>
            <Text style={styles.scheduleBadgeText}>Monthly</Text>
          </View>
        </View>
        <Text style={styles.scheduleDescription}>
          Based on your lookback period liability, you are a monthly depositor. Deposits are due by the 15th of the following month.
        </Text>
        <View style={styles.nextDepositRow}>
          <View>
            <Text style={styles.nextDepositLabel}>Next Deposit Due</Text>
            <Text style={styles.nextDepositDate}>January 15, 2025</Text>
          </View>
          <TouchableOpacity style={styles.depositButton} onPress={() => setShowDepositModal(true)}>
            <Text style={styles.depositButtonText}>Make Deposit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upcoming Deadlines */}
      <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
      <View style={styles.deadlinesList}>
        {upcomingDeadlines.map((deadline, index) => (
          <View key={index} style={styles.deadlineCard}>
            <View style={styles.deadlineLeft}>
              <View style={styles.deadlineIcon}>
                <Ionicons name="calendar" size={20} color="#1473FF" />
              </View>
              <View>
                <Text style={styles.deadlineForm}>{deadline.form}</Text>
                <Text style={styles.deadlineDesc}>{deadline.description}</Text>
              </View>
            </View>
            <View style={styles.deadlineRight}>
              <Text style={styles.deadlineDate}>{deadline.date}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        {[
          { icon: 'document-text', label: 'Generate W-2s', color: '#10B981' },
          { icon: 'calculator', label: 'Tax Calculator', color: '#3B82F6' },
          { icon: 'download', label: 'Download Forms', color: '#8B5CF6' },
          { icon: 'help-circle', label: 'Tax Help', color: '#F59E0B' },
        ].map((action, index) => (
          <TouchableOpacity key={index} style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
              <Ionicons name={action.icon as any} size={24} color={action.color} />
            </View>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFilings = () => (
    <View style={styles.tabContent}>
      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterButton, styles.filterButtonActive]}>
          <Text style={styles.filterButtonTextActive}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>941</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>940</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>State</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filingsList}>
        {MOCK_FILINGS.map((filing) => (
          <TouchableOpacity key={filing.id} style={styles.filingCard}>
            <View style={styles.filingHeader}>
              <View style={styles.filingBadge}>
                <Text style={styles.filingBadgeText}>Form {filing.formType}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(filing.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(filing.status) }]}>
                  {filing.status}
                </Text>
              </View>
            </View>
            <Text style={styles.filingPeriod}>{filing.period}</Text>
            <View style={styles.filingFooter}>
              <View>
                <Text style={styles.filingDueLabel}>Due Date</Text>
                <Text style={styles.filingDueDate}>{filing.dueDate}</Text>
              </View>
              <View style={styles.filingAmountContainer}>
                <Text style={styles.filingAmountLabel}>Amount</Text>
                <Text style={styles.filingAmount}>{formatCurrency(filing.amount)}</Text>
              </View>
            </View>
            {filing.status === 'pending' && (
              <TouchableOpacity style={styles.fileButton}>
                <Text style={styles.fileButtonText}>File Now</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDeposits = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity style={styles.addButton} onPress={() => setShowDepositModal(true)}>
        <LinearGradient
          colors={['#1473FF', '#BE01FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.addButtonGradient}
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addButtonText}>Record Deposit</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.depositsList}>
        {MOCK_DEPOSITS.map((deposit) => (
          <View key={deposit.id} style={styles.depositCard}>
            <View style={styles.depositHeader}>
              <Text style={styles.depositType}>{deposit.type}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(deposit.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(deposit.status) }]}>
                  {deposit.status}
                </Text>
              </View>
            </View>
            <Text style={styles.depositPeriod}>Period: {deposit.period}</Text>
            <View style={styles.depositFooter}>
              <Text style={styles.depositDate}>{deposit.depositDate}</Text>
              <Text style={styles.depositAmount}>{formatCurrency(deposit.amount)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderW2 = () => (
    <View style={styles.tabContent}>
      <View style={styles.w2Header}>
        <View>
          <Text style={styles.w2Title}>2024 W-2 Forms</Text>
          <Text style={styles.w2Subtitle}>Generate and distribute employee W-2s</Text>
        </View>
      </View>

      <View style={styles.w2Stats}>
        <View style={styles.w2StatCard}>
          <Text style={styles.w2StatValue}>24</Text>
          <Text style={styles.w2StatLabel}>Total Employees</Text>
        </View>
        <View style={styles.w2StatCard}>
          <Text style={styles.w2StatValue}>0</Text>
          <Text style={styles.w2StatLabel}>W-2s Generated</Text>
        </View>
        <View style={styles.w2StatCard}>
          <Text style={styles.w2StatValue}>24</Text>
          <Text style={styles.w2StatLabel}>Remaining</Text>
        </View>
      </View>

      <View style={styles.w2Actions}>
        <TouchableOpacity style={styles.w2ActionButton}>
          <LinearGradient
            colors={['#1473FF', '#BE01FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.w2ActionGradient}
          >
            <Ionicons name="document-text" size={24} color="#FFF" />
            <Text style={styles.w2ActionText}>Generate All W-2s</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={styles.w2SecondaryActions}>
          <TouchableOpacity style={styles.w2SecondaryButton}>
            <Ionicons name="download-outline" size={20} color="#1473FF" />
            <Text style={styles.w2SecondaryText}>Download W-3</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.w2SecondaryButton}>
            <Ionicons name="cloud-upload-outline" size={20} color="#1473FF" />
            <Text style={styles.w2SecondaryText}>E-File to SSA</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.w2Checklist}>
        <Text style={styles.checklistTitle}>Pre-Filing Checklist</Text>
        {[
          { label: 'Verify employee SSNs', checked: true },
          { label: 'Confirm addresses are current', checked: true },
          { label: 'Review YTD earnings', checked: false },
          { label: 'Verify tax withholdings', checked: false },
          { label: 'Check benefit deductions', checked: false },
        ].map((item, index) => (
          <View key={index} style={styles.checklistItem}>
            <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
              {item.checked && <Ionicons name="checkmark" size={14} color="#FFF" />}
            </View>
            <Text style={[styles.checklistLabel, item.checked && styles.checklistLabelChecked]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1473FF', '#BE01FF']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tax Center</Text>
          <TouchableOpacity>
            <Ionicons name="help-circle-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          {[
            { key: 'overview', label: 'Overview', icon: 'grid' },
            { key: 'filings', label: 'Filings', icon: 'document' },
            { key: 'deposits', label: 'Deposits', icon: 'cash' },
            { key: 'w2', label: 'W-2', icon: 'people' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key as TabType)}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? '#FFF' : 'rgba(255,255,255,0.6)'}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'filings' && renderFilings()}
        {activeTab === 'deposits' && renderDeposits()}
        {activeTab === 'w2' && renderW2()}
      </ScrollView>

      {/* Deposit Modal */}
      <Modal visible={showDepositModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Tax Deposit</Text>
              <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.depositTypeSelector}>
              {['Federal 941', 'FUTA', 'State'].map((type) => (
                <TouchableOpacity key={type} style={styles.depositTypeOption}>
                  <Text style={styles.depositTypeText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.depositInfo}>
              <Text style={styles.depositInfoLabel}>Suggested Amount</Text>
              <Text style={styles.depositInfoValue}>$15,000.00</Text>
              <Text style={styles.depositInfoDesc}>Based on Dec 1-15 payroll</Text>
            </View>

            <TouchableOpacity style={styles.modalButton}>
              <LinearGradient
                colors={['#1473FF', '#BE01FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalButtonText}>Record Deposit</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 4,
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
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
  liabilityCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  liabilityGradient: {
    padding: 20,
  },
  liabilityLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  liabilityAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    marginVertical: 4,
  },
  liabilityPeriod: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  liabilityBreakdown: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 16,
    gap: 24,
  },
  liabilityItem: {},
  liabilityItemLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  liabilityItemValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  scheduleCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  scheduleBadge: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scheduleBadgeText: {
    fontSize: 12,
    color: '#1473FF',
    fontWeight: '500',
  },
  scheduleDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  nextDepositRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  nextDepositLabel: {
    fontSize: 12,
    color: '#666',
  },
  nextDepositDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  depositButton: {
    backgroundColor: '#1473FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  depositButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  deadlinesList: {
    gap: 12,
    marginBottom: 24,
  },
  deadlineCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  deadlineIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deadlineForm: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  deadlineDesc: {
    fontSize: 12,
    color: '#666',
  },
  deadlineRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deadlineDate: {
    fontSize: 14,
    color: '#666',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    width: '47%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  filterButtonActive: {
    backgroundColor: '#1473FF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  filingsList: {
    gap: 12,
  },
  filingCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  filingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filingBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  filingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  filingPeriod: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filingDueLabel: {
    fontSize: 12,
    color: '#666',
  },
  filingDueDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  filingAmountContainer: {
    alignItems: 'flex-end',
  },
  filingAmountLabel: {
    fontSize: 12,
    color: '#666',
  },
  filingAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1473FF',
  },
  fileButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
  },
  fileButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1473FF',
  },
  addButton: {
    marginBottom: 16,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  depositsList: {
    gap: 12,
  },
  depositCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  depositHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  depositType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  depositPeriod: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  depositFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  depositDate: {
    fontSize: 14,
    color: '#666',
  },
  depositAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  w2Header: {
    marginBottom: 16,
  },
  w2Title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  w2Subtitle: {
    fontSize: 14,
    color: '#666',
  },
  w2Stats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  w2StatCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  w2StatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  w2StatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  w2Actions: {
    marginBottom: 24,
  },
  w2ActionButton: {
    marginBottom: 12,
  },
  w2ActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  w2ActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  w2SecondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  w2SecondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFF',
    gap: 6,
  },
  w2SecondaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1473FF',
  },
  w2Checklist: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checklistLabel: {
    fontSize: 14,
    color: '#333',
  },
  checklistLabelChecked: {
    color: '#666',
    textDecorationLine: 'line-through',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  depositTypeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  depositTypeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  depositTypeText: {
    fontSize: 14,
    color: '#666',
  },
  depositInfo: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  depositInfoLabel: {
    fontSize: 12,
    color: '#666',
  },
  depositInfoValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
    marginVertical: 4,
  },
  depositInfoDesc: {
    fontSize: 13,
    color: '#666',
  },
  modalButton: {
    marginTop: 8,
  },
  modalButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
