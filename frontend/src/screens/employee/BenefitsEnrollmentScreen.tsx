/**
 * EMPLOYEE BENEFITS ENROLLMENT SCREEN
 * Self-service benefits enrollment for employees
 * Supports health, dental, vision, 401k, and other benefits
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface BenefitPlan {
  id: string;
  type: 'health' | 'dental' | 'vision' | '401k' | 'life' | 'disability' | 'hsa' | 'fsa';
  name: string;
  carrier: string;
  description: string;
  tiers: PlanTier[];
  employee_contribution: number;
  employer_contribution: number;
}

interface PlanTier {
  id: string;
  name: string;
  coverage_type: 'employee_only' | 'employee_spouse' | 'employee_children' | 'family';
  employee_cost_per_pay: number;
  deductible: number;
  out_of_pocket_max: number;
}

interface CurrentEnrollment {
  plan_id: string;
  tier_id: string;
  effective_date: string;
  status: 'active' | 'pending' | 'waived';
}

interface Dependent {
  id: string;
  first_name: string;
  last_name: string;
  relationship: string;
  date_of_birth: string;
  ssn_last_four: string;
}

const BENEFIT_TYPES = [
  { id: 'health', name: 'Medical', icon: 'medkit', color: '#EF4444' },
  { id: 'dental', name: 'Dental', icon: 'happy', color: '#3B82F6' },
  { id: 'vision', name: 'Vision', icon: 'eye', color: '#8B5CF6' },
  { id: '401k', name: '401(k)', icon: 'trending-up', color: '#10B981' },
  { id: 'life', name: 'Life Insurance', icon: 'shield-checkmark', color: '#F59E0B' },
  { id: 'disability', name: 'Disability', icon: 'umbrella', color: '#EC4899' },
  { id: 'hsa', name: 'HSA', icon: 'wallet', color: '#06B6D4' },
  { id: 'fsa', name: 'FSA', icon: 'card', color: '#84CC16' },
];

export default function BenefitsEnrollmentScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<BenefitPlan[]>([]);
  const [currentEnrollments, setCurrentEnrollments] = useState<CurrentEnrollment[]>([]);
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [selectedBenefitType, setSelectedBenefitType] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<BenefitPlan | null>(null);
  const [selectedTier, setSelectedTier] = useState<PlanTier | null>(null);
  const [enrollmentStep, setEnrollmentStep] = useState<'browse' | 'select' | 'review'>('browse');
  const [isOpenEnrollment, setIsOpenEnrollment] = useState(true);
  const [enrollmentDeadline, setEnrollmentDeadline] = useState<string | null>(null);

  const fetchBenefitsData = useCallback(async () => {
    try {
      const [plansRes, enrollmentsRes, dependentsRes] = await Promise.all([
        api.get('/api/benefits/available-plans'),
        api.get('/api/benefits/my-enrollments'),
        api.get('/api/employee/dependents'),
      ]);
      
      setAvailablePlans(plansRes.data.plans || []);
      setCurrentEnrollments(enrollmentsRes.data.enrollments || []);
      setDependents(dependentsRes.data.dependents || []);
      setIsOpenEnrollment(plansRes.data.is_open_enrollment || false);
      setEnrollmentDeadline(plansRes.data.enrollment_deadline || null);
    } catch (error) {
      console.error('Failed to fetch benefits data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBenefitsData();
  }, [fetchBenefitsData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBenefitsData();
  };

  const getEnrollmentForType = (type: string) => {
    const plan = availablePlans.find(p => p.type === type);
    if (!plan) return null;
    return currentEnrollments.find(e => e.plan_id === plan.id);
  };

  const getTotalMonthlyContribution = () => {
    let total = 0;
    currentEnrollments.forEach(enrollment => {
      const plan = availablePlans.find(p => p.id === enrollment.plan_id);
      if (plan) {
        const tier = plan.tiers.find(t => t.id === enrollment.tier_id);
        if (tier) {
          total += tier.employee_cost_per_pay * 2; // Assuming bi-weekly
        }
      }
    });
    return total;
  };

  const handleSelectPlan = (plan: BenefitPlan) => {
    setSelectedPlan(plan);
    setSelectedTier(null);
    setEnrollmentStep('select');
  };

  const handleSelectTier = (tier: PlanTier) => {
    setSelectedTier(tier);
  };

  const handleEnroll = async () => {
    if (!selectedPlan || !selectedTier) {
      Alert.alert('Error', 'Please select a plan and coverage level');
      return;
    }

    Alert.alert(
      'Confirm Enrollment',
      `Are you sure you want to enroll in ${selectedPlan.name} - ${selectedTier.name}?\n\nYour cost: $${selectedTier.employee_cost_per_pay.toFixed(2)}/pay period`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const response = await api.post('/api/benefits/enroll', {
                plan_id: selectedPlan.id,
                tier_id: selectedTier.id,
              });

              if (response.data.success) {
                Alert.alert('Success', 'You have been enrolled successfully!');
                setEnrollmentStep('browse');
                setSelectedPlan(null);
                setSelectedTier(null);
                setSelectedBenefitType(null);
                fetchBenefitsData();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to complete enrollment');
            }
          },
        },
      ]
    );
  };

  const handleWaiveCoverage = async (benefitType: string) => {
    Alert.alert(
      'Waive Coverage',
      'Are you sure you want to waive this coverage? You may not be able to enroll until the next open enrollment period.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Waive',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/api/benefits/waive', { benefit_type: benefitType });
              Alert.alert('Coverage Waived', 'Your coverage has been waived.');
              fetchBenefitsData();
            } catch (error) {
              Alert.alert('Error', 'Failed to waive coverage');
            }
          },
        },
      ]
    );
  };

  const renderBenefitTypeCard = (type: typeof BENEFIT_TYPES[0]) => {
    const plans = availablePlans.filter(p => p.type === type.id);
    const enrollment = getEnrollmentForType(type.id);
    const isEnrolled = enrollment && enrollment.status === 'active';
    const isWaived = enrollment && enrollment.status === 'waived';

    return (
      <TouchableOpacity
        key={type.id}
        style={[styles.benefitCard, isEnrolled && styles.benefitCardEnrolled]}
        onPress={() => {
          setSelectedBenefitType(type.id);
          if (plans.length === 1) {
            handleSelectPlan(plans[0]);
          }
        }}
      >
        <View style={[styles.benefitIconContainer, { backgroundColor: type.color + '20' }]}>
          <Ionicons name={type.icon as any} size={28} color={type.color} />
        </View>
        <View style={styles.benefitContent}>
          <Text style={styles.benefitName}>{type.name}</Text>
          {isEnrolled && (
            <View style={styles.enrolledBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.enrolledText}>Enrolled</Text>
            </View>
          )}
          {isWaived && (
            <View style={styles.waivedBadge}>
              <Text style={styles.waivedText}>Waived</Text>
            </View>
          )}
          {!isEnrolled && !isWaived && plans.length > 0 && (
            <Text style={styles.planCount}>{plans.length} plan{plans.length > 1 ? 's' : ''} available</Text>
          )}
          {plans.length === 0 && (
            <Text style={styles.unavailableText}>Not offered</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    );
  };

  const renderPlanSelection = () => {
    if (!selectedBenefitType) return null;
    
    const plans = availablePlans.filter(p => p.type === selectedBenefitType);
    const typeInfo = BENEFIT_TYPES.find(t => t.id === selectedBenefitType);

    return (
      <View style={styles.planSelectionContainer}>
        <View style={styles.planSelectionHeader}>
          <TouchableOpacity onPress={() => {
            setSelectedBenefitType(null);
            setSelectedPlan(null);
            setEnrollmentStep('browse');
          }}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.planSelectionTitle}>{typeInfo?.name} Plans</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.plansList}>
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, selectedPlan?.id === plan.id && styles.planCardSelected]}
              onPress={() => handleSelectPlan(plan)}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planCarrier}>{plan.carrier}</Text>
              </View>
              <Text style={styles.planDescription}>{plan.description}</Text>
              
              {selectedPlan?.id === plan.id && (
                <View style={styles.tierSelection}>
                  <Text style={styles.tierTitle}>Select Coverage Level</Text>
                  {plan.tiers.map((tier) => (
                    <TouchableOpacity
                      key={tier.id}
                      style={[styles.tierOption, selectedTier?.id === tier.id && styles.tierOptionSelected]}
                      onPress={() => handleSelectTier(tier)}
                    >
                      <View style={styles.tierRadio}>
                        {selectedTier?.id === tier.id && <View style={styles.tierRadioInner} />}
                      </View>
                      <View style={styles.tierContent}>
                        <Text style={styles.tierName}>{tier.name}</Text>
                        <Text style={styles.tierCoverage}>
                          {tier.coverage_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Text>
                      </View>
                      <View style={styles.tierCost}>
                        <Text style={styles.tierCostValue}>${tier.employee_cost_per_pay.toFixed(2)}</Text>
                        <Text style={styles.tierCostPeriod}>/pay period</Text>
                      </View>
                    </TouchableOpacity>
                  ))}

                  {selectedTier && (
                    <View style={styles.tierDetails}>
                      <View style={styles.tierDetailRow}>
                        <Text style={styles.tierDetailLabel}>Deductible</Text>
                        <Text style={styles.tierDetailValue}>${selectedTier.deductible.toLocaleString()}</Text>
                      </View>
                      <View style={styles.tierDetailRow}>
                        <Text style={styles.tierDetailLabel}>Out-of-Pocket Max</Text>
                        <Text style={styles.tierDetailValue}>${selectedTier.out_of_pocket_max.toLocaleString()}</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity 
            style={styles.waiveButton}
            onPress={() => handleWaiveCoverage(selectedBenefitType)}
          >
            <Text style={styles.waiveButtonText}>Waive Coverage</Text>
          </TouchableOpacity>
        </ScrollView>

        {selectedPlan && selectedTier && (
          <View style={styles.enrollmentFooter}>
            <View style={styles.enrollmentSummary}>
              <Text style={styles.summaryLabel}>Your Cost</Text>
              <Text style={styles.summaryValue}>${selectedTier.employee_cost_per_pay.toFixed(2)}/pay</Text>
            </View>
            <TouchableOpacity style={styles.enrollButton} onPress={handleEnroll}>
              <LinearGradient
                colors={['#1473FF', '#BE01FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.enrollButtonGradient}
              >
                <Text style={styles.enrollButtonText}>Enroll Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1473FF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {selectedBenefitType ? (
        renderPlanSelection()
      ) : (
        <>
          <LinearGradient colors={gradients.header} style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Benefits Enrollment</Text>
              <View style={{ width: 24 }} />
            </View>

            {isOpenEnrollment && enrollmentDeadline && (
              <View style={styles.enrollmentBanner}>
                <Ionicons name="time" size={20} color="#F59E0B" />
                <View style={styles.bannerContent}>
                  <Text style={styles.bannerTitle}>Open Enrollment</Text>
                  <Text style={styles.bannerDeadline}>
                    Deadline: {new Date(enrollmentDeadline).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>Monthly Contribution</Text>
                <Text style={styles.summaryItemValue}>${getTotalMonthlyContribution().toFixed(2)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>Dependents</Text>
                <Text style={styles.summaryItemValue}>{dependents.length}</Text>
              </View>
            </View>
          </LinearGradient>

          <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />
            }
          >
            <Text style={styles.sectionTitle}>Available Benefits</Text>

            {BENEFIT_TYPES.map(renderBenefitTypeCard)}

            {dependents.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Your Dependents</Text>
                {dependents.map((dependent) => (
                  <View key={dependent.id} style={styles.dependentCard}>
                    <View style={styles.dependentIcon}>
                      <Ionicons name="person" size={20} color="#1473FF" />
                    </View>
                    <View style={styles.dependentInfo}>
                      <Text style={styles.dependentName}>
                        {dependent.first_name} {dependent.last_name}
                      </Text>
                      <Text style={styles.dependentRelationship}>{dependent.relationship}</Text>
                    </View>
                    <Text style={styles.dependentDob}>
                      DOB: {new Date(dependent.date_of_birth).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </>
            )}

            <TouchableOpacity style={styles.addDependentButton}>
              <Ionicons name="add-circle" size={20} color="#1473FF" />
              <Text style={styles.addDependentText}>Add Dependent</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  enrollmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B20',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  bannerDeadline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  summaryItemLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  summaryItemValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  benefitCardEnrolled: {
    borderColor: '#10B981',
  },
  benefitIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  benefitContent: {
    flex: 1,
  },
  benefitName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  enrolledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  enrolledText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
  },
  waivedBadge: {
    backgroundColor: '#6B728020',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  waivedText: {
    fontSize: 12,
    color: '#6B7280',
  },
  planCount: {
    fontSize: 13,
    color: '#a0a0a0',
  },
  unavailableText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  dependentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  dependentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1473FF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dependentInfo: {
    flex: 1,
  },
  dependentName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  dependentRelationship: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 2,
  },
  dependentDob: {
    fontSize: 12,
    color: '#666',
  },
  addDependentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1473FF20',
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 8,
    gap: 8,
  },
  addDependentText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1473FF',
  },
  planSelectionContainer: {
    flex: 1,
  },
  planSelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  planSelectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  plansList: {
    flex: 1,
    padding: 20,
  },
  planCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#2a2a4e',
  },
  planCardSelected: {
    borderColor: '#1473FF',
  },
  planHeader: {
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  planCarrier: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 2,
  },
  planDescription: {
    fontSize: 14,
    color: '#a0a0a0',
    lineHeight: 20,
  },
  tierSelection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  tierTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  tierOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  tierOptionSelected: {
    borderColor: '#1473FF',
    backgroundColor: '#1473FF10',
  },
  tierRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tierRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1473FF',
  },
  tierContent: {
    flex: 1,
  },
  tierName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  tierCoverage: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
  },
  tierCost: {
    alignItems: 'flex-end',
  },
  tierCostValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  tierCostPeriod: {
    fontSize: 11,
    color: '#666',
  },
  tierDetails: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
  },
  tierDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tierDetailLabel: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  tierDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  waiveButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  waiveButtonText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  enrollmentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  enrollmentSummary: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 2,
  },
  enrollButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  enrollButtonGradient: {
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  enrollButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
});
