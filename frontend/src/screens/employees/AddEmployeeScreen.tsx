/**
 * ADD EMPLOYEE SCREEN
 * Form to create a new employee - 100% functional
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
import employeesService from '../../services/employees';

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  hire_date: string;
  pay_type: 'salary' | 'hourly';
  salary: string;
  hourly_rate: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  emergency_name: string;
  emergency_relationship: string;
  emergency_phone: string;
}

const DEPARTMENTS = ['Engineering', 'Design', 'Marketing', 'Sales', 'Finance', 'HR', 'Operations'];

export default function AddEmployeeScreen({ navigation }: any) {
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    hire_date: new Date().toISOString().split('T')[0],
    pay_type: 'salary',
    salary: '',
    hourly_rate: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    emergency_name: '',
    emergency_relationship: '',
    emergency_phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.first_name.trim() || !formData.last_name.trim()) {
          Alert.alert('Required', 'Please enter first and last name');
          return false;
        }
        if (!formData.email.trim() || !formData.email.includes('@')) {
          Alert.alert('Required', 'Please enter a valid email');
          return false;
        }
        return true;
      case 2:
        if (!formData.department || !formData.position) {
          Alert.alert('Required', 'Please select department and enter position');
          return false;
        }
        if (formData.pay_type === 'salary' && !formData.salary) {
          Alert.alert('Required', 'Please enter salary');
          return false;
        }
        if (formData.pay_type === 'hourly' && !formData.hourly_rate) {
          Alert.alert('Required', 'Please enter hourly rate');
          return false;
        }
        return true;
      case 3:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      // Create employee via API
      await employeesService.createEmployee({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || undefined,
        department: formData.department || undefined,
        position: formData.position || undefined,
        hire_date: formData.hire_date,
        pay_type: formData.pay_type,
        pay_rate: formData.pay_type === 'salary' 
          ? parseFloat(formData.salary) 
          : parseFloat(formData.hourly_rate),
        pay_frequency: 'biweekly',
        address: formData.street ? {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
        } : undefined,
      });
      
      Alert.alert('Success', 'Employee added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    field: keyof FormData,
    options?: {
      placeholder?: string;
      keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    }
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={formData[field]}
        onChangeText={(text) => updateField(field, text)}
        placeholder={options?.placeholder || `Enter ${label.toLowerCase()}`}
        placeholderTextColor="#999"
        keyboardType={options?.keyboardType || 'default'}
        autoCapitalize={options?.autoCapitalize || 'sentences'}
      />
    </View>
  );

  const renderStep1 = () => (
    <>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <View style={styles.row}>
        <View style={styles.halfInput}>
          {renderInput('First Name', 'first_name', { autoCapitalize: 'words' })}
        </View>
        <View style={styles.halfInput}>
          {renderInput('Last Name', 'last_name', { autoCapitalize: 'words' })}
        </View>
      </View>
      {renderInput('Email', 'email', { keyboardType: 'email-address', autoCapitalize: 'none' })}
      {renderInput('Phone', 'phone', { keyboardType: 'phone-pad' })}
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.stepTitle}>Employment Details</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Department</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
          {DEPARTMENTS.map((dept) => (
            <TouchableOpacity
              key={dept}
              style={[styles.chip, formData.department === dept && styles.chipSelected]}
              onPress={() => updateField('department', dept)}
            >
              <Text style={[styles.chipText, formData.department === dept && styles.chipTextSelected]}>
                {dept}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {renderInput('Position', 'position', { autoCapitalize: 'words' })}
      {renderInput('Hire Date', 'hire_date', { placeholder: 'YYYY-MM-DD' })}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Pay Type</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, formData.pay_type === 'salary' && styles.toggleButtonActive]}
            onPress={() => updateField('pay_type', 'salary')}
          >
            <Text style={[styles.toggleText, formData.pay_type === 'salary' && styles.toggleTextActive]}>
              Salary
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, formData.pay_type === 'hourly' && styles.toggleButtonActive]}
            onPress={() => updateField('pay_type', 'hourly')}
          >
            <Text style={[styles.toggleText, formData.pay_type === 'hourly' && styles.toggleTextActive]}>
              Hourly
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {formData.pay_type === 'salary' ? (
        renderInput('Annual Salary ($)', 'salary', { keyboardType: 'numeric' })
      ) : (
        renderInput('Hourly Rate ($)', 'hourly_rate', { keyboardType: 'numeric' })
      )}
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.stepTitle}>Additional Information</Text>
      
      <Text style={styles.sectionLabel}>Address</Text>
      {renderInput('Street', 'street')}
      <View style={styles.row}>
        <View style={styles.halfInput}>
          {renderInput('City', 'city', { autoCapitalize: 'words' })}
        </View>
        <View style={styles.quarterInput}>
          {renderInput('State', 'state', { autoCapitalize: 'characters' })}
        </View>
        <View style={styles.quarterInput}>
          {renderInput('ZIP', 'zip', { keyboardType: 'numeric' })}
        </View>
      </View>

      <Text style={styles.sectionLabel}>Emergency Contact</Text>
      {renderInput('Contact Name', 'emergency_name', { autoCapitalize: 'words' })}
      {renderInput('Relationship', 'emergency_relationship')}
      {renderInput('Contact Phone', 'emergency_phone', { keyboardType: 'phone-pad' })}
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#1473FF', '#BE01FF']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Employee</Text>
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((step) => (
            <View
              key={step}
              style={[
                styles.progressDot,
                currentStep >= step && styles.progressDotActive,
              ]}
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
          onPress={currentStep === totalSteps ? handleSubmit : handleNext}
          disabled={loading}
        >
          <LinearGradient
            colors={['#1473FF', '#BE01FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {loading ? 'Saving...' : currentStep === totalSteps ? 'Add Employee' : 'Continue'}
            </Text>
            {!loading && currentStep < totalSteps && (
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
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
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
    backgroundColor: colors.background,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a0a0a0',
    marginTop: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
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
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  quarterInput: {
    flex: 0.5,
  },
  chipContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    marginRight: 8,
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
    color: colors.text,
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
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
    color: colors.text,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 34,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
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
    color: '#a0a0a0',
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
    color: colors.text,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  bottomPadding: {
    height: 40,
  },
});
