/**
 * DASHBOARD SCREEN
 * Routes to Admin Dashboard for platform admins, regular dashboard for others
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
import { extendedColors as colors, gradients, shadows, spacing, borderRadius, typography } from '../../styles/theme';
import useResponsive from '../../hooks/useResponsive';

// Components
import Header from '../../components/dashboard/Header';
import StatsCard from '../../components/dashboard/StatsCard';
import RewardsCard from '../../components/dashboard/RewardsCard';
import EmployeeCard from '../../components/dashboard/EmployeeCard';
import ActivityItem from '../../components/dashboard/ActivityItem';
import SubscriptionCard from '../../components/dashboard/SubscriptionCard';
import AIInsightsCard from '../../components/ai/AIInsightsCard';
import WeatherWidget from '../../components/dashboard/WeatherWidget';

// Admin Dashboard for platform owners
import AdminDashboard from '../admin/AdminDashboard';

type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Tier hierarchy for feature access
const TIER_LEVELS: Record<string, number> = {
  free: 0,
  starter: 1,
  professional: 2,
  business: 3,
};

export default function DashboardScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<DashboardNavigationProp>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { stats, activities, rewards, recentEmployees, isLoading } = useSelector((state: RootState) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchDashboard());
  };

  const firstName = user?.first_name || 'User';
  const userTier = user?.subscription_tier || 'free';
  const tierLevel = TIER_LEVELS[userTier] ?? 0;
  
  // Feature access helpers
  const hasFeatureAccess = (minTier: string) => tierLevel >= (TIER_LEVELS[minTier] ?? 0);
  const isAdmin = user?.is_admin === true;
  const userRole = (user as any)?.role || 'employee';
  const isEmployer = userRole === 'admin' || userRole === 'employer' || userRole === 'manager' || isAdmin;

  // If user is platform admin, show the admin dashboard
  if (isAdmin) {
    return <AdminDashboard />;
  }

  // Responsive design
  const { isMobile, isTablet, isDesktop, horizontalPadding, gridColumns } = useResponsive();

  // Responsive styles
  const responsiveStyles = {
    scrollContent: {
      padding: horizontalPadding,
      paddingBottom: spacing.xxl,
      maxWidth: isDesktop ? 1400 : '100%',
      marginHorizontal: isDesktop ? 'auto' : 0,
      width: '100%',
    },
    mainGrid: {
      flexDirection: (isMobile ? 'column' : 'row') as 'column' | 'row',
      gap: spacing.lg,
    },
    leftColumn: {
      flex: isMobile ? undefined : 2,
      width: isMobile ? '100%' : undefined,
    },
    rightColumn: {
      flex: isMobile ? undefined : 1,
      width: isMobile ? '100%' : undefined,
    },
    enterpriseGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      justifyContent: 'center' as const,
      gap: 16,
    },
    enterpriseCardWidth: isMobile ? '45%' as const : isTablet ? '30%' as const : 140,
  };

  return (
    <View style={styles.container}>
      <Header />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, responsiveStyles.scrollContent]}
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
            <Text style={styles.heroTitle}>Welcome back, {firstName}!</Text>
            <Text style={styles.heroSubtitle}>
              Your admin dashboard is ready. Monitor platform activity, generate paystubs, and manage your system.
            </Text>
          </View>
        </LinearGradient>

        {/* Weather Widget */}
        <View style={styles.weatherContainer}>
          <WeatherWidget />
        </View>

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

        {/* AI Insights - Powered by Gemini */}
        <View style={{ paddingHorizontal: spacing.md }}>
          <AIInsightsCard
            metrics={{
              total_payroll: stats?.ytd_gross || 0,
              employee_count: stats?.active_employees || 0,
              avg_pay: stats?.avg_net_pay || 0,
              paystubs_generated: stats?.total_paystubs || 0,
              prev_total_payroll: (stats as any)?.prev_ytd_gross || 0,
              prev_paystubs: (stats as any)?.prev_paystubs || 0,
              plan: user?.subscription_tier || 'free',
              usage_percent: (stats as any)?.usage_percent || 0,
            }}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
                            navigation.navigate('GeneratePaystub', {});
            }}
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
            activeOpacity={0.8}
            style={styles.secondaryActionButton}
            onPress={() => {
                            navigation.navigate('AddEmployee');
            }}
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
                <TouchableOpacity onPress={() => navigation.navigate('Employees')}>
                  <Text style={styles.viewAllLink}>View All</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.employeeList}>
                {recentEmployees && recentEmployees.length > 0 ? (
                  recentEmployees.slice(0, 3).map((employee: any) => (
                    <EmployeeCard
                      key={employee.id}
                      initials={`${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`}
                      name={`${employee.first_name || ''} ${employee.last_name || ''}`}
                      role={`${employee.position || 'Employee'} • ${employee.state || 'US'}`}
                      onGeneratePaystub={() => navigation.navigate('GeneratePaystub', { employeeId: employee.id })}
                      onEdit={() => navigation.navigate('EmployeeDetail', { employeeId: employee.id })}
                    />
                  ))
                ) : (
                  <View style={styles.emptyEmployees}>
                    <Ionicons name="people-outline" size={32} color="#a0a0a0" />
                    <Text style={styles.emptyText}>No employees yet</Text>
                    <TouchableOpacity 
                      style={styles.addEmployeeLink}
                      onPress={() => navigation.navigate('AddEmployee' as any)}
                    >
                      <Text style={styles.addEmployeeText}>Add your first employee</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Recent Activity Card */}
            <View style={[styles.card, { marginTop: spacing.lg }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <Ionicons name="time" size={20} color={colors.primary.purple} />
                  <Text style={styles.cardTitle}>Recent Activity</Text>
                </View>
              </View>

              {activities && activities.length > 0 ? (
                activities.slice(0, 3).map((activity: any, index: number) => (
                  <ActivityItem
                    key={activity.id || index}
                    icon={activity.icon || 'ellipse'}
                    title={activity.title || activity.description}
                    time={activity.timestamp || 'Recently'}
                  />
                ))
              ) : (
                <View style={styles.emptyEmployees}>
                  <Ionicons name="time-outline" size={32} color="#a0a0a0" />
                  <Text style={styles.emptyText}>No recent activity</Text>
                </View>
              )}
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
              onUpgrade={() => navigation.navigate('Subscription' as any)}
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
          
          <View style={[styles.enterpriseGrid, responsiveStyles.enterpriseGrid]}>
            {/* Admin Portal - Only visible to platform admins (you) */}
            {isAdmin && (
              <TouchableOpacity 
                style={[styles.enterpriseCard, { width: responsiveStyles.enterpriseCardWidth }]}
                onPress={() => navigation.navigate('AdminPortal' as any)}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#6D28D9']}
                  style={styles.enterpriseIconBg}
                >
                  <Ionicons name="shield-checkmark" size={24} color="#FFF" />
                </LinearGradient>
                <Text style={styles.enterpriseCardTitle}>Admin Portal</Text>
                <Text style={styles.enterpriseCardDesc}>Platform Analytics</Text>
              </TouchableOpacity>
            )}

            {/* Employer/Admin Only Features */}
            {isEmployer && (
              <TouchableOpacity 
                style={[styles.enterpriseCard, { width: responsiveStyles.enterpriseCardWidth }]}
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
            )}

            {isEmployer && (
              <TouchableOpacity 
                style={[styles.enterpriseCard, { width: responsiveStyles.enterpriseCardWidth }]}
                onPress={() => navigation.navigate('Reports' as any)}
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
            )}

            {isEmployer && (
              <TouchableOpacity 
                style={[styles.enterpriseCard, { width: responsiveStyles.enterpriseCardWidth }]}
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
            )}

            {isEmployer && (
              <TouchableOpacity 
                style={[styles.enterpriseCard, { width: responsiveStyles.enterpriseCardWidth }]}
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
            )}

            {/* Employee Features - Clock In/Out */}
            {!isEmployer && (
              <TouchableOpacity 
                style={[styles.enterpriseCard, { width: responsiveStyles.enterpriseCardWidth }]}
                onPress={() => navigation.navigate('Timesheet' as any)}
              >
                <LinearGradient
                  colors={['#F97316', '#EA580C']}
                  style={styles.enterpriseIconBg}
                >
                  <Ionicons name="time" size={24} color="#FFF" />
                </LinearGradient>
                <Text style={styles.enterpriseCardTitle}>Timesheet</Text>
                <Text style={styles.enterpriseCardDesc}>Clock In/Out</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.enterpriseCard, { width: responsiveStyles.enterpriseCardWidth }]}
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
              style={[styles.enterpriseCard, { width: responsiveStyles.enterpriseCardWidth }]}
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

            {isEmployer && (
              <TouchableOpacity 
                style={[styles.enterpriseCard, { width: responsiveStyles.enterpriseCardWidth }]}
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
            )}

            <TouchableOpacity 
              style={[styles.enterpriseCard, { width: responsiveStyles.enterpriseCardWidth }]}
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

            {isEmployer && (
              <TouchableOpacity 
                style={[styles.enterpriseCard, { width: responsiveStyles.enterpriseCardWidth }]}
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
            )}

            <TouchableOpacity 
              style={[styles.enterpriseCard, { width: responsiveStyles.enterpriseCardWidth }]}
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
    backgroundColor: '#0f0f23',
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
  weatherContainer: {
    marginBottom: spacing.lg,
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
    backgroundColor: colors.surface.primary,
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  enterpriseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 16,
    marginTop: 8,
  },
  enterpriseCard: {
    minHeight: 120,
    backgroundColor: colors.surface.elevated,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
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
    color: colors.text.primary,
    textAlign: 'center',
  },
  enterpriseCardDesc: {
    fontSize: 11,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  employeeList: {
    gap: 12,
  },
  emptyEmployees: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 8,
  },
  addEmployeeLink: {
    marginTop: 12,
  },
  addEmployeeText: {
    fontSize: 14,
    color: '#1473FF',
    fontWeight: '600',
  },
});
