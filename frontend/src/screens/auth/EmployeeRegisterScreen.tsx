/**
 * EMPLOYEE SELF-SERVICE REGISTRATION SCREEN
 * Multi-step wizard for employee self-service signup
 * Supports both self-registration and employer-invited flows
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

type StepType = 'account' | 'personal' | 'employment' | 'verify' | 'complete';

interface AccountData {
  email: string;
  password: string;
  password_confirm: string;
  phone_number: string;
}

interface PersonalData {
  first_name: string;
  middle_initial: string;
  last_name: string;
  preferred_name: string;
  date_of_birth: string;
  ssn: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip_code: string;
}

interface EmploymentData {
  employment_status: 'employed' | 'not_employed' | 'self_employed';
  employer_code: string;
  job_title: string;
}

export default function EmployeeRegisterScreen() {
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
  
  const [personalData, setPersonalData] = useState<PersonalData>({
    first_name: '',
    middle_initial: '',
    last_name: '',
    preferred_name: '',
    date_of_birth: '',
    ssn: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
  });
  
  const [employmentData, setEmploymentData] = useState<EmploymentData>({
    employment_status: 'employed',
    employer_code: '',
    job_title: '',
  });

  const [verificationCode, setVerificationCode] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [electronicConsent, setElectronicConsent] = useState(false);

  useEffect(() => {
    if (invitationToken) {
      loadInvitationData();
    }
  }, [invitationToken]);

  const loadInvitationData = async () => {
    try {
      const response = await api.get(`/api/onboarding/invitation/${invitationToken}`);
      if (response.data) {
        setInvitationData(response.data);
        setAccountData(prev => ({ ...prev, email: response.data.pre_filled_data?.email || '' }));
        setPersonalData(prev => ({
          ...prev,
          first_name: response.data.pre_filled_data?.name?.split(' ')[0] || '',
          last_name: response.data.pre_filled_data?.name?.split(' ').slice(-1)[0] || '',
        }));
        setEmploymentData(prev => ({
          ...prev,
          job_title: response.data.pre_filled_data?.job_title || '',
        }));
      }
    } catch (error) {
      console.error('Invalid invitation token');
    }
  };

  const steps: { key: StepType; label: string }[] = [
    { key: 'account', label: 'Account' },
    { key: 'personal', label: 'Personal' },
    { key: 'employment', label: 'Employment' },
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

  const formatDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
  };

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) return { valid: false, message: 'At least 8 characters' };
    if (!/[A-Z]/.test(password)) return { valid: false, message: 'One uppercase letter' };
    if (!/[a-z]/.test(password)) return { valid: false, message: 'One lowercase letter' };
    if (!/[0-9]/.test(password)) return { valid: false, message: 'One number' };
    if (!/[!@#$%^&*]/.test(password)) return { valid: false, message: 'One special character (!@#$%^&*)' };
    return { valid: true, message: 'Strong password' };
  };

  const getPasswordStrength = (password: string): { strength: number; color: string } => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[!@#$%^&*]/.test(password)) strength += 20;
    
    let color = '#EF4444';
    if (strength >= 60) color = '#F59E0B';
    if (strength >= 80) color = '#10B981';
    if (strength === 100) color = '#10B981';
    
    return { strength, color };
  };

  const validateStep = (step: StepType): boolean => {
    switch (step) {
      case 'account':
        if (!accountData.email.includes('@')) {
          Alert.alert('Invalid Email', 'Please enter a valid email address');
          return false;
        }
        const passwordValidation = validatePassword(accountData.password);
        if (!passwordValidation.valid) {
          Alert.alert('Weak Password', passwordValidation.message);
          return false;
        }
        if (accountData.password !== accountData.password_confirm) {
          Alert.alert('Password Mismatch', 'Passwords do not match');
          return false;
        }
        if (!accountData.phone_number || accountData.phone_number.length < 14) {
          Alert.alert('Invalid Phone', 'Please enter a valid phone number');
          return false;
        }
        if (!termsAccepted || !privacyAccepted || !electronicConsent) {
          Alert.alert('Required', 'Please accept all terms and conditions');
          return false;
        }
        return true;
      
      case 'personal':
        if (!personalData.first_name.trim() || !personalData.last_name.trim()) {
          Alert.alert('Required', 'First and last name are required');
          return false;
        }
        if (!personalData.date_of_birth || personalData.date_of_birth.length < 10) {
          Alert.alert('Required', 'Valid date of birth is required');
          return false;
        }
        if (!personalData.address_line1.trim() || !personalData.city.trim() || 
            !personalData.state.trim() || !personalData.zip_code.trim()) {
          Alert.alert('Required', 'Complete address is required');
          return false;
        }
        return true;
      
      case 'employment':
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
        const response = await api.post('/api/auth/register/employee', {
          ...accountData,
          terms_accepted: termsAccepted,
          privacy_accepted: privacyAccepted,
          electronic_consent: electronicConsent,
          invitation_token: invitationToken,
        });
        
        if (response.data.success) {
          setCurrentStep('personal');
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
    if (invitationToken) {
      navigation.navigate('EmployeePortal');
    } else {
      navigation.navigate('Dashboard');
    }
  };

  const resendVerificationCode = async () => {
    try {
      await api.post('/api/auth/resend-verification', { email: accountData.email });
      Alert.alert('Sent', 'A new verification code has been sent to your email');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code');
    }
  };

  const renderAccountStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Create Your Account</Text>
      <Text style={styles.stepSubtitle}>
        {invitationData 
          ? `You've been invited to join ${invitationData.employer_name}`
          : 'Set up your Saurellius employee account'
        }
      </Text>

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
          editable={!invitationData}
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
        {accountData.password.length > 0 && (
          <View style={styles.passwordStrength}>
            <View style={styles.strengthBar}>
              <View style={[
                styles.strengthFill,
                { 
                  width: `${getPasswordStrength(accountData.password).strength}%`,
                  backgroundColor: getPasswordStrength(accountData.password).color
                }
              ]} />
            </View>
            <Text style={[styles.strengthText, { color: getPasswordStrength(accountData.password).color }]}>
              {validatePassword(accountData.password).message}
            </Text>
          </View>
        )}
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
        {accountData.password_confirm.length > 0 && (
          <View style={styles.matchIndicator}>
            <Ionicons 
              name={accountData.password === accountData.password_confirm ? 'checkmark-circle' : 'close-circle'} 
              size={16} 
              color={accountData.password === accountData.password_confirm ? '#10B981' : '#EF4444'} 
            />
            <Text style={{ 
              color: accountData.password === accountData.password_confirm ? '#10B981' : '#EF4444',
              fontSize: 12,
              marginLeft: 4
            }}>
              {accountData.password === accountData.password_confirm ? 'Passwords match' : 'Passwords do not match'}
            </Text>
          </View>
        )}
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
        <Text style={styles.helperText}>For SMS notifications and 2FA</Text>
      </View>

      <View style={styles.agreementSection}>
        <TouchableOpacity 
          style={styles.checkboxRow}
          onPress={() => setTermsAccepted(!termsAccepted)}
        >
          <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
            {termsAccepted && <Ionicons name="checkmark" size={14} color="#FFF" />}
          </View>
          <Text style={styles.checkboxLabel}>
            I agree to the <Text style={styles.link}>Terms of Service</Text> *
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.checkboxRow}
          onPress={() => setPrivacyAccepted(!privacyAccepted)}
        >
          <View style={[styles.checkbox, privacyAccepted && styles.checkboxChecked]}>
            {privacyAccepted && <Ionicons name="checkmark" size={14} color="#FFF" />}
          </View>
          <Text style={styles.checkboxLabel}>
            I agree to the <Text style={styles.link}>Privacy Policy</Text> *
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.checkboxRow}
          onPress={() => setElectronicConsent(!electronicConsent)}
        >
          <View style={[styles.checkbox, electronicConsent && styles.checkboxChecked]}>
            {electronicConsent && <Ionicons name="checkmark" size={14} color="#FFF" />}
          </View>
          <Text style={styles.checkboxLabel}>
            I consent to receive electronic communications (paystubs, tax documents) *
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPersonalStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepSubtitle}>Enter your legal name exactly as it appears on your Social Security card</Text>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={personalData.first_name}
            onChangeText={(text) => setPersonalData(prev => ({ ...prev, first_name: text }))}
            placeholder="Legal first name"
            placeholderTextColor="#666"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>M.I.</Text>
          <TextInput
            style={styles.input}
            value={personalData.middle_initial}
            onChangeText={(text) => setPersonalData(prev => ({ ...prev, middle_initial: text.toUpperCase() }))}
            placeholder="M"
            placeholderTextColor="#666"
            maxLength={1}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Last Name *</Text>
        <TextInput
          style={styles.input}
          value={personalData.last_name}
          onChangeText={(text) => setPersonalData(prev => ({ ...prev, last_name: text }))}
          placeholder="Legal last name"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Preferred Name (if different)</Text>
        <TextInput
          style={styles.input}
          value={personalData.preferred_name}
          onChangeText={(text) => setPersonalData(prev => ({ ...prev, preferred_name: text }))}
          placeholder="What you like to be called"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date of Birth *</Text>
        <TextInput
          style={styles.input}
          value={personalData.date_of_birth}
          onChangeText={(text) => setPersonalData(prev => ({ ...prev, date_of_birth: formatDate(text) }))}
          placeholder="MM/DD/YYYY"
          placeholderTextColor="#666"
          keyboardType="number-pad"
          maxLength={10}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Social Security Number</Text>
        <TextInput
          style={styles.input}
          value={personalData.ssn}
          onChangeText={(text) => setPersonalData(prev => ({ ...prev, ssn: formatSSN(text) }))}
          placeholder="XXX-XX-XXXX"
          placeholderTextColor="#666"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={11}
        />
        <Text style={styles.helperText}>Required for tax purposes. Encrypted immediately.</Text>
      </View>

      <Text style={[styles.label, { marginTop: 20, marginBottom: 12 }]}>Home Address</Text>

      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          value={personalData.address_line1}
          onChangeText={(text) => setPersonalData(prev => ({ ...prev, address_line1: text }))}
          placeholder="Street address *"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          value={personalData.address_line2}
          onChangeText={(text) => setPersonalData(prev => ({ ...prev, address_line2: text }))}
          placeholder="Apt, suite, unit (optional)"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
          <TextInput
            style={styles.input}
            value={personalData.city}
            onChangeText={(text) => setPersonalData(prev => ({ ...prev, city: text }))}
            placeholder="City *"
            placeholderTextColor="#666"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <TextInput
            style={styles.input}
            value={personalData.state}
            onChangeText={(text) => setPersonalData(prev => ({ ...prev, state: text.toUpperCase() }))}
            placeholder="ST *"
            placeholderTextColor="#666"
            maxLength={2}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <TextInput
            style={styles.input}
            value={personalData.zip_code}
            onChangeText={(text) => setPersonalData(prev => ({ ...prev, zip_code: text }))}
            placeholder="ZIP *"
            placeholderTextColor="#666"
            keyboardType="number-pad"
            maxLength={5}
          />
        </View>
      </View>
    </View>
  );

  const renderEmploymentStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Employment Information</Text>
      <Text style={styles.stepSubtitle}>Tell us about your current employment status</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Current Employment Status</Text>
        {[
          { value: 'employed', label: 'Currently Employed', description: 'Looking for my employer on Saurellius' },
          { value: 'not_employed', label: 'Not Currently Employed', description: 'Setting up profile for future employment' },
          { value: 'self_employed', label: 'Self-Employed / Contractor', description: 'I work as an independent contractor' },
        ].map((status) => (
          <TouchableOpacity
            key={status.value}
            style={[styles.statusOption, employmentData.employment_status === status.value && styles.statusOptionSelected]}
            onPress={() => setEmploymentData(prev => ({ ...prev, employment_status: status.value as any }))}
          >
            <View style={[styles.radioCircle, employmentData.employment_status === status.value && styles.radioCircleSelected]}>
              {employmentData.employment_status === status.value && <View style={styles.radioInner} />}
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusLabel}>{status.label}</Text>
              <Text style={styles.statusDescription}>{status.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {employmentData.employment_status === 'employed' && !invitationToken && (
        <>
          <View style={styles.infoCard}>
            <Ionicons name="search" size={24} color="#3B82F6" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Find Your Employer</Text>
              <Text style={styles.infoText}>
                Enter your employer's company code or search by company name
              </Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Employer Code</Text>
            <TextInput
              style={styles.input}
              value={employmentData.employer_code}
              onChangeText={(text) => setEmploymentData(prev => ({ ...prev, employer_code: text.toUpperCase() }))}
              placeholder="Enter code from your employer"
              placeholderTextColor="#666"
              autoCapitalize="characters"
            />
          </View>

          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={20} color="#1473FF" />
            <Text style={styles.searchButtonText}>Search for Employer</Text>
          </TouchableOpacity>
        </>
      )}

      {invitationData && (
        <View style={styles.employerCard}>
          <View style={styles.employerInfo}>
            <View style={styles.employerLogo}>
              <Ionicons name="business" size={32} color="#1473FF" />
            </View>
            <View>
              <Text style={styles.employerName}>{invitationData.employer_name}</Text>
              <Text style={styles.employerDetail}>Invited you to join</Text>
            </View>
          </View>
          <View style={styles.jobInfo}>
            <Text style={styles.jobLabel}>Position</Text>
            <Text style={styles.jobTitle}>{invitationData.pre_filled_data?.job_title || 'To be determined'}</Text>
          </View>
          <View style={styles.jobInfo}>
            <Text style={styles.jobLabel}>Hire Date</Text>
            <Text style={styles.jobTitle}>{invitationData.pre_filled_data?.hire_date || 'To be determined'}</Text>
          </View>
        </View>
      )}

      {employmentData.employment_status === 'self_employed' && (
        <View style={styles.infoCard}>
          <Ionicons name="briefcase" size={24} color="#F59E0B" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Contractor Portal</Text>
            <Text style={styles.infoText}>
              You'll be redirected to set up your contractor profile after verification
            </Text>
          </View>
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

      <TouchableOpacity style={styles.resendButton} onPress={resendVerificationCode}>
        <Text style={styles.resendText}>Didn't receive the code? <Text style={styles.resendLink}>Resend</Text></Text>
      </TouchableOpacity>

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
      
      <Text style={styles.stepTitle}>Welcome to Saurellius!</Text>
      <Text style={styles.stepSubtitle}>
        Your account has been created successfully.
        {invitationData 
          ? ` You're now connected to ${invitationData.employer_name}.`
          : ' Complete your profile to get started.'
        }
      </Text>

      <View style={styles.nextStepsCard}>
        <Text style={styles.nextStepsTitle}>Next Steps</Text>
        {[
          { icon: 'document-text', label: 'Complete W-4 Tax Form', done: false },
          { icon: 'card', label: 'Set Up Direct Deposit', done: false },
          { icon: 'shield-checkmark', label: 'Verify I-9 Documents', done: false },
          { icon: 'heart', label: 'Enroll in Benefits', done: false },
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
          <Text style={styles.completeButtonText}>Go to Dashboard</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'account': return renderAccountStep();
      case 'personal': return renderPersonalStep();
      case 'employment': return renderEmploymentStep();
      case 'verify': return renderVerifyStep();
      case 'complete': return renderCompleteStep();
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
          <Text style={styles.headerTitle}>Employee Sign Up</Text>
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
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  passwordStrength: {
    marginTop: 8,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#2a2a4e',
    borderRadius: 2,
    marginBottom: 4,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  agreementSection: {
    marginTop: 20,
    gap: 12,
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
  statusOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  statusOptionSelected: {
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
  statusContent: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFF',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 13,
    color: '#a0a0a0',
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
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1473FF',
    gap: 8,
  },
  searchButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1473FF',
  },
  employerCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1473FF',
  },
  employerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  employerLogo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#1473FF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  employerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  employerDetail: {
    fontSize: 14,
    color: '#10B981',
  },
  jobInfo: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  jobLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
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
  resendButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  resendLink: {
    color: '#1473FF',
    fontWeight: '600',
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
