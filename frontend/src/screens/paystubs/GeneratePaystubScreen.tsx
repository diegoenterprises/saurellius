/**
 * GENERATE PAYSTUB SCREEN
 * Create new paystub with employee selection and earnings input
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface PaystubFormData {
  employee_id: string;
  employee_name: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  regular_hours: string;
  regular_rate: string;
  overtime_hours: string;
  bonus: string;
  commission: string;
  state: string;
  filing_status: string;
  allowances: string;
}

const EMPLOYEES = [
  { id: '1', name: 'Sarah Johnson', department: 'Engineering' },
  { id: '2', name: 'Michael Chen', department: 'Design' },
  { id: '3', name: 'Emily Davis', department: 'Marketing' },
  { id: '4', name: 'James Wilson', department: 'Sales' },
];

const STATES = ['CA', 'TX', 'NY', 'FL', 'WA', 'IL', 'PA', 'OH', 'GA', 'NC'];
const FILING_STATUSES = ['Single', 'Married Filing Jointly', 'Married Filing Separately', 'Head of Household'];

export default function GeneratePaystubScreen({ navigation }: any) {
  const [formData, setFormData] = useState<PaystubFormData>({
    employee_id: '',
    employee_name: '',
    pay_period_start: '',
    pay_period_end: '',
    pay_date: '',
    regular_hours: '80',
    regular_rate: '',
    overtime_hours: '0',
    bonus: '0',
    commission: '0',
    state: 'CA',
    filing_status: 'Single',
    allowances: '1',
  });
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showEmployeeSelect, setShowEmployeeSelect] = useState(false);

  const updateField = (field: keyof PaystubFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const selectEmployee = (employee: typeof EMPLOYEES[0]) => {
    setFormData((prev) => ({
      ...prev,
      employee_id: employee.id,
      employee_name: employee.name,
    }));
    setShowEmployeeSelect(false);
  };

  const calculateGrossPay = () => {
    const regularPay = parseFloat(formData.regular_hours || '0') * parseFloat(formData.regular_rate || '0');
    const overtimePay = parseFloat(formData.overtime_hours || '0') * parseFloat(formData.regular_rate || '0') * 1.5;
    const bonus = parseFloat(formData.bonus || '0');
    const commission = parseFloat(formData.commission || '0');
    return regularPay + overtimePay + bonus + commission;
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.employee_id) {
          Alert.alert('Required', 'Please select an employee');
          return false;
        }
        if (!formData.pay_period_start || !formData.pay_period_end || !formData.pay_date) {
          Alert.alert('Required', 'Please enter pay period dates');
          return false;
        }
        return true;
      case 2:
        if (!formData.regular_rate || parseFloat(formData.regular_rate) <= 0) {
          Alert.alert('Required', 'Please enter a valid hourly rate');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleGenerate = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert('Success', 'Paystub generated successfully', [
        { text: 'View', onPress: () => navigation.navigate('PaystubDetail', { paystubId: '123' }) },
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate paystub');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderInput = (
    label: string,
    field: keyof PaystubFormData,
    options?: {
      placeholder?: string;
      keyboardType?: 'default' | 'numeric' | 'decimal-pad';
      prefix?: string;
    }
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        {options?.prefix && <Text style={styles.inputPrefix}>{options.prefix}</Text>}
        <TextInput
          style={[styles.input, options?.prefix ? styles.inputWithPrefix : null]}
          value={formData[field]}
          onChangeText={(text) => updateField(field, text)}
          placeholder={options?.placeholder || ''}
          placeholderTextColor="#999"
          keyboardType={options?.keyboardType || 'default'}
        />
      </View>
    </View>
  );

  const renderStep1 = () => (
    <>
      <Text style={styles.stepTitle}>Employee & Pay Period</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Employee</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowEmployeeSelect(!showEmployeeSelect)}
        >
          <Text style={formData.employee_name ? styles.selectText : styles.selectPlaceholder}>
            {formData.employee_name || 'Select an employee'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        {showEmployeeSelect && (
          <View style={styles.dropdown}>
            {EMPLOYEES.map((emp) => (
              <TouchableOpacity
                key={emp.id}
                style={styles.dropdownItem}
                onPress={() => selectEmployee(emp)}
              >
                <Text style={styles.dropdownName}>{emp.name}</Text>
                <Text style={styles.dropdownDept}>{emp.department}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {renderInput('Pay Period Start', 'pay_period_start', { placeholder: 'YYYY-MM-DD' })}
      {renderInput('Pay Period End', 'pay_period_end', { placeholder: 'YYYY-MM-DD' })}
      {renderInput('Pay Date', 'pay_date', { placeholder: 'YYYY-MM-DD' })}
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.stepTitle}>Earnings</Text>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          {renderInput('Regular Hours', 'regular_hours', { keyboardType: 'decimal-pad' })}
        </View>
        <View style={styles.halfInput}>
          {renderInput('Hourly Rate', 'regular_rate', { keyboardType: 'decimal-pad', prefix: '$' })}
        </View>
      </View>

      {renderInput('Overtime Hours', 'overtime_hours', { keyboardType: 'decimal-pad' })}
      {renderInput('Bonus', 'bonus', { keyboardType: 'decimal-pad', prefix: '$' })}
      {renderInput('Commission', 'commission', { keyboardType: 'decimal-pad', prefix: '$' })}

      <View style={styles.grossPayCard}>
        <Text style={styles.grossPayLabel}>Estimated Gross Pay</Text>
        <Text style={styles.grossPayValue}>{formatCurrency(calculateGrossPay())}</Text>
      </View>
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.stepTitle}>Tax Information</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>State</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
          {STATES.map((state) => (
            <TouchableOpacity
              key={state}
              style={[styles.chip, formData.state === state && styles.chipSelected]}
              onPress={() => updateField('state', state)}
            >
              <Text style={[styles.chipText, formData.state === state && styles.chipTextSelected]}>
                {state}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Filing Status</Text>
        {FILING_STATUSES.map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.radioOption, formData.filing_status === status && styles.radioOptionSelected]}
            onPress={() => updateField('filing_status', status)}
          >
            <View style={[styles.radio, formData.filing_status === status && styles.radioSelected]}>
              {formData.filing_status === status && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioText}>{status}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderInput('Allowances', 'allowances', { keyboardType: 'numeric' })}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Employee</Text>
          <Text style={styles.summaryValue}>{formData.employee_name}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Pay Period</Text>
          <Text style={styles.summaryValue}>{formData.pay_period_start} to {formData.pay_period_end}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Gross Pay</Text>
          <Text style={styles.summaryValue}>{formatCurrency(calculateGrossPay())}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>State</Text>
          <Text style={styles.summaryValue}>{formData.state}</Text>
        </View>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#1473FF', '#BE01FF']} style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Generate Paystub</Text>
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((step) => (
            <View
              key={step}
              style={[styles.progressDot, currentStep >= step && styles.progressDotActive]}
            />
          ))}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backStepButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color="#666" />
            <Text style={styles.backStepText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, loading && styles.buttonDisabled]}
          onPress={currentStep === 3 ? handleGenerate : handleNext}
          disabled={loading}
        >
          <LinearGradient
            colors={['#1473FF', '#BE01FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {loading ? 'Generating...' : currentStep === 3 ? 'Generate Paystub' : 'Continue'}
            </Text>
            {!loading && currentStep < 3 && (
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressDotActive: {
    backgroundColor: '#FFF',
    width: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  inputPrefix: {
    paddingLeft: 14,
    fontSize: 16,
    color: '#666',
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  inputWithPrefix: {
    paddingLeft: 4,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  selectText: {
    fontSize: 16,
    color: '#333',
  },
  selectPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  dropdown: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#EEE',
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  dropdownDept: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  grossPayCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  grossPayLabel: {
    fontSize: 14,
    color: '#666',
  },
  grossPayValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1473FF',
    marginTop: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  chipSelected: {
    backgroundColor: '#1473FF',
    borderColor: '#1473FF',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
  },
  chipTextSelected: {
    color: '#FFF',
    fontWeight: '500',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  radioOptionSelected: {
    borderColor: '#1473FF',
    backgroundColor: '#F0F7FF',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCC',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#1473FF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1473FF',
  },
  radioText: {
    fontSize: 15,
    color: '#333',
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 34,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    alignItems: 'center',
  },
  backStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backStepText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  nextButton: {
    flex: 1,
    marginLeft: 12,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  bottomPadding: {
    height: 40,
  },
});
