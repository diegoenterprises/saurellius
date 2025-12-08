/**
 * ✨ STANDALONE PAYSTUB GENERATOR
 * For employers to generate individual paystubs without employee records
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { AppDispatch, RootState } from '../../store';
import { checkPaystubLimit } from '../../store/slices/billingSlice';
import { paystubService } from '../../services/api';
import { PAYSTUB_THEMES } from '../../styles/theme';
import { colors, gradients, spacing, borderRadius, typography, shadows } from '../../styles/theme';

// US States list
const US_STATES = [
  { label: 'Select State', value: '' },
  { label: 'Alabama', value: 'AL' },
  { label: 'Alaska', value: 'AK' },
  { label: 'Arizona', value: 'AZ' },
  { label: 'Arkansas', value: 'AR' },
  { label: 'California', value: 'CA' },
  { label: 'Colorado', value: 'CO' },
  { label: 'Connecticut', value: 'CT' },
  { label: 'Delaware', value: 'DE' },
  { label: 'Florida', value: 'FL' },
  { label: 'Georgia', value: 'GA' },
  { label: 'Hawaii', value: 'HI' },
  { label: 'Idaho', value: 'ID' },
  { label: 'Illinois', value: 'IL' },
  { label: 'Indiana', value: 'IN' },
  { label: 'Iowa', value: 'IA' },
  { label: 'Kansas', value: 'KS' },
  { label: 'Kentucky', value: 'KY' },
  { label: 'Louisiana', value: 'LA' },
  { label: 'Maine', value: 'ME' },
  { label: 'Maryland', value: 'MD' },
  { label: 'Massachusetts', value: 'MA' },
  { label: 'Michigan', value: 'MI' },
  { label: 'Minnesota', value: 'MN' },
  { label: 'Mississippi', value: 'MS' },
  { label: 'Missouri', value: 'MO' },
  { label: 'Montana', value: 'MT' },
  { label: 'Nebraska', value: 'NE' },
  { label: 'Nevada', value: 'NV' },
  { label: 'New Hampshire', value: 'NH' },
  { label: 'New Jersey', value: 'NJ' },
  { label: 'New Mexico', value: 'NM' },
  { label: 'New York', value: 'NY' },
  { label: 'North Carolina', value: 'NC' },
  { label: 'North Dakota', value: 'ND' },
  { label: 'Ohio', value: 'OH' },
  { label: 'Oklahoma', value: 'OK' },
  { label: 'Oregon', value: 'OR' },
  { label: 'Pennsylvania', value: 'PA' },
  { label: 'Rhode Island', value: 'RI' },
  { label: 'South Carolina', value: 'SC' },
  { label: 'South Dakota', value: 'SD' },
  { label: 'Tennessee', value: 'TN' },
  { label: 'Texas', value: 'TX' },
  { label: 'Utah', value: 'UT' },
  { label: 'Vermont', value: 'VT' },
  { label: 'Virginia', value: 'VA' },
  { label: 'Washington', value: 'WA' },
  { label: 'West Virginia', value: 'WV' },
  { label: 'Wisconsin', value: 'WI' },
  { label: 'Wyoming', value: 'WY' },
];

const PAY_FREQUENCIES = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Bi-Weekly', value: 'biweekly' },
  { label: 'Semi-Monthly', value: 'semimonthly' },
  { label: 'Monthly', value: 'monthly' },
];

const FILING_STATUSES = [
  { label: 'Single', value: 'single' },
  { label: 'Married Filing Jointly', value: 'married' },
  { label: 'Married Filing Separately', value: 'married_separately' },
  { label: 'Head of Household', value: 'head_of_household' },
];

interface PaystubFormData {
  // Company Info
  companyName: string;
  companyAddress: string;
  companyCity: string;
  companyState: string;
  companyZip: string;
  companyEIN: string;
  
  // Employee Info
  employeeName: string;
  employeeAddress: string;
  employeeCity: string;
  employeeState: string;
  employeeZip: string;
  employeeSSN: string;
  
  // Pay Info
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  payFrequency: string;
  
  // Earnings
  regularHours: string;
  hourlyRate: string;
  overtimeHours: string;
  bonus: string;
  commission: string;
  
  // Tax Info
  filingStatus: string;
  allowances: string;
  
  // YTD (optional)
  ytdGross: string;
  ytdFederalTax: string;
  ytdStateTax: string;
  ytdSocialSecurity: string;
  ytdMedicare: string;
  
  // Theme
  theme: string;
}

const initialFormData: PaystubFormData = {
  companyName: '',
  companyAddress: '',
  companyCity: '',
  companyState: '',
  companyZip: '',
  companyEIN: '',
  employeeName: '',
  employeeAddress: '',
  employeeCity: '',
  employeeState: '',
  employeeZip: '',
  employeeSSN: '',
  payPeriodStart: '',
  payPeriodEnd: '',
  payDate: '',
  payFrequency: 'biweekly',
  regularHours: '',
  hourlyRate: '',
  overtimeHours: '0',
  bonus: '0',
  commission: '0',
  filingStatus: 'single',
  allowances: '0',
  ytdGross: '0',
  ytdFederalTax: '0',
  ytdStateTax: '0',
  ytdSocialSecurity: '0',
  ytdMedicare: '0',
  theme: 'diego_original',
};

export default function StandalonePaystubScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { paystubLimit } = useSelector((state: RootState) => state.billing);
  
  const [formData, setFormData] = useState<PaystubFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const updateField = (field: keyof PaystubFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateGrossPay = () => {
    const regularPay = parseFloat(formData.regularHours || '0') * parseFloat(formData.hourlyRate || '0');
    const overtimePay = parseFloat(formData.overtimeHours || '0') * parseFloat(formData.hourlyRate || '0') * 1.5;
    const bonus = parseFloat(formData.bonus || '0');
    const commission = parseFloat(formData.commission || '0');
    return regularPay + overtimePay + bonus + commission;
  };

  const handleGeneratePaystub = async () => {
    // Validate required fields
    if (!formData.companyName || !formData.employeeName || !formData.employeeState || 
        !formData.hourlyRate || !formData.regularHours || !formData.payDate) {
      Toast.show({
        type: 'error',
        text1: 'Missing Fields',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check billing limit first
      await dispatch(checkPaystubLimit()).unwrap();

      // Generate paystub via API
      const response = await paystubService.generate({
        company: {
          name: formData.companyName,
          address: formData.companyAddress,
          city: formData.companyCity,
          state: formData.companyState,
          zip: formData.companyZip,
          ein: formData.companyEIN,
        },
        employee: {
          name: formData.employeeName,
          address: formData.employeeAddress,
          city: formData.employeeCity,
          state: formData.employeeState,
          zip: formData.employeeZip,
          ssn_last_four: formData.employeeSSN.slice(-4),
        },
        pay_info: {
          period_start: formData.payPeriodStart,
          period_end: formData.payPeriodEnd,
          pay_date: formData.payDate,
          pay_frequency: formData.payFrequency,
        },
        earnings: {
          regular_hours: parseFloat(formData.regularHours),
          hourly_rate: parseFloat(formData.hourlyRate),
          overtime_hours: parseFloat(formData.overtimeHours),
          bonus: parseFloat(formData.bonus),
          commission: parseFloat(formData.commission),
        },
        tax_info: {
          filing_status: formData.filingStatus,
          allowances: parseInt(formData.allowances),
          work_state: formData.employeeState,
        },
        ytd: {
          gross: parseFloat(formData.ytdGross),
          federal_tax: parseFloat(formData.ytdFederalTax),
          state_tax: parseFloat(formData.ytdStateTax),
          social_security: parseFloat(formData.ytdSocialSecurity),
          medicare: parseFloat(formData.ytdMedicare),
        },
        theme: formData.theme,
      });

      Toast.show({
        type: 'success',
        text1: 'Paystub Generated!',
        text2: 'Your paystub has been created successfully',
      });

      // Navigate to paystub detail or download
      navigation.navigate('PaystubDetail' as never, { paystubId: response.data.id } as never);

    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Generation Failed',
        text2: error?.message || 'Failed to generate paystub',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            currentStep >= step && styles.stepCircleActive,
            currentStep === step && styles.stepCircleCurrent,
          ]}>
            {currentStep > step ? (
              <Ionicons name="checkmark" size={16} color="white" />
            ) : (
              <Text style={[
                styles.stepNumber,
                currentStep >= step && styles.stepNumberActive,
              ]}>{step}</Text>
            )}
          </View>
          {step < 4 && <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Company Information</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Company Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.companyName}
          onChangeText={(v) => updateField('companyName', v)}
          placeholder="Acme Corporation"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          value={formData.companyAddress}
          onChangeText={(v) => updateField('companyAddress', v)}
          placeholder="123 Business Ave"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.formGroup, { flex: 2 }]}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={formData.companyCity}
            onChangeText={(v) => updateField('companyCity', v)}
            placeholder="City"
          />
        </View>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>State</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.companyState}
              onValueChange={(v) => updateField('companyState', v)}
              style={styles.picker}
            >
              {US_STATES.map((state) => (
                <Picker.Item key={state.value} label={state.label} value={state.value} />
              ))}
            </Picker>
          </View>
        </View>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>ZIP</Text>
          <TextInput
            style={styles.input}
            value={formData.companyZip}
            onChangeText={(v) => updateField('companyZip', v)}
            placeholder="12345"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>EIN (Employer ID)</Text>
        <TextInput
          style={styles.input}
          value={formData.companyEIN}
          onChangeText={(v) => updateField('companyEIN', v)}
          placeholder="XX-XXXXXXX"
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Employee Information</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Employee Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.employeeName}
          onChangeText={(v) => updateField('employeeName', v)}
          placeholder="John Smith"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          value={formData.employeeAddress}
          onChangeText={(v) => updateField('employeeAddress', v)}
          placeholder="456 Employee St"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.formGroup, { flex: 2 }]}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={formData.employeeCity}
            onChangeText={(v) => updateField('employeeCity', v)}
            placeholder="City"
          />
        </View>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>Work State *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.employeeState}
              onValueChange={(v) => updateField('employeeState', v)}
              style={styles.picker}
            >
              {US_STATES.map((state) => (
                <Picker.Item key={state.value} label={state.label} value={state.value} />
              ))}
            </Picker>
          </View>
        </View>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>ZIP</Text>
          <TextInput
            style={styles.input}
            value={formData.employeeZip}
            onChangeText={(v) => updateField('employeeZip', v)}
            placeholder="12345"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>SSN (Last 4 digits shown on paystub)</Text>
        <TextInput
          style={styles.input}
          value={formData.employeeSSN}
          onChangeText={(v) => updateField('employeeSSN', v)}
          placeholder="XXX-XX-XXXX"
          secureTextEntry
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>Filing Status</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.filingStatus}
              onValueChange={(v) => updateField('filingStatus', v)}
              style={styles.picker}
            >
              {FILING_STATUSES.map((status) => (
                <Picker.Item key={status.value} label={status.label} value={status.value} />
              ))}
            </Picker>
          </View>
        </View>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>Allowances</Text>
          <TextInput
            style={styles.input}
            value={formData.allowances}
            onChangeText={(v) => updateField('allowances', v)}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Pay Information</Text>

      <View style={styles.row}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>Pay Period Start *</Text>
          <TextInput
            style={styles.input}
            value={formData.payPeriodStart}
            onChangeText={(v) => updateField('payPeriodStart', v)}
            placeholder="MM/DD/YYYY"
          />
        </View>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>Pay Period End *</Text>
          <TextInput
            style={styles.input}
            value={formData.payPeriodEnd}
            onChangeText={(v) => updateField('payPeriodEnd', v)}
            placeholder="MM/DD/YYYY"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>Pay Date *</Text>
          <TextInput
            style={styles.input}
            value={formData.payDate}
            onChangeText={(v) => updateField('payDate', v)}
            placeholder="MM/DD/YYYY"
          />
        </View>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>Pay Frequency</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.payFrequency}
              onValueChange={(v) => updateField('payFrequency', v)}
              style={styles.picker}
            >
              {PAY_FREQUENCIES.map((freq) => (
                <Picker.Item key={freq.value} label={freq.label} value={freq.value} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      <View style={styles.divider} />
      <Text style={styles.subTitle}>Earnings</Text>

      <View style={styles.row}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>Hourly Rate *</Text>
          <View style={styles.inputWithPrefix}>
            <Text style={styles.inputPrefix}>$</Text>
            <TextInput
              style={[styles.input, styles.inputWithPrefixInput]}
              value={formData.hourlyRate}
              onChangeText={(v) => updateField('hourlyRate', v)}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>Regular Hours *</Text>
          <TextInput
            style={styles.input}
            value={formData.regularHours}
            onChangeText={(v) => updateField('regularHours', v)}
            placeholder="80"
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>Overtime Hours</Text>
          <TextInput
            style={styles.input}
            value={formData.overtimeHours}
            onChangeText={(v) => updateField('overtimeHours', v)}
            placeholder="0"
            keyboardType="decimal-pad"
          />
        </View>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>Bonus</Text>
          <View style={styles.inputWithPrefix}>
            <Text style={styles.inputPrefix}>$</Text>
            <TextInput
              style={[styles.input, styles.inputWithPrefixInput]}
              value={formData.bonus}
              onChangeText={(v) => updateField('bonus', v)}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      </View>

      {/* Gross Pay Preview */}
      <View style={styles.grossPayPreview}>
        <Text style={styles.grossPayLabel}>Estimated Gross Pay</Text>
        <Text style={styles.grossPayValue}>${calculateGrossPay().toFixed(2)}</Text>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>YTD & Theme</Text>

      <Text style={styles.subTitle}>Year-to-Date Totals (Optional)</Text>
      <Text style={styles.helpText}>
        Enter previous YTD totals if this is not the first paystub of the year.
      </Text>

      <View style={styles.row}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>YTD Gross</Text>
          <View style={styles.inputWithPrefix}>
            <Text style={styles.inputPrefix}>$</Text>
            <TextInput
              style={[styles.input, styles.inputWithPrefixInput]}
              value={formData.ytdGross}
              onChangeText={(v) => updateField('ytdGross', v)}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>YTD Federal Tax</Text>
          <View style={styles.inputWithPrefix}>
            <Text style={styles.inputPrefix}>$</Text>
            <TextInput
              style={[styles.input, styles.inputWithPrefixInput]}
              value={formData.ytdFederalTax}
              onChangeText={(v) => updateField('ytdFederalTax', v)}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>YTD State Tax</Text>
          <View style={styles.inputWithPrefix}>
            <Text style={styles.inputPrefix}>$</Text>
            <TextInput
              style={[styles.input, styles.inputWithPrefixInput]}
              value={formData.ytdStateTax}
              onChangeText={(v) => updateField('ytdStateTax', v)}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>YTD Social Security</Text>
          <View style={styles.inputWithPrefix}>
            <Text style={styles.inputPrefix}>$</Text>
            <TextInput
              style={[styles.input, styles.inputWithPrefixInput]}
              value={formData.ytdSocialSecurity}
              onChangeText={(v) => updateField('ytdSocialSecurity', v)}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      </View>

      <View style={styles.divider} />
      <Text style={styles.subTitle}>Select Theme</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themeSelector}>
        {Object.entries(PAYSTUB_THEMES).map(([key, theme]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.themeOption,
              formData.theme === key && styles.themeOptionSelected,
            ]}
            onPress={() => updateField('theme', key)}
          >
            <LinearGradient
              colors={[theme.gradient_start, theme.gradient_end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.themePreview}
            />
            <Text style={styles.themeName}>{theme.name}</Text>
            {formData.theme === key && (
              <View style={styles.themeCheck}>
                <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Generate Paystub</Text>
          <Text style={styles.headerSubtitle}>
            Create a professional paystub with automatic tax calculations
          </Text>
        </View>
      </LinearGradient>

      {/* Step Indicator */}
      {renderStepIndicator()}

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigation}>
          {currentStep > 1 && (
            <TouchableOpacity 
              style={styles.backBtn}
              onPress={() => setCurrentStep(currentStep - 1)}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}

          {currentStep < totalSteps ? (
            <TouchableOpacity 
              style={styles.nextBtnContainer}
              onPress={() => setCurrentStep(currentStep + 1)}
            >
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextBtn}
              >
                <Text style={styles.nextBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.nextBtnContainer}
              onPress={handleGeneratePaystub}
              disabled={isLoading}
            >
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.nextBtn, isLoading && styles.btnDisabled]}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="document-text" size={20} color="white" />
                    <Text style={styles.nextBtnText}>Generate Paystub</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  headerContent: {},
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: 'white',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface.elevated,
    borderWidth: 2,
    borderColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: colors.primary.purple,
    borderColor: colors.primary.purple,
  },
  stepCircleCurrent: {
    ...shadows.glow,
  },
  stepNumber: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  stepNumberActive: {
    color: 'white',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.border.default,
    marginHorizontal: spacing.xs,
  },
  stepLineActive: {
    backgroundColor: colors.primary.purple,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  stepContent: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  stepTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  subTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  helpText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    backgroundColor: colors.surface.elevated,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface.elevated,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  inputWithPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface.elevated,
  },
  inputPrefix: {
    paddingLeft: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  inputWithPrefixInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.lg,
  },
  grossPayPreview: {
    backgroundColor: 'rgba(190, 1, 255, 0.1)',
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  grossPayLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  grossPayValue: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    color: colors.primary.purple,
  },
  themeSelector: {
    marginTop: spacing.md,
  },
  themeOption: {
    width: 100,
    marginRight: spacing.md,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionSelected: {
    borderColor: colors.primary.purple,
    backgroundColor: 'rgba(190, 1, 255, 0.05)',
  },
  themePreview: {
    width: 80,
    height: 50,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  themeName: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  themeCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  backBtnText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
  nextBtnContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  nextBtnText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: 'white',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
