/**
 * EMPLOYER REGISTRATION SCREEN
 * Multi-step wizard for employer self-service registration
 * Captures company info, tax registration, banking, compliance, and subscription
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

type StepType = 'company' | 'federal_tax' | 'state_tax' | 'banking' | 'compliance' | 'subscription' | 'review';

interface CompanyData {
  legal_business_name: string;
  dba_name: string;
  ein: string;
  entity_type: string;
  industry_naics_code: string;
  formation_date: string;
  state_of_incorporation: string;
  business_address_line1: string;
  business_address_line2: string;
  city: string;
  state: string;
  zip_code: string;
  phone_number: string;
  website: string;
}

interface TaxData {
  federal_depositor_frequency: string;
  form_941_schedule: string;
  futa_liable: boolean;
  state_registrations: Array<{
    state: string;
    state_tax_id: string;
    sui_account: string;
    sui_rate: string;
  }>;
}

interface BankingData {
  bank_name: string;
  routing_number: string;
  account_number: string;
  account_type: string;
  verification_method: string;
}

interface ComplianceData {
  e_verify_enrolled: boolean;
  e_verify_company_id: string;
  aca_applicable_large_employer: boolean;
  eeo1_reporting_required: boolean;
  workers_comp_carrier: string;
  workers_comp_policy_number: string;
}

const ENTITY_TYPES = [
  { value: 'c_corp', label: 'C Corporation' },
  { value: 's_corp', label: 'S Corporation' },
  { value: 'llc', label: 'LLC' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'sole_proprietor', label: 'Sole Proprietor' },
  { value: 'nonprofit', label: 'Non-Profit' },
];

const DEPOSITOR_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly Depositor' },
  { value: 'semi_weekly', label: 'Semi-Weekly Depositor' },
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function EmployerRegisterScreen() {
  const navigation = useNavigation<any>();
  const [currentStep, setCurrentStep] = useState<StepType>('company');
  const [loading, setLoading] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  
  // Form Data
  const [companyData, setCompanyData] = useState<CompanyData>({
    legal_business_name: '',
    dba_name: '',
    ein: '',
    entity_type: '',
    industry_naics_code: '',
    formation_date: '',
    state_of_incorporation: '',
    business_address_line1: '',
    business_address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    phone_number: '',
    website: '',
  });
  
  const [taxData, setTaxData] = useState<TaxData>({
    federal_depositor_frequency: 'monthly',
    form_941_schedule: 'quarterly',
    futa_liable: true,
    state_registrations: [],
  });
  
  const [bankingData, setBankingData] = useState<BankingData>({
    bank_name: '',
    routing_number: '',
    account_number: '',
    account_type: 'checking',
    verification_method: 'micro_deposit',
  });
  
  const [complianceData, setComplianceData] = useState<ComplianceData>({
    e_verify_enrolled: false,
    e_verify_company_id: '',
    aca_applicable_large_employer: false,
    eeo1_reporting_required: false,
    workers_comp_carrier: '',
    workers_comp_policy_number: '',
  });
  
  const [selectedPlan, setSelectedPlan] = useState('professional');

  const steps: { key: StepType; label: string; icon: string }[] = [
    { key: 'company', label: 'Company', icon: 'business' },
    { key: 'federal_tax', label: 'Federal Tax', icon: 'document-text' },
    { key: 'state_tax', label: 'State Tax', icon: 'map' },
    { key: 'banking', label: 'Banking', icon: 'card' },
    { key: 'compliance', label: 'Compliance', icon: 'shield-checkmark' },
    { key: 'subscription', label: 'Subscription', icon: 'star' },
    { key: 'review', label: 'Review', icon: 'checkmark-circle' },
  ];

  const getCurrentStepIndex = () => steps.findIndex(s => s.key === currentStep);

  const formatEIN = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 9)}`;
  };

  const formatPhone = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const validateStep = (step: StepType): boolean => {
    switch (step) {
      case 'company':
        if (!companyData.legal_business_name.trim()) {
          Alert.alert('Required', 'Legal business name is required');
          return false;
        }
        if (!companyData.ein || companyData.ein.length < 10) {
          Alert.alert('Required', 'Valid EIN is required (XX-XXXXXXX)');
          return false;
        }
        if (!companyData.entity_type) {
          Alert.alert('Required', 'Please select entity type');
          return false;
        }
        if (!companyData.business_address_line1 || !companyData.city || !companyData.state || !companyData.zip_code) {
          Alert.alert('Required', 'Complete business address is required');
          return false;
        }
        return true;
      
      case 'federal_tax':
        return true;
      
      case 'state_tax':
        return true;
      
      case 'banking':
        if (!bankingData.bank_name.trim()) {
          Alert.alert('Required', 'Bank name is required');
          return false;
        }
        if (!bankingData.routing_number || bankingData.routing_number.length !== 9) {
          Alert.alert('Required', 'Valid 9-digit routing number is required');
          return false;
        }
        if (!bankingData.account_number.trim()) {
          Alert.alert('Required', 'Account number is required');
          return false;
        }
        return true;
      
      case 'compliance':
        return true;
      
      case 'subscription':
        return true;
      
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;
    
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key);
    }
  };

  const handleBack = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/employer-registration/complete', {
        company: companyData,
        tax: taxData,
        banking: bankingData,
        compliance: complianceData,
        subscription_plan: selectedPlan,
      });
      
      if (response.data.success) {
        Alert.alert(
          'Registration Complete!',
          'Your employer account has been created. Welcome to Saurellius!',
          [{ text: 'Continue', onPress: () => navigation.navigate('Dashboard') }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const addStateRegistration = () => {
    setTaxData(prev => ({
      ...prev,
      state_registrations: [
        ...prev.state_registrations,
        { state: '', state_tax_id: '', sui_account: '', sui_rate: '' }
      ]
    }));
  };

  const updateStateRegistration = (index: number, field: string, value: string) => {
    setTaxData(prev => ({
      ...prev,
      state_registrations: prev.state_registrations.map((reg, i) => 
        i === index ? { ...reg, [field]: value } : reg
      )
    }));
  };

  const removeStateRegistration = (index: number) => {
    setTaxData(prev => ({
      ...prev,
      state_registrations: prev.state_registrations.filter((_, i) => i !== index)
    }));
  };

  const renderCompanyStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Company Information</Text>
      <Text style={styles.stepSubtitle}>Enter your business details exactly as registered</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Legal Business Name *</Text>
        <TextInput
          style={styles.input}
          value={companyData.legal_business_name}
          onChangeText={(text) => setCompanyData(prev => ({ ...prev, legal_business_name: text }))}
          placeholder="Enter legal business name"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>DBA Name (if different)</Text>
        <TextInput
          style={styles.input}
          value={companyData.dba_name}
          onChangeText={(text) => setCompanyData(prev => ({ ...prev, dba_name: text }))}
          placeholder="Doing Business As"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Federal Employer ID (EIN) *</Text>
        <TextInput
          style={styles.input}
          value={companyData.ein}
          onChangeText={(text) => setCompanyData(prev => ({ ...prev, ein: formatEIN(text) }))}
          placeholder="XX-XXXXXXX"
          placeholderTextColor="#666"
          keyboardType="number-pad"
          maxLength={10}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Entity Type *</Text>
        <View style={styles.chipContainer}>
          {ENTITY_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[styles.chip, companyData.entity_type === type.value && styles.chipSelected]}
              onPress={() => setCompanyData(prev => ({ ...prev, entity_type: type.value }))}
            >
              <Text style={[styles.chipText, companyData.entity_type === type.value && styles.chipTextSelected]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Address *</Text>
        <TextInput
          style={styles.input}
          value={companyData.business_address_line1}
          onChangeText={(text) => setCompanyData(prev => ({ ...prev, business_address_line1: text }))}
          placeholder="Street address"
          placeholderTextColor="#666"
        />
        <TextInput
          style={[styles.input, { marginTop: 8 }]}
          value={companyData.business_address_line2}
          onChangeText={(text) => setCompanyData(prev => ({ ...prev, business_address_line2: text }))}
          placeholder="Suite, unit, building (optional)"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            value={companyData.city}
            onChangeText={(text) => setCompanyData(prev => ({ ...prev, city: text }))}
            placeholder="City"
            placeholderTextColor="#666"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>State *</Text>
          <TextInput
            style={styles.input}
            value={companyData.state}
            onChangeText={(text) => setCompanyData(prev => ({ ...prev, state: text.toUpperCase() }))}
            placeholder="ST"
            placeholderTextColor="#666"
            maxLength={2}
            autoCapitalize="characters"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>ZIP *</Text>
          <TextInput
            style={styles.input}
            value={companyData.zip_code}
            onChangeText={(text) => setCompanyData(prev => ({ ...prev, zip_code: text }))}
            placeholder="00000"
            placeholderTextColor="#666"
            keyboardType="number-pad"
            maxLength={5}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={companyData.phone_number}
          onChangeText={(text) => setCompanyData(prev => ({ ...prev, phone_number: formatPhone(text) }))}
          placeholder="(000) 000-0000"
          placeholderTextColor="#666"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Website</Text>
        <TextInput
          style={styles.input}
          value={companyData.website}
          onChangeText={(text) => setCompanyData(prev => ({ ...prev, website: text }))}
          placeholder="https://www.example.com"
          placeholderTextColor="#666"
          keyboardType="url"
          autoCapitalize="none"
        />
      </View>
    </View>
  );

  const renderFederalTaxStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Federal Tax Registration</Text>
      <Text style={styles.stepSubtitle}>Configure your federal tax deposit schedule</Text>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color="#3B82F6" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Deposit Schedule</Text>
          <Text style={styles.infoText}>
            Your deposit frequency is determined by your lookback period liability.
            Most new employers are monthly depositors.
          </Text>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Federal Tax Depositor Frequency</Text>
        {DEPOSITOR_FREQUENCIES.map((freq) => (
          <TouchableOpacity
            key={freq.value}
            style={[styles.radioOption, taxData.federal_depositor_frequency === freq.value && styles.radioOptionSelected]}
            onPress={() => setTaxData(prev => ({ ...prev, federal_depositor_frequency: freq.value }))}
          >
            <View style={[styles.radioCircle, taxData.federal_depositor_frequency === freq.value && styles.radioCircleSelected]}>
              {taxData.federal_depositor_frequency === freq.value && <View style={styles.radioInner} />}
            </View>
            <View style={styles.radioContent}>
              <Text style={styles.radioLabel}>{freq.label}</Text>
              <Text style={styles.radioDescription}>
                {freq.value === 'monthly' 
                  ? 'Deposit by the 15th of the following month'
                  : 'Deposit within 3 days of payday'
                }
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Form 941 Filing Schedule</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleButton, taxData.form_941_schedule === 'quarterly' && styles.toggleButtonActive]}
            onPress={() => setTaxData(prev => ({ ...prev, form_941_schedule: 'quarterly' }))}
          >
            <Text style={[styles.toggleText, taxData.form_941_schedule === 'quarterly' && styles.toggleTextActive]}>
              Quarterly (Most Employers)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, taxData.form_941_schedule === 'annual' && styles.toggleButtonActive]}
            onPress={() => setTaxData(prev => ({ ...prev, form_941_schedule: 'annual' }))}
          >
            <Text style={[styles.toggleText, taxData.form_941_schedule === 'annual' && styles.toggleTextActive]}>
              Annual (Seasonal)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={[styles.checkbox, taxData.futa_liable && styles.checkboxChecked]}
            onPress={() => setTaxData(prev => ({ ...prev, futa_liable: !prev.futa_liable }))}
          >
            {taxData.futa_liable && <Ionicons name="checkmark" size={16} color="#FFF" />}
          </TouchableOpacity>
          <View style={styles.checkboxContent}>
            <Text style={styles.checkboxLabel}>Subject to FUTA (Federal Unemployment Tax)</Text>
            <Text style={styles.checkboxDescription}>Most employers are subject to FUTA at 6.0% on first $7,000</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStateTaxStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>State Tax Registration</Text>
      <Text style={styles.stepSubtitle}>Add states where you have employees</Text>

      {taxData.state_registrations.map((reg, index) => (
        <View key={index} style={styles.stateCard}>
          <View style={styles.stateCardHeader}>
            <Text style={styles.stateCardTitle}>State {index + 1}</Text>
            <TouchableOpacity onPress={() => removeStateRegistration(index)}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              value={reg.state}
              onChangeText={(text) => updateStateRegistration(index, 'state', text.toUpperCase())}
              placeholder="ST"
              placeholderTextColor="#666"
              maxLength={2}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State Employer Tax ID</Text>
            <TextInput
              style={styles.input}
              value={reg.state_tax_id}
              onChangeText={(text) => updateStateRegistration(index, 'state_tax_id', text)}
              placeholder="Enter state tax ID"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>SUI Account #</Text>
              <TextInput
                style={styles.input}
                value={reg.sui_account}
                onChangeText={(text) => updateStateRegistration(index, 'sui_account', text)}
                placeholder="SUI Account"
                placeholderTextColor="#666"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>SUI Rate %</Text>
              <TextInput
                style={styles.input}
                value={reg.sui_rate}
                onChangeText={(text) => updateStateRegistration(index, 'sui_rate', text)}
                placeholder="0.00"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={addStateRegistration}>
        <Ionicons name="add-circle" size={24} color="#1473FF" />
        <Text style={styles.addButtonText}>Add State Registration</Text>
      </TouchableOpacity>

      {taxData.state_registrations.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="map-outline" size={48} color="#666" />
          <Text style={styles.emptyStateText}>No state registrations added</Text>
          <Text style={styles.emptyStateSubtext}>Add states where you have employees working</Text>
        </View>
      )}
    </View>
  );

  const renderBankingStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Banking & ACH Setup</Text>
      <Text style={styles.stepSubtitle}>Configure your bank account for payroll and tax payments</Text>

      <View style={styles.infoCard}>
        <Ionicons name="shield-checkmark" size={24} color="#10B981" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Bank-Level Security</Text>
          <Text style={styles.infoText}>
            Your banking information is encrypted with AES-256 and stored securely.
            We never share your account details.
          </Text>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Bank Name *</Text>
        <TextInput
          style={styles.input}
          value={bankingData.bank_name}
          onChangeText={(text) => setBankingData(prev => ({ ...prev, bank_name: text }))}
          placeholder="Enter bank name"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Routing Number (ABA) *</Text>
        <TextInput
          style={styles.input}
          value={bankingData.routing_number}
          onChangeText={(text) => setBankingData(prev => ({ ...prev, routing_number: text.replace(/\D/g, '') }))}
          placeholder="9-digit routing number"
          placeholderTextColor="#666"
          keyboardType="number-pad"
          maxLength={9}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Account Number *</Text>
        <TextInput
          style={styles.input}
          value={bankingData.account_number}
          onChangeText={(text) => setBankingData(prev => ({ ...prev, account_number: text }))}
          placeholder="Enter account number"
          placeholderTextColor="#666"
          keyboardType="number-pad"
          secureTextEntry
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Account Type *</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleButton, bankingData.account_type === 'checking' && styles.toggleButtonActive]}
            onPress={() => setBankingData(prev => ({ ...prev, account_type: 'checking' }))}
          >
            <Text style={[styles.toggleText, bankingData.account_type === 'checking' && styles.toggleTextActive]}>
              Checking
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, bankingData.account_type === 'savings' && styles.toggleButtonActive]}
            onPress={() => setBankingData(prev => ({ ...prev, account_type: 'savings' }))}
          >
            <Text style={[styles.toggleText, bankingData.account_type === 'savings' && styles.toggleTextActive]}>
              Savings
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Verification Method</Text>
        <TouchableOpacity
          style={[styles.radioOption, bankingData.verification_method === 'micro_deposit' && styles.radioOptionSelected]}
          onPress={() => setBankingData(prev => ({ ...prev, verification_method: 'micro_deposit' }))}
        >
          <View style={[styles.radioCircle, bankingData.verification_method === 'micro_deposit' && styles.radioCircleSelected]}>
            {bankingData.verification_method === 'micro_deposit' && <View style={styles.radioInner} />}
          </View>
          <View style={styles.radioContent}>
            <Text style={styles.radioLabel}>Micro-Deposits (1-2 business days)</Text>
            <Text style={styles.radioDescription}>We'll deposit two small amounts to verify</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.radioOption, bankingData.verification_method === 'instant' && styles.radioOptionSelected]}
          onPress={() => setBankingData(prev => ({ ...prev, verification_method: 'instant' }))}
        >
          <View style={[styles.radioCircle, bankingData.verification_method === 'instant' && styles.radioCircleSelected]}>
            {bankingData.verification_method === 'instant' && <View style={styles.radioInner} />}
          </View>
          <View style={styles.radioContent}>
            <Text style={styles.radioLabel}>Instant Verification (Plaid)</Text>
            <Text style={styles.radioDescription}>Connect with your bank login</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderComplianceStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Regulatory Compliance</Text>
      <Text style={styles.stepSubtitle}>Configure compliance requirements for your business</Text>

      <View style={styles.inputGroup}>
        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={[styles.checkbox, complianceData.e_verify_enrolled && styles.checkboxChecked]}
            onPress={() => setComplianceData(prev => ({ ...prev, e_verify_enrolled: !prev.e_verify_enrolled }))}
          >
            {complianceData.e_verify_enrolled && <Ionicons name="checkmark" size={16} color="#FFF" />}
          </TouchableOpacity>
          <View style={styles.checkboxContent}>
            <Text style={styles.checkboxLabel}>E-Verify Enrolled</Text>
            <Text style={styles.checkboxDescription}>Electronically verify employment eligibility</Text>
          </View>
        </View>
      </View>

      {complianceData.e_verify_enrolled && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-Verify Company ID</Text>
          <TextInput
            style={styles.input}
            value={complianceData.e_verify_company_id}
            onChangeText={(text) => setComplianceData(prev => ({ ...prev, e_verify_company_id: text }))}
            placeholder="Enter E-Verify Company ID"
            placeholderTextColor="#666"
          />
        </View>
      )}

      <View style={styles.inputGroup}>
        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={[styles.checkbox, complianceData.aca_applicable_large_employer && styles.checkboxChecked]}
            onPress={() => setComplianceData(prev => ({ ...prev, aca_applicable_large_employer: !prev.aca_applicable_large_employer }))}
          >
            {complianceData.aca_applicable_large_employer && <Ionicons name="checkmark" size={16} color="#FFF" />}
          </TouchableOpacity>
          <View style={styles.checkboxContent}>
            <Text style={styles.checkboxLabel}>ACA Applicable Large Employer (ALE)</Text>
            <Text style={styles.checkboxDescription}>50+ full-time equivalent employees</Text>
          </View>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={[styles.checkbox, complianceData.eeo1_reporting_required && styles.checkboxChecked]}
            onPress={() => setComplianceData(prev => ({ ...prev, eeo1_reporting_required: !prev.eeo1_reporting_required }))}
          >
            {complianceData.eeo1_reporting_required && <Ionicons name="checkmark" size={16} color="#FFF" />}
          </TouchableOpacity>
          <View style={styles.checkboxContent}>
            <Text style={styles.checkboxLabel}>EEO-1 Reporting Required</Text>
            <Text style={styles.checkboxDescription}>100+ employees or federal contractor</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.label, { marginTop: 20, marginBottom: 12 }]}>Workers' Compensation Insurance</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Insurance Carrier</Text>
        <TextInput
          style={styles.input}
          value={complianceData.workers_comp_carrier}
          onChangeText={(text) => setComplianceData(prev => ({ ...prev, workers_comp_carrier: text }))}
          placeholder="Enter carrier name"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Policy Number</Text>
        <TextInput
          style={styles.input}
          value={complianceData.workers_comp_policy_number}
          onChangeText={(text) => setComplianceData(prev => ({ ...prev, workers_comp_policy_number: text }))}
          placeholder="Enter policy number"
          placeholderTextColor="#666"
        />
      </View>
    </View>
  );

  const renderSubscriptionStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Choose Your Plan</Text>
      <Text style={styles.stepSubtitle}>Select the plan that fits your business needs</Text>

      {[
        {
          id: 'starter',
          name: 'Starter',
          price: 29,
          employees: '1-10',
          features: ['Payroll Processing', 'Direct Deposit', 'Tax Filing', 'Basic Support']
        },
        {
          id: 'professional',
          name: 'Professional',
          price: 99,
          employees: '11-50',
          features: ['Everything in Starter', 'Time & Attendance', 'Benefits Admin', 'HR Tools', 'Priority Support'],
          recommended: true
        },
        {
          id: 'business',
          name: 'Business',
          price: 299,
          employees: '51-200',
          features: ['Everything in Professional', 'Advanced Reporting', 'API Access', 'Dedicated Account Manager']
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: null,
          employees: '201+',
          features: ['Everything in Business', 'Custom Integrations', 'SLA Guarantee', 'On-site Training']
        }
      ].map((plan) => (
        <TouchableOpacity
          key={plan.id}
          style={[styles.planCard, selectedPlan === plan.id && styles.planCardSelected]}
          onPress={() => setSelectedPlan(plan.id)}
        >
          {plan.recommended && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>RECOMMENDED</Text>
            </View>
          )}
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planEmployees}>{plan.employees} employees</Text>
            </View>
            <View style={styles.planPriceContainer}>
              {plan.price ? (
                <>
                  <Text style={styles.planPrice}>${plan.price}</Text>
                  <Text style={styles.planPeriod}>/month</Text>
                </>
              ) : (
                <Text style={styles.planPrice}>Custom</Text>
              )}
            </View>
          </View>
          <View style={styles.planFeatures}>
            {plan.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
          {selectedPlan === plan.id && (
            <View style={styles.selectedIndicator}>
              <Ionicons name="checkmark-circle" size={24} color="#1473FF" />
            </View>
          )}
        </TouchableOpacity>
      ))}

      <View style={styles.trialNotice}>
        <Ionicons name="gift" size={24} color="#F59E0B" />
        <Text style={styles.trialText}>Start with a 14-day free trial. No credit card required.</Text>
      </View>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Submit</Text>
      <Text style={styles.stepSubtitle}>Please review your information before submitting</Text>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Company Information</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Legal Name</Text>
          <Text style={styles.reviewValue}>{companyData.legal_business_name}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>EIN</Text>
          <Text style={styles.reviewValue}>{companyData.ein}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Entity Type</Text>
          <Text style={styles.reviewValue}>{ENTITY_TYPES.find(e => e.value === companyData.entity_type)?.label}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Address</Text>
          <Text style={styles.reviewValue}>
            {companyData.business_address_line1}, {companyData.city}, {companyData.state} {companyData.zip_code}
          </Text>
        </View>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Tax Configuration</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Depositor Frequency</Text>
          <Text style={styles.reviewValue}>{taxData.federal_depositor_frequency}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>State Registrations</Text>
          <Text style={styles.reviewValue}>{taxData.state_registrations.length} states</Text>
        </View>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Banking</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Bank</Text>
          <Text style={styles.reviewValue}>{bankingData.bank_name}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Account Type</Text>
          <Text style={styles.reviewValue}>{bankingData.account_type}</Text>
        </View>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Subscription</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Selected Plan</Text>
          <Text style={styles.reviewValue}>{selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}</Text>
        </View>
      </View>

      <View style={styles.agreementContainer}>
        <Text style={styles.agreementText}>
          By clicking "Complete Registration", you agree to our Terms of Service and Privacy Policy.
          You authorize Saurellius to initiate ACH debits and credits to your bank account.
        </Text>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'company': return renderCompanyStep();
      case 'federal_tax': return renderFederalTaxStep();
      case 'state_tax': return renderStateTaxStep();
      case 'banking': return renderBankingStep();
      case 'compliance': return renderComplianceStep();
      case 'subscription': return renderSubscriptionStep();
      case 'review': return renderReviewStep();
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Employer Registration</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.progressBar}>
          {steps.map((step, index) => (
            <React.Fragment key={step.key}>
              <TouchableOpacity
                style={styles.stepIndicator}
                onPress={() => index <= getCurrentStepIndex() && setCurrentStep(step.key)}
                disabled={index > getCurrentStepIndex()}
              >
                <View style={[
                  styles.stepCircle,
                  index <= getCurrentStepIndex() && styles.stepCircleActive,
                  index < getCurrentStepIndex() && styles.stepCircleCompleted
                ]}>
                  {index < getCurrentStepIndex() ? (
                    <Ionicons name="checkmark" size={14} color="#FFF" />
                  ) : (
                    <Ionicons name={step.icon as any} size={14} color={index <= getCurrentStepIndex() ? '#FFF' : 'rgba(255,255,255,0.4)'} />
                  )}
                </View>
              </TouchableOpacity>
              {index < steps.length - 1 && (
                <View style={[
                  styles.stepLine,
                  index < getCurrentStepIndex() && styles.stepLineActive
                ]} />
              )}
            </React.Fragment>
          ))}
        </View>
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

      <View style={styles.footer}>
        {getCurrentStepIndex() > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color="#666" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, loading && styles.buttonDisabled]}
          onPress={currentStep === 'review' ? handleSubmit : handleNext}
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
                  {currentStep === 'review' ? 'Complete Registration' : 'Continue'}
                </Text>
                {currentStep !== 'review' && <Ionicons name="arrow-forward" size={20} color="#FFF" />}
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
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
  },
  stepCircleActive: {
    backgroundColor: '#1473FF',
  },
  stepCircleCompleted: {
    backgroundColor: '#10B981',
  },
  stepLine: {
    width: 20,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 2,
  },
  stepLineActive: {
    backgroundColor: '#10B981',
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
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#a0a0a0',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  row: {
    flexDirection: 'row',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  chipSelected: {
    backgroundColor: '#1473FF',
    borderColor: '#1473FF',
  },
  chipText: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  chipTextSelected: {
    color: '#FFF',
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1473FF20',
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
    color: '#FFF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#a0a0a0',
    lineHeight: 18,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  radioOptionSelected: {
    borderColor: '#1473FF',
    backgroundColor: '#1473FF10',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: '#1473FF',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1473FF',
  },
  radioContent: {
    flex: 1,
  },
  radioLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFF',
    marginBottom: 4,
  },
  radioDescription: {
    fontSize: 13,
    color: '#a0a0a0',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleButtonActive: {
    backgroundColor: '#1473FF',
  },
  toggleText: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  toggleTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#1473FF',
    borderColor: '#1473FF',
  },
  checkboxContent: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFF',
    marginBottom: 4,
  },
  checkboxDescription: {
    fontSize: 13,
    color: '#a0a0a0',
  },
  stateCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  stateCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stateCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1473FF',
    borderStyle: 'dashed',
    gap: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1473FF',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#a0a0a0',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  planCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2a2a4e',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#1473FF',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  planEmployees: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 4,
  },
  planPriceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1473FF',
  },
  planPeriod: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  planFeatures: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  trialNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B20',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  trialText: {
    fontSize: 14,
    color: '#F59E0B',
    flex: 1,
  },
  reviewSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1473FF',
    marginBottom: 12,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  reviewLabel: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  reviewValue: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  agreementContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
  },
  agreementText: {
    fontSize: 13,
    color: '#a0a0a0',
    lineHeight: 20,
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
