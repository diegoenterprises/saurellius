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
});
