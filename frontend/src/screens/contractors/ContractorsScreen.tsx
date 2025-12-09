/**
 * CONTRACTORS SCREEN
 * 1099 Contractor management, payments, and tax forms
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'contractors' | 'payments' | '1099s';

interface Contractor {
  id: string;
  name: string;
  email: string;
  type: string;
  ytdPayments: number;
  w9OnFile: boolean;
  status: string;
}

interface Payment {
  id: string;
  contractorId: string;
  contractorName: string;
  amount: number;
  date: string;
  status: string;
  description: string;
}

const MOCK_CONTRACTORS: Contractor[] = [
  { id: '1', name: 'Alex Thompson', email: 'alex@design.co', type: 'individual', ytdPayments: 12500, w9OnFile: true, status: 'active' },
  { id: '2', name: 'Creative Solutions LLC', email: 'billing@creative.com', type: 'llc_single', ytdPayments: 28000, w9OnFile: true, status: 'active' },
  { id: '3', name: 'Maria Garcia', email: 'maria@consulting.com', type: 'individual', ytdPayments: 8500, w9OnFile: false, status: 'active' },
  { id: '4', name: 'TechWrite Inc', email: 'ap@techwrite.com', type: 'c_corporation', ytdPayments: 15000, w9OnFile: true, status: 'active' },
];

const MOCK_PAYMENTS: Payment[] = [
  { id: '1', contractorId: '1', contractorName: 'Alex Thompson', amount: 2500, date: '2024-12-15', status: 'paid', description: 'December design work' },
  { id: '2', contractorId: '2', contractorName: 'Creative Solutions LLC', amount: 5000, date: '2024-12-10', status: 'paid', description: 'Marketing materials' },
  { id: '3', contractorId: '3', contractorName: 'Maria Garcia', amount: 1500, date: '2024-12-05', status: 'pending', description: 'Consulting services' },
  { id: '4', contractorId: '1', contractorName: 'Alex Thompson', amount: 3000, date: '2024-11-30', status: 'paid', description: 'November design work' },
];

export default function ContractorsScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabType>('contractors');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: '#10B981',
      inactive: '#6B7280',
      paid: '#10B981',
      pending: '#F59E0B',
      processing: '#3B82F6',
    };
    return colors[status] || '#6B7280';
  };

  const contractorsRequiring1099 = MOCK_CONTRACTORS.filter(c => c.ytdPayments >= 600).length;
  const totalYTDPayments = MOCK_CONTRACTORS.reduce((sum, c) => sum + c.ytdPayments, 0);
  const missingW9 = MOCK_CONTRACTORS.filter(c => !c.w9OnFile).length;

  const renderContractors = () => (
    <View style={styles.tabContent}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{MOCK_CONTRACTORS.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatCurrency(totalYTDPayments)}</Text>
          <Text style={styles.statLabel}>YTD Paid</Text>
        </View>
        <View style={[styles.statCard, missingW9 > 0 && { backgroundColor: '#FEF3C7' }]}>
          <Text style={[styles.statValue, missingW9 > 0 && { color: '#F59E0B' }]}>{missingW9}</Text>
          <Text style={styles.statLabel}>Missing W-9</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contractors..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
        <LinearGradient
          colors={['#1473FF', '#BE01FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.addButtonGradient}
        >
          <Ionicons name="person-add" size={20} color="#FFF" />
          <Text style={styles.addButtonText}>Add Contractor</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.contractorsList}>
        {MOCK_CONTRACTORS.map((contractor) => (
          <TouchableOpacity key={contractor.id} style={styles.contractorCard}>
            <View style={styles.contractorHeader}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{contractor.name.charAt(0)}</Text>
              </View>
              <View style={styles.contractorInfo}>
                <Text style={styles.contractorName}>{contractor.name}</Text>
                <Text style={styles.contractorEmail}>{contractor.email}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(contractor.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(contractor.status) }]}>
                  {contractor.status}
                </Text>
              </View>
            </View>

            <View style={styles.contractorDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>YTD Payments</Text>
                <Text style={styles.detailValue}>{formatCurrency(contractor.ytdPayments)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Type</Text>
                <Text style={styles.detailValue}>{contractor.type.replace('_', ' ')}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>W-9</Text>
                <View style={styles.w9Status}>
                  <Ionicons 
                    name={contractor.w9OnFile ? 'checkmark-circle' : 'alert-circle'} 
                    size={16} 
                    color={contractor.w9OnFile ? '#10B981' : '#F59E0B'} 
                  />
                  <Text style={[styles.w9Text, { color: contractor.w9OnFile ? '#10B981' : '#F59E0B' }]}>
                    {contractor.w9OnFile ? 'On File' : 'Missing'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.contractorActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setShowPaymentModal(true)}
              >
                <Ionicons name="cash-outline" size={18} color="#1473FF" />
                <Text style={styles.actionButtonText}>Pay</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="document-text-outline" size={18} color="#1473FF" />
                <Text style={styles.actionButtonText}>View</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPayments = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity style={styles.addButton} onPress={() => setShowPaymentModal(true)}>
        <LinearGradient
          colors={['#1473FF', '#BE01FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.addButtonGradient}
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addButtonText}>New Payment</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.paymentsList}>
        {MOCK_PAYMENTS.map((payment) => (
          <TouchableOpacity key={payment.id} style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <Text style={styles.paymentDate}>{payment.date}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
                  {payment.status}
                </Text>
              </View>
            </View>
            <Text style={styles.paymentContractor}>{payment.contractorName}</Text>
            <Text style={styles.paymentDescription}>{payment.description}</Text>
            <View style={styles.paymentFooter}>
              <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const render1099s = () => (
    <View style={styles.tabContent}>
      <View style={styles.form1099Header}>
        <View style={styles.form1099Info}>
          <Text style={styles.form1099Title}>2024 1099-NEC Forms</Text>
          <Text style={styles.form1099Subtitle}>
            {contractorsRequiring1099} contractors require 1099 forms
          </Text>
        </View>
        <TouchableOpacity style={styles.generateButton}>
          <Text style={styles.generateButtonText}>Generate All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.thresholdCard}>
        <Ionicons name="information-circle" size={24} color="#3B82F6" />
        <View style={styles.thresholdInfo}>
          <Text style={styles.thresholdTitle}>1099-NEC Threshold</Text>
          <Text style={styles.thresholdText}>
            Forms required for contractors paid $600 or more in the tax year
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Contractors Above Threshold</Text>
      <View style={styles.form1099List}>
        {MOCK_CONTRACTORS.filter(c => c.ytdPayments >= 600).map((contractor) => (
          <View key={contractor.id} style={styles.form1099Card}>
            <View style={styles.form1099CardHeader}>
              <View>
                <Text style={styles.form1099Name}>{contractor.name}</Text>
                <Text style={styles.form1099Type}>{contractor.type.replace('_', ' ')}</Text>
              </View>
              <Text style={styles.form1099Amount}>{formatCurrency(contractor.ytdPayments)}</Text>
            </View>
            <View style={styles.form1099CardFooter}>
              <View style={styles.form1099Status}>
                <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.form1099StatusText}>Not Generated</Text>
              </View>
              <TouchableOpacity style={styles.form1099Action}>
                <Text style={styles.form1099ActionText}>Generate</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Below Threshold</Text>
      <View style={styles.belowThresholdList}>
        {MOCK_CONTRACTORS.filter(c => c.ytdPayments < 600).map((contractor) => (
          <View key={contractor.id} style={styles.belowThresholdItem}>
            <Text style={styles.belowThresholdName}>{contractor.name}</Text>
            <Text style={styles.belowThresholdAmount}>{formatCurrency(contractor.ytdPayments)}</Text>
          </View>
        ))}
        {MOCK_CONTRACTORS.filter(c => c.ytdPayments < 600).length === 0 && (
          <Text style={styles.emptyText}>All contractors are above the threshold</Text>
        )}
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
          <Text style={styles.headerTitle}>Contractors</Text>
          <TouchableOpacity>
            <Ionicons name="filter" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          {[
            { key: 'contractors', label: 'Contractors', icon: 'people' },
            { key: 'payments', label: 'Payments', icon: 'cash' },
            { key: '1099s', label: '1099 Forms', icon: 'document' },
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
        {activeTab === 'contractors' && renderContractors()}
        {activeTab === 'payments' && renderPayments()}
        {activeTab === '1099s' && render1099s()}
      </ScrollView>

      {/* Add Contractor Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Contractor</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name / Business Name</Text>
              <TextInput style={styles.formInput} placeholder="Enter name" placeholderTextColor="#999" />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput style={styles.formInput} placeholder="email@example.com" placeholderTextColor="#999" keyboardType="email-address" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Contractor Type</Text>
              <View style={styles.typeOptions}>
                {['Individual', 'LLC', 'Corporation'].map((type) => (
                  <TouchableOpacity key={type} style={styles.typeOption}>
                    <Text style={styles.typeOptionText}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={() => {
              setShowAddModal(false);
              Alert.alert('Success', 'Contractor added successfully');
            }}>
              <LinearGradient
                colors={['#1473FF', '#BE01FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalButtonText}>Add Contractor</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Contractor</Text>
              <TouchableOpacity style={styles.selectInput}>
                <Text style={styles.selectPlaceholder}>Select contractor</Text>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Amount</Text>
              <TextInput style={styles.formInput} placeholder="$0.00" placeholderTextColor="#999" keyboardType="decimal-pad" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput style={styles.formInput} placeholder="Payment description" placeholderTextColor="#999" />
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={() => {
              setShowPaymentModal(false);
              Alert.alert('Success', 'Payment created successfully');
            }}>
              <LinearGradient
                colors={['#1473FF', '#BE01FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalButtonText}>Create Payment</Text>
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
  contractorsList: {
    gap: 12,
  },
  contractorCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  contractorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1473FF',
  },
  contractorInfo: {
    flex: 1,
  },
  contractorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contractorEmail: {
    fontSize: 13,
    color: '#666',
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
  contractorDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailItem: {},
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textTransform: 'capitalize',
  },
  w9Status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  w9Text: {
    fontSize: 14,
    fontWeight: '500',
  },
  contractorActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#EBF5FF',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1473FF',
  },
  paymentsList: {
    gap: 12,
  },
  paymentCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentDate: {
    fontSize: 14,
    color: '#666',
  },
  paymentContractor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1473FF',
  },
  form1099Header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  form1099Info: {},
  form1099Title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  form1099Subtitle: {
    fontSize: 14,
    color: '#666',
  },
  generateButton: {
    backgroundColor: '#1473FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  thresholdCard: {
    flexDirection: 'row',
    backgroundColor: '#EBF5FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  thresholdInfo: {
    flex: 1,
  },
  thresholdTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  thresholdText: {
    fontSize: 13,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  form1099List: {
    gap: 12,
    marginBottom: 24,
  },
  form1099Card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  form1099CardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  form1099Name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  form1099Type: {
    fontSize: 13,
    color: '#666',
    textTransform: 'capitalize',
  },
  form1099Amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  form1099CardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  form1099Status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  form1099StatusText: {
    fontSize: 13,
    color: '#666',
  },
  form1099Action: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#EBF5FF',
  },
  form1099ActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1473FF',
  },
  belowThresholdList: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  belowThresholdItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  belowThresholdName: {
    fontSize: 14,
    color: '#333',
  },
  belowThresholdAmount: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
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
  selectInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  typeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  typeOptionText: {
    fontSize: 14,
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
