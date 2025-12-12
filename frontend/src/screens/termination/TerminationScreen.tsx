/**
 * SAURELLIUS TERMINATION PROCESSING
 * Employee offboarding with state-specific final pay rules
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
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface TerminationData {
  employee_id: string;
  employee_name: string;
  termination_date: string;
  termination_type: 'voluntary' | 'involuntary' | 'retirement';
  reason: string;
  last_work_date: string;
  final_pay_due_date?: string;
  state_rule?: string;
  pto_hours_remaining: number;
  pto_payout_required: boolean;
}

interface FinalPayBreakdown {
  regular_pay: number;
  pto_payout: number;
  expense_reimbursements: number;
  gross_pay: number;
  federal_tax: number;
  state_tax: number;
  fica: number;
  total_taxes: number;
  deductions: number;
  garnishments: number;
  net_pay: number;
}

const STATE_RULES: Record<string, { involuntary: string; voluntary: string; pto_payout: boolean }> = {
  'CA': { involuntary: 'Immediate', voluntary: '72 Hours', pto_payout: true },
  'CO': { involuntary: 'Immediate', voluntary: 'Next Payday', pto_payout: true },
  'MA': { involuntary: 'Immediate', voluntary: 'Next Payday', pto_payout: true },
  'TX': { involuntary: '6 Days', voluntary: 'Next Payday', pto_payout: false },
  'NY': { involuntary: 'Next Payday', voluntary: 'Next Payday', pto_payout: false },
  'FL': { involuntary: 'Next Payday', voluntary: 'Next Payday', pto_payout: false },
};

const TerminationScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [terminationDate, setTerminationDate] = useState('');
  const [lastWorkDate, setLastWorkDate] = useState('');
  const [terminationType, setTerminationType] = useState<'voluntary' | 'involuntary' | 'retirement'>('voluntary');
  const [reason, setReason] = useState('');
  const [reasonDetails, setReasonDetails] = useState('');
  const [workState, setWorkState] = useState('');
  const [ptoHours, setPtoHours] = useState('0');
  const [hourlyRate, setHourlyRate] = useState('0');
  const [regularPay, setRegularPay] = useState('0');
  const [expenseReimb, setExpenseReimb] = useState('0');
  const [garnishments, setGarnishments] = useState('0');
  
  // Calculated values
  const [finalPayBreakdown, setFinalPayBreakdown] = useState<FinalPayBreakdown | null>(null);
  const [finalPayDueDate, setFinalPayDueDate] = useState('');
  const [stateRule, setStateRule] = useState('');
  const [ptoPayout, setPtoPayout] = useState(0);
  
  // Checklist
  const [checklist, setChecklist] = useState({
    final_pay_calculated: false,
    benefits_terminated: false,
    cobra_notice_sent: false,
    equipment_collected: false,
    access_revoked: false,
    exit_interview_completed: false,
    documentation_filed: false,
  });

  const calculateFinalPay = () => {
    const regPay = parseFloat(regularPay) || 0;
    const pto = parseFloat(ptoHours) || 0;
    const rate = parseFloat(hourlyRate) || 0;
    const expense = parseFloat(expenseReimb) || 0;
    const garn = parseFloat(garnishments) || 0;
    
    const stateRules = STATE_RULES[workState.toUpperCase()];
    const ptoPay = stateRules?.pto_payout ? pto * rate : 0;
    setPtoPayout(ptoPay);
    
    const gross = regPay + ptoPay + expense;
    const federal = gross * 0.22;
    const state = gross * 0.05;
    const fica = gross * 0.0765;
    const totalTax = federal + state + fica;
    const net = gross - totalTax - garn;
    
    setFinalPayBreakdown({
      regular_pay: regPay,
      pto_payout: ptoPay,
      expense_reimbursements: expense,
      gross_pay: gross,
      federal_tax: federal,
      state_tax: state,
      fica: fica,
      total_taxes: totalTax,
      deductions: 0,
      garnishments: garn,
      net_pay: net,
    });
    
    // Calculate due date
    if (stateRules) {
      const rule = terminationType === 'involuntary' ? stateRules.involuntary : stateRules.voluntary;
      setStateRule(rule);
      
      const termDate = new Date(terminationDate);
      let dueDate = new Date(termDate);
      
      if (rule === 'Immediate') {
        dueDate = termDate;
      } else if (rule === '72 Hours') {
        dueDate.setDate(dueDate.getDate() + 3);
      } else if (rule === '6 Days') {
        dueDate.setDate(dueDate.getDate() + 6);
      } else {
        // Next payday - assume biweekly Friday
        const daysUntilFriday = (5 - dueDate.getDay() + 7) % 7 || 7;
        dueDate.setDate(dueDate.getDate() + daysUntilFriday);
      }
      
      setFinalPayDueDate(dueDate.toISOString().split('T')[0]);
    }
    
    setChecklist(prev => ({ ...prev, final_pay_calculated: true }));
    setStep(3);
  };

  const handleChecklistChange = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = () => {
    if (!Object.values(checklist).every(v => v)) {
      Alert.alert('Incomplete', 'Please complete all checklist items before finalizing.');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmTermination = () => {
    setShowConfirmModal(false);
    Alert.alert('Success', 'Termination processed successfully. Final pay will be issued by ' + finalPayDueDate);
  };

  const styles = createStyles(isDarkMode);

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Employee Information</Text>
      
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
        placeholder="Employee ID"
        placeholderTextColor="#9CA3AF"
      />
      
      <Text style={styles.inputLabel}>Work State *</Text>
      <TextInput
        style={styles.input}
        value={workState}
        onChangeText={setWorkState}
        placeholder="e.g., CA, TX, NY"
        placeholderTextColor="#9CA3AF"
        maxLength={2}
        autoCapitalize="characters"
      />
      
      <Text style={styles.inputLabel}>Termination Type *</Text>
      <View style={styles.typeButtons}>
        {(['voluntary', 'involuntary', 'retirement'] as const).map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.typeButton, terminationType === type && styles.typeButtonActive]}
            onPress={() => setTerminationType(type)}
          >
            <Text style={[styles.typeButtonText, terminationType === type && styles.typeButtonTextActive]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.inputLabel}>Termination Date *</Text>
      <TextInput
        style={styles.input}
        value={terminationDate}
        onChangeText={setTerminationDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#9CA3AF"
      />
      
      <Text style={styles.inputLabel}>Last Work Date</Text>
      <TextInput
        style={styles.input}
        value={lastWorkDate}
        onChangeText={setLastWorkDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#9CA3AF"
      />
      
      <Text style={styles.inputLabel}>Reason *</Text>
      <TextInput
        style={styles.input}
        value={reason}
        onChangeText={setReason}
        placeholder="e.g., Resignation, Performance, Layoff"
        placeholderTextColor="#9CA3AF"
      />
      
      <Text style={styles.inputLabel}>Additional Details</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={reasonDetails}
        onChangeText={setReasonDetails}
        placeholder="Optional notes..."
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={3}
      />
      
      {/* State Rules Info */}
      {workState && STATE_RULES[workState.toUpperCase()] && (
        <View style={styles.stateRulesCard}>
          <View style={styles.stateRulesHeader}>
            <Ionicons name="information-circle" size={20} color="#6366F1" />
            <Text style={styles.stateRulesTitle}>{workState.toUpperCase()} Final Pay Rules</Text>
          </View>
          <View style={styles.stateRulesContent}>
            <Text style={styles.stateRuleItem}>
              <Text style={styles.stateRuleLabel}>Involuntary: </Text>
              {STATE_RULES[workState.toUpperCase()].involuntary}
            </Text>
            <Text style={styles.stateRuleItem}>
              <Text style={styles.stateRuleLabel}>Voluntary: </Text>
              {STATE_RULES[workState.toUpperCase()].voluntary}
            </Text>
            <Text style={styles.stateRuleItem}>
              <Text style={styles.stateRuleLabel}>PTO Payout: </Text>
              {STATE_RULES[workState.toUpperCase()].pto_payout ? 'Required' : 'Not Required'}
            </Text>
          </View>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.nextButton}
        onPress={() => {
          if (!employeeName || !employeeId || !terminationDate || !reason || !workState) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
          }
          setStep(2);
        }}
      >
        <Text style={styles.nextButtonText}>Continue to Final Pay</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Final Pay Calculation</Text>
      
      <Text style={styles.inputLabel}>Regular Pay (Final Period) *</Text>
      <TextInput
        style={styles.input}
        value={regularPay}
        onChangeText={setRegularPay}
        placeholder="0.00"
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
      />
      
      <Text style={styles.inputLabel}>PTO Hours Remaining</Text>
      <TextInput
        style={styles.input}
        value={ptoHours}
        onChangeText={setPtoHours}
        placeholder="0"
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
      />
      
      <Text style={styles.inputLabel}>Hourly Rate (for PTO calculation)</Text>
      <TextInput
        style={styles.input}
        value={hourlyRate}
        onChangeText={setHourlyRate}
        placeholder="0.00"
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
      />
      
      <Text style={styles.inputLabel}>Expense Reimbursements</Text>
      <TextInput
        style={styles.input}
        value={expenseReimb}
        onChangeText={setExpenseReimb}
        placeholder="0.00"
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
      />
      
      <Text style={styles.inputLabel}>Outstanding Garnishments</Text>
      <TextInput
        style={styles.input}
        value={garnishments}
        onChangeText={setGarnishments}
        placeholder="0.00"
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
      />
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
          <Ionicons name="arrow-back" size={20} color={isDarkMode ? '#FFFFFF' : '#374151'} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={calculateFinalPay}>
          <Text style={styles.nextButtonText}>Calculate</Text>
          <Ionicons name="calculator" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Final Pay Summary</Text>
      
      {/* Due Date Alert */}
      <View style={styles.dueDateCard}>
        <Ionicons name="calendar" size={24} color="#F59E0B" />
        <View style={styles.dueDateContent}>
          <Text style={styles.dueDateLabel}>Final Pay Due By</Text>
          <Text style={styles.dueDateValue}>{finalPayDueDate}</Text>
          <Text style={styles.dueDateRule}>{workState.toUpperCase()} Rule: {stateRule}</Text>
        </View>
      </View>
      
      {/* Pay Breakdown */}
      {finalPayBreakdown && (
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Pay Breakdown</Text>
          
          <View style={styles.breakdownSection}>
            <Text style={styles.sectionTitle}>Earnings</Text>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Regular Pay</Text>
              <Text style={styles.breakdownValue}>${finalPayBreakdown.regular_pay.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>PTO Payout ({ptoHours} hrs)</Text>
              <Text style={styles.breakdownValue}>${finalPayBreakdown.pto_payout.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Expense Reimbursements</Text>
              <Text style={styles.breakdownValue}>${finalPayBreakdown.expense_reimbursements.toFixed(2)}</Text>
            </View>
            <View style={[styles.breakdownRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Gross Pay</Text>
              <Text style={styles.totalValue}>${finalPayBreakdown.gross_pay.toFixed(2)}</Text>
            </View>
          </View>
          
          <View style={styles.breakdownSection}>
            <Text style={styles.sectionTitle}>Deductions</Text>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Federal Tax</Text>
              <Text style={styles.breakdownValueNeg}>-${finalPayBreakdown.federal_tax.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>State Tax</Text>
              <Text style={styles.breakdownValueNeg}>-${finalPayBreakdown.state_tax.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>FICA</Text>
              <Text style={styles.breakdownValueNeg}>-${finalPayBreakdown.fica.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Garnishments</Text>
              <Text style={styles.breakdownValueNeg}>-${finalPayBreakdown.garnishments.toFixed(2)}</Text>
            </View>
          </View>
          
          <View style={styles.netPayRow}>
            <Text style={styles.netPayLabel}>NET PAY</Text>
            <Text style={styles.netPayValue}>${finalPayBreakdown.net_pay.toFixed(2)}</Text>
          </View>
        </View>
      )}
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
          <Ionicons name="arrow-back" size={20} color={isDarkMode ? '#FFFFFF' : '#374151'} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={() => setStep(4)}>
          <Text style={styles.nextButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Offboarding Checklist</Text>
      
      <View style={styles.checklistContainer}>
        {Object.entries(checklist).map(([key, value]) => (
          <TouchableOpacity
            key={key}
            style={styles.checklistItem}
            onPress={() => handleChecklistChange(key as keyof typeof checklist)}
          >
            <View style={[styles.checkbox, value && styles.checkboxChecked]}>
              {value && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </View>
            <Text style={styles.checklistText}>
              {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.cobraCard}>
        <Ionicons name="shield-checkmark" size={24} color="#10B981" />
        <View style={styles.cobraContent}>
          <Text style={styles.cobraTitle}>COBRA Notice Required</Text>
          <Text style={styles.cobraText}>
            Send COBRA notification within 44 days of termination date.
          </Text>
        </View>
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(3)}>
          <Ionicons name="arrow-back" size={20} color={isDarkMode ? '#FFFFFF' : '#374151'} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Process Termination</Text>
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.header}>
        <Text style={styles.headerTitle}>Employee Termination</Text>
        <Text style={styles.headerSubtitle}>Process offboarding and final pay</Text>
      </LinearGradient>
      
      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map(s => (
          <View key={s} style={styles.progressStep}>
            <View style={[styles.progressCircle, step >= s && styles.progressCircleActive]}>
              {step > s ? (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              ) : (
                <Text style={[styles.progressNumber, step >= s && styles.progressNumberActive]}>{s}</Text>
              )}
            </View>
            <Text style={[styles.progressLabel, step >= s && styles.progressLabelActive]}>
              {s === 1 ? 'Info' : s === 2 ? 'Pay' : s === 3 ? 'Review' : 'Complete'}
            </Text>
          </View>
        ))}
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </ScrollView>
      
      {/* Confirm Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning" size={48} color="#F59E0B" />
            <Text style={styles.modalTitle}>Confirm Termination</Text>
            <Text style={styles.modalText}>
              Are you sure you want to process this termination for {employeeName}? This action will:
            </Text>
            <View style={styles.modalList}>
              <Text style={styles.modalListItem}>• Generate final paycheck</Text>
              <Text style={styles.modalListItem}>• Terminate benefits</Text>
              <Text style={styles.modalListItem}>• Revoke system access</Text>
              <Text style={styles.modalListItem}>• Send COBRA notice</Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowConfirmModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmButton} onPress={confirmTermination}>
                <Text style={styles.modalConfirmText}>Confirm</Text>
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
  header: { padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  progressContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 20, backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' },
  progressStep: { alignItems: 'center' },
  progressCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: isDarkMode ? '#374151' : '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  progressCircleActive: { backgroundColor: '#6366F1' },
  progressNumber: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  progressNumberActive: { color: '#FFFFFF' },
  progressLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  progressLabelActive: { color: '#6366F1', fontWeight: '600' },
  content: { flex: 1 },
  stepContent: { padding: 20 },
  stepTitle: { fontSize: 20, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#1F2937', marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: isDarkMode ? '#D1D5DB' : '#374151', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: isDarkMode ? '#374151' : '#FFFFFF', borderRadius: 8, padding: 14, fontSize: 16, color: isDarkMode ? '#FFFFFF' : '#1F2937', borderWidth: 1, borderColor: isDarkMode ? '#4B5563' : '#D1D5DB' },
  textArea: { height: 80, textAlignVertical: 'top' },
  typeButtons: { flexDirection: 'row', gap: 8 },
  typeButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: isDarkMode ? '#4B5563' : '#D1D5DB', alignItems: 'center' },
  typeButtonActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  typeButtonText: { color: isDarkMode ? '#D1D5DB' : '#6B7280', fontWeight: '600' },
  typeButtonTextActive: { color: '#FFFFFF' },
  stateRulesCard: { backgroundColor: isDarkMode ? '#1E3A5F' : '#EEF2FF', padding: 16, borderRadius: 12, marginTop: 20 },
  stateRulesHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  stateRulesTitle: { fontSize: 16, fontWeight: '600', color: isDarkMode ? '#93C5FD' : '#4338CA' },
  stateRulesContent: { gap: 4 },
  stateRuleItem: { color: isDarkMode ? '#BFDBFE' : '#4338CA', fontSize: 14 },
  stateRuleLabel: { fontWeight: '600' },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  backButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 8, borderWidth: 1, borderColor: isDarkMode ? '#4B5563' : '#D1D5DB' },
  backButtonText: { color: isDarkMode ? '#FFFFFF' : '#374151', fontWeight: '600' },
  nextButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#6366F1', paddingVertical: 14, borderRadius: 8 },
  nextButtonText: { color: '#FFFFFF', fontWeight: '600' },
  submitButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 8 },
  submitButtonText: { color: '#FFFFFF', fontWeight: '600' },
  dueDateCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: isDarkMode ? '#422006' : '#FEF3C7', padding: 16, borderRadius: 12, marginBottom: 20 },
  dueDateContent: { flex: 1 },
  dueDateLabel: { fontSize: 12, color: '#92400E' },
  dueDateValue: { fontSize: 20, fontWeight: 'bold', color: isDarkMode ? '#FCD34D' : '#92400E' },
  dueDateRule: { fontSize: 12, color: '#B45309', marginTop: 2 },
  breakdownCard: { backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: isDarkMode ? '#374151' : '#E5E7EB' },
  breakdownTitle: { fontSize: 16, fontWeight: '600', color: isDarkMode ? '#FFFFFF' : '#1F2937', marginBottom: 16 },
  breakdownSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  breakdownLabel: { color: isDarkMode ? '#D1D5DB' : '#6B7280' },
  breakdownValue: { color: isDarkMode ? '#FFFFFF' : '#1F2937', fontWeight: '500' },
  breakdownValueNeg: { color: '#EF4444', fontWeight: '500' },
  totalRow: { borderTopWidth: 1, borderTopColor: isDarkMode ? '#374151' : '#E5E7EB', paddingTop: 8, marginTop: 4 },
  totalLabel: { fontWeight: '600', color: isDarkMode ? '#FFFFFF' : '#1F2937' },
  totalValue: { fontWeight: '600', color: isDarkMode ? '#FFFFFF' : '#1F2937' },
  netPayRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: isDarkMode ? '#065F46' : '#D1FAE5', padding: 12, borderRadius: 8, marginTop: 8 },
  netPayLabel: { fontSize: 16, fontWeight: 'bold', color: isDarkMode ? '#A7F3D0' : '#065F46' },
  netPayValue: { fontSize: 18, fontWeight: 'bold', color: isDarkMode ? '#A7F3D0' : '#065F46' },
  checklistContainer: { gap: 12 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: isDarkMode ? '#374151' : '#E5E7EB' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: isDarkMode ? '#4B5563' : '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#10B981', borderColor: '#10B981' },
  checklistText: { flex: 1, color: isDarkMode ? '#FFFFFF' : '#1F2937', fontSize: 15 },
  cobraCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: isDarkMode ? '#064E3B' : '#D1FAE5', padding: 16, borderRadius: 12, marginTop: 20, marginBottom: 20 },
  cobraContent: { flex: 1 },
  cobraTitle: { fontSize: 14, fontWeight: '600', color: isDarkMode ? '#A7F3D0' : '#065F46' },
  cobraText: { fontSize: 12, color: isDarkMode ? '#6EE7B7' : '#047857', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center', width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#1F2937', marginTop: 16 },
  modalText: { color: '#6B7280', textAlign: 'center', marginTop: 8 },
  modalList: { alignSelf: 'flex-start', marginTop: 16 },
  modalListItem: { color: isDarkMode ? '#D1D5DB' : '#6B7280', marginBottom: 4 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' },
  modalCancelButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: isDarkMode ? '#4B5563' : '#D1D5DB', alignItems: 'center' },
  modalCancelText: { color: isDarkMode ? '#D1D5DB' : '#6B7280', fontWeight: '600' },
  modalConfirmButton: { flex: 1, backgroundColor: '#EF4444', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalConfirmText: { color: '#FFFFFF', fontWeight: '600' },
});

export default TerminationScreen;
