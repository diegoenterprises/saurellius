/**
 * CONTRACTOR SELF-SERVICE REGISTRATION SCREEN
 * Multi-step wizard for contractor (1099) self-service signup
 * Includes W-9 wizard, payment setup, and business information
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
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../services/api';

type StepType = 'account' | 'business' | 'w9' | 'payment' | 'verify' | 'complete';

interface AccountData {
  email: string;
  password: string;
  password_confirm: string;
  phone_number: string;
}

interface BusinessData {
  business_classification: string;
  full_name: string;
  business_name: string;
  services_description: string;
  website: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip_code: string;
}

interface W9Data {
  tax_classification: string;
  tin_type: 'ssn' | 'ein';
  tin_value: string;
  exempt_payee_code: string;
  fatca_reporting_code: string;
  certification_accepted: boolean;
  signature_name: string;
}

interface PaymentData {
  payment_method: string;
  bank_name: string;
  routing_number: string;
  account_number: string;
  account_type: string;
}

const BUSINESS_CLASSIFICATIONS = [
  { value: 'individual', label: 'Individual / Sole Proprietor' },
  { value: 'single_member_llc', label: 'Single-Member LLC' },
  { value: 'multi_member_llc', label: 'Multi-Member LLC' },
  { value: 'partnership', label: 'Partnership' },
  { value: 's_corp', label: 'S Corporation' },
  { value: 'c_corp', label: 'C Corporation' },
  { value: 'trust_estate', label: 'Trust / Estate' },
];

const TAX_CLASSIFICATIONS = [
  { value: 'individual', label: 'Individual/sole proprietor or single-member LLC', code: '' },
  { value: 'c_corp', label: 'C Corporation', code: 'C' },
  { value: 's_corp', label: 'S Corporation', code: 'S' },
  { value: 'partnership', label: 'Partnership', code: 'P' },
  { value: 'trust_estate', label: 'Trust/estate', code: 'T' },
  { value: 'llc_c', label: 'LLC treated as C Corporation', code: 'C' },
  { value: 'llc_s', label: 'LLC treated as S Corporation', code: 'S' },
  { value: 'llc_p', label: 'LLC treated as Partnership', code: 'P' },
];

export default function ContractorRegisterScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const invitationToken = route.params?.token;
  const [currentStep, setCurrentStep] = useState<StepType>('account');
  const [loading, setLoading] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  
  const [accountData, setAccountData] = useState<AccountData>({
    email: '',
    password: '',
    password_confirm: '',
    phone_number: '',
  });
  
  const [businessData, setBusinessData] = useState<BusinessData>({
    business_classification: '',
    full_name: '',
    business_name: '',
    services_description: '',
    website: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
  });
  
  const [w9Data, setW9Data] = useState<W9Data>({
    tax_classification: '',
    tin_type: 'ssn',
    tin_value: '',
    exempt_payee_code: '',
    fatca_reporting_code: '',
    certification_accepted: false,
    signature_name: '',
  });
  
  const [paymentData, setPaymentData] = useState<PaymentData>({
    payment_method: 'direct_deposit',
    bank_name: '',
    routing_number: '',
    account_number: '',
    account_type: 'checking',
  });

  const [verificationCode, setVerificationCode] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [independentContractorAck, setIndependentContractorAck] = useState(false);
  const [taxResponsibilityAck, setTaxResponsibilityAck] = useState(false);

  const steps: { key: StepType; label: string }[] = [
    { key: 'account', label: 'Account' },
    { key: 'business', label: 'Business' },
    { key: 'w9', label: 'W-9' },
    { key: 'payment', label: 'Payment' },
    { key: 'verify', label: 'Verify' },
    { key: 'complete', label: 'Complete' },
  ];

  const getCurrentStepIndex = () => steps.findIndex(s => s.key === currentStep);

  const formatPhone = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const formatSSN = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 9)}`;
  };

  const formatEIN = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 9)}`;
  };

  const validateStep = (step: StepType): boolean => {
    switch (step) {
      case 'account':
        if (!accountData.email.includes('@')) {
          Alert.alert('Invalid Email', 'Please enter a valid email address');
          return false;
        }
        if (accountData.password.length < 8) {
          Alert.alert('Weak Password', 'Password must be at least 8 characters');
          return false;
        }
        if (accountData.password !== accountData.password_confirm) {
          Alert.alert('Password Mismatch', 'Passwords do not match');
          return false;
        }
        if (!termsAccepted || !independentContractorAck || !taxResponsibilityAck) {
          Alert.alert('Required', 'Please accept all acknowledgments');
          return false;
        }
        return true;
      
      case 'business':
        if (!businessData.business_classification) {
          Alert.alert('Required', 'Please select your business classification');
          return false;
        }
        if (!businessData.full_name.trim()) {
          Alert.alert('Required', 'Full legal name is required');
          return false;
        }
        if (!businessData.address_line1.trim() || !businessData.city.trim() || 
            !businessData.state.trim() || !businessData.zip_code.trim()) {
          Alert.alert('Required', 'Complete business address is required');
          return false;
        }
        return true;
      
      case 'w9':
        if (!w9Data.tax_classification) {
          Alert.alert('Required', 'Please select your tax classification');
          return false;
        }
        if (!w9Data.tin_value || 
            (w9Data.tin_type === 'ssn' && w9Data.tin_value.length < 11) ||
            (w9Data.tin_type === 'ein' && w9Data.tin_value.length < 10)) {
          Alert.alert('Required', 'Valid Tax ID is required');
          return false;
        }
        if (!w9Data.certification_accepted) {
          Alert.alert('Required', 'W-9 certification is required');
          return false;
        }
        if (!w9Data.signature_name.trim()) {
          Alert.alert('Required', 'Digital signature is required');
          return false;
        }
        return true;
      
      case 'payment':
        if (paymentData.payment_method === 'direct_deposit') {
          if (!paymentData.bank_name.trim() || 
              !paymentData.routing_number || paymentData.routing_number.length !== 9 ||
              !paymentData.account_number.trim()) {
            Alert.alert('Required', 'Complete bank information is required');
            return false;
          }
        }
        return true;
      
      case 'verify':
        if (verificationCode.length !== 6) {
          Alert.alert('Invalid Code', 'Please enter the 6-digit verification code');
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;
    
    const currentIndex = getCurrentStepIndex();
    
    if (currentStep === 'account') {
      setLoading(true);
      try {
        const response = await api.post('/api/contractor/register', {
          ...accountData,
          terms_accepted: termsAccepted,
          independent_contractor_ack: independentContractorAck,
          tax_responsibility_ack: taxResponsibilityAck,
        });
        
        if (response.data.success) {
          setCurrentStep('business');
        }
      } catch (error: any) {
        Alert.alert('Error', error.response?.data?.message || 'Registration failed');
      } finally {
        setLoading(false);
      }
      return;
    }
    
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

  const handleVerifyCode = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/verify/email', {
        email: accountData.email,
        code: verificationCode,
      });
      
      if (response.data.success) {
        setCurrentStep('complete');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    navigation.navigate('ContractorPortal');
  };

  const renderAccountStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Create Contractor Account</Text>
      <Text style={styles.stepSubtitle}>Set up your independent contractor profile</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address *</Text>
        <TextInput
          style={styles.input}
          value={accountData.email}
          onChangeText={(text) => setAccountData(prev => ({ ...prev, email: text.toLowerCase().trim() }))}
          placeholder="your@email.com"
          placeholderTextColor="#666"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={styles.input}
          value={accountData.password}
          onChangeText={(text) => setAccountData(prev => ({ ...prev, password: text }))}
          placeholder="Create a strong password"
          placeholderTextColor="#666"
          secureTextEntry
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirm Password *</Text>
        <TextInput
          style={styles.input}
          value={accountData.password_confirm}
          onChangeText={(text) => setAccountData(prev => ({ ...prev, password_confirm: text }))}
          placeholder="Confirm your password"
          placeholderTextColor="#666"
          secureTextEntry
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Mobile Phone *</Text>
        <TextInput
          style={styles.input}
          value={accountData.phone_number}
          onChangeText={(text) => setAccountData(prev => ({ ...prev, phone_number: formatPhone(text) }))}
          placeholder="(000) 000-0000"
          placeholderTextColor="#666"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.acknowledgmentSection}>
        <Text style={styles.acknowledgmentTitle}>Required Acknowledgments</Text>
        
        <TouchableOpacity 
          style={styles.checkboxRow}
          onPress={() => setTermsAccepted(!termsAccepted)}
        >
          <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
            {termsAccepted && <Ionicons name="checkmark" size={14} color="#FFF" />}
          </View>
          <Text style={styles.checkboxLabel}>
            I agree to the <Text style={styles.link}>Terms of Service</Text> and <Text style={styles.link}>Privacy Policy</Text> *
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.checkboxRow}
          onPress={() => setIndependentContractorAck(!independentContractorAck)}
        >
          <View style={[styles.checkbox, independentContractorAck && styles.checkboxChecked]}>
            {independentContractorAck && <Ionicons name="checkmark" size={14} color="#FFF" />}
          </View>
          <Text style={styles.checkboxLabel}>
            I acknowledge that I am an independent contractor, not an employee *
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.checkboxRow}
          onPress={() => setTaxResponsibilityAck(!taxResponsibilityAck)}
        >
          <View style={[styles.checkbox, taxResponsibilityAck && styles.checkboxChecked]}>
            {taxResponsibilityAck && <Ionicons name="checkmark" size={14} color="#FFF" />}
          </View>
          <Text style={styles.checkboxLabel}>
            I understand I am responsible for my own taxes (no withholding) *
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBusinessStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Business Information</Text>
      <Text style={styles.stepSubtitle}>Tell us about your business or freelance work</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Classification *</Text>
        {BUSINESS_CLASSIFICATIONS.map((classification) => (
          <TouchableOpacity
            key={classification.value}
            style={[styles.classificationOption, businessData.business_classification === classification.value && styles.classificationOptionSelected]}
            onPress={() => setBusinessData(prev => ({ ...prev, business_classification: classification.value }))}
          >
            <View style={[styles.radioCircle, businessData.business_classification === classification.value && styles.radioCircleSelected]}>
              {businessData.business_classification === classification.value && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.classificationLabel}>{classification.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Legal Name *</Text>
        <TextInput
          style={styles.input}
          value={businessData.full_name}
          onChangeText={(text) => setBusinessData(prev => ({ ...prev, full_name: text }))}
          placeholder="As shown on your tax return"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Name (if different)</Text>
        <TextInput
          style={styles.input}
          value={businessData.business_name}
          onChangeText={(text) => setBusinessData(prev => ({ ...prev, business_name: text }))}
          placeholder="DBA or trade name"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Services You Provide</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={businessData.services_description}
          onChangeText={(text) => setBusinessData(prev => ({ ...prev, services_description: text }))}
          placeholder="Describe your services..."
          placeholderTextColor="#666"
          multiline
          numberOfLines={3}
        />
      </View>

      <Text style={[styles.label, { marginTop: 16, marginBottom: 12 }]}>Business Address *</Text>

      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          value={businessData.address_line1}
          onChangeText={(text) => setBusinessData(prev => ({ ...prev, address_line1: text }))}
          placeholder="Street address"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          value={businessData.address_line2}
          onChangeText={(text) => setBusinessData(prev => ({ ...prev, address_line2: text }))}
          placeholder="Suite, unit (optional)"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
          <TextInput
            style={styles.input}
            value={businessData.city}
            onChangeText={(text) => setBusinessData(prev => ({ ...prev, city: text }))}
            placeholder="City"
            placeholderTextColor="#666"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <TextInput
            style={styles.input}
            value={businessData.state}
            onChangeText={(text) => setBusinessData(prev => ({ ...prev, state: text.toUpperCase() }))}
            placeholder="ST"
            placeholderTextColor="#666"
            maxLength={2}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <TextInput
            style={styles.input}
            value={businessData.zip_code}
            onChangeText={(text) => setBusinessData(prev => ({ ...prev, zip_code: text }))}
            placeholder="ZIP"
            placeholderTextColor="#666"
            keyboardType="number-pad"
            maxLength={5}
          />
        </View>
      </View>
    </View>
  );

  const renderW9Step = () => (
    <View style={styles.stepContent}>
      <View style={styles.w9Header}>
        <Text style={styles.stepTitle}>W-9 Tax Information</Text>
        <Text style={styles.stepSubtitle}>Request for Taxpayer Identification Number and Certification</Text>
      </View>

      <View style={styles.irsNotice}>
        <Ionicons name="information-circle" size={24} color="#F59E0B" />
        <Text style={styles.irsNoticeText}>
          This information is required by the IRS. It will be used to prepare your Form 1099-NEC at year end.
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Federal Tax Classification *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.taxClassScroll}>
          {TAX_CLASSIFICATIONS.map((classification) => (
            <TouchableOpacity
              key={classification.value}
              style={[styles.taxClassChip, w9Data.tax_classification === classification.value && styles.taxClassChipSelected]}
              onPress={() => setW9Data(prev => ({ ...prev, tax_classification: classification.value }))}
            >
              <Text style={[styles.taxClassChipText, w9Data.tax_classification === classification.value && styles.taxClassChipTextSelected]}>
                {classification.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tax Identification Number (TIN) *</Text>
        <View style={styles.tinTypeRow}>
          <TouchableOpacity
            style={[styles.tinTypeButton, w9Data.tin_type === 'ssn' && styles.tinTypeButtonActive]}
            onPress={() => setW9Data(prev => ({ ...prev, tin_type: 'ssn', tin_value: '' }))}
          >
            <Text style={[styles.tinTypeText, w9Data.tin_type === 'ssn' && styles.tinTypeTextActive]}>SSN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tinTypeButton, w9Data.tin_type === 'ein' && styles.tinTypeButtonActive]}
            onPress={() => setW9Data(prev => ({ ...prev, tin_type: 'ein', tin_value: '' }))}
          >
            <Text style={[styles.tinTypeText, w9Data.tin_type === 'ein' && styles.tinTypeTextActive]}>EIN</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          value={w9Data.tin_value}
          onChangeText={(text) => setW9Data(prev => ({ 
            ...prev, 
            tin_value: prev.tin_type === 'ssn' ? formatSSN(text) : formatEIN(text) 
          }))}
          placeholder={w9Data.tin_type === 'ssn' ? 'XXX-XX-XXXX' : 'XX-XXXXXXX'}
          placeholderTextColor="#666"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={w9Data.tin_type === 'ssn' ? 11 : 10}
        />
      </View>

      <View style={styles.certificationSection}>
        <Text style={styles.certificationTitle}>W-9 Certification</Text>
        <Text style={styles.certificationText}>
          Under penalties of perjury, I certify that:{'\n\n'}
          1. The number shown on this form is my correct taxpayer identification number{'\n\n'}
          2. I am not subject to backup withholding because: (a) I am exempt from backup withholding, or (b) I have not been notified by the IRS that I am subject to backup withholding{'\n\n'}
          3. I am a U.S. citizen or other U.S. person{'\n\n'}
          4. The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct
        </Text>
        
        <TouchableOpacity 
          style={styles.checkboxRow}
          onPress={() => setW9Data(prev => ({ ...prev, certification_accepted: !prev.certification_accepted }))}
        >
          <View style={[styles.checkbox, w9Data.certification_accepted && styles.checkboxChecked]}>
            {w9Data.certification_accepted && <Ionicons name="checkmark" size={14} color="#FFF" />}
          </View>
          <Text style={styles.checkboxLabel}>
            I certify that the above statements are true and correct *
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Digital Signature *</Text>
        <TextInput
          style={styles.input}
          value={w9Data.signature_name}
          onChangeText={(text) => setW9Data(prev => ({ ...prev, signature_name: text }))}
          placeholder="Type your full legal name"
          placeholderTextColor="#666"
        />
        <Text style={styles.helperText}>By typing your name, you are signing this W-9 form electronically</Text>
      </View>
    </View>
  );

  const renderPaymentStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Payment Setup</Text>
      <Text style={styles.stepSubtitle}>How would you like to receive payments?</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Payment Method</Text>
        {[
          { value: 'direct_deposit', label: 'Direct Deposit (ACH)', icon: 'card', description: 'Fastest - 1-2 business days' },
          { value: 'check', label: 'Paper Check', icon: 'mail', description: 'Mailed to your address' },
          { value: 'wallet', label: 'Saurellius Wallet', icon: 'wallet', description: 'Instant access to funds' },
        ].map((method) => (
          <TouchableOpacity
            key={method.value}
            style={[styles.paymentOption, paymentData.payment_method === method.value && styles.paymentOptionSelected]}
            onPress={() => setPaymentData(prev => ({ ...prev, payment_method: method.value }))}
          >
            <View style={styles.paymentOptionIcon}>
              <Ionicons name={method.icon as any} size={24} color={paymentData.payment_method === method.value ? '#1473FF' : '#666'} />
            </View>
            <View style={styles.paymentOptionContent}>
              <Text style={styles.paymentOptionLabel}>{method.label}</Text>
              <Text style={styles.paymentOptionDescription}>{method.description}</Text>
            </View>
            {paymentData.payment_method === method.value && (
              <Ionicons name="checkmark-circle" size={24} color="#1473FF" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {paymentData.payment_method === 'direct_deposit' && (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bank Name *</Text>
            <TextInput
              style={styles.input}
              value={paymentData.bank_name}
              onChangeText={(text) => setPaymentData(prev => ({ ...prev, bank_name: text }))}
              placeholder="Enter bank name"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Routing Number *</Text>
            <TextInput
              style={styles.input}
              value={paymentData.routing_number}
              onChangeText={(text) => setPaymentData(prev => ({ ...prev, routing_number: text.replace(/\D/g, '') }))}
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
              value={paymentData.account_number}
              onChangeText={(text) => setPaymentData(prev => ({ ...prev, account_number: text }))}
              placeholder="Enter account number"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Type</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleButton, paymentData.account_type === 'checking' && styles.toggleButtonActive]}
                onPress={() => setPaymentData(prev => ({ ...prev, account_type: 'checking' }))}
              >
                <Text style={[styles.toggleText, paymentData.account_type === 'checking' && styles.toggleTextActive]}>
                  Checking
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, paymentData.account_type === 'savings' && styles.toggleButtonActive]}
                onPress={() => setPaymentData(prev => ({ ...prev, account_type: 'savings' }))}
              >
                <Text style={[styles.toggleText, paymentData.account_type === 'savings' && styles.toggleTextActive]}>
                  Savings
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {paymentData.payment_method === 'wallet' && (
        <View style={styles.walletInfo}>
          <LinearGradient
            colors={['#1473FF20', '#BE01FF20']}
            style={styles.walletInfoGradient}
          >
            <Ionicons name="wallet" size={48} color="#1473FF" />
            <Text style={styles.walletInfoTitle}>Saurellius Wallet</Text>
            <Text style={styles.walletInfoText}>
              Get paid instantly to your digital wallet. Transfer to your bank anytime - instant transfers for $1.50 or free in 1-3 days.
            </Text>
          </LinearGradient>
        </View>
      )}
    </View>
  );

  const renderVerifyStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.verifyIcon}>
        <LinearGradient
          colors={['#1473FF', '#BE01FF']}
          style={styles.verifyIconGradient}
        >
          <Ionicons name="mail" size={48} color="#FFF" />
        </LinearGradient>
      </View>
      
      <Text style={styles.stepTitle}>Verify Your Email</Text>
      <Text style={styles.stepSubtitle}>
        We sent a 6-digit verification code to{'\n'}
        <Text style={{ color: '#1473FF' }}>{accountData.email}</Text>
      </Text>

      <View style={styles.codeInputContainer}>
        <TextInput
          style={styles.codeInput}
          value={verificationCode}
          onChangeText={setVerificationCode}
          placeholder="000000"
          placeholderTextColor="#666"
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
        />
      </View>

      <TouchableOpacity
        style={[styles.verifyButton, verificationCode.length !== 6 && styles.buttonDisabled]}
        onPress={handleVerifyCode}
        disabled={verificationCode.length !== 6 || loading}
      >
        <LinearGradient
          colors={['#1473FF', '#BE01FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.verifyButtonGradient}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify Email</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderCompleteStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.successIcon}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.successIconGradient}
        >
          <Ionicons name="checkmark" size={64} color="#FFF" />
        </LinearGradient>
      </View>
      
      <Text style={styles.stepTitle}>You're All Set!</Text>
      <Text style={styles.stepSubtitle}>
        Your contractor account has been created successfully. You can now send invoices and track your earnings.
      </Text>

      <View style={styles.nextStepsCard}>
        <Text style={styles.nextStepsTitle}>What You Can Do Now</Text>
        {[
          { icon: 'document-text', label: 'Create Your First Invoice' },
          { icon: 'search', label: 'Find Clients to Work With' },
          { icon: 'receipt', label: 'Track Business Expenses' },
          { icon: 'car', label: 'Log Mileage for Deductions' },
        ].map((step, index) => (
          <View key={index} style={styles.nextStepItem}>
            <View style={styles.nextStepIcon}>
              <Ionicons name={step.icon as any} size={20} color="#1473FF" />
            </View>
            <Text style={styles.nextStepLabel}>{step.label}</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
        <LinearGradient
          colors={['#1473FF', '#BE01FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.completeButtonGradient}
        >
          <Text style={styles.completeButtonText}>Go to Contractor Portal</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'account': return renderAccountStep();
      case 'business': return renderBusinessStep();
      case 'w9': return renderW9Step();
      case 'payment': return renderPaymentStep();
      case 'verify': return renderVerifyStep();
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
          <Text style={styles.headerTitle}>Contractor Sign Up</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((getCurrentStepIndex() + 1) / steps.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>Step {getCurrentStepIndex() + 1} of {steps.length}</Text>
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

      {currentStep !== 'verify' && currentStep !== 'complete' && (
        <View style={styles.footer}>
          {getCurrentStepIndex() > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={20} color="#666" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextButton, loading && styles.buttonDisabled]}
            onPress={handleNext}
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
                  <Text style={styles.nextButtonText}>Continue</Text>
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
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  acknowledgmentSection: {
    marginTop: 20,
    gap: 12,
  },
  acknowledgmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
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
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#a0a0a0',
    lineHeight: 20,
  },
  link: {
    color: '#1473FF',
    textDecorationLine: 'underline',
  },
  classificationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  classificationOptionSelected: {
    borderColor: '#1473FF',
    backgroundColor: '#1473FF10',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1473FF',
  },
  classificationLabel: {
    fontSize: 15,
    color: '#FFF',
  },
  w9Header: {
    marginBottom: 20,
  },
  irsNotice: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
    alignItems: 'flex-start',
  },
  irsNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#F59E0B',
    lineHeight: 18,
  },
  taxClassScroll: {
    marginBottom: 8,
  },
  taxClassChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a4e',
    marginRight: 8,
  },
  taxClassChipSelected: {
    backgroundColor: '#1473FF',
    borderColor: '#1473FF',
  },
  taxClassChipText: {
    fontSize: 13,
    color: '#a0a0a0',
  },
  taxClassChipTextSelected: {
    color: '#FFF',
    fontWeight: '500',
  },
  tinTypeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tinTypeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  tinTypeButtonActive: {
    backgroundColor: '#1473FF',
    borderColor: '#1473FF',
  },
  tinTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tinTypeTextActive: {
    color: '#FFF',
  },
  certificationSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  certificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  certificationText: {
    fontSize: 12,
    color: '#a0a0a0',
    lineHeight: 18,
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  paymentOptionSelected: {
    borderColor: '#1473FF',
    backgroundColor: '#1473FF10',
  },
  paymentOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#2a2a4e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentOptionContent: {
    flex: 1,
  },
  paymentOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
    marginBottom: 4,
  },
  paymentOptionDescription: {
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
  walletInfo: {
    marginTop: 16,
  },
  walletInfoGradient: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  walletInfoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 12,
    marginBottom: 8,
  },
  walletInfoText: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'center',
    lineHeight: 20,
  },
  verifyIcon: {
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeInputContainer: {
    marginVertical: 24,
  },
  codeInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    borderWidth: 2,
    borderColor: '#2a2a4e',
    letterSpacing: 8,
  },
  verifyButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  verifyButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
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
  nextStepsCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginVertical: 24,
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
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  nextStepIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1473FF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nextStepLabel: {
    flex: 1,
    fontSize: 15,
    color: '#FFF',
  },
  completeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  completeButtonText: {
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
