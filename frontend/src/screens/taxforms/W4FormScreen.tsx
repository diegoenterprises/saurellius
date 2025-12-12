/**
 * SAURELLIUS W-4 FORM
 * Electronic W-4 submission with all 5 steps
 * Supports 2020+ W-4 format
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type FilingStatus = 'single' | 'married_jointly' | 'married_separately' | 'head_of_household' | 'qualifying_surviving_spouse';

interface W4Data {
  filingStatus: FilingStatus;
  step2Checkbox: boolean;
  step2Additional: string;
  qualifyingChildren: string;
  otherDependents: string;
  otherIncome: string;
  deductions: string;
  extraWithholding: string;
  claimExempt: boolean;
}

const FILING_STATUS_OPTIONS: { value: FilingStatus; label: string; description: string }[] = [
  { value: 'single', label: 'Single', description: 'Unmarried or legally separated' },
  { value: 'married_jointly', label: 'Married Filing Jointly', description: 'Married and filing a joint return' },
  { value: 'married_separately', label: 'Married Filing Separately', description: 'Married but filing separate returns' },
  { value: 'head_of_household', label: 'Head of Household', description: 'Unmarried with qualifying dependent' },
  { value: 'qualifying_surviving_spouse', label: 'Qualifying Surviving Spouse', description: 'Widow(er) with dependent child' },
];

const W4FormScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<W4Data>({
    filingStatus: 'single',
    step2Checkbox: false,
    step2Additional: '',
    qualifyingChildren: '0',
    otherDependents: '0',
    otherIncome: '',
    deductions: '',
    extraWithholding: '',
    claimExempt: false,
  });
  const [signature, setSignature] = useState('');
  
  // Calculated values
  const step3Total = (parseInt(formData.qualifyingChildren) || 0) * 2000 + 
                     (parseInt(formData.otherDependents) || 0) * 500;
  
  const handleSubmit = () => {
    if (!signature) {
      Alert.alert('Signature Required', 'Please sign the form to submit.');
      return;
    }
    
    Alert.alert(
      'Submit W-4',
      'Your W-4 will be effective on your next paycheck. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit',
          onPress: () => {
            Alert.alert('Success', 'Your W-4 has been submitted successfully.');
          }
        },
      ]
    );
  };
  
  const styles = createStyles(isDarkMode);
  
  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Step 1: Enter Personal Information</Text>
      <Text style={styles.stepDescription}>
        Choose your filing status. This determines your standard deduction and tax bracket.
      </Text>
      
      <View style={styles.filingStatusOptions}>
        {FILING_STATUS_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filingOption,
              formData.filingStatus === option.value && styles.filingOptionSelected
            ]}
            onPress={() => setFormData({ ...formData, filingStatus: option.value })}
          >
            <View style={styles.radioOuter}>
              {formData.filingStatus === option.value && <View style={styles.radioInner} />}
            </View>
            <View style={styles.filingOptionText}>
              <Text style={[
                styles.filingOptionLabel,
                formData.filingStatus === option.value && styles.filingOptionLabelSelected
              ]}>
                {option.label}
              </Text>
              <Text style={styles.filingOptionDesc}>{option.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity style={styles.nextButton} onPress={() => setCurrentStep(2)}>
        <Text style={styles.nextButtonText}>Continue to Step 2</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
  
  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Step 2: Multiple Jobs or Spouse Works</Text>
      <Text style={styles.stepDescription}>
        Complete this step if you (1) hold more than one job at a time, or (2) are married filing jointly 
        and your spouse also works. Skip if neither applies.
      </Text>
      
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={24} color="#6366F1" />
        <Text style={styles.infoText}>
          If you have two jobs with similar pay, you can simply check the box below. 
          Otherwise, use the IRS Tax Withholding Estimator or the Multiple Jobs Worksheet.
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setFormData({ ...formData, step2Checkbox: !formData.step2Checkbox })}
      >
        <View style={[styles.checkbox, formData.step2Checkbox && styles.checkboxChecked]}>
          {formData.step2Checkbox && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </View>
        <Text style={styles.checkboxLabel}>
          Check here if you have two jobs with similar pay (or if you're married filing jointly 
          and your spouse's job pays similarly to yours)
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.inputLabel}>
        Additional amount from IRS estimator or worksheet (optional)
      </Text>
      <TextInput
        style={styles.input}
        value={formData.step2Additional}
        onChangeText={(text) => setFormData({ ...formData, step2Additional: text })}
        placeholder="$0"
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
      />
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep(1)}>
          <Ionicons name="arrow-back" size={20} color={isDarkMode ? '#FFFFFF' : '#374151'} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={() => setCurrentStep(3)}>
          <Text style={styles.nextButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Step 3: Claim Dependents</Text>
      <Text style={styles.stepDescription}>
        If your total income will be $200,000 or less ($400,000 or less if married filing jointly), 
        enter your dependents to reduce your withholding.
      </Text>
      
      <View style={styles.dependentRow}>
        <View style={styles.dependentInput}>
          <Text style={styles.inputLabel}>Qualifying children under age 17</Text>
          <TextInput
            style={styles.input}
            value={formData.qualifyingChildren}
            onChangeText={(text) => setFormData({ ...formData, qualifyingChildren: text })}
            placeholder="0"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
          <Text style={styles.inputHelper}>× $2,000 each</Text>
        </View>
        
        <View style={styles.dependentInput}>
          <Text style={styles.inputLabel}>Other dependents</Text>
          <TextInput
            style={styles.input}
            value={formData.otherDependents}
            onChangeText={(text) => setFormData({ ...formData, otherDependents: text })}
            placeholder="0"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
          <Text style={styles.inputHelper}>× $500 each</Text>
        </View>
      </View>
      
      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Total Dependent Credit</Text>
        <Text style={styles.totalValue}>${step3Total.toLocaleString()}</Text>
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep(2)}>
          <Ionicons name="arrow-back" size={20} color={isDarkMode ? '#FFFFFF' : '#374151'} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={() => setCurrentStep(4)}>
          <Text style={styles.nextButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Step 4: Other Adjustments (Optional)</Text>
      <Text style={styles.stepDescription}>
        Use this step to adjust your withholding for other income, deductions, or to request extra withholding.
      </Text>
      
      <Text style={styles.inputLabel}>
        (a) Other income (not from jobs) - interest, dividends, retirement
      </Text>
      <TextInput
        style={styles.input}
        value={formData.otherIncome}
        onChangeText={(text) => setFormData({ ...formData, otherIncome: text })}
        placeholder="$0"
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
      />
      <Text style={styles.inputHelper}>This increases your withholding</Text>
      
      <Text style={styles.inputLabel}>
        (b) Deductions beyond standard deduction (itemized deductions)
      </Text>
      <TextInput
        style={styles.input}
        value={formData.deductions}
        onChangeText={(text) => setFormData({ ...formData, deductions: text })}
        placeholder="$0"
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
      />
      <Text style={styles.inputHelper}>This decreases your withholding</Text>
      
      <Text style={styles.inputLabel}>
        (c) Extra withholding per pay period
      </Text>
      <TextInput
        style={styles.input}
        value={formData.extraWithholding}
        onChangeText={(text) => setFormData({ ...formData, extraWithholding: text })}
        placeholder="$0"
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
      />
      <Text style={styles.inputHelper}>Additional amount to withhold from each paycheck</Text>
      
      <View style={styles.exemptBox}>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setFormData({ ...formData, claimExempt: !formData.claimExempt })}
        >
          <View style={[styles.checkbox, formData.claimExempt && styles.checkboxChecked]}>
            {formData.claimExempt && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
          </View>
          <Text style={styles.checkboxLabel}>
            Claim exempt from withholding (you had no tax liability last year AND expect none this year)
          </Text>
        </TouchableOpacity>
        {formData.claimExempt && (
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={styles.warningText}>
              Exempt status expires on February 15 of next year. You must recertify annually.
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep(3)}>
          <Ionicons name="arrow-back" size={20} color={isDarkMode ? '#FFFFFF' : '#374151'} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={() => setCurrentStep(5)}>
          <Text style={styles.nextButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Step 5: Sign Here</Text>
      <Text style={styles.stepDescription}>
        Under penalties of perjury, I declare that this certificate, to the best of my knowledge and belief, 
        is true, correct, and complete.
      </Text>
      
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>W-4 Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Filing Status:</Text>
          <Text style={styles.summaryValue}>
            {FILING_STATUS_OPTIONS.find(o => o.value === formData.filingStatus)?.label}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Multiple Jobs:</Text>
          <Text style={styles.summaryValue}>
            {formData.step2Checkbox ? 'Yes' : 'No'}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Dependent Credit:</Text>
          <Text style={styles.summaryValue}>${step3Total.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Other Income:</Text>
          <Text style={styles.summaryValue}>${formData.otherIncome || '0'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Extra Deductions:</Text>
          <Text style={styles.summaryValue}>${formData.deductions || '0'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Extra Withholding:</Text>
          <Text style={styles.summaryValue}>${formData.extraWithholding || '0'}/paycheck</Text>
        </View>
        {formData.claimExempt && (
          <View style={styles.exemptBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#F59E0B" />
            <Text style={styles.exemptBadgeText}>Claiming Exempt</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.inputLabel}>Electronic Signature *</Text>
      <TextInput
        style={styles.input}
        value={signature}
        onChangeText={setSignature}
        placeholder="Type your full legal name"
        placeholderTextColor="#9CA3AF"
      />
      
      <Text style={styles.dateLabel}>Date: {new Date().toLocaleDateString()}</Text>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep(4)}>
          <Ionicons name="arrow-back" size={20} color={isDarkMode ? '#FFFFFF' : '#374151'} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit W-4</Text>
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.header}>
        <Text style={styles.headerTitle}>Form W-4</Text>
        <Text style={styles.headerSubtitle}>Employee's Withholding Certificate</Text>
      </LinearGradient>
      
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4, 5].map(step => (
          <View key={step} style={styles.progressStep}>
            <View style={[
              styles.progressCircle,
              currentStep >= step && styles.progressCircleActive,
              currentStep > step && styles.progressCircleComplete
            ]}>
              {currentStep > step ? (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              ) : (
                <Text style={[
                  styles.progressNumber,
                  currentStep >= step && styles.progressNumberActive
                ]}>{step}</Text>
              )}
            </View>
            {step < 5 && <View style={[
              styles.progressLine,
              currentStep > step && styles.progressLineActive
            ]} />}
          </View>
        ))}
      </View>
      
      <ScrollView style={styles.content}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
      </ScrollView>
    </View>
  );
};

const createStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDarkMode ? '#111827' : '#F3F4F6' },
  header: { padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  progressContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' },
  progressStep: { flexDirection: 'row', alignItems: 'center' },
  progressCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: isDarkMode ? '#374151' : '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  progressCircleActive: { backgroundColor: '#6366F1' },
  progressCircleComplete: { backgroundColor: '#10B981' },
  progressNumber: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  progressNumberActive: { color: '#FFFFFF' },
  progressLine: { width: 40, height: 2, backgroundColor: isDarkMode ? '#374151' : '#E5E7EB', marginHorizontal: 4 },
  progressLineActive: { backgroundColor: '#10B981' },
  content: { flex: 1 },
  stepContent: { padding: 20 },
  stepTitle: { fontSize: 20, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#1F2937', marginBottom: 8 },
  stepDescription: { fontSize: 14, color: '#6B7280', marginBottom: 20, lineHeight: 20 },
  filingStatusOptions: { gap: 12 },
  filingOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderWidth: 2, borderColor: isDarkMode ? '#374151' : '#E5E7EB' },
  filingOptionSelected: { borderColor: '#6366F1', backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF' },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#6366F1', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#6366F1' },
  filingOptionText: { flex: 1 },
  filingOptionLabel: { fontSize: 16, fontWeight: '600', color: isDarkMode ? '#FFFFFF' : '#1F2937' },
  filingOptionLabelSelected: { color: '#6366F1' },
  filingOptionDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: isDarkMode ? '#D1D5DB' : '#374151', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: isDarkMode ? '#374151' : '#FFFFFF', borderRadius: 8, padding: 14, fontSize: 16, color: isDarkMode ? '#FFFFFF' : '#1F2937', borderWidth: 1, borderColor: isDarkMode ? '#4B5563' : '#D1D5DB' },
  inputHelper: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, backgroundColor: isDarkMode ? '#1E3A5F' : '#EEF2FF', borderRadius: 12, marginBottom: 20 },
  infoText: { flex: 1, fontSize: 13, color: isDarkMode ? '#93C5FD' : '#4338CA', lineHeight: 20 },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderRadius: 12, marginBottom: 16 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: isDarkMode ? '#4B5563' : '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  checkboxLabel: { flex: 1, fontSize: 14, color: isDarkMode ? '#D1D5DB' : '#374151', lineHeight: 20 },
  dependentRow: { flexDirection: 'row', gap: 16 },
  dependentInput: { flex: 1 },
  totalBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: isDarkMode ? '#065F46' : '#D1FAE5', borderRadius: 12, marginTop: 20 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: isDarkMode ? '#A7F3D0' : '#065F46' },
  totalValue: { fontSize: 24, fontWeight: 'bold', color: isDarkMode ? '#A7F3D0' : '#065F46' },
  exemptBox: { marginTop: 20, padding: 16, backgroundColor: isDarkMode ? '#422006' : '#FEF3C7', borderRadius: 12 },
  warningBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  warningText: { flex: 1, fontSize: 12, color: '#92400E' },
  summaryCard: { backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: isDarkMode ? '#374151' : '#E5E7EB' },
  summaryTitle: { fontSize: 16, fontWeight: '600', color: isDarkMode ? '#FFFFFF' : '#1F2937', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB' },
  summaryLabel: { fontSize: 14, color: '#6B7280' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: isDarkMode ? '#FFFFFF' : '#1F2937' },
  exemptBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 8, backgroundColor: isDarkMode ? '#422006' : '#FEF3C7', borderRadius: 8 },
  exemptBadgeText: { color: '#92400E', fontWeight: '600' },
  dateLabel: { fontSize: 14, color: '#6B7280', marginTop: 8 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  backButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 8, borderWidth: 1, borderColor: isDarkMode ? '#4B5563' : '#D1D5DB' },
  backButtonText: { color: isDarkMode ? '#FFFFFF' : '#374151', fontWeight: '600' },
  nextButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#6366F1', paddingVertical: 14, borderRadius: 8 },
  nextButtonText: { color: '#FFFFFF', fontWeight: '600' },
  submitButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 8 },
  submitButtonText: { color: '#FFFFFF', fontWeight: '600' },
});

export default W4FormScreen;
