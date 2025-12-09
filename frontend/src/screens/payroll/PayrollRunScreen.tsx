/**
 * PAYROLL RUN SCREEN
 * Complete payroll processing workflow
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type StepType = 'setup' | 'employees' | 'review' | 'approve';

interface PayrollEmployee {
  id: string;
  name: string;
  department: string;
  regularHours: number;
  overtimeHours: number;
  grossPay: number;
  taxes: number;
  deductions: number;
  netPay: number;
}

const MOCK_EMPLOYEES: PayrollEmployee[] = [
  { id: '1', name: 'John Smith', department: 'Engineering', regularHours: 80, overtimeHours: 5, grossPay: 4500, taxes: 1125, deductions: 450, netPay: 2925 },
  { id: '2', name: 'Sarah Johnson', department: 'Marketing', regularHours: 80, overtimeHours: 0, grossPay: 3800, taxes: 950, deductions: 380, netPay: 2470 },
  { id: '3', name: 'Mike Davis', department: 'Sales', regularHours: 80, overtimeHours: 10, grossPay: 5200, taxes: 1300, deductions: 520, netPay: 3380 },
  { id: '4', name: 'Emily Chen', department: 'Engineering', regularHours: 80, overtimeHours: 0, grossPay: 4200, taxes: 1050, deductions: 420, netPay: 2730 },
  { id: '5', name: 'David Wilson', department: 'Operations', regularHours: 80, overtimeHours: 8, grossPay: 3950, taxes: 987.50, deductions: 395, netPay: 2567.50 },
];

export default function PayrollRunScreen({ navigation }: any) {
  const [currentStep, setCurrentStep] = useState<StepType>('setup');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const steps = [
    { key: 'setup', label: 'Setup', icon: 'settings' },
    { key: 'employees', label: 'Employees', icon: 'people' },
    { key: 'review', label: 'Review', icon: 'document-text' },
    { key: 'approve', label: 'Approve', icon: 'checkmark-circle' },
  ];

  const totals = {
    employees: MOCK_EMPLOYEES.length,
    grossPay: MOCK_EMPLOYEES.reduce((sum, e) => sum + e.grossPay, 0),
    taxes: MOCK_EMPLOYEES.reduce((sum, e) => sum + e.taxes, 0),
    deductions: MOCK_EMPLOYEES.reduce((sum, e) => sum + e.deductions, 0),
    netPay: MOCK_EMPLOYEES.reduce((sum, e) => sum + e.netPay, 0),
  };

  const renderSetup = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Payroll Setup</Text>
      <Text style={styles.stepSubtitle}>Configure your payroll run</Text>

      <View style={styles.setupCard}>
        <Text style={styles.setupLabel}>Pay Period</Text>
        <View style={styles.setupOptions}>
          <TouchableOpacity style={[styles.setupOption, styles.setupOptionActive]}>
            <Text style={styles.setupOptionTextActive}>Dec 1 - Dec 15, 2024</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.setupCard}>
        <Text style={styles.setupLabel}>Pay Date</Text>
        <View style={styles.setupOptions}>
          <TouchableOpacity style={[styles.setupOption, styles.setupOptionActive]}>
            <Ionicons name="calendar" size={18} color="#1473FF" />
            <Text style={styles.setupOptionTextActive}>December 20, 2024</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.setupCard}>
        <Text style={styles.setupLabel}>Payroll Type</Text>
        <View style={styles.typeGrid}>
          {['Regular', 'Off-Cycle', 'Bonus', 'Final'].map((type) => (
            <TouchableOpacity 
              key={type} 
              style={[styles.typeOption, type === 'Regular' && styles.typeOptionActive]}
            >
              <Text style={[styles.typeOptionText, type === 'Regular' && styles.typeOptionTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color="#3B82F6" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Payroll Schedule</Text>
          <Text style={styles.infoText}>
            This is a bi-weekly payroll. Tax deposits will be due by January 15, 2025.
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={() => setCurrentStep('employees')}>
        <LinearGradient
          colors={['#1473FF', '#BE01FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.nextButtonGradient}
        >
          <Text style={styles.nextButtonText}>Continue to Employees</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderEmployees = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <View>
          <Text style={styles.stepTitle}>Employee Earnings</Text>
          <Text style={styles.stepSubtitle}>{totals.employees} employees in this payroll</Text>
        </View>
        <TouchableOpacity style={styles.addEmployeeBtn}>
          <Ionicons name="add" size={20} color="#1473FF" />
        </TouchableOpacity>
      </View>

      <View style={styles.employeesList}>
        {MOCK_EMPLOYEES.map((employee) => (
          <TouchableOpacity key={employee.id} style={styles.employeeCard}>
            <View style={styles.employeeHeader}>
              <View style={styles.employeeAvatar}>
                <Text style={styles.avatarText}>{employee.name.charAt(0)}</Text>
              </View>
              <View style={styles.employeeInfo}>
                <Text style={styles.employeeName}>{employee.name}</Text>
                <Text style={styles.employeeDept}>{employee.department}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>

            <View style={styles.hoursRow}>
              <View style={styles.hoursItem}>
                <Text style={styles.hoursLabel}>Regular</Text>
                <Text style={styles.hoursValue}>{employee.regularHours}h</Text>
              </View>
              <View style={styles.hoursItem}>
                <Text style={styles.hoursLabel}>Overtime</Text>
                <Text style={[styles.hoursValue, employee.overtimeHours > 0 && styles.overtimeValue]}>
                  {employee.overtimeHours}h
                </Text>
              </View>
              <View style={styles.hoursItem}>
                <Text style={styles.hoursLabel}>Gross</Text>
                <Text style={styles.grossValue}>{formatCurrency(employee.grossPay)}</Text>
              </View>
            </View>

            <View style={styles.payBreakdown}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Taxes</Text>
                <Text style={styles.breakdownValue}>-{formatCurrency(employee.taxes)}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Deductions</Text>
                <Text style={styles.breakdownValue}>-{formatCurrency(employee.deductions)}</Text>
              </View>
              <View style={[styles.breakdownItem, styles.netPayItem]}>
                <Text style={styles.netPayLabel}>Net Pay</Text>
                <Text style={styles.netPayValue}>{formatCurrency(employee.netPay)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.navButtons}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep('setup')}>
          <Ionicons name="arrow-back" size={20} color="#666" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButtonSmall} onPress={() => setCurrentStep('review')}>
          <LinearGradient
            colors={['#1473FF', '#BE01FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonSmallGradient}
          >
            <Text style={styles.nextButtonText}>Review</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReview = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review Payroll</Text>
      <Text style={styles.stepSubtitle}>Verify totals before approval</Text>

      <View style={styles.summaryCard}>
        <LinearGradient
          colors={['#1473FF', '#BE01FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.summaryGradient}
        >
          <Text style={styles.summaryLabel}>Total Payroll</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(totals.grossPay)}</Text>
          <Text style={styles.summaryEmployees}>{totals.employees} employees</Text>
        </LinearGradient>
      </View>

      <View style={styles.totalsCard}>
        <Text style={styles.totalsTitle}>Payroll Summary</Text>
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Gross Pay</Text>
          <Text style={styles.totalValue}>{formatCurrency(totals.grossPay)}</Text>
        </View>
        
        <View style={styles.totalsDivider} />
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Employee Taxes</Text>
          <Text style={[styles.totalValue, styles.deductionValue]}>-{formatCurrency(totals.taxes)}</Text>
        </View>
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Deductions</Text>
          <Text style={[styles.totalValue, styles.deductionValue]}>-{formatCurrency(totals.deductions)}</Text>
        </View>
        
        <View style={styles.totalsDivider} />
        
        <View style={[styles.totalRow, styles.netPayRow]}>
          <Text style={styles.netPayLabelLarge}>Net Pay</Text>
          <Text style={styles.netPayValueLarge}>{formatCurrency(totals.netPay)}</Text>
        </View>
      </View>

      <View style={styles.taxCard}>
        <Text style={styles.taxTitle}>Employer Taxes</Text>
        <View style={styles.taxItems}>
          <View style={styles.taxItem}>
            <Text style={styles.taxLabel}>Social Security (6.2%)</Text>
            <Text style={styles.taxValue}>{formatCurrency(totals.grossPay * 0.062)}</Text>
          </View>
          <View style={styles.taxItem}>
            <Text style={styles.taxLabel}>Medicare (1.45%)</Text>
            <Text style={styles.taxValue}>{formatCurrency(totals.grossPay * 0.0145)}</Text>
          </View>
          <View style={styles.taxItem}>
            <Text style={styles.taxLabel}>FUTA (0.6%)</Text>
            <Text style={styles.taxValue}>{formatCurrency(totals.grossPay * 0.006)}</Text>
          </View>
          <View style={styles.taxItem}>
            <Text style={styles.taxLabel}>SUTA (2.7%)</Text>
            <Text style={styles.taxValue}>{formatCurrency(totals.grossPay * 0.027)}</Text>
          </View>
        </View>
        <View style={styles.totalsDivider} />
        <View style={styles.taxItem}>
          <Text style={styles.totalEmployerLabel}>Total Employer Cost</Text>
          <Text style={styles.totalEmployerValue}>
            {formatCurrency(totals.grossPay + (totals.grossPay * 0.1075))}
          </Text>
        </View>
      </View>

      <View style={styles.navButtons}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep('employees')}>
          <Ionicons name="arrow-back" size={20} color="#666" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButtonSmall} onPress={() => setCurrentStep('approve')}>
          <LinearGradient
            colors={['#1473FF', '#BE01FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonSmallGradient}
          >
            <Text style={styles.nextButtonText}>Approve</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderApprove = () => (
    <View style={styles.stepContent}>
      <View style={styles.approveHeader}>
        <View style={styles.approveIcon}>
          <Ionicons name="checkmark-circle" size={48} color="#10B981" />
        </View>
        <Text style={styles.approveTitle}>Ready to Process</Text>
        <Text style={styles.approveSubtitle}>Review and approve this payroll</Text>
      </View>

      <View style={styles.finalSummary}>
        <View style={styles.finalRow}>
          <Text style={styles.finalLabel}>Pay Period</Text>
          <Text style={styles.finalValue}>Dec 1 - Dec 15, 2024</Text>
        </View>
        <View style={styles.finalRow}>
          <Text style={styles.finalLabel}>Pay Date</Text>
          <Text style={styles.finalValue}>December 20, 2024</Text>
        </View>
        <View style={styles.finalRow}>
          <Text style={styles.finalLabel}>Employees</Text>
          <Text style={styles.finalValue}>{totals.employees}</Text>
        </View>
        <View style={styles.finalDivider} />
        <View style={styles.finalRow}>
          <Text style={styles.finalLabel}>Total Net Pay</Text>
          <Text style={styles.finalValueLarge}>{formatCurrency(totals.netPay)}</Text>
        </View>
        <View style={styles.finalRow}>
          <Text style={styles.finalLabel}>Total Employer Cost</Text>
          <Text style={styles.finalValueLarge}>{formatCurrency(totals.grossPay * 1.1075)}</Text>
        </View>
      </View>

      <View style={styles.checklistCard}>
        <Text style={styles.checklistTitle}>Pre-Process Checklist</Text>
        {[
          'Verified all employee hours',
          'Confirmed tax calculations',
          'Reviewed deductions',
          'Bank account has sufficient funds',
        ].map((item, index) => (
          <View key={index} style={styles.checklistItem}>
            <View style={styles.checkbox}>
              <Ionicons name="checkmark" size={14} color="#FFF" />
            </View>
            <Text style={styles.checklistText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.navButtons}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep('review')}>
          <Ionicons name="arrow-back" size={20} color="#666" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.processButton} 
          onPress={() => setShowConfirmModal(true)}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.processButtonGradient}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
            <Text style={styles.processButtonText}>Process Payroll</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1473FF', '#BE01FF']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Run Payroll</Text>
          <TouchableOpacity>
            <Ionicons name="help-circle-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Progress Steps */}
        <View style={styles.progressBar}>
          {steps.map((step, index) => (
            <React.Fragment key={step.key}>
              <View style={styles.stepIndicator}>
                <View style={[
                  styles.stepCircle,
                  steps.findIndex(s => s.key === currentStep) >= index && styles.stepCircleActive
                ]}>
                  <Ionicons 
                    name={step.icon as any} 
                    size={14} 
                    color={steps.findIndex(s => s.key === currentStep) >= index ? '#FFF' : 'rgba(255,255,255,0.4)'} 
                  />
                </View>
                <Text style={[
                  styles.stepLabel,
                  steps.findIndex(s => s.key === currentStep) >= index && styles.stepLabelActive
                ]}>
                  {step.label}
                </Text>
              </View>
              {index < steps.length - 1 && (
                <View style={[
                  styles.stepLine,
                  steps.findIndex(s => s.key === currentStep) > index && styles.stepLineActive
                ]} />
              )}
            </React.Fragment>
          ))}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 'setup' && renderSetup()}
        {currentStep === 'employees' && renderEmployees()}
        {currentStep === 'review' && renderReview()}
        {currentStep === 'approve' && renderApprove()}
      </ScrollView>

      {/* Confirm Modal */}
      <Modal visible={showConfirmModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.confirmIcon}>
              <Ionicons name="help-circle" size={48} color="#F59E0B" />
            </View>
            <Text style={styles.confirmTitle}>Process Payroll?</Text>
            <Text style={styles.confirmText}>
              This will initiate direct deposits for {totals.employees} employees totaling {formatCurrency(totals.netPay)}.
            </Text>
            <Text style={styles.confirmWarning}>This action cannot be undone.</Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={() => {
                  setShowConfirmModal(false);
                  setIsProcessing(true);
                  setTimeout(() => {
                    setIsProcessing(false);
                    Alert.alert('Success', 'Payroll processed successfully!', [
                      { text: 'OK', onPress: () => navigation.goBack() }
                    ]);
                  }, 2000);
                }}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.confirmButtonGradient}
                >
                  <Text style={styles.confirmButtonText}>Process</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  stepIndicator: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  stepLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
  stepLabelActive: {
    color: '#FFF',
    fontWeight: '500',
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 4,
    marginBottom: 16,
  },
  stepLineActive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 16,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  addEmployeeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setupCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  setupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  setupOptions: {},
  setupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    gap: 10,
  },
  setupOptionActive: {
    backgroundColor: '#EBF5FF',
    borderWidth: 1,
    borderColor: '#1473FF',
  },
  setupOptionTextActive: {
    fontSize: 15,
    color: '#1473FF',
    fontWeight: '500',
  },
  typeGrid: {
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
  typeOptionActive: {
    backgroundColor: '#1473FF',
  },
  typeOptionText: {
    fontSize: 13,
    color: '#666',
  },
  typeOptionTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EBF5FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  nextButton: {
    marginTop: 'auto',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  employeesList: {
    gap: 12,
    marginBottom: 20,
  },
  employeeCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  employeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1473FF',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  employeeDept: {
    fontSize: 13,
    color: '#666',
  },
  hoursRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  hoursItem: {
    flex: 1,
  },
  hoursLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  hoursValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  overtimeValue: {
    color: '#F59E0B',
  },
  grossValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1473FF',
  },
  payBreakdown: {
    gap: 6,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 13,
    color: '#666',
  },
  netPayItem: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  netPayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  netPayValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#FFF',
    gap: 6,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
  },
  nextButtonSmall: {
    flex: 1,
  },
  nextButtonSmallGradient: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  summaryGradient: {
    padding: 24,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
  },
  summaryEmployees: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  totalsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  totalsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  deductionValue: {
    color: '#EF4444',
  },
  totalsDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  netPayRow: {
    marginTop: 4,
  },
  netPayLabelLarge: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  netPayValueLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  taxCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  taxTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  taxItems: {
    gap: 8,
  },
  taxItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taxLabel: {
    fontSize: 14,
    color: '#666',
  },
  taxValue: {
    fontSize: 14,
    color: '#333',
  },
  totalEmployerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  totalEmployerValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1473FF',
  },
  approveHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  approveIcon: {
    marginBottom: 12,
  },
  approveTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  approveSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  finalSummary: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  finalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  finalLabel: {
    fontSize: 14,
    color: '#666',
  },
  finalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  finalDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 10,
  },
  finalValueLarge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1473FF',
  },
  checklistCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checklistText: {
    fontSize: 14,
    color: '#333',
  },
  processButton: {
    flex: 1,
  },
  processButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  processButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmModal: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  confirmIcon: {
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  confirmText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmWarning: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  confirmButton: {
    flex: 1,
  },
  confirmButtonGradient: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
