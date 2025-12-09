/**
 * ACCOUNTING SCREEN
 * General Ledger, Chart of Accounts, Journal Entries, Financial Reports
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'chart' | 'journal' | 'reports';

interface Account {
  code: string;
  name: string;
  type: string;
  balance: number;
}

interface JournalEntry {
  id: string;
  date: string;
  description: string;
  total: number;
  source: string;
}

const MOCK_ACCOUNTS: Account[] = [
  { code: '1010', name: 'Payroll Checking', type: 'asset', balance: 125000.00 },
  { code: '2100', name: 'Wages Payable', type: 'liability', balance: 45000.00 },
  { code: '2200', name: 'Federal Tax Payable', type: 'liability', balance: 12500.00 },
  { code: '2230', name: 'Social Security Payable', type: 'liability', balance: 8250.00 },
  { code: '2240', name: 'Medicare Payable', type: 'liability', balance: 1930.00 },
  { code: '2330', name: '401(k) Payable', type: 'liability', balance: 6750.00 },
  { code: '5000', name: 'Wages Expense', type: 'expense', balance: 450000.00 },
  { code: '5100', name: 'Employer FICA', type: 'expense', balance: 34425.00 },
  { code: '5200', name: 'Health Insurance Expense', type: 'expense', balance: 28000.00 },
];

const MOCK_ENTRIES: JournalEntry[] = [
  { id: '1', date: '2024-12-15', description: 'Payroll - Dec 1-15', total: 125000.00, source: 'payroll' },
  { id: '2', date: '2024-12-01', description: 'Payroll - Nov 16-30', total: 118500.00, source: 'payroll' },
  { id: '3', date: '2024-11-15', description: 'Payroll - Nov 1-15', total: 122000.00, source: 'payroll' },
  { id: '4', date: '2024-11-01', description: 'Tax Deposit - Q3', total: 45000.00, source: 'manual' },
];

export default function AccountingScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabType>('chart');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [accountFilter, setAccountFilter] = useState<string>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getAccountTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      asset: '#10B981',
      liability: '#F59E0B',
      equity: '#8B5CF6',
      revenue: '#3B82F6',
      expense: '#EF4444',
    };
    return colors[type] || '#6B7280';
  };

  const filteredAccounts = MOCK_ACCOUNTS.filter((account) => {
    const matchesSearch = account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         account.code.includes(searchQuery);
    const matchesFilter = accountFilter === 'all' || account.type === accountFilter;
    return matchesSearch && matchesFilter;
  });

  const renderChartOfAccounts = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search accounts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['all', 'asset', 'liability', 'expense'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, accountFilter === filter && styles.filterChipActive]}
            onPress={() => setAccountFilter(filter)}
          >
            <Text style={[styles.filterChipText, accountFilter === filter && styles.filterChipTextActive]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.accountsList}>
        {filteredAccounts.map((account) => (
          <TouchableOpacity
            key={account.code}
            style={styles.accountCard}
            onPress={() => setSelectedAccount(account)}
          >
            <View style={styles.accountHeader}>
              <View style={[styles.accountTypeBadge, { backgroundColor: getAccountTypeColor(account.type) + '20' }]}>
                <Text style={[styles.accountTypeText, { color: getAccountTypeColor(account.type) }]}>
                  {account.code}
                </Text>
              </View>
              <Text style={styles.accountBalance}>{formatCurrency(account.balance)}</Text>
            </View>
            <Text style={styles.accountName}>{account.name}</Text>
            <Text style={styles.accountType}>{account.type.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderJournalEntries = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity style={styles.addButton} onPress={() => setShowEntryModal(true)}>
        <LinearGradient
          colors={['#1473FF', '#BE01FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.addButtonGradient}
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addButtonText}>New Journal Entry</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.entriesList}>
        {MOCK_ENTRIES.map((entry) => (
          <TouchableOpacity key={entry.id} style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryDate}>{entry.date}</Text>
              <View style={[styles.sourceBadge, entry.source === 'payroll' && styles.sourceBadgePayroll]}>
                <Text style={styles.sourceBadgeText}>{entry.source}</Text>
              </View>
            </View>
            <Text style={styles.entryDescription}>{entry.description}</Text>
            <View style={styles.entryFooter}>
              <Text style={styles.entryAmount}>{formatCurrency(entry.total)}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderReports = () => (
    <View style={styles.tabContent}>
      <View style={styles.reportsGrid}>
        {[
          { icon: 'document-text', title: 'Trial Balance', desc: 'Account balances summary' },
          { icon: 'trending-up', title: 'Income Statement', desc: 'Revenue & expenses' },
          { icon: 'layers', title: 'Balance Sheet', desc: 'Assets, liabilities, equity' },
          { icon: 'cash', title: 'Payroll Journal', desc: 'Payroll entries' },
          { icon: 'calculator', title: 'Tax Liability', desc: 'Tax obligations' },
          { icon: 'pie-chart', title: 'Cost Analysis', desc: 'Labor cost breakdown' },
        ].map((report, index) => (
          <TouchableOpacity key={index} style={styles.reportCard}>
            <View style={styles.reportIconContainer}>
              <Ionicons name={report.icon as any} size={24} color="#1473FF" />
            </View>
            <Text style={styles.reportTitle}>{report.title}</Text>
            <Text style={styles.reportDesc}>{report.desc}</Text>
            <View style={styles.reportAction}>
              <Text style={styles.reportActionText}>Generate</Text>
              <Ionicons name="arrow-forward" size={16} color="#1473FF" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Quick Summary</Text>
        <View style={styles.summaryCards}>
          <View style={[styles.summaryCard, { backgroundColor: '#F0FDF4' }]}>
            <Text style={styles.summaryLabel}>Total Assets</Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>$125,000</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.summaryLabel}>Total Liabilities</Text>
            <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>$74,430</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FEE2E2' }]}>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>$512,425</Text>
          </View>
        </View>
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
          <Text style={styles.headerTitle}>Accounting</Text>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          {[
            { key: 'chart', label: 'Chart of Accounts', icon: 'list' },
            { key: 'journal', label: 'Journal', icon: 'book' },
            { key: 'reports', label: 'Reports', icon: 'bar-chart' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key as TabType)}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
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
        {activeTab === 'chart' && renderChartOfAccounts()}
        {activeTab === 'journal' && renderJournalEntries()}
        {activeTab === 'reports' && renderReports()}
      </ScrollView>

      <Modal visible={showEntryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Journal Entry</Text>
              <TouchableOpacity onPress={() => setShowEntryModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Create a manual journal entry</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Date</Text>
              <TextInput style={styles.formInput} placeholder="YYYY-MM-DD" placeholderTextColor="#999" />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput style={styles.formInput} placeholder="Entry description" placeholderTextColor="#999" />
            </View>

            <TouchableOpacity style={styles.modalButton}>
              <LinearGradient
                colors={['#1473FF', '#BE01FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalButtonText}>Create Entry</Text>
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
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabText: {
    fontSize: 12,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  filterChipActive: {
    backgroundColor: '#1473FF',
    borderColor: '#1473FF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  accountsList: {
    gap: 12,
  },
  accountCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  accountTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  accountBalance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 12,
    color: '#999',
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
  entriesList: {
    gap: 12,
  },
  entryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryDate: {
    fontSize: 14,
    color: '#666',
  },
  sourceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  sourceBadgePayroll: {
    backgroundColor: '#DBEAFE',
  },
  sourceBadgeText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  entryDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1473FF',
  },
  reportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  reportCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  reportIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reportDesc: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  reportAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportActionText: {
    fontSize: 13,
    color: '#1473FF',
    fontWeight: '500',
  },
  summarySection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryCards: {
    gap: 12,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
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
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#333',
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
