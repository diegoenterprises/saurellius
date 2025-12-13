/**
 * EMPLOYEE W-4 TAX FORM WIZARD
 * Step-by-step W-4 form completion with IRS guidelines
 * Calculates withholding based on employee selections
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

type W4Step = 'intro' | 'filing_status' | 'multiple_jobs' | 'dependents' | 'adjustments' | 'signature' | 'complete';

interface W4Data {
  filing_status: 'single' | 'married_filing_jointly' | 'head_of_household' | '';
  multiple_jobs_or_spouse_works: boolean;
  use_multiple_jobs_worksheet: boolean;
  qualifying_children_count: number;
  other_dependents_count: number;
  other_income: number;
  deductions: number;
  extra_withholding: number;
  exempt: boolean;
  signature_name: string;
  signature_date: string;
}

const FILING_STATUS_OPTIONS = [
  { 
    value: 'single', 
    label: 'Single or Married filing separately',
    description: 'Check this if you are unmarried or married but filing a separate return',
  },
  { 
    value: 'married_filing_jointly', 
    label: 'Married filing jointly',
    description: 'Check this if you are married and filing a joint return',
  },
  { 
    value: 'head_of_household', 
    label: 'Head of household',
    description: 'Check this only if you are unmarried and pay more than half the costs of keeping up a home for yourself and a qualifying individual',
  },
];

export default function W4WizardScreen() {
  const navigation = useNavigation<any>();
  const [currentStep, setCurrentStep] = useState<W4Step>('intro');
  const [loading, setLoading] = useState(false);
  const [existingW4, setExistingW4] = useState<any>(null);
  
  const [w4Data, setW4Data] = useState<W4Data>({
    filing_status: '',
    multiple_jobs_or_spouse_works: false,
    use_multiple_jobs_worksheet: false,
    qualifying_children_count: 0,
    other_dependents_count: 0,
    other_income: 0,
    deductions: 0,
    extra_withholding: 0,
    exempt: false,
    signature_name: '',
    signature_date: new Date().toISOString().split('T')[0],
  });

  const steps: W4Step[] = ['intro', 'filing_status', 'multiple_jobs', 'dependents', 'adjustments', 'signature', 'complete'];
  const getCurrentStepIndex = () => steps.indexOf(currentStep);

  useEffect(() => {
    fetchExistingW4();
  }, []);

  const fetchExistingW4 = async () => {
    try {
      const response = await api.get('/api/employee/w4');
      if (response.data.w4) {
        setExistingW4(response.data.w4);
      }
    } catch (error) {
      console.error('Failed to fetch W-4:', error);
    }
  };

  const calculateDependentCredit = () => {
    const childCredit = w4Data.qualifying_children_count * 2000;
    const otherCredit = w4Data.other_dependents_count * 500;
    return childCredit + otherCredit;
  };

  const handleNext = () => {
    const currentIndex = getCurrentStepIndex();
    
    if (currentStep === 'filing_status' && !w4Data.filing_status) {
      Alert.alert('Required', 'Please select your filing status');
      return;
    }
    
    if (currentStep === 'signature' && !w4Data.signature_name.trim()) {
      Alert.alert('Required', 'Please sign by typing your full legal name');
      return;
    }

    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/employee/w4', {
        ...w4Data,
        dependent_credit: calculateDependentCredit(),
      });

      if (response.data.success) {
        setCurrentStep('complete');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit W-4');
    } finally {
      setLoading(false);
    }
  };

  const renderIntroStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.introIcon}>
        <LinearGradient colors={['#1473FF', '#BE01FF']} style={styles.introIconGradient}>
          <Ionicons name="document-text" size={48} color="#FFF" />
        </LinearGradient>
      </View>

      <Text style={styles.introTitle}>Form W-4</Text>
      <Text style={styles.introSubtitle}>Employee's Withholding Certificate</Text>

      <View style={styles.introCard}>
        <Text style={styles.introCardTitle}>What is Form W-4?</Text>
        <Text style={styles.introCardText}>
          The W-4 form tells your employer how much federal income tax to withhold from your paycheck. 
          Your withholding affects your refund or tax due when you file your return.
        </Text>
      </View>

      <View style={styles.introCard}>
        <Text style={styles.introCardTitle}>When should I update my W-4?</Text>
        <View style={styles.bulletList}>
          {[
            'Starting a new job',
            'Getting married or divorced',
            'Having or adopting a child',
            'Major income changes',
            'Buying a home',
          ].map((item, index) => (
            <View key={index} style={styles.bulletItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {existingW4 && (
        <View style={styles.existingW4Card}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <View style={styles.existingW4Content}>
            <Text style={styles.existingW4Title}>Current W-4 on File</Text>
            <Text style={styles.existingW4Text}>
              Last updated: {new Date(existingW4.updated_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderFilingStatusStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Step 1: Filing Status</Text>
      <Text style={styles.stepSubtitle}>
        Choose the filing status that applies to your situation
      </Text>

      <View style={styles.filingOptions}>
        {FILING_STATUS_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filingOption,
              w4Data.filing_status === option.value && styles.filingOptionSelected,
            ]}
            onPress={() => setW4Data(prev => ({ ...prev, filing_status: option.value as any }))}
          >
            <View style={styles.filingOptionHeader}>
              <View style={[
                styles.filingRadio,
                w4Data.filing_status === option.value && styles.filingRadioSelected,
              ]}>
                {w4Data.filing_status === option.value && <View style={styles.filingRadioInner} />}
              </View>
              <Text style={styles.filingOptionLabel}>{option.label}</Text>
            </View>
            <Text style={styles.filingOptionDesc}>{option.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMultipleJobsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Step 2: Multiple Jobs</Text>
      <Text style={styles.stepSubtitle}>
        Complete this step if you (1) hold more than one job at a time, or (2) are married filing jointly and your spouse also works
      </Text>

      <TouchableOpacity
        style={[
          styles.yesNoOption,
          w4Data.multiple_jobs_or_spouse_works && styles.yesNoOptionSelected,
        ]}
        onPress={() => setW4Data(prev => ({ ...prev, multiple_jobs_or_spouse_works: !prev.multiple_jobs_or_spouse_works }))}
      >
        <View style={[styles.checkbox, w4Data.multiple_jobs_or_spouse_works && styles.checkboxChecked]}>
          {w4Data.multiple_jobs_or_spouse_works && <Ionicons name="checkmark" size={16} color="#FFF" />}
        </View>
        <View style={styles.yesNoContent}>
          <Text style={styles.yesNoLabel}>I have multiple jobs or my spouse works</Text>
          <Text style={styles.yesNoDesc}>
            Check this if the income from all jobs is similar and you want accurate withholding
          </Text>
        </View>
      </TouchableOpacity>

      {w4Data.multiple_jobs_or_spouse_works && (
        <View style={styles.multipleJobsOptions}>
          <Text style={styles.optionSectionTitle}>Choose how to handle withholding:</Text>

          <TouchableOpacity
            style={[
              styles.methodOption,
              !w4Data.use_multiple_jobs_worksheet && styles.methodOptionSelected,
            ]}
            onPress={() => setW4Data(prev => ({ ...prev, use_multiple_jobs_worksheet: false }))}
          >
            <View style={[styles.methodRadio, !w4Data.use_multiple_jobs_worksheet && styles.methodRadioSelected]}>
              {!w4Data.use_multiple_jobs_worksheet && <View style={styles.methodRadioInner} />}
            </View>
            <View style={styles.methodContent}>
              <Text style={styles.methodTitle}>Use the IRS Tax Withholding Estimator</Text>
              <Text style={styles.methodDesc}>Most accurate method (recommended)</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.methodOption,
              w4Data.use_multiple_jobs_worksheet && styles.methodOptionSelected,
            ]}
            onPress={() => setW4Data(prev => ({ ...prev, use_multiple_jobs_worksheet: true }))}
          >
            <View style={[styles.methodRadio, w4Data.use_multiple_jobs_worksheet && styles.methodRadioSelected]}>
              {w4Data.use_multiple_jobs_worksheet && <View style={styles.methodRadioInner} />}
            </View>
            <View style={styles.methodContent}>
              <Text style={styles.methodTitle}>Check the box (simplified method)</Text>
              <Text style={styles.methodDesc}>Only if jobs pay similar wages</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {!w4Data.multiple_jobs_or_spouse_works && (
        <View style={styles.skipInfo}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <Text style={styles.skipInfoText}>
            If you don't have multiple jobs and your spouse doesn't work, you can skip to the next step.
          </Text>
        </View>
      )}
    </View>
  );

  const renderDependentsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Step 3: Claim Dependents</Text>
      <Text style={styles.stepSubtitle}>
        If your total income will be $200,000 or less ($400,000 or less if married filing jointly), 
        enter the credit amounts below
      </Text>

      <View style={styles.dependentSection}>
        <View style={styles.dependentHeader}>
          <Ionicons name="people" size={24} color="#F59E0B" />
          <Text style={styles.dependentTitle}>Qualifying Children</Text>
        </View>
        <Text style={styles.dependentDesc}>
          Children under 17 who live with you and are related (sons, daughters, stepchildren, etc.)
        </Text>
        
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => setW4Data(prev => ({ 
              ...prev, 
              qualifying_children_count: Math.max(0, prev.qualifying_children_count - 1) 
            }))}
          >
            <Ionicons name="remove" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.counterValue}>
            <Text style={styles.counterNumber}>{w4Data.qualifying_children_count}</Text>
            <Text style={styles.counterLabel}>x $2,000 each</Text>
          </View>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => setW4Data(prev => ({ 
              ...prev, 
              qualifying_children_count: prev.qualifying_children_count + 1 
            }))}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dependentSection}>
        <View style={styles.dependentHeader}>
          <Ionicons name="person" size={24} color="#8B5CF6" />
          <Text style={styles.dependentTitle}>Other Dependents</Text>
        </View>
        <Text style={styles.dependentDesc}>
          Other qualifying relatives who live with you and meet IRS requirements
        </Text>
        
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => setW4Data(prev => ({ 
              ...prev, 
              other_dependents_count: Math.max(0, prev.other_dependents_count - 1) 
            }))}
          >
            <Ionicons name="remove" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.counterValue}>
            <Text style={styles.counterNumber}>{w4Data.other_dependents_count}</Text>
            <Text style={styles.counterLabel}>x $500 each</Text>
          </View>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => setW4Data(prev => ({ 
              ...prev, 
              other_dependents_count: prev.other_dependents_count + 1 
            }))}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.creditTotal}>
        <Text style={styles.creditTotalLabel}>Total Dependent Credit</Text>
        <Text style={styles.creditTotalValue}>${calculateDependentCredit().toLocaleString()}</Text>
      </View>
    </View>
  );

  const renderAdjustmentsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Step 4: Other Adjustments</Text>
      <Text style={styles.stepSubtitle}>
        Optional: Enter any additional adjustments to fine-tune your withholding
      </Text>

      <View style={styles.adjustmentSection}>
        <Text style={styles.adjustmentLabel}>4(a) Other Income</Text>
        <Text style={styles.adjustmentDesc}>
          Income not from jobs (interest, dividends, retirement income)
        </Text>
        <View style={styles.amountInput}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountTextInput}
            value={w4Data.other_income > 0 ? w4Data.other_income.toString() : ''}
            onChangeText={(text) => setW4Data(prev => ({ ...prev, other_income: parseFloat(text) || 0 }))}
            placeholder="0"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <View style={styles.adjustmentSection}>
        <Text style={styles.adjustmentLabel}>4(b) Deductions</Text>
        <Text style={styles.adjustmentDesc}>
          Enter amount if you expect to claim deductions other than the standard deduction
        </Text>
        <View style={styles.amountInput}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountTextInput}
            value={w4Data.deductions > 0 ? w4Data.deductions.toString() : ''}
            onChangeText={(text) => setW4Data(prev => ({ ...prev, deductions: parseFloat(text) || 0 }))}
            placeholder="0"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <View style={styles.adjustmentSection}>
        <Text style={styles.adjustmentLabel}>4(c) Extra Withholding</Text>
        <Text style={styles.adjustmentDesc}>
          Additional tax you want withheld from each paycheck
        </Text>
        <View style={styles.amountInput}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountTextInput}
            value={w4Data.extra_withholding > 0 ? w4Data.extra_withholding.toString() : ''}
            onChangeText={(text) => setW4Data(prev => ({ ...prev, extra_withholding: parseFloat(text) || 0 }))}
            placeholder="0"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.exemptOption, w4Data.exempt && styles.exemptOptionSelected]}
        onPress={() => setW4Data(prev => ({ ...prev, exempt: !prev.exempt }))}
      >
        <View style={[styles.checkbox, w4Data.exempt && styles.checkboxChecked]}>
          {w4Data.exempt && <Ionicons name="checkmark" size={16} color="#FFF" />}
        </View>
        <View style={styles.exemptContent}>
          <Text style={styles.exemptLabel}>Claim Exemption from Withholding</Text>
          <Text style={styles.exemptDesc}>
            Only check if you had no tax liability last year AND expect none this year
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderSignatureStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Step 5: Sign & Submit</Text>
      <Text style={styles.stepSubtitle}>
        Review your information and sign to complete your W-4
      </Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Your W-4 Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Filing Status</Text>
          <Text style={styles.summaryValue}>
            {FILING_STATUS_OPTIONS.find(o => o.value === w4Data.filing_status)?.label || 'Not selected'}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Multiple Jobs/Spouse Works</Text>
          <Text style={styles.summaryValue}>{w4Data.multiple_jobs_or_spouse_works ? 'Yes' : 'No'}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Dependent Credit</Text>
          <Text style={styles.summaryValue}>${calculateDependentCredit().toLocaleString()}</Text>
        </View>
        
        {w4Data.other_income > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Other Income</Text>
            <Text style={styles.summaryValue}>${w4Data.other_income.toLocaleString()}</Text>
          </View>
        )}
        
        {w4Data.extra_withholding > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Extra Withholding</Text>
            <Text style={styles.summaryValue}>${w4Data.extra_withholding}/paycheck</Text>
          </View>
        )}
        
        {w4Data.exempt && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Exempt Status</Text>
            <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>Claiming Exempt</Text>
          </View>
        )}
      </View>

      <View style={styles.signatureSection}>
        <Text style={styles.signatureTitle}>Electronic Signature</Text>
        <Text style={styles.signatureText}>
          Under penalties of perjury, I declare that this certificate, to the best of my knowledge and belief, is true, correct, and complete.
        </Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Type Your Full Legal Name *</Text>
          <TextInput
            style={styles.signatureInput}
            value={w4Data.signature_name}
            onChangeText={(text) => setW4Data(prev => ({ ...prev, signature_name: text }))}
            placeholder="Your full legal name"
            placeholderTextColor="#666"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Date</Text>
          <TextInput
            style={styles.input}
            value={w4Data.signature_date}
            editable={false}
          />
        </View>
      </View>
    </View>
  );

  const renderCompleteStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.successIcon}>
        <LinearGradient colors={['#10B981', '#059669']} style={styles.successIconGradient}>
          <Ionicons name="checkmark" size={64} color="#FFF" />
        </LinearGradient>
      </View>

      <Text style={styles.completeTitle}>W-4 Submitted Successfully!</Text>
      <Text style={styles.completeSubtitle}>
        Your federal tax withholding has been updated. Changes will take effect on your next paycheck.
      </Text>

      <View style={styles.nextStepsCard}>
        <Text style={styles.nextStepsTitle}>What Happens Next</Text>
        {[
          { icon: 'checkmark-circle', text: 'Your employer will update your withholding' },
          { icon: 'cash', text: 'Your next paycheck will reflect the changes' },
          { icon: 'calendar', text: 'Review your W-4 annually or after major life changes' },
        ].map((item, index) => (
          <View key={index} style={styles.nextStepItem}>
            <Ionicons name={item.icon as any} size={20} color="#10B981" />
            <Text style={styles.nextStepText}>{item.text}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.doneButton}
        onPress={() => navigation.goBack()}
      >
        <LinearGradient
          colors={['#1473FF', '#BE01FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.doneButtonGradient}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'intro': return renderIntroStep();
      case 'filing_status': return renderFilingStatusStep();
      case 'multiple_jobs': return renderMultipleJobsStep();
      case 'dependents': return renderDependentsStep();
      case 'adjustments': return renderAdjustmentsStep();
      case 'signature': return renderSignatureStep();
      case 'complete': return renderCompleteStep();
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Form W-4</Text>
          <View style={{ width: 24 }} />
        </View>

        {currentStep !== 'intro' && currentStep !== 'complete' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${((getCurrentStepIndex()) / (steps.length - 2)) * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>Step {getCurrentStepIndex()} of {steps.length - 2}</Text>
          </View>
        )}
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderStepContent()}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {currentStep !== 'complete' && (
        <View style={styles.footer}>
          {currentStep !== 'intro' && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={20} color="#666" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextButton, loading && styles.buttonDisabled]}
            onPress={currentStep === 'signature' ? handleSubmit : handleNext}
            disabled={loading}
          >
            <LinearGradient
              colors={['#1473FF', '#BE01FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>
                    {currentStep === 'intro' ? 'Start' : currentStep === 'signature' ? 'Submit W-4' : 'Continue'}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  progressContainer: {
    paddingHorizontal: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1473FF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContent: {
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 24,
    lineHeight: 20,
  },
  introIcon: {
    alignItems: 'center',
    marginBottom: 24,
  },
  introIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    marginBottom: 24,
  },
  introCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  introCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  introCardText: {
    fontSize: 14,
    color: '#a0a0a0',
    lineHeight: 20,
  },
  bulletList: {
    gap: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bulletText: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  existingW4Card: {
    flexDirection: 'row',
    backgroundColor: '#3B82F620',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  existingW4Content: {
    flex: 1,
  },
  existingW4Title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  existingW4Text: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 2,
  },
  filingOptions: {
    gap: 12,
  },
  filingOption: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#2a2a4e',
  },
  filingOptionSelected: {
    borderColor: '#1473FF',
    backgroundColor: '#1473FF10',
  },
  filingOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filingRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  filingRadioSelected: {
    borderColor: '#1473FF',
  },
  filingRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1473FF',
  },
  filingOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
    flex: 1,
  },
  filingOptionDesc: {
    fontSize: 13,
    color: '#a0a0a0',
    marginLeft: 34,
    lineHeight: 18,
  },
  yesNoOption: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#2a2a4e',
    marginBottom: 16,
  },
  yesNoOptionSelected: {
    borderColor: '#1473FF',
    backgroundColor: '#1473FF10',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  checkboxChecked: {
    backgroundColor: '#1473FF',
    borderColor: '#1473FF',
  },
  yesNoContent: {
    flex: 1,
  },
  yesNoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
    marginBottom: 4,
  },
  yesNoDesc: {
    fontSize: 13,
    color: '#a0a0a0',
    lineHeight: 18,
  },
  multipleJobsOptions: {
    marginTop: 8,
  },
  optionSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  methodOption: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a4e',
    marginBottom: 10,
  },
  methodOptionSelected: {
    borderColor: '#1473FF',
    backgroundColor: '#1473FF10',
  },
  methodRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodRadioSelected: {
    borderColor: '#1473FF',
  },
  methodRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1473FF',
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
  },
  methodDesc: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
  },
  skipInfo: {
    flexDirection: 'row',
    backgroundColor: '#3B82F620',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  skipInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#3B82F6',
    lineHeight: 20,
  },
  dependentSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  dependentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  dependentTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
  },
  dependentDesc: {
    fontSize: 13,
    color: '#a0a0a0',
    marginBottom: 16,
    lineHeight: 18,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1473FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    alignItems: 'center',
    minWidth: 80,
  },
  counterNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
  },
  counterLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 4,
  },
  creditTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#10B98120',
    borderRadius: 12,
    padding: 18,
  },
  creditTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  creditTotalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  adjustmentSection: {
    marginBottom: 20,
  },
  adjustmentLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  adjustmentDesc: {
    fontSize: 13,
    color: '#a0a0a0',
    marginBottom: 10,
    lineHeight: 18,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a4e',
    paddingHorizontal: 14,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
    marginRight: 8,
  },
  amountTextInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    paddingVertical: 14,
  },
  exemptOption: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#2a2a4e',
    marginTop: 8,
  },
  exemptOptionSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#F59E0B10',
  },
  exemptContent: {
    flex: 1,
  },
  exemptLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFF',
    marginBottom: 4,
  },
  exemptDesc: {
    fontSize: 13,
    color: '#a0a0a0',
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
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
  summaryLabel: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
  },
  signatureSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  signatureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  signatureText: {
    fontSize: 13,
    color: '#a0a0a0',
    lineHeight: 20,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#a0a0a0',
    marginBottom: 6,
  },
  signatureInput: {
    backgroundColor: '#0f0f23',
    borderRadius: 10,
    padding: 16,
    fontSize: 18,
    fontStyle: 'italic',
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  input: {
    backgroundColor: '#0f0f23',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  nextStepsCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  nextStepText: {
    fontSize: 14,
    color: '#a0a0a0',
    flex: 1,
  },
  doneButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  doneButtonGradient: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 34,
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#2a2a4e',
    gap: 6,
  },
  backButtonText: {
    fontSize: 16,
    color: '#a0a0a0',
  },
  nextButton: {
    flex: 1,
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
});
