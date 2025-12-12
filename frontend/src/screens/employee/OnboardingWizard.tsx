/**
 * EMPLOYEE ONBOARDING WIZARD
 * 10-section guided onboarding workflow
 * Zero-touch HR administration
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import employeeSelfServiceAPI, { OnboardingStatus } from '../../services/employeeSelfService';
import { colors, gradients } from '../../theme';

interface SectionConfig {
  number: number;
  name: string;
  icon: string;
  description: string;
  required: boolean;
}

const SECTIONS: SectionConfig[] = [
  { number: 1, name: 'Personal Information', icon: 'person', description: 'Your identity and contact details', required: true },
  { number: 2, name: 'Employment Information', icon: 'briefcase', description: 'Job title, department, schedule', required: true },
  { number: 3, name: 'Federal W-4', icon: 'document-text', description: 'Federal tax withholding elections', required: true },
  { number: 4, name: 'State Tax Forms', icon: 'documents', description: 'State-specific tax forms', required: true },
  { number: 5, name: 'Direct Deposit', icon: 'card', description: 'Bank account for payroll', required: true },
  { number: 6, name: 'Form I-9', icon: 'shield-checkmark', description: 'Employment eligibility verification', required: true },
  { number: 7, name: 'Benefits Enrollment', icon: 'heart', description: 'Health, dental, vision, 401k', required: false },
  { number: 8, name: 'Policy Acknowledgments', icon: 'document-attach', description: 'Company policies and handbook', required: true },
  { number: 9, name: 'Additional Information', icon: 'information-circle', description: 'Education, certifications', required: false },
  { number: 10, name: 'Document Uploads', icon: 'cloud-upload', description: 'ID, SSN card, voided check', required: false },
];

interface ProgressBarProps {
  progress: number;
  sectionsComplete: number;
  totalSections: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, sectionsComplete, totalSections }) => (
  <View style={styles.progressContainer}>
    <View style={styles.progressHeader}>
      <Text style={styles.progressTitle}>Onboarding Progress</Text>
      <Text style={styles.progressPercent}>{progress}%</Text>
    </View>
    <View style={styles.progressBarBg}>
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.progressBarFill, { width: `${progress}%` }]}
      />
    </View>
    <Text style={styles.progressSubtitle}>
      {sectionsComplete} of {totalSections} sections complete
    </Text>
  </View>
);

interface SectionCardProps {
  section: SectionConfig;
  status: 'not_started' | 'in_progress' | 'complete';
  isUnlocked: boolean;
  onPress: () => void;
}

const SectionCard: React.FC<SectionCardProps> = ({ section, status, isUnlocked, onPress }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'complete':
        return <Ionicons name="checkmark-circle" size={24} color={colors.status.success} />;
      case 'in_progress':
        return <Ionicons name="ellipsis-horizontal-circle" size={24} color={colors.primary.purple} />;
      default:
        return isUnlocked
          ? <Ionicons name="arrow-forward-circle" size={24} color={colors.primary.blue} />
          : <Ionicons name="lock-closed" size={24} color="#D1D5DB" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'complete': return 'Complete';
      case 'in_progress': return 'In Progress';
      default: return isUnlocked ? 'Start' : 'Locked';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.sectionCard,
        status === 'complete' && styles.sectionCardComplete,
        !isUnlocked && styles.sectionCardLocked,
      ]}
      onPress={onPress}
      disabled={!isUnlocked}
    >
      <View style={[
        styles.sectionIconContainer,
        status === 'complete' && styles.sectionIconComplete,
      ]}>
        <Ionicons
          name={section.icon as any}
          size={24}
          color={status === 'complete' ? 'white' : colors.primary.purple}
        />
      </View>
      <View style={styles.sectionContent}>
        <View style={styles.sectionHeader}>
          <Text style={[
            styles.sectionName,
            !isUnlocked && styles.sectionNameLocked,
          ]}>
            {section.number}. {section.name}
          </Text>
          {section.required && (
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredText}>Required</Text>
            </View>
          )}
        </View>
        <Text style={[
          styles.sectionDescription,
          !isUnlocked && styles.sectionDescriptionLocked,
        ]}>
          {section.description}
        </Text>
      </View>
      <View style={styles.sectionStatus}>
        {getStatusIcon()}
        <Text style={[
          styles.statusText,
          status === 'complete' && styles.statusTextComplete,
        ]}>
          {getStatusText()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function OnboardingWizard() {
  const navigation = useNavigation();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = async () => {
    try {
      const response = await employeeSelfServiceAPI.getOnboardingStatus();
      if (response.success) {
        setStatus(response.status);
      }
    } catch (error) {
      console.error('Failed to load onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const navigateToSection = (section: SectionConfig) => {
    const screenMap: Record<number, string> = {
      1: 'OnboardingPersonalInfo',
      2: 'OnboardingEmployment',
      3: 'OnboardingW4',
      4: 'OnboardingStateTax',
      5: 'OnboardingDirectDeposit',
      6: 'OnboardingI9',
      7: 'OnboardingBenefits',
      8: 'OnboardingPolicies',
      9: 'OnboardingAdditional',
      10: 'OnboardingDocuments',
    };
    navigation.navigate(screenMap[section.number] as never);
  };

  const getSectionStatus = (sectionNum: number): 'not_started' | 'in_progress' | 'complete' => {
    if (!status?.sections) return 'not_started';
    return status.sections[sectionNum]?.status || 'not_started';
  };

  const isSectionUnlocked = (sectionNum: number): boolean => {
    if (sectionNum === 1) return true;
    // Previous required sections must be complete
    for (let i = 1; i < sectionNum; i++) {
      const section = SECTIONS.find(s => s.number === i);
      if (section?.required && getSectionStatus(i) !== 'complete') {
        return false;
      }
    }
    return true;
  };

  const handleSubmitOnboarding = async () => {
    Alert.prompt(
      'Final Certification',
      'Type your full legal name to certify that all information is accurate.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async (signature) => {
            if (!signature) {
              Alert.alert('Error', 'Signature is required');
              return;
            }
            try {
              const response = await employeeSelfServiceAPI.submitOnboarding(signature);
              if (response.success) {
                Alert.alert(
                  'Success!',
                  'Your onboarding has been submitted. Your employer will review your information.',
                  [{ text: 'OK', onPress: () => navigation.navigate('EmployeePortal' as never) }]
                );
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to submit onboarding');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.purple} />
        <Text style={styles.loadingText}>Loading onboarding...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Complete Your Onboarding</Text>
        <Text style={styles.headerSubtitle}>
          Complete all required sections to finish your employee setup
        </Text>
      </LinearGradient>

      {/* Progress */}
      <View style={styles.content}>
        <ProgressBar
          progress={status?.progress_percent || 0}
          sectionsComplete={status?.sections_completed || 0}
          totalSections={status?.total_sections || 10}
        />

        {/* Time Estimate */}
        <View style={styles.timeEstimate}>
          <Ionicons name="time-outline" size={18} color="#6B7280" />
          <Text style={styles.timeEstimateText}>
            Estimated time: 20-30 minutes
          </Text>
        </View>

        {/* Sections */}
        <View style={styles.sectionsContainer}>
          {SECTIONS.map((section) => (
            <SectionCard
              key={section.number}
              section={section}
              status={getSectionStatus(section.number)}
              isUnlocked={isSectionUnlocked(section.number)}
              onPress={() => navigateToSection(section)}
            />
          ))}
        </View>

        {/* Submit Button */}
        {status?.can_submit && (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitOnboarding}
          >
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButtonGradient}
            >
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text style={styles.submitButtonText}>Submit Onboarding</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Ionicons name="help-circle-outline" size={24} color="#6B7280" />
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>Need Help?</Text>
            <Text style={styles.helpText}>
              Contact your HR department or email support@saurellius.com
            </Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
  },
  content: {
    padding: 16,
    marginTop: -20,
  },
  progressContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary.purple,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  timeEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  timeEstimateText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  sectionsContainer: {
    marginBottom: 24,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionCardComplete: {
    borderColor: colors.status.success,
    borderWidth: 1,
  },
  sectionCardLocked: {
    opacity: 0.6,
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionIconComplete: {
    backgroundColor: colors.status.success,
  },
  sectionContent: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  sectionNameLocked: {
    color: '#9CA3AF',
  },
  requiredBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  sectionDescriptionLocked: {
    color: '#D1D5DB',
  },
  sectionStatus: {
    alignItems: 'center',
    marginLeft: 12,
  },
  statusText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  statusTextComplete: {
    color: colors.status.success,
    fontWeight: '600',
  },
  submitButton: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 10,
  },
  helpSection: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
  },
  helpContent: {
    marginLeft: 12,
    flex: 1,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 13,
    color: '#6B7280',
  },
  bottomPadding: {
    height: 32,
  },
});
