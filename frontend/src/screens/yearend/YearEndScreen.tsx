/**
 * SAURELLIUS YEAR-END PROCESSING
 * W-2 generation, tax filing, and year-end compliance
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface W2Summary {
  id: string;
  employee_id: string;
  employee_name: string;
  ssn_last4: string;
  box1_wages: number;
  box2_federal_withheld: number;
  box3_ss_wages: number;
  box4_ss_withheld: number;
  box5_medicare_wages: number;
  box6_medicare_withheld: number;
  state: string;
  box16_state_wages: number;
  box17_state_withheld: number;
  status: 'draft' | 'review' | 'approved' | 'filed' | 'delivered';
}

interface FilingDeadline {
  form: string;
  due_date: string;
  description: string;
  status: 'upcoming' | 'due_soon' | 'overdue' | 'completed';
}

const YearEndScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 1);
  const [w2s, setW2s] = useState<W2Summary[]>([]);
  const [selectedW2, setSelectedW2] = useState<W2Summary | null>(null);
  const [showW2Modal, setShowW2Modal] = useState(false);
  const [activeTab, setActiveTab] = useState<'w2' | 'filings' | 'deadlines'>('w2');
  
  const [deadlines] = useState<FilingDeadline[]>([
    { form: 'W-2/W-3', due_date: '2025-01-31', description: 'W-2s to employees and W-3 to SSA', status: 'due_soon' },
    { form: '1099-NEC', due_date: '2025-01-31', description: '1099s to contractors', status: 'due_soon' },
    { form: '941 Q4', due_date: '2025-01-31', description: 'Q4 Quarterly Federal Tax Return', status: 'due_soon' },
    { form: '940', due_date: '2025-01-31', description: 'Annual FUTA Tax Return', status: 'upcoming' },
    { form: '941 Q1', due_date: '2025-04-30', description: 'Q1 Quarterly Federal Tax Return', status: 'upcoming' },
  ]);
  
  const [stats, setStats] = useState({
    total_employees: 0,
    w2s_generated: 0,
    w2s_approved: 0,
    w2s_filed: 0,
    total_wages: 0,
    total_federal_tax: 0,
  });

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    setLoading(true);
    // Simulated data - replace with API call
    setTimeout(() => {
      const mockW2s: W2Summary[] = Array.from({ length: 25 }, (_, i) => ({
        id: `w2-${i + 1}`,
        employee_id: `EMP${String(i + 1).padStart(3, '0')}`,
        employee_name: `Employee ${i + 1}`,
        ssn_last4: `${1000 + i}`,
        box1_wages: 45000 + Math.random() * 80000,
        box2_federal_withheld: 8000 + Math.random() * 15000,
        box3_ss_wages: Math.min(45000 + Math.random() * 80000, 168600),
        box4_ss_withheld: 2790 + Math.random() * 5000,
        box5_medicare_wages: 45000 + Math.random() * 80000,
        box6_medicare_withheld: 650 + Math.random() * 1500,
        state: ['CA', 'TX', 'NY', 'FL', 'IL'][Math.floor(Math.random() * 5)],
        box16_state_wages: 45000 + Math.random() * 80000,
        box17_state_withheld: 2000 + Math.random() * 8000,
        status: ['draft', 'review', 'approved', 'filed'][Math.floor(Math.random() * 4)] as any,
      }));
      
      setW2s(mockW2s);
      setStats({
        total_employees: mockW2s.length,
        w2s_generated: mockW2s.length,
        w2s_approved: mockW2s.filter(w => ['approved', 'filed'].includes(w.status)).length,
        w2s_filed: mockW2s.filter(w => w.status === 'filed').length,
        total_wages: mockW2s.reduce((sum, w) => sum + w.box1_wages, 0),
        total_federal_tax: mockW2s.reduce((sum, w) => sum + w.box2_federal_withheld, 0),
      });
      setLoading(false);
    }, 500);
  };

  const handleGenerateW2s = () => {
    Alert.alert(
      'Generate W-2s',
      `Generate W-2 forms for all ${stats.total_employees} employees for ${selectedYear}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Generate', onPress: () => Alert.alert('Success', 'W-2 generation started. You will be notified when complete.') },
      ]
    );
  };

  const handleBulkApprove = () => {
    const pendingCount = w2s.filter(w => w.status === 'review').length;
    Alert.alert(
      'Bulk Approve',
      `Approve ${pendingCount} W-2 forms pending review?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve All', 
          onPress: () => {
            setW2s(w2s.map(w => w.status === 'review' ? { ...w, status: 'approved' } : w));
            Alert.alert('Success', `${pendingCount} W-2s approved`);
          }
        },
      ]
    );
  };

  const handleFileW2s = () => {
    const approvedCount = w2s.filter(w => w.status === 'approved').length;
    Alert.alert(
      'File W-2s with SSA',
      `Submit ${approvedCount} approved W-2 forms to the Social Security Administration?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'File', 
          onPress: () => {
            setW2s(w2s.map(w => w.status === 'approved' ? { ...w, status: 'filed' } : w));
            Alert.alert('Success', 'W-2s submitted to SSA');
          }
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#6B7280';
      case 'review': return '#F59E0B';
      case 'approved': return '#10B981';
      case 'filed': return '#6366F1';
      case 'delivered': return '#8B5CF6';
      case 'upcoming': return '#6B7280';
      case 'due_soon': return '#F59E0B';
      case 'overdue': return '#EF4444';
      case 'completed': return '#10B981';
      default: return '#6B7280';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const styles = createStyles(isDarkMode);

  const renderW2Item = ({ item }: { item: W2Summary }) => (
    <TouchableOpacity 
      style={styles.w2Card}
      onPress={() => { setSelectedW2(item); setShowW2Modal(true); }}
    >
      <View style={styles.w2Header}>
        <View>
          <Text style={styles.w2Name}>{item.employee_name}</Text>
          <Text style={styles.w2Id}>SSN: •••-••-{item.ssn_last4}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.w2Summary}>
        <View style={styles.w2SummaryItem}>
          <Text style={styles.w2Label}>Wages (Box 1)</Text>
          <Text style={styles.w2Value}>{formatCurrency(item.box1_wages)}</Text>
        </View>
        <View style={styles.w2SummaryItem}>
          <Text style={styles.w2Label}>Fed Tax (Box 2)</Text>
          <Text style={styles.w2Value}>{formatCurrency(item.box2_federal_withheld)}</Text>
        </View>
        <View style={styles.w2SummaryItem}>
          <Text style={styles.w2Label}>State</Text>
          <Text style={styles.w2Value}>{item.state}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDeadlineItem = ({ item }: { item: FilingDeadline }) => (
    <View style={styles.deadlineCard}>
      <View style={[styles.deadlineIndicator, { backgroundColor: getStatusColor(item.status) }]} />
      <View style={styles.deadlineContent}>
        <Text style={styles.deadlineForm}>{item.form}</Text>
        <Text style={styles.deadlineDescription}>{item.description}</Text>
        <Text style={styles.deadlineDate}>Due: {item.due_date}</Text>
      </View>
      <View style={[styles.deadlineStatus, { backgroundColor: getStatusColor(item.status) + '20' }]}>
        <Text style={[styles.deadlineStatusText, { color: getStatusColor(item.status) }]}>
          {item.status.replace('_', ' ').toUpperCase()}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Year-End Processing</Text>
          <View style={styles.yearSelector}>
            <TouchableOpacity onPress={() => setSelectedYear(y => y - 1)}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.yearText}>{selectedYear}</Text>
            <TouchableOpacity onPress={() => setSelectedYear(y => y + 1)}>
              <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.w2s_generated}</Text>
          <Text style={styles.statLabel}>W-2s Generated</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.w2s_approved}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.w2s_filed}</Text>
          <Text style={styles.statLabel}>Filed</Text>
        </View>
      </View>

      {/* Totals */}
      <View style={styles.totalsCard}>
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Total Wages</Text>
          <Text style={styles.totalValue}>{formatCurrency(stats.total_wages)}</Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Federal Tax Withheld</Text>
          <Text style={styles.totalValue}>{formatCurrency(stats.total_federal_tax)}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['w2', 'filings', 'deadlines'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons 
              name={tab === 'w2' ? 'document-text' : tab === 'filings' ? 'folder' : 'calendar'} 
              size={20} 
              color={activeTab === tab ? '#6366F1' : '#6B7280'} 
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'w2' ? 'W-2 Forms' : tab === 'filings' ? 'Tax Filings' : 'Deadlines'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'w2' && (
        <>
          {/* Action Buttons */}
          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.actionButton} onPress={handleGenerateW2s}>
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Generate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]} onPress={handleBulkApprove}>
              <Ionicons name="checkmark-circle" size={20} color="#6366F1" />
              <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Approve All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionButtonGreen]} onPress={handleFileW2s}>
              <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>File</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={w2s}
            renderItem={renderW2Item}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
          />
        </>
      )}

      {activeTab === 'deadlines' && (
        <FlatList
          data={deadlines}
          renderItem={renderDeadlineItem}
          keyExtractor={item => item.form}
          contentContainerStyle={styles.listContent}
        />
      )}

      {activeTab === 'filings' && (
        <View style={styles.filingsContent}>
          <View style={styles.filingCard}>
            <Ionicons name="document" size={32} color="#6366F1" />
            <Text style={styles.filingTitle}>Form 941</Text>
            <Text style={styles.filingDescription}>Quarterly Federal Tax Return</Text>
            <TouchableOpacity style={styles.filingButton}>
              <Text style={styles.filingButtonText}>Generate Q4 {selectedYear}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.filingCard}>
            <Ionicons name="document" size={32} color="#10B981" />
            <Text style={styles.filingTitle}>Form 940</Text>
            <Text style={styles.filingDescription}>Annual FUTA Tax Return</Text>
            <TouchableOpacity style={styles.filingButton}>
              <Text style={styles.filingButtonText}>Generate {selectedYear}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.filingCard}>
            <Ionicons name="document" size={32} color="#F59E0B" />
            <Text style={styles.filingTitle}>1099-NEC</Text>
            <Text style={styles.filingDescription}>Contractor Payments</Text>
            <TouchableOpacity style={styles.filingButton}>
              <Text style={styles.filingButtonText}>Generate {selectedYear}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* W-2 Detail Modal */}
      <Modal visible={showW2Modal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>W-2 Details</Text>
              <TouchableOpacity onPress={() => setShowW2Modal(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#1F2937'} />
              </TouchableOpacity>
            </View>
            
            {selectedW2 && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.w2ModalName}>{selectedW2.employee_name}</Text>
                <Text style={styles.w2ModalId}>SSN: •••-••-{selectedW2.ssn_last4}</Text>
                
                <View style={styles.w2BoxesGrid}>
                  <View style={styles.w2Box}>
                    <Text style={styles.w2BoxLabel}>Box 1 - Wages</Text>
                    <Text style={styles.w2BoxValue}>{formatCurrency(selectedW2.box1_wages)}</Text>
                  </View>
                  <View style={styles.w2Box}>
                    <Text style={styles.w2BoxLabel}>Box 2 - Federal Tax</Text>
                    <Text style={styles.w2BoxValue}>{formatCurrency(selectedW2.box2_federal_withheld)}</Text>
                  </View>
                  <View style={styles.w2Box}>
                    <Text style={styles.w2BoxLabel}>Box 3 - SS Wages</Text>
                    <Text style={styles.w2BoxValue}>{formatCurrency(selectedW2.box3_ss_wages)}</Text>
                  </View>
                  <View style={styles.w2Box}>
                    <Text style={styles.w2BoxLabel}>Box 4 - SS Tax</Text>
                    <Text style={styles.w2BoxValue}>{formatCurrency(selectedW2.box4_ss_withheld)}</Text>
                  </View>
                  <View style={styles.w2Box}>
                    <Text style={styles.w2BoxLabel}>Box 5 - Medicare Wages</Text>
                    <Text style={styles.w2BoxValue}>{formatCurrency(selectedW2.box5_medicare_wages)}</Text>
                  </View>
                  <View style={styles.w2Box}>
                    <Text style={styles.w2BoxLabel}>Box 6 - Medicare Tax</Text>
                    <Text style={styles.w2BoxValue}>{formatCurrency(selectedW2.box6_medicare_withheld)}</Text>
                  </View>
                  <View style={styles.w2Box}>
                    <Text style={styles.w2BoxLabel}>Box 16 - State Wages</Text>
                    <Text style={styles.w2BoxValue}>{formatCurrency(selectedW2.box16_state_wages)}</Text>
                  </View>
                  <View style={styles.w2Box}>
                    <Text style={styles.w2BoxLabel}>Box 17 - State Tax</Text>
                    <Text style={styles.w2BoxValue}>{formatCurrency(selectedW2.box17_state_withheld)}</Text>
                  </View>
                </View>
                
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalActionButton}>
                    <Ionicons name="download" size={20} color="#6366F1" />
                    <Text style={styles.modalActionText}>Download PDF</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalActionButton}>
                    <Ionicons name="mail" size={20} color="#6366F1" />
                    <Text style={styles.modalActionText}>Email to Employee</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDarkMode ? '#111827' : '#F3F4F6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? '#111827' : '#F3F4F6' },
  header: { padding: 20, paddingTop: 60 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  yearSelector: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  yearText: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  statsContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#6366F1' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  totalsCard: { flexDirection: 'row', backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', marginHorizontal: 16, padding: 16, borderRadius: 12, marginBottom: 16 },
  totalItem: { flex: 1, alignItems: 'center' },
  totalLabel: { fontSize: 12, color: '#6B7280' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#1F2937', marginTop: 4 },
  totalDivider: { width: 1, backgroundColor: isDarkMode ? '#374151' : '#E5E7EB' },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 8, backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' },
  tabActive: { backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF' },
  tabText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  tabTextActive: { color: '#6366F1' },
  actionBar: { flexDirection: 'row', padding: 16, gap: 8 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#6366F1', paddingVertical: 10, borderRadius: 8 },
  actionButtonSecondary: { backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderWidth: 1, borderColor: '#6366F1' },
  actionButtonGreen: { backgroundColor: '#10B981' },
  actionButtonText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  actionButtonTextSecondary: { color: '#6366F1' },
  listContent: { padding: 16, paddingTop: 0 },
  w2Card: { backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: isDarkMode ? '#374151' : '#E5E7EB' },
  w2Header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  w2Name: { fontSize: 16, fontWeight: '600', color: isDarkMode ? '#FFFFFF' : '#1F2937' },
  w2Id: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '700' },
  w2Summary: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: isDarkMode ? '#374151' : '#E5E7EB' },
  w2SummaryItem: { flex: 1 },
  w2Label: { fontSize: 10, color: '#6B7280' },
  w2Value: { fontSize: 14, fontWeight: '600', color: isDarkMode ? '#FFFFFF' : '#1F2937', marginTop: 2 },
  deadlineCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12 },
  deadlineIndicator: { width: 4, height: 40, borderRadius: 2, marginRight: 12 },
  deadlineContent: { flex: 1 },
  deadlineForm: { fontSize: 16, fontWeight: '600', color: isDarkMode ? '#FFFFFF' : '#1F2937' },
  deadlineDescription: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  deadlineDate: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  deadlineStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  deadlineStatusText: { fontSize: 10, fontWeight: '700' },
  filingsContent: { padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  filingCard: { width: '47%', backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center' },
  filingTitle: { fontSize: 16, fontWeight: '600', color: isDarkMode ? '#FFFFFF' : '#1F2937', marginTop: 8 },
  filingDescription: { fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  filingButton: { marginTop: 12, backgroundColor: '#6366F1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  filingButtonText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#1F2937' },
  modalBody: { padding: 20 },
  w2ModalName: { fontSize: 20, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#1F2937' },
  w2ModalId: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 20 },
  w2BoxesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  w2Box: { width: '47%', backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', padding: 12, borderRadius: 8 },
  w2BoxLabel: { fontSize: 11, color: '#6B7280' },
  w2BoxValue: { fontSize: 16, fontWeight: '600', color: isDarkMode ? '#FFFFFF' : '#1F2937', marginTop: 4 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalActionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#6366F1' },
  modalActionText: { color: '#6366F1', fontWeight: '600' },
});

export default YearEndScreen;
