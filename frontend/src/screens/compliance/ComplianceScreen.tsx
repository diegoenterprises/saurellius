/**
 * DOCUGINUITY COMPLIANCE SCREEN
 * Document tracking, I-9, W-4, W-2, 941, 1099 management
 * Filing calendar and compliance status
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import complianceService from '../../services/compliance';

type TabType = 'overview' | 'documents' | 'deadlines' | 'onboarding';

interface ComplianceStatus {
  total_employees: number;
  fully_compliant: number;
  missing_documents: number;
  expiring_soon: number;
  compliance_rate: number;
}

interface Deadline {
  form: string;
  deadline: string;
  description: string;
  days_remaining: number;
}

interface FederalForm {
  id: string;
  name: string;
  full_name: string;
  purpose: string;
  deadline: string;
  frequency: string;
}

export default function ComplianceScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Deadline[]>([]);
  const [federalForms, setFederalForms] = useState<FederalForm[]>([]);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  useEffect(() => {
    loadData();
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardData, deadlinesData, formsData] = await Promise.all([
        complianceService.getComplianceDashboard(),
        complianceService.getUpcomingDeadlines(60),
        complianceService.getAllForms(),
      ]);

      if (dashboardData?.compliance_status) {
        setComplianceStatus(dashboardData.compliance_status);
      }
      if (deadlinesData) {
        setUpcomingDeadlines(deadlinesData as any);
      }
      if (formsData) {
        setFederalForms(formsData as any);
      }
    } catch (error) {
      console.error('Error loading compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return '#10B981';
    if (rate >= 70) return '#F59E0B';
    return '#EF4444';
  };

  const getDeadlineUrgency = (days: number) => {
    if (days <= 7) return { color: '#EF4444', label: 'Urgent' };
    if (days <= 14) return { color: '#F59E0B', label: 'Soon' };
    if (days <= 30) return { color: '#3B82F6', label: 'Upcoming' };
    return { color: '#6B7280', label: 'Scheduled' };
  };

  const tabs: { id: TabType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'overview', label: 'Overview', icon: 'analytics-outline' },
    { id: 'documents', label: 'DocuGinuity', icon: 'document-text-outline' },
    { id: 'deadlines', label: 'Deadlines', icon: 'calendar-outline' },
    { id: 'onboarding', label: 'Onboarding', icon: 'person-add-outline' },
  ];

  const documentTypes = [
    { id: 'i9', name: 'I-9', description: 'Employment Eligibility', icon: 'person-circle-outline', count: 45 },
    { id: 'w4', name: 'W-4', description: 'Withholding Certificate', icon: 'document-outline', count: 48 },
    { id: 'w2', name: 'W-2', description: 'Wage Statement', icon: 'receipt-outline', count: 42 },
    { id: '941', name: '941', description: 'Quarterly Tax Return', icon: 'calculator-outline', count: 4 },
    { id: '1099', name: '1099-NEC', description: 'Contractor Payments', icon: 'briefcase-outline', count: 12 },
    { id: 'w9', name: 'W-9', description: 'Contractor TIN Request', icon: 'card-outline', count: 15 },
  ];

  const renderOverview = () => (
    <Animated.View 
      style={[
        styles.tabContent,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      {/* Compliance Score Card */}
      <View style={styles.scoreCard}>
        <LinearGradient
          colors={['#1473FF', '#BE01FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.scoreGradient}
        >
          <View style={styles.scoreHeader}>
            <Ionicons name="shield-checkmark" size={32} color="#fff" />
            <Text style={styles.scoreTitle}>DocuGinuity Compliance</Text>
          </View>
          
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>
              {complianceStatus?.compliance_rate || 95}%
            </Text>
            <Text style={styles.scoreLabel}>Compliant</Text>
          </View>

          <View style={styles.scoreStats}>
            <View style={styles.scoreStat}>
              <Text style={styles.scoreStatValue}>{complianceStatus?.total_employees || 50}</Text>
              <Text style={styles.scoreStatLabel}>Employees</Text>
            </View>
            <View style={styles.scoreStatDivider} />
            <View style={styles.scoreStat}>
              <Text style={styles.scoreStatValue}>{complianceStatus?.fully_compliant || 48}</Text>
              <Text style={styles.scoreStatLabel}>Compliant</Text>
            </View>
            <View style={styles.scoreStatDivider} />
            <View style={styles.scoreStat}>
              <Text style={styles.scoreStatValue}>{complianceStatus?.missing_documents || 2}</Text>
              <Text style={styles.scoreStatLabel}>Missing Docs</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('AddEmployee' as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="add-circle" size={24} color="#10B981" />
            </View>
            <Text style={styles.actionLabel}>New Employee</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => setActiveTab('documents')}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Ionicons name="scan" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.actionLabel}>Scan Document</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => {
              // Show alerts - filter missing documents
              setActiveTab('documents');
            }}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="alert-circle" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.actionLabel}>View Alerts</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Reports' as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <Ionicons name="download" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.actionLabel}>Export Report</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upcoming Deadlines Preview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
          <TouchableOpacity onPress={() => setActiveTab('deadlines')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {upcomingDeadlines.slice(0, 3).map((deadline, index) => {
          const urgency = getDeadlineUrgency(deadline.days_remaining);
          return (
            <View key={index} style={styles.deadlineItem}>
              <View style={[styles.deadlineIndicator, { backgroundColor: urgency.color }]} />
              <View style={styles.deadlineContent}>
                <Text style={styles.deadlineForm}>{deadline.form}</Text>
                <Text style={styles.deadlineDesc}>{deadline.description}</Text>
              </View>
              <View style={styles.deadlineDate}>
                <Text style={[styles.deadlineDays, { color: urgency.color }]}>
                  {deadline.days_remaining}d
                </Text>
                <Text style={styles.deadlineDateText}>{deadline.deadline}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );

  const renderDocuments = () => (
    <View style={styles.tabContent}>
      <View style={styles.documentsGrid}>
        {documentTypes.map((doc) => (
          <TouchableOpacity key={doc.id} style={styles.documentCard}>
            <View style={styles.documentIconContainer}>
              <Ionicons name={doc.icon as any} size={28} color="#1473FF" />
            </View>
            <Text style={styles.documentName}>{doc.name}</Text>
            <Text style={styles.documentDesc}>{doc.description}</Text>
            <View style={styles.documentCount}>
              <Text style={styles.documentCountText}>{doc.count}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDeadlines = () => (
    <View style={styles.tabContent}>
      <View style={styles.calendarHeader}>
        <Text style={styles.calendarYear}>2025 Filing Calendar</Text>
      </View>
      
      {federalForms.length > 0 ? (
        federalForms.map((form, index) => (
          <View key={index} style={styles.formItem}>
            <View style={styles.formIconBox}>
              <Ionicons name="document-text" size={20} color="#1473FF" />
            </View>
            <View style={styles.formContent}>
              <Text style={styles.formName}>{form.name}</Text>
              <Text style={styles.formPurpose}>{form.purpose}</Text>
              <Text style={styles.formDeadline}>Due: {form.deadline}</Text>
            </View>
            <View style={[styles.formFrequency, { backgroundColor: form.frequency === 'quarterly' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(139, 92, 246, 0.15)' }]}>
              <Text style={[styles.formFrequencyText, { color: form.frequency === 'quarterly' ? '#3B82F6' : '#8B5CF6' }]}>
                {form.frequency}
              </Text>
            </View>
          </View>
        ))
      ) : (
        // Default deadlines if API not available
        [
          { form: 'W-2/W-3', date: 'January 31', desc: 'Employee wage statements' },
          { form: 'Form 941', date: 'Quarterly', desc: 'Federal tax return' },
          { form: 'Form 940', date: 'January 31', desc: 'FUTA tax return' },
          { form: '1099-NEC', date: 'January 31', desc: 'Contractor payments' },
          { form: '1095-C', date: 'March 2', desc: 'ACA health coverage' },
        ].map((item, index) => (
          <View key={index} style={styles.formItem}>
            <View style={styles.formIconBox}>
              <Ionicons name="document-text" size={20} color="#1473FF" />
            </View>
            <View style={styles.formContent}>
              <Text style={styles.formName}>{item.form}</Text>
              <Text style={styles.formPurpose}>{item.desc}</Text>
              <Text style={styles.formDeadline}>Due: {item.date}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderOnboarding = () => (
    <View style={styles.tabContent}>
      <View style={styles.onboardingCard}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.onboardingGradient}
        >
          <Ionicons name="person-add" size={40} color="#fff" />
          <Text style={styles.onboardingTitle}>New Employee Checklist</Text>
          <Text style={styles.onboardingSubtitle}>
            Automated document collection for new hires
          </Text>
          <TouchableOpacity 
            style={styles.onboardingButton}
            onPress={() => navigation.navigate('Onboarding' as any)}
          >
            <Text style={styles.onboardingButtonText}>Start Onboarding</Text>
            <Ionicons name="arrow-forward" size={18} color="#10B981" />
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Required Documents</Text>
        
        {[
          { name: 'I-9 Form', desc: 'Within 3 days of hire', icon: 'person-circle', docType: 'i9' },
          { name: 'W-4 Form', desc: 'At time of hire', icon: 'document', docType: 'w4' },
          { name: 'State W-4', desc: 'State-specific withholding', icon: 'map', docType: 'state_w4' },
          { name: 'Direct Deposit', desc: 'Bank account verification', icon: 'card', docType: 'direct_deposit' },
          { name: 'Emergency Contact', desc: 'Required for safety', icon: 'call', docType: 'emergency' },
        ].map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.checklistItem}
            onPress={() => setActiveTab('documents')}
          >
            <View style={styles.checklistIcon}>
              <Ionicons name={item.icon as any} size={20} color="#1473FF" />
            </View>
            <View style={styles.checklistContent}>
              <Text style={styles.checklistName}>{item.name}</Text>
              <Text style={styles.checklistDesc}>{item.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#a0a0a0" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DocuGinuity</Text>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon} 
              size={18} 
              color={activeTab === tab.id ? '#1473FF' : '#6B7280'} 
            />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1473FF"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'documents' && renderDocuments()}
        {activeTab === 'deadlines' && renderDeadlines()}
        {activeTab === 'onboarding' && renderOnboarding()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(20, 115, 255, 0.15)',
  },
  tabLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#1473FF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  // Score Card
  scoreCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  scoreGradient: {
    padding: 20,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  scoreCircle: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
  },
  scoreLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scoreStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoreStat: {
    alignItems: 'center',
  },
  scoreStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  scoreStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  scoreStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  // Section
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: '#1473FF',
    fontWeight: '500',
  },
  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
  // Deadlines
  deadlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  deadlineIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  deadlineContent: {
    flex: 1,
  },
  deadlineForm: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  deadlineDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  deadlineDate: {
    alignItems: 'flex-end',
  },
  deadlineDays: {
    fontSize: 16,
    fontWeight: '700',
  },
  deadlineDateText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  // Documents Grid
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  documentCard: {
    width: '47%',
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  documentIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(20, 115, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  documentName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  documentDesc: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  documentCount: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(20, 115, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  documentCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1473FF',
  },
  // Calendar
  calendarHeader: {
    marginBottom: 16,
  },
  calendarYear: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  formItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  formIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(20, 115, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  formContent: {
    flex: 1,
  },
  formName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  formPurpose: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  formDeadline: {
    fontSize: 11,
    color: '#1473FF',
    marginTop: 4,
  },
  formFrequency: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  formFrequencyText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  // Onboarding
  onboardingCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  onboardingGradient: {
    padding: 24,
    alignItems: 'center',
  },
  onboardingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
  },
  onboardingSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  onboardingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  onboardingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  checklistIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(20, 115, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checklistContent: {
    flex: 1,
  },
  checklistName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  checklistDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
