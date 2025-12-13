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

type UserRole = 'employer' | 'employee' | 'contractor';

const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  
  const [role, setRole] = useState<UserRole | null>(null);

  const handleRoleSelect = (selectedRole: UserRole) => {
    switch (selectedRole) {
      case 'employer':
        navigation.navigate('EmployerRegister');
        break;
      case 'employee':
        navigation.navigate('EmployeeRegister');
        break;
      case 'contractor':
        navigation.navigate('ContractorRegister');
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={gradients.header} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Get Started</Text>
          <Text style={styles.headerSubtitle}>Choose how you want to use Saurellius</Text>
        </LinearGradient>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>I am a...</Text>

          <TouchableOpacity 
            style={styles.roleCard}
            onPress={() => handleRoleSelect('employer')}
          >
            <LinearGradient
              colors={['#1473FF', '#0D5BCC']}
              style={styles.roleIconContainer}
            >
              <Ionicons name="business" size={32} color="#FFF" />
            </LinearGradient>
            <View style={styles.roleContent}>
              <Text style={styles.roleTitle}>Employer</Text>
              <Text style={styles.roleDescription}>
                Create your company, manage payroll, hire employees, and handle tax compliance
              </Text>
              <View style={styles.roleFeatures}>
                <View style={styles.featureTag}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={styles.featureText}>Full Payroll Suite</Text>
                </View>
                <View style={styles.featureTag}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={styles.featureText}>Tax Filing</Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.roleCard}
            onPress={() => handleRoleSelect('employee')}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.roleIconContainer}
            >
              <Ionicons name="person" size={32} color="#FFF" />
            </LinearGradient>
            <View style={styles.roleContent}>
              <Text style={styles.roleTitle}>Employee</Text>
              <Text style={styles.roleDescription}>
                Access your paystubs, manage tax forms, enroll in benefits, and track time off
              </Text>
              <View style={styles.roleFeatures}>
                <View style={styles.featureTag}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={styles.featureText}>Self-Service Portal</Text>
                </View>
                <View style={styles.featureTag}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={styles.featureText}>Direct Deposit</Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.roleCard}
            onPress={() => handleRoleSelect('contractor')}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.roleIconContainer}
            >
              <Ionicons name="briefcase" size={32} color="#FFF" />
            </LinearGradient>
            <View style={styles.roleContent}>
              <Text style={styles.roleTitle}>Contractor (1099)</Text>
              <Text style={styles.roleDescription}>
                Send invoices, track expenses, manage W-9 forms, and receive payments
              </Text>
              <View style={styles.roleFeatures}>
                <View style={styles.featureTag}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={styles.featureText}>Invoice Clients</Text>
                </View>
                <View style={styles.featureTag}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={styles.featureText}>Expense Tracking</Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Already have an account? <Text style={styles.loginLinkText}>Log In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  scrollContent: { flexGrow: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  backButton: { marginBottom: 20 },
  headerTitle: { fontSize: 32, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  form: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginBottom: 20 },
  roleCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#1a1a2e', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#2a2a4e' 
  },
  roleIconContainer: { 
    width: 64, 
    height: 64, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  roleContent: { flex: 1 },
  roleTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  roleDescription: { fontSize: 13, color: '#a0a0a0', lineHeight: 18, marginBottom: 8 },
  roleFeatures: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featureTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  featureText: { fontSize: 12, color: '#a0a0a0' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2a2a4e' },
  dividerText: { marginHorizontal: 16, fontSize: 14, color: '#666' },
  loginLink: { alignItems: 'center', paddingBottom: 40 },
  loginText: { fontSize: 15, color: '#a0a0a0' },
  loginLinkText: { color: '#1473FF', fontWeight: '600' },
});

export default SignUpScreen;
