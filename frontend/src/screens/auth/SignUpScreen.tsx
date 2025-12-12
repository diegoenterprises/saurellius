/**
 * SAURELLIUS SIGN UP
 * New user registration - Employer & Employee
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store';

type UserRole = 'employer' | 'employee';

const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  
  const [role, setRole] = useState<UserRole>('employer');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyCode, setCompanyCode] = useState(''); // For employees joining existing company
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleSignUp = async () => {
    // Validation
    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (role === 'employer' && !companyName) {
      Alert.alert('Error', 'Please enter your company name');
      return;
    }
    if (role === 'employee' && !companyCode) {
      Alert.alert('Error', 'Please enter your company code (provided by your employer)');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (!agreeToTerms) {
      Alert.alert('Error', 'Please agree to the Terms of Service');
      return;
    }

    try {
      await dispatch(register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        company_name: role === 'employer' ? companyName : undefined,
        company_code: role === 'employee' ? companyCode : undefined,
        role,
      })).unwrap();
      
      Alert.alert('Success', 'Account created successfully! Please check your email to verify your account.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to create account. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <LinearGradient colors={['#1473FF', '#BE01FF']} style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Start your payroll journey</Text>
          </LinearGradient>

          <View style={styles.form}>
            {/* Role Selection */}
            <Text style={styles.roleLabel}>I am an:</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity 
                style={[styles.roleButton, role === 'employer' && styles.roleButtonActive]}
                onPress={() => setRole('employer')}
              >
                <Ionicons name="business" size={24} color={role === 'employer' ? '#fff' : '#a0a0a0'} />
                <Text style={[styles.roleButtonText, role === 'employer' && styles.roleButtonTextActive]}>Employer</Text>
                <Text style={[styles.roleDesc, role === 'employer' && styles.roleDescActive]}>Create company</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleButton, role === 'employee' && styles.roleButtonActive]}
                onPress={() => setRole('employee')}
              >
                <Ionicons name="person" size={24} color={role === 'employee' ? '#fff' : '#a0a0a0'} />
                <Text style={[styles.roleButtonText, role === 'employee' && styles.roleButtonTextActive]}>Employee</Text>
                <Text style={[styles.roleDesc, role === 'employee' && styles.roleDescActive]}>Join company</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <Ionicons name="person-outline" size={20} color="#a0a0a0" />
                <TextInput style={styles.input} placeholder="First Name" value={firstName} onChangeText={setFirstName} placeholderTextColor="#999" />
              </View>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <TextInput style={styles.input} placeholder="Last Name" value={lastName} onChangeText={setLastName} placeholderTextColor="#999" />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#a0a0a0" />
              <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#999" />
            </View>

            {role === 'employer' ? (
              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={20} color="#a0a0a0" />
                <TextInput style={styles.input} placeholder="Company Name" value={companyName} onChangeText={setCompanyName} placeholderTextColor="#999" />
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <Ionicons name="key-outline" size={20} color="#a0a0a0" />
                <TextInput style={styles.input} placeholder="Company Code (from employer)" value={companyCode} onChangeText={setCompanyCode} autoCapitalize="characters" placeholderTextColor="#999" />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#a0a0a0" />
              <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#a0a0a0" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#a0a0a0" />
              <TextInput style={styles.input} placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} />
            </View>

            <View style={styles.termsRow}>
              <TouchableOpacity 
                style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}
                onPress={() => setAgreeToTerms(!agreeToTerms)}
              >
                {agreeToTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
              </TouchableOpacity>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink} onPress={() => navigation.navigate('TermsConditions')}>
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text style={styles.termsLink} onPress={() => navigation.navigate('PrivacyPolicy')}>
                  Privacy Policy
                </Text>
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]} 
              onPress={handleSignUp}
              disabled={isLoading}
            >
              <LinearGradient colors={['#1473FF', '#BE01FF']} style={styles.signUpGradient}>
                <Text style={styles.signUpButtonText}>{isLoading ? 'Creating Account...' : 'Create Account'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign up with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => Alert.alert('Google Sign-In', 'Configure GOOGLE_CLIENT_ID in environment variables to enable Google authentication.')}
              >
                <Ionicons name="logo-google" size={24} color="#DB4437" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => Alert.alert('Apple Sign-In', 'Requires Apple Developer Program membership ($99/year) and iOS device.')}
              >
                <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => Alert.alert('Microsoft Sign-In', 'Configure AZURE_CLIENT_ID in environment variables to enable Microsoft authentication.')}
              >
                <Ionicons name="logo-microsoft" size={24} color="#00A4EF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => Alert.alert('Facebook Sign-In', 'Configure FACEBOOK_APP_ID in environment variables to enable Facebook authentication.')}
              >
                <Ionicons name="logo-facebook" size={24} color="#1877F2" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Already have an account? <Text style={styles.loginLinkText}>Log In</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 },
  backButton: { marginBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  form: { flex: 1, padding: 20 },
  roleLabel: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 12 },
  roleSelector: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleButton: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: '#2a2a4e' },
  roleButtonActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  roleButtonText: { fontSize: 16, fontWeight: '600', color: '#fff', marginTop: 8 },
  roleButtonTextActive: { color: '#fff' },
  roleDesc: { fontSize: 12, color: '#a0a0a0', marginTop: 4 },
  roleDescActive: { color: 'rgba(255,255,255,0.8)' },
  row: { flexDirection: 'row', gap: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16, borderWidth: 1, borderColor: '#2a2a4e' },
  halfInput: { flex: 1 },
  input: { flex: 1, fontSize: 16, marginLeft: 10, color: '#fff' },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#2a2a4e', marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  termsText: { flex: 1, fontSize: 14, color: '#a0a0a0' },
  termsLink: { color: '#1473FF', fontWeight: '600' },
  signUpButton: { borderRadius: 12, overflow: 'hidden', marginBottom: 24 },
  signUpButtonDisabled: { opacity: 0.7 },
  signUpGradient: { paddingVertical: 16, alignItems: 'center' },
  signUpButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2a2a4e' },
  dividerText: { marginHorizontal: 16, fontSize: 14, color: '#a0a0a0' },
  socialButtons: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 24 },
  socialButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#2a2a4e', justifyContent: 'center', alignItems: 'center' },
  loginLink: { alignItems: 'center' },
  loginText: { fontSize: 14, color: '#a0a0a0' },
  loginLinkText: { color: '#1473FF', fontWeight: '600' },
});

export default SignUpScreen;
