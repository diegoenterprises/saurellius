/**
 * SAURELLIUS PAYROLL CORRECTIONS
 * Handle overpayments, underpayments, and retroactive adjustments
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  FlatList,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Correction {
  id: string;
  type: 'overpayment' | 'underpayment' | 'retroactive_raise' | 'tax_correction';
  employee_id: string;
  employee_name: string;
  amount: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'completed' | 'cancelled';
  created_at: string;
  reason: string;
}

const PayrollCorrectionsScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedType, setSelectedType] = useState<Correction['type'] | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'all'>('pending');
  
  // Form state
  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [recoveryMethod, setRecoveryMethod] = useState<'full' | 'split'>('full');
  const [splitPayments, setSplitPayments] = useState('2');

  useEffect(() => {
    // Load corrections
    setCorrections([
      {
        id: '1',
        type: 'overpayment',
        employee_id: 'EMP001',
        employee_name: 'John Smith',
        amount: 450.00,
        status: 'pending_approval',
        created_at: '2024-12-10',
        reason: 'Duplicate bonus payment',
      },
      {
        id: '2',
        type: 'underpayment',
        employee_id: 'EMP015',
        employee_name: 'Sarah Johnson',
        amount: 200.00,
        status: 'approved',
        created_at: '2024-12-09',
        reason: 'Missing overtime hours',
      },
      {
        id: '3',
        type: 'retroactive_raise',
        employee_id: 'EMP008',
        employee_name: 'Mike Williams',
        amount: 1250.00,
        status: 'completed',
        created_at: '2024-12-05',
        reason: 'Salary increase effective Nov 1',
      },
    ]);
  }, []);

  const getTypeIcon = (type: Correction['type']) => {
    switch (type) {
      case 'overpayment': return 'arrow-down-circle';
      case 'underpayment': return 'arrow-up-circle';
      case 'retroactive_raise': return 'trending-up';
      case 'tax_correction': return 'document-text';
    }
  };

  const getTypeColor = (type: Correction['type']) => {
    switch (type) {
      case 'overpayment': return '#EF4444';
      case 'underpayment': return '#10B981';
      case 'retroactive_raise': return '#6366F1';
      case 'tax_correction': return '#F59E0B';
    }
  };

  const getStatusColor = (status: Correction['status']) => {
    switch (status) {
      case 'draft': return '#6B7280';
      case 'pending_approval': return '#F59E0B';
      case 'approved': return '#3B82F6';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
    }
  };

  const filteredCorrections = corrections.filter(c => {
    if (activeTab === 'pending') return ['draft', 'pending_approval', 'approved'].includes(c.status);
    if (activeTab === 'completed') return ['completed', 'cancelled'].includes(c.status);
    return true;
  });

  const handleCreateCorrection = () => {
    if (!selectedType || !employeeName || !employeeId || !amount || !reason) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newCorrection: Correction = {
      id: Date.now().toString(),
      type: selectedType,
      employee_id: employeeId,
      employee_name: employeeName,
      amount: parseFloat(amount),
      status: 'draft',
      created_at: new Date().toISOString().split('T')[0],
      reason: reason,
    };

    setCorrections([newCorrection, ...corrections]);
    resetForm();
    setShowNewModal(false);
    Alert.alert('Success', 'Correction created. Submit for approval when ready.');
  };

  const resetForm = () => {
    setSelectedType(null);
    setEmployeeName('');
    setEmployeeId('');
    setAmount('');
    setReason('');
    setRecoveryMethod('full');
    setSplitPayments('2');
  };

  const handleApprove = (id: string) => {
    setCorrections(corrections.map(c => 
      c.id === id ? { ...c, status: 'approved' } : c
    ));
    Alert.alert('Approved', 'Correction has been approved for processing.');
  };

  const handleProcess = (id: string) => {
    setCorrections(corrections.map(c => 
      c.id === id ? { ...c, status: 'completed' } : c
    ));
    Alert.alert('Processed', 'Correction has been applied to payroll.');
  };

  const styles = createStyles(isDarkMode);

  const renderCorrectionItem = ({ item }: { item: Correction }) => (
    <View style={styles.correctionCard}>
      <View style={styles.correctionHeader}>
        <View style={[styles.typeIcon, { backgroundColor: getTypeColor(item.type) + '20' }]}>
          <Ionicons name={getTypeIcon(item.type)} size={24} color={getTypeColor(item.type)} />
        </View>
        <View style={styles.correctionInfo}>
          <Text style={styles.correctionEmployee}>{item.employee_name}</Text>
          <Text style={styles.correctionType}>
            {item.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </Text>
        </View>
        <View style={styles.correctionAmount}>
          <Text style={[styles.amountValue, { color: getTypeColor(item.type) }]}>
            {item.type === 'overpayment' ? '-' : '+'}${item.amount.toFixed(2)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.correctionDetails}>
        <Text style={styles.correctionReason}>{item.reason}</Text>
        <Text style={styles.correctionDate}>Created: {item.created_at}</Text>
      </View>
      
      {/* Actions */}
      {item.status === 'draft' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButtonOutline}>
            <Text style={styles.actionButtonOutlineText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButtonPrimary}
            onPress={() => {
              setCorrections(corrections.map(c => 
                c.id === item.id ? { ...c, status: 'pending_approval' } : c
              ));
            }}
          >
            <Text style={styles.actionButtonPrimaryText}>Submit for Approval</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {item.status === 'pending_approval' && (
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.actionButtonDanger}
            onPress={() => {
              setCorrections(corrections.map(c => 
                c.id === item.id ? { ...c, status: 'cancelled' } : c
              ));
            }}
          >
            <Text style={styles.actionButtonDangerText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButtonSuccess}
            onPress={() => handleApprove(item.id)}
          >
            <Text style={styles.actionButtonSuccessText}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {item.status === 'approved' && (
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.actionButtonSuccess}
            onPress={() => handleProcess(item.id)}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonSuccessText}>Process</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.header}>
        <Text style={styles.headerTitle}>Payroll Corrections</Text>
        <TouchableOpacity style={styles.newButton} onPress={() => setShowNewModal(true)}>
          <Ionicons name="add" size={24} color="#6366F1" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>
            {corrections.filter(c => c.status === 'pending_approval').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#3B82F6' }]}>
            {corrections.filter(c => c.status === 'approved').length}
          </Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>
            {corrections.filter(c => c.status === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['pending', 'completed', 'all'] as const).map(tab => (
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

      {/* List */}
      <FlatList
        data={filteredCorrections}
        renderItem={renderCorrectionItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#6B7280" />
            <Text style={styles.emptyTitle}>No Corrections</Text>
            <Text style={styles.emptyText}>Create a new correction to get started</Text>
          </View>
        }
      />

      {/* New Correction Modal */}
      <Modal visible={showNewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Correction</Text>
              <TouchableOpacity onPress={() => { setShowNewModal(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#1F2937'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Type Selection */}
              <Text style={styles.inputLabel}>Correction Type *</Text>
              <View style={styles.typeGrid}>
                {([
                  { type: 'overpayment', label: 'Overpayment', icon: 'arrow-down-circle', desc: 'Recover excess pay' },
                  { type: 'underpayment', label: 'Underpayment', icon: 'arrow-up-circle', desc: 'Pay shortage' },
                  { type: 'retroactive_raise', label: 'Retro Raise', icon: 'trending-up', desc: 'Back-dated increase' },
                  { type: 'tax_correction', label: 'Tax Correction', icon: 'document-text', desc: 'W-2c scenario' },
                ] as const).map(item => (
                  <TouchableOpacity
                    key={item.type}
                    style={[
                      styles.typeCard,
                      selectedType === item.type && styles.typeCardActive,
                      { borderColor: selectedType === item.type ? getTypeColor(item.type) : isDarkMode ? '#374151' : '#E5E7EB' }
                    ]}
                    onPress={() => setSelectedType(item.type)}
                  >
                    <Ionicons 
                      name={item.icon} 
                      size={28} 
                      color={selectedType === item.type ? getTypeColor(item.type) : '#6B7280'} 
                    />
                    <Text style={[styles.typeLabel, selectedType === item.type && { color: getTypeColor(item.type) }]}>
                      {item.label}
                    </Text>
                    <Text style={styles.typeDesc}>{item.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Employee Name *</Text>
              <TextInput
                style={styles.input}
                value={employeeName}
                onChangeText={setEmployeeName}
                placeholder="Enter employee name"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Employee ID *</Text>
              <TextInput
                style={styles.input}
                value={employeeId}
                onChangeText={setEmployeeId}
                placeholder="EMP001"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Amount *</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Reason *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={reason}
                onChangeText={setReason}
                placeholder="Explain the reason for this correction..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />

              {selectedType === 'overpayment' && (
                <>
                  <Text style={styles.inputLabel}>Recovery Method</Text>
                  <View style={styles.recoveryOptions}>
                    <TouchableOpacity
                      style={[styles.recoveryOption, recoveryMethod === 'full' && styles.recoveryOptionActive]}
                      onPress={() => setRecoveryMethod('full')}
                    >
                      <Ionicons 
                        name={recoveryMethod === 'full' ? 'radio-button-on' : 'radio-button-off'} 
                        size={20} 
                        color={recoveryMethod === 'full' ? '#6366F1' : '#6B7280'} 
                      />
                      <Text style={styles.recoveryOptionText}>Full Recovery (Next Paycheck)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.recoveryOption, recoveryMethod === 'split' && styles.recoveryOptionActive]}
                      onPress={() => setRecoveryMethod('split')}
                    >
                      <Ionicons 
                        name={recoveryMethod === 'split' ? 'radio-button-on' : 'radio-button-off'} 
                        size={20} 
                        color={recoveryMethod === 'split' ? '#6366F1' : '#6B7280'} 
                      />
                      <Text style={styles.recoveryOptionText}>Split Over Multiple Paychecks</Text>
                    </TouchableOpacity>
                  </View>

                  {recoveryMethod === 'split' && (
                    <>
                      <Text style={styles.inputLabel}>Number of Payments</Text>
                      <TextInput
                        style={styles.input}
                        value={splitPayments}
                        onChangeText={setSplitPayments}
                        placeholder="2"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                      />
                      {amount && splitPayments && (
                        <Text style={styles.splitInfo}>
                          ${(parseFloat(amount) / parseInt(splitPayments)).toFixed(2)} per paycheck
                        </Text>
                      )}
                    </>
                  )}
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => { setShowNewModal(false); resetForm(); }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createButton} onPress={handleCreateCorrection}>
                <Text style={styles.createButtonText}>Create Correction</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDarkMode ? '#111827' : '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  newButton: { backgroundColor: '#FFFFFF', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' },
  tabActive: { backgroundColor: '#6366F1' },
  tabText: { color: '#6B7280', fontWeight: '600' },
  tabTextActive: { color: '#FFFFFF' },
  listContent: { padding: 16 },
  correctionCard: { backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: isDarkMode ? '#374151' : '#E5E7EB' },
  correctionHeader: { flexDirection: 'row', alignItems: 'center' },
  typeIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  correctionInfo: { flex: 1, marginLeft: 12 },
  correctionEmployee: { fontSize: 16, fontWeight: '600', color: isDarkMode ? '#FFFFFF' : '#1F2937' },
  correctionType: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  correctionAmount: { alignItems: 'flex-end' },
  amountValue: { fontSize: 18, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
  statusText: { fontSize: 9, fontWeight: '700' },
  correctionDetails: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: isDarkMode ? '#374151' : '#E5E7EB' },
  correctionReason: { fontSize: 14, color: isDarkMode ? '#D1D5DB' : '#6B7280' },
  correctionDate: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionButtonOutline: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: isDarkMode ? '#4B5563' : '#D1D5DB' },
  actionButtonOutlineText: { color: isDarkMode ? '#D1D5DB' : '#6B7280', fontWeight: '600' },
  actionButtonPrimary: { flex: 1, backgroundColor: '#6366F1', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionButtonPrimaryText: { color: '#FFFFFF', fontWeight: '600' },
  actionButtonSuccess: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 8, backgroundColor: '#10B981', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionButtonSuccessText: { color: '#FFFFFF', fontWeight: '600' },
  actionButtonDanger: { flex: 1, backgroundColor: '#FEE2E2', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionButtonDangerText: { color: '#EF4444', fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: isDarkMode ? '#FFFFFF' : '#1F2937', marginTop: 16 },
  emptyText: { color: '#6B7280', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#1F2937' },
  modalBody: { padding: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: isDarkMode ? '#D1D5DB' : '#374151', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', borderRadius: 8, padding: 14, fontSize: 16, color: isDarkMode ? '#FFFFFF' : '#1F2937', borderWidth: 1, borderColor: isDarkMode ? '#4B5563' : '#D1D5DB' },
  textArea: { height: 80, textAlignVertical: 'top' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  typeCard: { width: '47%', backgroundColor: isDarkMode ? '#374151' : '#F9FAFB', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 2 },
  typeCardActive: { backgroundColor: isDarkMode ? '#1E3A5F' : '#EEF2FF' },
  typeLabel: { fontSize: 14, fontWeight: '600', color: isDarkMode ? '#FFFFFF' : '#1F2937', marginTop: 8 },
  typeDesc: { fontSize: 11, color: '#6B7280', marginTop: 2, textAlign: 'center' },
  recoveryOptions: { gap: 12 },
  recoveryOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, backgroundColor: isDarkMode ? '#374151' : '#F9FAFB' },
  recoveryOptionActive: { backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF' },
  recoveryOptionText: { color: isDarkMode ? '#FFFFFF' : '#1F2937' },
  splitInfo: { color: '#6366F1', fontSize: 14, marginTop: 8, fontWeight: '600' },
  modalFooter: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: isDarkMode ? '#374151' : '#E5E7EB' },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: isDarkMode ? '#4B5563' : '#D1D5DB' },
  cancelButtonText: { color: isDarkMode ? '#D1D5DB' : '#6B7280', fontWeight: '600' },
  createButton: { flex: 1, backgroundColor: '#6366F1', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  createButtonText: { color: '#FFFFFF', fontWeight: '600' },
});

export default PayrollCorrectionsScreen;
