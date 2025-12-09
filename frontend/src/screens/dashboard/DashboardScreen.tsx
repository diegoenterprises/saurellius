/**
 * 📊 DASHBOARD SCREEN
 * Matches the dashboard.html design with hero, stats, employees, rewards
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { fetchDashboard } from '../../store/slices/dashboardSlice';
import { AppDispatch, RootState } from '../../store';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { colors, gradients, shadows, spacing, borderRadius, typography } from '../../styles/theme';

// Components
import Header from '../../components/dashboard/Header';
import StatsCard from '../../components/dashboard/StatsCard';
import RewardsCard from '../../components/dashboard/RewardsCard';
import EmployeeCard from '../../components/dashboard/EmployeeCard';
import ActivityItem from '../../components/dashboard/ActivityItem';
import SubscriptionCard from '../../components/dashboard/SubscriptionCard';

type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<DashboardNavigationProp>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { stats, activities, rewards, isLoading } = useSelector((state: RootState) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchDashboard());
  };

  const firstName = user?.first_name || 'User';

  return (
    <View style={styles.container}>
      <Header />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Welcome back, {firstName}! 👋</Text>
            <Text style={styles.heroSubtitle}>
              Your payroll dashboard is ready. Generate paystubs, manage employees, and track your rewards.
            </Text>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatsCard
            icon="document-text"
            value={stats?.total_paystubs?.toString() || '0'}
            label="Total Paystubs"
            trend="+12% from last month"
            trendUp
          />
          <StatsCard
            icon="cash"
            value={`$${(stats?.ytd_gross || 0).toLocaleString()}`}
            label="YTD Gross Pay"
            trend="+8.2% increase"
            trendUp
          />
          <StatsCard
            icon="people"
            value={stats?.active_employees?.toString() || '0'}
            label="Active Employees"
            trend="+2 new this month"
            trendUp
          />
          <StatsCard
            icon="calendar"
            value={stats?.next_pay_date || 'N/A'}
            label="Next Pay Date"
            trend="In 5 days"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('GeneratePaystub', {})}
          >
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryActionButton}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.primaryActionText}>Generate Paystub</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={() => navigation.navigate('AddEmployee')}
          >
            <Ionicons name="person-add-outline" size={20} color={colors.text.primary} />
            <Text style={styles.secondaryActionText}>Add Employee</Text>
          </TouchableOpacity>
        </View>

        {/* Content Grid */}
        <View style={styles.contentGrid}>
          {/* Left Column - Employees & Activity */}
          <View style={styles.leftColumn}>
            {/* Recent Employees Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <Ionicons name="people" size={20} color={colors.primary.purple} />
                  <Text style={styles.cardTitle}>Recent Employees</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.viewAllLink}>View All</Text>
                </TouchableOpacity>
              </View>

              {/* Sample Employees - would be mapped from actual data */}
              <EmployeeCard
                initials="SM"
                name="Sarah Mitchell"
                role="Senior Developer • CA"
                onGeneratePaystub={() => navigation.navigate('GeneratePaystub', { employeeId: '1' })}
                onEdit={() => navigation.navigate('EmployeeDetail', { employeeId: '1' })}
              />
              <EmployeeCard
                initials="MJ"
                name="Michael Johnson"
                role="Product Manager • NY"
                onGeneratePaystub={() => navigation.navigate('GeneratePaystub', { employeeId: '2' })}
                onEdit={() => navigation.navigate('EmployeeDetail', { employeeId: '2' })}
              />
              <EmployeeCard
                initials="EC"
                name="Emily Chen"
                role="UX Designer • TX"
                onGeneratePaystub={() => navigation.navigate('GeneratePaystub', { employeeId: '3' })}
                onEdit={() => navigation.navigate('EmployeeDetail', { employeeId: '3' })}
              />
            </View>

            {/* Recent Activity Card */}
            <View style={[styles.card, { marginTop: spacing.lg }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <Ionicons name="time" size={20} color={colors.primary.purple} />
                  <Text style={styles.cardTitle}>Recent Activity</Text>
                </View>
              </View>

              <ActivityItem
                icon="document-text"
                title="Paystub generated for Sarah Mitchell"
                time="2 hours ago"
              />
              <ActivityItem
                icon="star"
                title="Earned 10 reward points"
                time="5 hours ago"
              />
              <ActivityItem
                icon="person-add"
                title="New employee added: Emily Chen"
                time="1 day ago"
              />
            </View>
          </View>

          {/* Right Column - Rewards & Stats */}
          <View style={styles.rightColumn}>
            {/* Rewards Card */}
            <RewardsCard
              tier={rewards?.current_tier || 'Bronze'}
              points={rewards?.current_points || 0}
              progress={rewards?.tier_progress || 0}
              pointsToNext={rewards?.points_to_next_tier || 1000}
              nextTier={rewards?.next_tier || 'Silver'}
              onPress={() => navigation.navigate('Rewards')}
            />

            {/* Quick Stats Card */}
            <View style={[styles.card, { marginTop: spacing.lg }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <Ionicons name="pie-chart" size={20} color={colors.primary.purple} />
                  <Text style={styles.cardTitle}>This Month</Text>
                </View>
              </View>

              <View style={styles.quickStatItem}>
                <View>
                  <Text style={styles.quickStatLabel}>Paystubs Generated</Text>
                  <Text style={styles.quickStatValue}>{stats?.paystubs_this_month || 0}</Text>
                </View>
                <Ionicons name="document-text" size={32} color={colors.primary.purple} style={{ opacity: 0.2 }} />
              </View>

              <View style={styles.quickStatItem}>
                <View>
                  <Text style={styles.quickStatLabel}>Total Processed</Text>
                  <Text style={styles.quickStatValue}>${(stats?.total_processed_this_month || 0).toLocaleString()}</Text>
                </View>
                <Ionicons name="cash" size={32} color={colors.primary.blue} style={{ opacity: 0.2 }} />
              </View>

              <View style={styles.quickStatItem}>
                <View>
                  <Text style={styles.quickStatLabel}>Avg. Net Pay</Text>
                  <Text style={styles.quickStatValue}>${(stats?.avg_net_pay || 0).toLocaleString()}</Text>
                </View>
                <Ionicons name="trending-up" size={32} color={colors.status.success} style={{ opacity: 0.2 }} />
              </View>
            </View>

            {/* Subscription Card */}
            <SubscriptionCard
              plan={user?.subscription_tier || 'professional'}
              onUpgrade={() => console.log('Upgrade')}
            />
          </View>
        </View>

        {/* Enterprise Features Section */}
        <View style={styles.enterpriseSection}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Ionicons name="business" size={20} color={colors.primary.purple} />
              <Text style={styles.cardTitle}>Enterprise Features</Text>
            </View>
          </View>
          
          <View style={styles.enterpriseGrid}>
            <TouchableOpacity 
              style={styles.enterpriseCard}
              onPress={() => navigation.navigate('AdminPortal' as any)}
            >
              <LinearGradient
                colors={['#8B5CF6', '#6D28D9']}
                style={styles.enterpriseIconBg}
              >
                <Ionicons name="shield-checkmark" size={24} color="#FFF" />
              </LinearGradient>
              <Text style={styles.enterpriseCardTitle}>Admin Portal</Text>
              <Text style={styles.enterpriseCardDesc}>Analytics & API Management</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.enterpriseCard}
              onPress={() => navigation.navigate('Compliance' as any)}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.enterpriseIconBg}
              >
                <Ionicons name="document-text" size={24} color="#FFF" />
              </LinearGradient>
              <Text style={styles.enterpriseCardTitle}>Compliance</Text>
              <Text style={styles.enterpriseCardDesc}>DocuGinuity Forms</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.enterpriseCard}
              onPress={() => navigation.navigate('Reporting' as any)}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.enterpriseIconBg}
              >
                <Ionicons name="bar-chart" size={24} color="#FFF" />
              </LinearGradient>
              <Text style={styles.enterpriseCardTitle}>Reports</Text>
              <Text style={styles.enterpriseCardDesc}>Payroll Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.enterpriseCard}
              onPress={() => navigation.navigate('TaxCenter' as any)}
            >
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                style={styles.enterpriseIconBg}
              >
                <Ionicons name="calculator" size={24} color="#FFF" />
              </LinearGradient>
              <Text style={styles.enterpriseCardTitle}>Tax Filing</Text>
              <Text style={styles.enterpriseCardDesc}>941, 940, W-2</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.enterpriseCard}
              onPress={() => navigation.navigate('Contractors' as any)}
            >
              <LinearGradient
                colors={['#EC4899', '#BE185D']}
                style={styles.enterpriseIconBg}
              >
                <Ionicons name="briefcase" size={24} color="#FFF" />
              </LinearGradient>
              <Text style={styles.enterpriseCardTitle}>Contractors</Text>
              <Text style={styles.enterpriseCardDesc}>1099 Management</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.enterpriseCard}
              onPress={() => navigation.navigate('PTO' as any)}
            >
              <LinearGradient
                colors={['#14B8A6', '#0D9488']}
                style={styles.enterpriseIconBg}
              >
                <Ionicons name="calendar" size={24} color="#FFF" />
              </LinearGradient>
              <Text style={styles.enterpriseCardTitle}>Time Off</Text>
              <Text style={styles.enterpriseCardDesc}>PTO & Leave</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.enterpriseCard}
              onPress={() => navigation.navigate('Swipe' as any)}
            >
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                style={styles.enterpriseIconBg}
              >
                <Ionicons name="swap-horizontal" size={24} color="#FFF" />
              </LinearGradient>
              <Text style={styles.enterpriseCardTitle}>SWIPE</Text>
              <Text style={styles.enterpriseCardDesc}>Schedule Swap</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.enterpriseCard}
              onPress={() => navigation.navigate('Workforce' as any)}
            >
              <LinearGradient
                colors={['#0EA5E9', '#0284C7']}
                style={styles.enterpriseIconBg}
              >
                <Ionicons name="people" size={24} color="#FFF" />
              </LinearGradient>
              <Text style={styles.enterpriseCardTitle}>Workforce</Text>
              <Text style={styles.enterpriseCardDesc}>Real-Time View</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.enterpriseCard}
              onPress={() => navigation.navigate('Messages' as any)}
            >
              <LinearGradient
                colors={['#A855F7', '#9333EA']}
                style={styles.enterpriseIconBg}
              >
                <Ionicons name="chatbubbles" size={24} color="#FFF" />
              </LinearGradient>
              <Text style={styles.enterpriseCardTitle}>Messages</Text>
              <Text style={styles.enterpriseCardDesc}>Communications</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.enterpriseCard}
              onPress={() => navigation.navigate('Garnishment' as any)}
            >
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.enterpriseIconBg}
              >
                <Ionicons name="wallet" size={24} color="#FFF" />
              </LinearGradient>
              <Text style={styles.enterpriseCardTitle}>Garnishments</Text>
              <Text style={styles.enterpriseCardDesc}>Wage Deductions</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.enterpriseCard}
              onPress={() => navigation.navigate('Benefits' as any)}
            >
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                style={styles.enterpriseIconBg}
              >
                <Ionicons name="heart" size={24} color="#FFF" />
              </LinearGradient>
              <Text style={styles.enterpriseCardTitle}>Benefits</Text>
              <Text style={styles.enterpriseCardDesc}>Health & Insurance</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  hero: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.glow,
  },
  heroContent: {
    position: 'relative',
    zIndex: 2,
  },
  heroTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    color: 'white',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: typography.fontSize.lg,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    ...shadows.glow,
  },
  primaryActionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: 'white',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
  },
  secondaryActionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.primary,
  },
  contentGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  leftColumn: {
    flex: 2,
  },
  rightColumn: {
    flex: 1,
    minWidth: 280,
  },
  card: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  viewAllLink: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary.purple,
  },
  quickStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface.elevated,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  quickStatLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.text.primary,
  },
  enterpriseSection: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  enterpriseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  enterpriseCard: {
    width: '31%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  enterpriseIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  enterpriseCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  enterpriseCardDesc: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 2,
  },
});
