/**
 * SAURELLIUS BENEFITS
 * Health insurance, dental, vision, life, 401k, FSA/HSA enrollment and management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import benefitsService, {
  BenefitPlan,
  Enrollment,
  Dependent,
  BenefitsSummary,
} from '../../services/benefits';

type TabType = 'overview' | 'medical' | 'dental' | 'vision' | 'life' | 'retirement' | 'dependents';

const BenefitsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [summary, setSummary] = useState<BenefitsSummary | null>(null);
  const [plans, setPlans] = useState<BenefitPlan[]>([]);
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<BenefitPlan | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [summaryRes, plansRes, dependentsRes] = await Promise.all([
        benefitsService.getBenefitsSummary(),
        benefitsService.getAvailablePlans(),
        benefitsService.getDependents(),
      ]);

      if (summaryRes.success) setSummary(summaryRes.summary);
      if (plansRes.success) setPlans(plansRes.plans);
      if (dependentsRes.success) setDependents(dependentsRes.dependents);
    } catch (error) {
      console.error('Error fetching benefits data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getBenefitIcon = (type: string): string => {
    const icons: Record<string, string> = {
      medical: 'medkit',
      dental: 'fitness',
      vision: 'eye',
      life: 'shield-checkmark',
      '401k': 'trending-up',
      retirement_401k: 'trending-up',
      hsa: 'wallet',
      fsa: 'card',
    };
    return icons[type] || 'document';
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  // Overview Tab
  const renderOverview = () => (
    <View style={styles.section}>
      {/* Cost Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Your Benefits Cost Summary</Text>
        <View style={styles.costRow}>
          <View style={styles.costItem}>
            <Text style={styles.costLabel}>Per Paycheck</Text>
            <Text style={styles.costValue}>
              {formatCurrency(summary?.total_employee_cost_per_paycheck || 0)}
            </Text>
          </View>
          <View style={styles.costDivider} />
          <View style={styles.costItem}>
            <Text style={styles.costLabel}>Monthly</Text>
            <Text style={styles.costValue}>
              {formatCurrency(summary?.total_employee_cost_monthly || 0)}
            </Text>
          </View>
          <View style={styles.costDivider} />
          <View style={styles.costItem}>
            <Text style={styles.costLabel}>Annual</Text>
            <Text style={styles.costValue}>
              {formatCurrency(summary?.total_employee_cost_annual || 0)}
            </Text>
          </View>
        </View>
        <View style={styles.employerContribution}>
          <Ionicons name="gift-outline" size={16} color="#10B981" />
          <Text style={styles.employerText}>
            Employer contributes {formatCurrency(summary?.total_employer_cost_monthly || 0)}/mo
          </Text>
        </View>
      </View>

      {/* Active Enrollments */}
      <Text style={styles.sectionTitle}>Your Active Benefits</Text>
      {summary?.enrollments.filter(e => e.status === 'enrolled').map((enrollment) => (
        <TouchableOpacity 
          key={enrollment.enrollment_id} 
          style={styles.enrollmentCard}
          onPress={() => {
            const plan = plans.find(p => p.plan_id === enrollment.plan_id);
            if (plan) {
              setSelectedPlan(plan);
              setShowPlanModal(true);
            }
          }}
        >
          <View style={styles.enrollmentIcon}>
            <Ionicons 
              name={getBenefitIcon(enrollment.benefit_type || '') as any} 
              size={24} 
              color="#1473FF" 
            />
          </View>
          <View style={styles.enrollmentInfo}>
            <Text style={styles.enrollmentName}>{enrollment.plan_name}</Text>
            <Text style={styles.enrollmentType}>
              {enrollment.benefit_type?.replace(/_/g, ' ').toUpperCase()} - {enrollment.coverage_level.replace(/_/g, ' ')}
            </Text>
            <Text style={styles.enrollmentCarrier}>{enrollment.carrier}</Text>
          </View>
          <View style={styles.enrollmentCost}>
            <Text style={styles.enrollmentCostValue}>
              {formatCurrency(enrollment.employee_contribution)}
            </Text>
            <Text style={styles.enrollmentCostLabel}>/mo</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      ))}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => {
            Alert.alert(
              'Benefit ID Cards',
              'Select which ID card to view:',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Medical ID', onPress: () => Alert.alert('Medical ID', 'Medical insurance ID card displayed. Member ID: XXX-XXX-XXX') },
                { text: 'Dental ID', onPress: () => Alert.alert('Dental ID', 'Dental insurance ID card displayed.') },
                { text: 'Vision ID', onPress: () => Alert.alert('Vision ID', 'Vision insurance ID card displayed.') },
              ]
            );
          }}
        >
          <Ionicons name="document-text-outline" size={24} color="#1473FF" />
          <Text style={styles.quickActionText}>View ID Cards</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => setActiveTab('dependents')}
        >
          <Ionicons name="people-outline" size={24} color="#1473FF" />
          <Text style={styles.quickActionText}>Manage Dependents</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => {
            Alert.alert(
              'Report Life Event',
              'Select the type of qualifying life event:',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Marriage', onPress: () => Alert.alert('Marriage', 'Life event form submitted. You have 30 days to update benefits.') },
                { text: 'Birth/Adoption', onPress: () => Alert.alert('New Child', 'Life event form submitted. Add dependent within 30 days.') },
                { text: 'Divorce', onPress: () => Alert.alert('Divorce', 'Life event form submitted. Update beneficiaries as needed.') },
                { text: 'Loss of Coverage', onPress: () => Alert.alert('Coverage Change', 'Life event form submitted for special enrollment.') },
              ]
            );
          }}
        >
          <Ionicons name="calendar-outline" size={24} color="#1473FF" />
          <Text style={styles.quickActionText}>Life Event</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => {
            Alert.alert(
              'COBRA Information',
              'COBRA allows you to continue health coverage after employment ends.\n\nCoverage can last 18-36 months depending on circumstances.',
              [
                { text: 'Close' },
                { text: 'Eligibility Info', onPress: () => Alert.alert('COBRA Eligibility', 'You may be eligible if you lose coverage due to job loss, reduced hours, or other qualifying events.') },
                { text: 'Cost Estimate', onPress: () => Alert.alert('COBRA Cost', 'COBRA premiums are typically 102% of the full premium cost. Contact HR for exact amounts.') },
                { text: 'Contact HR', onPress: () => Alert.alert('HR Contact', 'Email: hr@company.com\nPhone: (555) 123-4567') },
              ]
            );
          }}
        >
          <Ionicons name="help-circle-outline" size={24} color="#1473FF" />
          <Text style={styles.quickActionText}>COBRA Info</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Plans Tab (Medical, Dental, Vision, etc.)
  const renderPlansTab = (benefitType: string) => {
    const filteredPlans = plans.filter(p => p.benefit_type === benefitType);
    const currentEnrollment = summary?.enrollments.find(
      e => e.benefit_type === benefitType && e.status === 'enrolled'
    );

    return (
      <View style={styles.section}>
        {currentEnrollment && (
          <View style={styles.currentPlanCard}>
            <View style={styles.currentPlanHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.currentPlanLabel}>Currently Enrolled</Text>
            </View>
            <Text style={styles.currentPlanName}>{currentEnrollment.plan_name}</Text>
            <Text style={styles.currentPlanDetails}>
              {currentEnrollment.coverage_level.replace(/_/g, ' ')} - {formatCurrency(currentEnrollment.employee_contribution)}/mo
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Available Plans</Text>
        {filteredPlans.map((plan) => (
          <TouchableOpacity
            key={plan.plan_id}
            style={[
              styles.planCard,
              currentEnrollment?.plan_id === plan.plan_id && styles.planCardActive
            ]}
            onPress={() => {
              setSelectedPlan(plan);
              setShowPlanModal(true);
            }}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.plan_name}</Text>
              {currentEnrollment?.plan_id === plan.plan_id && (
                <View style={styles.enrolledBadge}>
                  <Text style={styles.enrolledBadgeText}>Enrolled</Text>
                </View>
              )}
            </View>
            <Text style={styles.planCarrier}>{plan.carrier}</Text>
            
            {plan.plan_details.type && (
              <View style={styles.planType}>
                <Text style={styles.planTypeText}>{plan.plan_details.type}</Text>
              </View>
            )}

            {plan.plan_details.deductible && (
              <View style={styles.planDetail}>
                <Text style={styles.planDetailLabel}>Deductible</Text>
                <Text style={styles.planDetailValue}>
                  ${plan.plan_details.deductible.individual} / ${plan.plan_details.deductible.family}
                </Text>
              </View>
            )}

            {plan.plan_details.premium_monthly && (
              <View style={styles.planPremiums}>
                <Text style={styles.premiumLabel}>Monthly Premiums:</Text>
                {Object.entries(plan.plan_details.premium_monthly).map(([level, amount]) => (
                  <View key={level} style={styles.premiumRow}>
                    <Text style={styles.premiumLevel}>{level.replace(/_/g, ' ')}</Text>
                    <Text style={styles.premiumAmount}>${amount}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.viewDetailsButton}>
              <Text style={styles.viewDetailsText}>View Full Details</Text>
              <Ionicons name="arrow-forward" size={16} color="#1473FF" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Dependents Tab
  const renderDependents = () => (
    <View style={styles.section}>
      <View style={styles.dependentsHeader}>
        <Text style={styles.sectionTitle}>Your Dependents</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => {
          Alert.alert(
            'Add Dependent',
            'Enter dependent information:',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Add Spouse', onPress: () => Alert.alert('Success', 'Spouse added to your benefits') },
              { text: 'Add Child', onPress: () => Alert.alert('Success', 'Child added to your benefits') },
            ]
          );
        }}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {dependents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color="#4a4a6e" />
          <Text style={styles.emptyText}>No dependents added</Text>
          <Text style={styles.emptySubtext}>
            Add your spouse or children to include them in your benefits
          </Text>
        </View>
      ) : (
        dependents.map((dependent) => (
          <View key={dependent.dependent_id} style={styles.dependentCard}>
            <View style={styles.dependentAvatar}>
              <Text style={styles.dependentInitials}>
                {dependent.first_name[0]}{dependent.last_name[0]}
              </Text>
            </View>
            <View style={styles.dependentInfo}>
              <Text style={styles.dependentName}>{dependent.full_name}</Text>
              <Text style={styles.dependentRelation}>
                {dependent.relationship.replace(/_/g, ' ')} - Age {dependent.age}
              </Text>
              {dependent.is_student && (
                <View style={styles.dependentBadge}>
                  <Text style={styles.dependentBadgeText}>Student</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.dependentActions} onPress={() => {
              Alert.alert(
                dependent.full_name,
                `${dependent.relationship.replace(/_/g, ' ')} - Age ${dependent.age}`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Edit', onPress: () => Alert.alert('Edit', 'Edit dependent information') },
                  { text: 'Remove', style: 'destructive', onPress: () => Alert.alert('Removed', `${dependent.full_name} removed from benefits`) },
                ]
              );
            }}>
              <Ionicons name="ellipsis-vertical" size={20} color="#a0a0a0" />
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );

  // Tab Navigation
  const TabButton: React.FC<{ tab: TabType; label: string; icon: string }> = ({ tab, label, icon }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={activeTab === tab ? '#1473FF' : '#666'}
      />
      <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'medical':
        return renderPlansTab('medical');
      case 'dental':
        return renderPlansTab('dental');
      case 'vision':
        return renderPlansTab('vision');
      case 'life':
        return renderPlansTab('life');
      case 'retirement':
        return renderPlansTab('retirement_401k');
      case 'dependents':
        return renderDependents();
      default:
        return renderOverview();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1473FF', '#BE01FF']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Benefits</Text>
            <Text style={styles.headerSubtitle}>Manage your health and insurance</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Bar */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        <TabButton tab="overview" label="Overview" icon="grid-outline" />
        <TabButton tab="medical" label="Medical" icon="medkit-outline" />
        <TabButton tab="dental" label="Dental" icon="fitness-outline" />
        <TabButton tab="vision" label="Vision" icon="eye-outline" />
        <TabButton tab="life" label="Life" icon="shield-outline" />
        <TabButton tab="retirement" label="401(k)" icon="trending-up-outline" />
        <TabButton tab="dependents" label="Dependents" icon="people-outline" />
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading benefits...</Text>
          </View>
        ) : (
          renderContent()
        )}
      </ScrollView>

      {/* Plan Details Modal */}
      <Modal
        visible={showPlanModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPlanModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPlanModal(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Plan Details</Text>
            <View style={{ width: 28 }} />
          </View>
          
          {selectedPlan && (
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalPlanName}>{selectedPlan.plan_name}</Text>
              <Text style={styles.modalCarrier}>{selectedPlan.carrier}</Text>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Plan Type</Text>
                <Text style={styles.modalSectionText}>{selectedPlan.plan_details.type}</Text>
              </View>

              {selectedPlan.plan_details.deductible && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Deductible</Text>
                  <Text style={styles.modalSectionText}>
                    Individual: ${selectedPlan.plan_details.deductible.individual}
                  </Text>
                  <Text style={styles.modalSectionText}>
                    Family: ${selectedPlan.plan_details.deductible.family}
                  </Text>
                </View>
              )}

              {selectedPlan.plan_details.out_of_pocket_max && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Out-of-Pocket Maximum</Text>
                  <Text style={styles.modalSectionText}>
                    Individual: ${selectedPlan.plan_details.out_of_pocket_max.individual}
                  </Text>
                  <Text style={styles.modalSectionText}>
                    Family: ${selectedPlan.plan_details.out_of_pocket_max.family}
                  </Text>
                </View>
              )}

              {selectedPlan.plan_details.copays && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Copays</Text>
                  {Object.entries(selectedPlan.plan_details.copays).map(([service, amount]) => (
                    <View key={service} style={styles.copayRow}>
                      <Text style={styles.copayService}>{service.replace(/_/g, ' ')}</Text>
                      <Text style={styles.copayAmount}>${amount}</Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity style={styles.enrollButton}>
                <Text style={styles.enrollButtonText}>Enroll in This Plan</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  tabBar: {
    backgroundColor: '#0f0f23',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  tabBarContent: {
    paddingHorizontal: 10,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#1473FF',
  },
  tabLabel: {
    fontSize: 14,
    color: '#a0a0a0',
    marginLeft: 6,
  },
  tabLabelActive: {
    color: '#1473FF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costItem: {
    flex: 1,
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    marginBottom: 4,
  },
  costValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1473FF',
  },
  costDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#2a2a4e',
  },
  employerContribution: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  employerText: {
    fontSize: 14,
    color: '#10B981',
    marginLeft: 6,
  },
  enrollmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  enrollmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(20, 115, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  enrollmentInfo: {
    flex: 1,
  },
  enrollmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  enrollmentType: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
  },
  enrollmentCarrier: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  enrollmentCost: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  enrollmentCostValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  enrollmentCostLabel: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '48%',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  currentPlanCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  currentPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentPlanLabel: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 6,
  },
  currentPlanName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  currentPlanDetails: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 4,
  },
  planCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  planCardActive: {
    borderColor: '#1473FF',
    borderWidth: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  planCarrier: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 12,
  },
  planType: {
    backgroundColor: 'rgba(20, 115, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  planTypeText: {
    fontSize: 12,
    color: '#1473FF',
    fontWeight: '600',
  },
  planDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planDetailLabel: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  planDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  planPremiums: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  premiumLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  premiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  premiumLevel: {
    fontSize: 14,
    color: '#a0a0a0',
    textTransform: 'capitalize',
  },
  premiumAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  enrolledBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  enrolledBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#1473FF',
    fontWeight: '600',
    marginRight: 4,
  },
  dependentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1473FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#a0a0a0',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  dependentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dependentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(20, 115, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dependentInitials: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1473FF',
  },
  dependentInfo: {
    flex: 1,
  },
  dependentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dependentRelation: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 2,
  },
  dependentBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  dependentBadgeText: {
    fontSize: 12,
    color: '#92400E',
  },
  dependentActions: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#a0a0a0',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContent: {
    padding: 20,
  },
  modalPlanName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalCarrier: {
    fontSize: 16,
    color: '#a0a0a0',
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a0a0a0',
    marginBottom: 8,
  },
  modalSectionText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  copayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  copayService: {
    fontSize: 14,
    color: '#a0a0a0',
    textTransform: 'capitalize',
  },
  copayAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  enrollButton: {
    backgroundColor: '#1473FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  enrollButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default BenefitsScreen;
