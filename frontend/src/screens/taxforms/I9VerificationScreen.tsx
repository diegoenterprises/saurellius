/**
 * SAURELLIUS I-9 VERIFICATION
 * Employment Eligibility Verification Form I-9
 * Section 1 (Employee) and Section 2 (Employer) support
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type CitizenshipStatus = 'citizen' | 'noncitizen_national' | 'permanent_resident' | 'authorized_alien';

interface I9Section1 {
  lastName: string;
  firstName: string;
  middleInitial: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  dateOfBirth: string;
  ssn: string;
  email: string;
  phone: string;
  citizenshipStatus: CitizenshipStatus;
  alienNumber: string;
  i94Number: string;
  workAuthExpiration: string;
  signature: string;
}

const CITIZENSHIP_OPTIONS: { value: CitizenshipStatus; label: string }[] = [
  { value: 'citizen', label: 'A citizen of the United States' },
  { value: 'noncitizen_national', label: 'A noncitizen national of the United States' },
  { value: 'permanent_resident', label: 'A lawful permanent resident (Alien Registration Number/USCIS Number)' },
  { value: 'authorized_alien', label: 'An alien authorized to work until (expiration date)' },
];

const LIST_A_DOCS = [
  'U.S. Passport',
  'U.S. Passport Card',
  'Permanent Resident Card (Form I-551)',
  'Employment Authorization Document (EAD)',
  'Foreign Passport with I-94',
];

const LIST_B_DOCS = [
  "Driver's License",
  'State ID Card',
  'School ID with Photograph',
  'Voter Registration Card',
  'U.S. Military Card',
];

const LIST_C_DOCS = [
  'Social Security Card (unrestricted)',
  'Birth Certificate (U.S.)',
  'Birth Certificate (U.S. Territory)',
  'Certification of Birth Abroad (FS-545)',
  'U.S. Citizen ID Card (I-197)',
];

const I9VerificationScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const [activeSection, setActiveSection] = useState<1 | 2>(1);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docListType, setDocListType] = useState<'A' | 'B' | 'C'>('A');
  
  const [section1, setSection1] = useState<I9Section1>({
    lastName: '',
    firstName: '',
    middleInitial: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    dateOfBirth: '',
    ssn: '',
    email: '',
    phone: '',
    citizenshipStatus: 'citizen',
    alienNumber: '',
    i94Number: '',
    workAuthExpiration: '',
    signature: '',
  });
  
  const [selectedDocs, setSelectedDocs] = useState<{
    listA?: string;
    listB?: string;
    listC?: string;
  }>({});
  
  const [section2, setSection2] = useState({
    listADoc: '',
    listANumber: '',
    listAExpiration: '',
    listBDoc: '',
    listBNumber: '',
    listBExpiration: '',
    listCDoc: '',
    listCNumber: '',
    listCExpiration: '',
    employerSignature: '',
    employerName: '',
    employerTitle: '',
    employerCompany: '',
    firstDayOfWork: '',
  });
  
  const handleSection1Submit = () => {
    if (!section1.lastName || !section1.firstName || !section1.dateOfBirth || !section1.signature) {
      Alert.alert('Error', 'Please complete all required fields');
      return;
    }
    
    Alert.alert(
      'Section 1 Complete',
      'Employee information saved. Section 2 must be completed within 3 business days of hire.',
      [{ text: 'OK', onPress: () => setActiveSection(2) }]
    );
  };
  
  const handleSection2Submit = () => {
    const hasListA = section2.listADoc && section2.listANumber;
    const hasListBC = section2.listBDoc && section2.listCDoc;
    
    if (!hasListA && !hasListBC) {
      Alert.alert('Error', 'Please provide List A document OR List B + List C documents');
      return;
    }
    
    if (!section2.employerSignature) {
      Alert.alert('Error', 'Employer signature is required');
      return;
    }
    
    Alert.alert(
      'I-9 Complete',
      'Employment verification is complete. Employee is authorized to work.',
      [{ text: 'OK' }]
    );
  };
  
  const selectDocument = (doc: string) => {
    if (docListType === 'A') {
      setSection2({ ...section2, listADoc: doc });
      setSelectedDocs({ ...selectedDocs, listA: doc });
    } else if (docListType === 'B') {
      setSection2({ ...section2, listBDoc: doc });
      setSelectedDocs({ ...selectedDocs, listB: doc });
    } else {
      setSection2({ ...section2, listCDoc: doc });
      setSelectedDocs({ ...selectedDocs, listC: doc });
    }
    setShowDocModal(false);
  };
  
  const styles = createStyles(isDarkMode);
  
  const renderSection1 = () => (
    <ScrollView style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>Section 1: Employee Information and Attestation</Text>
      <Text style={styles.sectionNote}>
        Employees must complete Section 1 on or before the first day of employment.
      </Text>
      
      {/* Personal Information */}
      <View style={styles.fieldGroup}>
        <Text style={styles.groupTitle}>Personal Information</Text>
        
        <View style={styles.row}>
          <View style={styles.col2}>
            <Text style={styles.inputLabel}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={section1.lastName}
              onChangeText={(t) => setSection1({ ...section1, lastName: t })}
              placeholder="Last name"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <View style={styles.col2}>
            <Text style={styles.inputLabel}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={section1.firstName}
              onChangeText={(t) => setSection1({ ...section1, firstName: t })}
              placeholder="First name"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>
        
        <View style={styles.row}>
          <View style={styles.col3}>
            <Text style={styles.inputLabel}>Middle Initial</Text>
            <TextInput
              style={styles.input}
              value={section1.middleInitial}
              onChangeText={(t) => setSection1({ ...section1, middleInitial: t })}
              placeholder="M.I."
              placeholderTextColor="#9CA3AF"
              maxLength={1}
            />
          </View>
          <View style={styles.col3}>
            <Text style={styles.inputLabel}>Date of Birth *</Text>
            <TextInput
              style={styles.input}
              value={section1.dateOfBirth}
              onChangeText={(t) => setSection1({ ...section1, dateOfBirth: t })}
              placeholder="MM/DD/YYYY"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <View style={styles.col3}>
            <Text style={styles.inputLabel}>SSN</Text>
            <TextInput
              style={styles.input}
              value={section1.ssn}
              onChangeText={(t) => setSection1({ ...section1, ssn: t })}
              placeholder="XXX-XX-XXXX"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />
          </View>
        </View>
        
        <Text style={styles.inputLabel}>Address *</Text>
        <TextInput
          style={styles.input}
          value={section1.address}
          onChangeText={(t) => setSection1({ ...section1, address: t })}
          placeholder="Street address"
          placeholderTextColor="#9CA3AF"
        />
        
        <View style={styles.row}>
          <View style={styles.col3}>
            <Text style={styles.inputLabel}>City *</Text>
            <TextInput
              style={styles.input}
              value={section1.city}
              onChangeText={(t) => setSection1({ ...section1, city: t })}
              placeholder="City"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <View style={styles.col3}>
            <Text style={styles.inputLabel}>State *</Text>
            <TextInput
              style={styles.input}
              value={section1.state}
              onChangeText={(t) => setSection1({ ...section1, state: t })}
              placeholder="State"
              placeholderTextColor="#9CA3AF"
              maxLength={2}
              autoCapitalize="characters"
            />
          </View>
          <View style={styles.col3}>
            <Text style={styles.inputLabel}>ZIP *</Text>
            <TextInput
              style={styles.input}
              value={section1.zipCode}
              onChangeText={(t) => setSection1({ ...section1, zipCode: t })}
              placeholder="ZIP"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>
      
      {/* Citizenship Attestation */}
      <View style={styles.fieldGroup}>
        <Text style={styles.groupTitle}>Citizenship/Immigration Status</Text>
        <Text style={styles.groupNote}>
          I attest, under penalty of perjury, that I am (check one of the following boxes):
        </Text>
        
        {CITIZENSHIP_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.citizenshipOption,
              section1.citizenshipStatus === option.value && styles.citizenshipOptionSelected
            ]}
            onPress={() => setSection1({ ...section1, citizenshipStatus: option.value })}
          >
            <View style={[
              styles.radioOuter,
              section1.citizenshipStatus === option.value && styles.radioOuterSelected
            ]}>
              {section1.citizenshipStatus === option.value && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.citizenshipLabel}>{option.label}</Text>
          </TouchableOpacity>
        ))}
        
        {section1.citizenshipStatus === 'permanent_resident' && (
          <View style={styles.additionalField}>
            <Text style={styles.inputLabel}>Alien Registration Number/USCIS Number *</Text>
            <TextInput
              style={styles.input}
              value={section1.alienNumber}
              onChangeText={(t) => setSection1({ ...section1, alienNumber: t })}
              placeholder="A-Number"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        )}
        
        {section1.citizenshipStatus === 'authorized_alien' && (
          <View style={styles.additionalField}>
            <View style={styles.row}>
              <View style={styles.col2}>
                <Text style={styles.inputLabel}>Work Authorization Expiration *</Text>
                <TextInput
                  style={styles.input}
                  value={section1.workAuthExpiration}
                  onChangeText={(t) => setSection1({ ...section1, workAuthExpiration: t })}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.col2}>
                <Text style={styles.inputLabel}>Alien Number or I-94 Number</Text>
                <TextInput
                  style={styles.input}
                  value={section1.i94Number}
                  onChangeText={(t) => setSection1({ ...section1, i94Number: t })}
                  placeholder="Number"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          </View>
        )}
      </View>
      
      {/* Signature */}
      <View style={styles.fieldGroup}>
        <Text style={styles.groupTitle}>Employee Signature</Text>
        <Text style={styles.inputLabel}>Electronic Signature *</Text>
        <TextInput
          style={styles.input}
          value={section1.signature}
          onChangeText={(t) => setSection1({ ...section1, signature: t })}
          placeholder="Type your full legal name"
          placeholderTextColor="#9CA3AF"
        />
        <Text style={styles.dateText}>Date: {new Date().toLocaleDateString()}</Text>
      </View>
      
      <TouchableOpacity style={styles.submitButton} onPress={handleSection1Submit}>
        <Text style={styles.submitButtonText}>Complete Section 1</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </ScrollView>
  );
  
  const renderSection2 = () => (
    <ScrollView style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>Section 2: Employer Review and Verification</Text>
      <Text style={styles.sectionNote}>
        Employers must complete Section 2 within 3 business days of the employee's first day of work.
      </Text>
      
      <View style={styles.deadlineAlert}>
        <Ionicons name="calendar" size={24} color="#F59E0B" />
        <View style={styles.deadlineContent}>
          <Text style={styles.deadlineTitle}>Deadline Reminder</Text>
          <Text style={styles.deadlineText}>
            You have 3 business days from the employee's start date to complete this section.
          </Text>
        </View>
      </View>
      
      {/* Document Selection */}
      <View style={styles.fieldGroup}>
        <Text style={styles.groupTitle}>Document Verification</Text>
        <Text style={styles.groupNote}>
          Examine one document from List A, OR one from List B AND one from List C.
        </Text>
        
        {/* List A */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>List A - Identity AND Employment Authorization</Text>
            <Text style={styles.listOr}>OR</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.docSelector}
            onPress={() => { setDocListType('A'); setShowDocModal(true); }}
          >
            <Ionicons name="document-text" size={24} color="#6366F1" />
            <Text style={styles.docSelectorText}>
              {section2.listADoc || 'Select List A Document'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
          
          {section2.listADoc && (
            <View style={styles.docDetails}>
              <View style={styles.col2}>
                <Text style={styles.inputLabel}>Document Number</Text>
                <TextInput
                  style={styles.input}
                  value={section2.listANumber}
                  onChangeText={(t) => setSection2({ ...section2, listANumber: t })}
                  placeholder="Enter number"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.col2}>
                <Text style={styles.inputLabel}>Expiration Date</Text>
                <TextInput
                  style={styles.input}
                  value={section2.listAExpiration}
                  onChangeText={(t) => setSection2({ ...section2, listAExpiration: t })}
                  placeholder="MM/DD/YYYY or N/A"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          )}
        </View>
        
        {/* List B + C */}
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>List B - Identity</Text>
          <TouchableOpacity 
            style={styles.docSelector}
            onPress={() => { setDocListType('B'); setShowDocModal(true); }}
          >
            <Ionicons name="card" size={24} color="#10B981" />
            <Text style={styles.docSelectorText}>
              {section2.listBDoc || 'Select List B Document'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
          
          {section2.listBDoc && (
            <View style={styles.docDetails}>
              <View style={styles.col2}>
                <Text style={styles.inputLabel}>Document Number</Text>
                <TextInput
                  style={styles.input}
                  value={section2.listBNumber}
                  onChangeText={(t) => setSection2({ ...section2, listBNumber: t })}
                  placeholder="Enter number"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.col2}>
                <Text style={styles.inputLabel}>Expiration Date</Text>
                <TextInput
                  style={styles.input}
                  value={section2.listBExpiration}
                  onChangeText={(t) => setSection2({ ...section2, listBExpiration: t })}
                  placeholder="MM/DD/YYYY or N/A"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>List C - Employment Authorization</Text>
            <Text style={styles.andLabel}>AND</Text>
          </View>
          <TouchableOpacity 
            style={styles.docSelector}
            onPress={() => { setDocListType('C'); setShowDocModal(true); }}
          >
            <Ionicons name="shield-checkmark" size={24} color="#F59E0B" />
            <Text style={styles.docSelectorText}>
              {section2.listCDoc || 'Select List C Document'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
          
          {section2.listCDoc && (
            <View style={styles.docDetails}>
              <View style={styles.col2}>
                <Text style={styles.inputLabel}>Document Number</Text>
                <TextInput
                  style={styles.input}
                  value={section2.listCNumber}
                  onChangeText={(t) => setSection2({ ...section2, listCNumber: t })}
                  placeholder="Enter number"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.col2}>
                <Text style={styles.inputLabel}>Expiration Date</Text>
                <TextInput
                  style={styles.input}
                  value={section2.listCExpiration}
                  onChangeText={(t) => setSection2({ ...section2, listCExpiration: t })}
                  placeholder="MM/DD/YYYY or N/A"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          )}
        </View>
      </View>
      
      {/* Employer Certification */}
      <View style={styles.fieldGroup}>
        <Text style={styles.groupTitle}>Employer Certification</Text>
        
        <Text style={styles.inputLabel}>First Day of Employment *</Text>
        <TextInput
          style={styles.input}
          value={section2.firstDayOfWork}
          onChangeText={(t) => setSection2({ ...section2, firstDayOfWork: t })}
          placeholder="MM/DD/YYYY"
          placeholderTextColor="#9CA3AF"
        />
        
        <View style={styles.row}>
          <View style={styles.col2}>
            <Text style={styles.inputLabel}>Employer Name *</Text>
            <TextInput
              style={styles.input}
              value={section2.employerName}
              onChangeText={(t) => setSection2({ ...section2, employerName: t })}
              placeholder="Full name"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <View style={styles.col2}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              value={section2.employerTitle}
              onChangeText={(t) => setSection2({ ...section2, employerTitle: t })}
              placeholder="Title"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>
        
        <Text style={styles.inputLabel}>Employer Signature *</Text>
        <TextInput
          style={styles.input}
          value={section2.employerSignature}
          onChangeText={(t) => setSection2({ ...section2, employerSignature: t })}
          placeholder="Type full legal name"
          placeholderTextColor="#9CA3AF"
        />
        <Text style={styles.dateText}>Date: {new Date().toLocaleDateString()}</Text>
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => setActiveSection(1)}>
          <Ionicons name="arrow-back" size={20} color={isDarkMode ? '#FFFFFF' : '#374151'} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSection2Submit}>
          <Text style={styles.submitButtonText}>Complete I-9</Text>
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#10B981', '#059669']} style={styles.header}>
        <Text style={styles.headerTitle}>Form I-9</Text>
        <Text style={styles.headerSubtitle}>Employment Eligibility Verification</Text>
      </LinearGradient>
      
      {/* Section Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeSection === 1 && styles.tabActive]}
          onPress={() => setActiveSection(1)}
        >
          <Text style={[styles.tabText, activeSection === 1 && styles.tabTextActive]}>
            Section 1: Employee
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeSection === 2 && styles.tabActive]}
          onPress={() => setActiveSection(2)}
        >
          <Text style={[styles.tabText, activeSection === 2 && styles.tabTextActive]}>
            Section 2: Employer
          </Text>
        </TouchableOpacity>
      </View>
      
      {activeSection === 1 ? renderSection1() : renderSection2()}
      
      {/* Document Selection Modal */}
      <Modal visible={showDocModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select List {docListType} Document
              </Text>
              <TouchableOpacity onPress={() => setShowDocModal(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#1F2937'} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {(docListType === 'A' ? LIST_A_DOCS : docListType === 'B' ? LIST_B_DOCS : LIST_C_DOCS).map(doc => (
                <TouchableOpacity
                  key={doc}
                  style={styles.docOption}
                  onPress={() => selectDocument(doc)}
                >
                  <Ionicons 
                    name="document-text-outline" 
                    size={20} 
                    color={isDarkMode ? '#D1D5DB' : '#6B7280'} 
                  />
                  <Text style={styles.docOptionText}>{doc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDarkMode ? '#111827' : '#F3F4F6' },
  header: { padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  tabContainer: { flexDirection: 'row', backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#10B981' },
  tabText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  tabTextActive: { color: '#10B981' },
  sectionContent: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#1F2937', marginBottom: 8 },
  sectionNote: { fontSize: 13, color: '#6B7280', marginBottom: 20 },
  fieldGroup: { marginBottom: 24 },
  groupTitle: { fontSize: 16, fontWeight: '600', color: isDarkMode ? '#FFFFFF' : '#1F2937', marginBottom: 8 },
  groupNote: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  col2: { flex: 1 },
  col3: { flex: 1 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: isDarkMode ? '#D1D5DB' : '#374151', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: isDarkMode ? '#374151' : '#FFFFFF', borderRadius: 8, padding: 12, fontSize: 15, color: isDarkMode ? '#FFFFFF' : '#1F2937', borderWidth: 1, borderColor: isDarkMode ? '#4B5563' : '#D1D5DB' },
  citizenshipOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 8, backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', marginBottom: 8, borderWidth: 1, borderColor: isDarkMode ? '#374151' : '#E5E7EB' },
  citizenshipOptionSelected: { borderColor: '#10B981', backgroundColor: isDarkMode ? '#064E3B' : '#D1FAE5' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#6B7280', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  radioOuterSelected: { borderColor: '#10B981' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },
  citizenshipLabel: { flex: 1, fontSize: 14, color: isDarkMode ? '#D1D5DB' : '#374151' },
  additionalField: { marginTop: 12, padding: 12, backgroundColor: isDarkMode ? '#374151' : '#F9FAFB', borderRadius: 8 },
  dateText: { fontSize: 13, color: '#6B7280', marginTop: 8 },
  deadlineAlert: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: isDarkMode ? '#422006' : '#FEF3C7', borderRadius: 12, marginBottom: 20 },
  deadlineContent: { flex: 1 },
  deadlineTitle: { fontSize: 14, fontWeight: '600', color: '#92400E' },
  deadlineText: { fontSize: 12, color: '#B45309', marginTop: 2 },
  listSection: { marginBottom: 16 },
  listHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  listTitle: { fontSize: 14, fontWeight: '600', color: isDarkMode ? '#FFFFFF' : '#1F2937' },
  listOr: { marginLeft: 12, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#6366F1', borderRadius: 4, color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  andLabel: { marginLeft: 12, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#10B981', borderRadius: 4, color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  docSelector: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: isDarkMode ? '#374151' : '#E5E7EB' },
  docSelectorText: { flex: 1, marginLeft: 12, fontSize: 14, color: isDarkMode ? '#D1D5DB' : '#6B7280' },
  docDetails: { flexDirection: 'row', gap: 12, marginTop: 12 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  backButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 8, borderWidth: 1, borderColor: isDarkMode ? '#4B5563' : '#D1D5DB' },
  backButtonText: { color: isDarkMode ? '#FFFFFF' : '#374151', fontWeight: '600' },
  submitButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 8 },
  submitButtonText: { color: '#FFFFFF', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#1F2937' },
  modalBody: { padding: 20 },
  docOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB' },
  docOptionText: { fontSize: 15, color: isDarkMode ? '#FFFFFF' : '#1F2937' },
});

export default I9VerificationScreen;
