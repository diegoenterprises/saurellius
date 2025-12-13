/**
 * ADMIN DASHBOARD
 * Platform owner dashboard with SaaS metrics, analytics, and subscriber management
 * Dynamically fetches data from backend API
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../../store';
import Header from '../../components/dashboard/Header';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const isLargeScreen = width >= 1024;
const isMediumScreen = width >= 768;

interface PlatformMetrics {
  // User metrics
  total_users: number;
  active_users: number;
  new_users_this_month: number;
  new_users_this_week: number;
  new_users_today: number;
  user_growth: number;
  
  // Engagement metrics
  dau: number;
  wau: number;
  mau: number;
  dau_mau_ratio: number;
  
  // Company metrics
  total_companies: number;
  active_companies: number;
  
  // Revenue metrics
  mrr: number;
  arr: number;
  arpu: number;
  arpa: number;
  ltv: number;
  cac: number;
  ltv_cac_ratio: number;
  revenue_growth: number;
  
  // MRR breakdown
  new_mrr: number;
  expansion_mrr: number;
  churned_mrr: number;
  net_new_mrr: number;
  
  // Revenue by tier
  starter_revenue: number;
  professional_revenue: number;
  business_revenue: number;
  
  // NRR
  nrr: number;
  
  // Subscription breakdown
  free_users: number;
  starter_users: number;
  professional_users: number;
  business_users: number;
  paid_users: number;
  active_subscribers: number;
  
  // Health metrics
  churn_rate: number;
  conversion_rate: number;
  
  // API metrics
  api_calls_today: number;
  api_calls_this_month: number;
  avg_response_time: number;
  api_uptime: number;
}

interface Signup {
  id: number;
  company: string;
  email: string;
  plan: string;
  role: string;
  date: string;
}

interface Activity {
  id: number;
  action: string;
  detail: string;
  time: string;
  type: string;
}

const DEFAULT_METRICS: PlatformMetrics = {
  // User metrics
  total_users: 0,
  active_users: 0,
  new_users_this_month: 0,
  new_users_this_week: 0,
  new_users_today: 0,
  user_growth: 0,
  
  // Engagement metrics
  dau: 0,
  wau: 0,
  mau: 0,
  dau_mau_ratio: 0,
  
  // Company metrics
  total_companies: 0,
  active_companies: 0,
  
  // Revenue metrics
  mrr: 0,
  arr: 0,
  arpu: 0,
  arpa: 0,
  ltv: 0,
  cac: 0,
  ltv_cac_ratio: 0,
  revenue_growth: 0,
  
  // MRR breakdown
  new_mrr: 0,
  expansion_mrr: 0,
  churned_mrr: 0,
  net_new_mrr: 0,
  
  // Revenue by tier
  starter_revenue: 0,
  professional_revenue: 0,
  business_revenue: 0,
  
  // NRR
  nrr: 0,
  
  // Subscription breakdown
  free_users: 0,
  starter_users: 0,
  professional_users: 0,
  business_users: 0,
  paid_users: 0,
  active_subscribers: 0,
  
  // Health metrics
  churn_rate: 0,
  conversion_rate: 0,
  
  // API metrics
  api_calls_today: 0,
  api_calls_this_month: 0,
  avg_response_time: 0,
  api_uptime: 99.9,
};

const COLORS = {
  background: '#0F0F23',
  surface: '#1A1A2E',
  surfaceLight: '#252545',
  primary: '#8B5CF6',
  blue: '#3B82F6',
  green: '#22C55E',
  yellow: '#F59E0B',
  red: '#EF4444',
  cyan: '#06B6D4',
  pink: '#EC4899',
  text: '#FFFFFF',
  textMuted: '#9CA3AF',
  border: '#2A2A4E',
};

export default function AdminDashboard() {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigation = useNavigation<any>();
  const { colors, gradients, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<PlatformMetrics>(DEFAULT_METRICS);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  // Navigation helpers
  const navigateTo = (screen: string) => {
    navigation.navigate(screen);
  };

  // Fetch all admin data
  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // Fetch metrics
      const metricsResponse = await api.get('/api/admin/metrics');
      if (metricsResponse.data.success) {
        setMetrics(metricsResponse.data.metrics);
      }

      // Fetch recent signups
      const signupsResponse = await api.get('/api/admin/recent-signups?limit=5');
      if (signupsResponse.data.success) {
        setSignups(signupsResponse.data.signups);
      }

      // Fetch activity
      const activityResponse = await api.get('/api/admin/activity');
      if (activityResponse.data.success) {
        setActivities(activityResponse.data.activities);
      }

      // Fetch system health
      const healthResponse = await api.get('/api/admin/system-health');
      if (healthResponse.data.success) {
        setSystemHealth(healthResponse.data.health);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRefresh = () => {
    fetchAdminData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

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
        {/* Admin Hero */}
        <LinearGradient
          colors={gradients.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroHeader}>
              <View>
                <Text style={styles.heroTitle}>Platform Command Center</Text>
                <Text style={styles.heroSubtitle}>
                  Welcome back, {user?.first_name}. Here's your platform overview.
                </Text>
              </View>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Key Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, styles.metricCardLarge]}>
            <LinearGradient
              colors={['#8B5CF6', '#6D28D9']}
              style={styles.metricIconBg}
            >
              <Ionicons name="people" size={24} color="#FFF" />
            </LinearGradient>
            <View style={styles.metricContent}>
              <Text style={styles.metricValue}>{formatNumber(metrics.total_users)}</Text>
              <Text style={styles.metricLabel}>Total Users</Text>
              <View style={styles.metricTrend}>
                <Ionicons name="trending-up" size={14} color={COLORS.green} />
                <Text style={[styles.trendText, { color: COLORS.green }]}>
                  +{metrics.user_growth}% this month
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.metricCard, styles.metricCardLarge]}>
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              style={styles.metricIconBg}
            >
              <Ionicons name="cash" size={24} color="#FFF" />
            </LinearGradient>
            <View style={styles.metricContent}>
              <Text style={styles.metricValue}>{formatCurrency(metrics.mrr)}</Text>
              <Text style={styles.metricLabel}>Monthly Revenue (MRR)</Text>
              <View style={styles.metricTrend}>
                <Ionicons name="trending-up" size={14} color={COLORS.green} />
                <Text style={[styles.trendText, { color: COLORS.green }]}>
                  +{metrics.revenue_growth}% growth
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.metricCard, styles.metricCardLarge]}>
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              style={styles.metricIconBg}
            >
              <Ionicons name="business" size={24} color="#FFF" />
            </LinearGradient>
            <View style={styles.metricContent}>
              <Text style={styles.metricValue}>{formatNumber(metrics.active_companies)}</Text>
              <Text style={styles.metricLabel}>Active Companies</Text>
              <View style={styles.metricTrend}>
                <Text style={styles.trendTextMuted}>
                  of {metrics.total_companies} total
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.metricCard, styles.metricCardLarge]}>
            <LinearGradient
              colors={['#06B6D4', '#0891B2']}
              style={styles.metricIconBg}
            >
              <Ionicons name="code-slash" size={24} color="#FFF" />
            </LinearGradient>
            <View style={styles.metricContent}>
              <Text style={styles.metricValue}>{formatNumber(metrics.api_calls_today)}</Text>
              <Text style={styles.metricLabel}>API Calls Today</Text>
              <View style={styles.metricTrend}>
                <Text style={styles.trendTextMuted}>
                  {metrics.avg_response_time}ms avg response
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Secondary Metrics */}
        <View style={styles.secondaryMetrics}>
          <View style={styles.smallMetricCard}>
            <Text style={styles.smallMetricValue}>{formatCurrency(metrics.arr)}</Text>
            <Text style={styles.smallMetricLabel}>Annual Revenue (ARR)</Text>
          </View>
          <View style={styles.smallMetricCard}>
            <Text style={styles.smallMetricValue}>{formatCurrency(metrics.arpu)}</Text>
            <Text style={styles.smallMetricLabel}>ARPU</Text>
          </View>
          <View style={styles.smallMetricCard}>
            <Text style={styles.smallMetricValue}>{formatCurrency(metrics.ltv)}</Text>
            <Text style={styles.smallMetricLabel}>Customer LTV</Text>
          </View>
          <View style={styles.smallMetricCard}>
            <Text style={[styles.smallMetricValue, { color: COLORS.green }]}>{metrics.ltv_cac_ratio}x</Text>
            <Text style={styles.smallMetricLabel}>LTV:CAC Ratio</Text>
          </View>
          <View style={styles.smallMetricCard}>
            <Text style={[styles.smallMetricValue, { color: COLORS.green }]}>{metrics.nrr}%</Text>
            <Text style={styles.smallMetricLabel}>Net Revenue Retention</Text>
          </View>
          <View style={styles.smallMetricCard}>
            <Text style={[styles.smallMetricValue, { color: COLORS.yellow }]}>{metrics.churn_rate}%</Text>
            <Text style={styles.smallMetricLabel}>Churn Rate</Text>
          </View>
        </View>

        {/* Engagement & Growth Metrics */}
        <View style={styles.engagementRow}>
          <View style={styles.engagementCard}>
            <Text style={styles.engagementTitle}>User Engagement</Text>
            <View style={styles.engagementStats}>
              <View style={styles.engagementStat}>
                <Text style={styles.engagementValue}>{metrics.dau}</Text>
                <Text style={styles.engagementLabel}>DAU</Text>
              </View>
              <View style={styles.engagementStat}>
                <Text style={styles.engagementValue}>{metrics.wau}</Text>
                <Text style={styles.engagementLabel}>WAU</Text>
              </View>
              <View style={styles.engagementStat}>
                <Text style={styles.engagementValue}>{metrics.mau}</Text>
                <Text style={styles.engagementLabel}>MAU</Text>
              </View>
              <View style={styles.engagementStat}>
                <Text style={[styles.engagementValue, { color: COLORS.cyan }]}>{metrics.dau_mau_ratio}%</Text>
                <Text style={styles.engagementLabel}>DAU/MAU</Text>
              </View>
            </View>
          </View>
          <View style={styles.engagementCard}>
            <Text style={styles.engagementTitle}>MRR Breakdown</Text>
            <View style={styles.engagementStats}>
              <View style={styles.engagementStat}>
                <Text style={[styles.engagementValue, { color: COLORS.green }]}>{formatCurrency(metrics.new_mrr)}</Text>
                <Text style={styles.engagementLabel}>New MRR</Text>
              </View>
              <View style={styles.engagementStat}>
                <Text style={[styles.engagementValue, { color: COLORS.blue }]}>{formatCurrency(metrics.expansion_mrr)}</Text>
                <Text style={styles.engagementLabel}>Expansion</Text>
              </View>
              <View style={styles.engagementStat}>
                <Text style={[styles.engagementValue, { color: COLORS.red }]}>-{formatCurrency(metrics.churned_mrr)}</Text>
                <Text style={styles.engagementLabel}>Churned</Text>
              </View>
              <View style={styles.engagementStat}>
                <Text style={[styles.engagementValue, { color: COLORS.primary }]}>{formatCurrency(metrics.net_new_mrr)}</Text>
                <Text style={styles.engagementLabel}>Net New</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Growth Stats */}
        <View style={styles.growthRow}>
          <View style={styles.growthCard}>
            <Ionicons name="person-add" size={24} color={COLORS.green} />
            <Text style={styles.growthValue}>{metrics.new_users_today}</Text>
            <Text style={styles.growthLabel}>New Today</Text>
          </View>
          <View style={styles.growthCard}>
            <Ionicons name="trending-up" size={24} color={COLORS.blue} />
            <Text style={styles.growthValue}>{metrics.new_users_this_week}</Text>
            <Text style={styles.growthLabel}>This Week</Text>
          </View>
          <View style={styles.growthCard}>
            <Ionicons name="calendar" size={24} color={COLORS.primary} />
            <Text style={styles.growthValue}>{metrics.new_users_this_month}</Text>
            <Text style={styles.growthLabel}>This Month</Text>
          </View>
          <View style={styles.growthCard}>
            <Ionicons name="cash" size={24} color={COLORS.green} />
            <Text style={styles.growthValue}>{metrics.paid_users}</Text>
            <Text style={styles.growthLabel}>Paid Users</Text>
          </View>
          <View style={styles.growthCard}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.cyan} />
            <Text style={styles.growthValue}>{metrics.conversion_rate}%</Text>
            <Text style={styles.growthLabel}>Conversion</Text>
          </View>
          <View style={styles.growthCard}>
            <Ionicons name="server" size={24} color={COLORS.yellow} />
            <Text style={styles.growthValue}>{metrics.api_uptime}%</Text>
            <Text style={styles.growthLabel}>API Uptime</Text>
          </View>
        </View>

        {/* Main Content Grid */}
        <View style={styles.contentGrid}>
          {/* Left Column */}
          <View style={styles.leftColumn}>
            {/* Subscription Breakdown */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Ionicons name="pie-chart" size={20} color={COLORS.primary} />
                  <Text style={styles.cardTitle}>Subscription Breakdown</Text>
                </View>
              </View>

              <View style={styles.subscriptionBars}>
                <View style={styles.subBar}>
                  <View style={styles.subBarHeader}>
                    <Text style={styles.subBarLabel}>Free</Text>
                    <Text style={styles.subBarCount}>{metrics.free_users}</Text>
                  </View>
                  <View style={styles.subBarTrack}>
                    <View style={[styles.subBarFill, { width: `${metrics.total_users > 0 ? (metrics.free_users / metrics.total_users) * 100 : 0}%`, backgroundColor: '#6B7280' }]} />
                  </View>
                </View>

                <View style={styles.subBar}>
                  <View style={styles.subBarHeader}>
                    <Text style={styles.subBarLabel}>Starter ($29/mo)</Text>
                    <Text style={styles.subBarCount}>{metrics.starter_users}</Text>
                  </View>
                  <View style={styles.subBarTrack}>
                    <View style={[styles.subBarFill, { width: `${metrics.total_users > 0 ? (metrics.starter_users / metrics.total_users) * 100 : 0}%`, backgroundColor: COLORS.blue }]} />
                  </View>
                </View>

                <View style={styles.subBar}>
                  <View style={styles.subBarHeader}>
                    <Text style={styles.subBarLabel}>Professional ($79/mo)</Text>
                    <Text style={styles.subBarCount}>{metrics.professional_users}</Text>
                  </View>
                  <View style={styles.subBarTrack}>
                    <View style={[styles.subBarFill, { width: `${metrics.total_users > 0 ? (metrics.professional_users / metrics.total_users) * 100 : 0}%`, backgroundColor: COLORS.primary }]} />
                  </View>
                </View>

                <View style={styles.subBar}>
                  <View style={styles.subBarHeader}>
                    <Text style={styles.subBarLabel}>Business ($199/mo)</Text>
                    <Text style={styles.subBarCount}>{metrics.business_users}</Text>
                  </View>
                  <View style={styles.subBarTrack}>
                    <View style={[styles.subBarFill, { width: `${metrics.total_users > 0 ? (metrics.business_users / metrics.total_users) * 100 : 0}%`, backgroundColor: COLORS.green }]} />
                  </View>
                </View>
              </View>

              <View style={styles.subscriptionSummary}>
                <Text style={styles.summaryText}>
                  Paid Conversion Rate: <Text style={styles.summaryHighlight}>{metrics.conversion_rate.toFixed(1)}%</Text>
                </Text>
              </View>
            </View>

            {/* Recent Signups */}
            <View style={[styles.card, { marginTop: 16 }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Ionicons name="person-add" size={20} color={COLORS.green} />
                  <Text style={styles.cardTitle}>Recent Signups</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.viewAllLink}>View All</Text>
                </TouchableOpacity>
              </View>

              {signups.length > 0 ? (
                signups.map((signup) => (
                  <View key={signup.id} style={styles.signupItem}>
                    <View style={styles.signupAvatar}>
                      <Text style={styles.signupAvatarText}>
                        {signup.company.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.signupInfo}>
                      <Text style={styles.signupCompany}>{signup.company}</Text>
                      <Text style={styles.signupEmail}>{signup.email}</Text>
                    </View>
                    <View style={styles.signupMeta}>
                      <View style={[styles.planBadge, { backgroundColor: getPlanColor(signup.plan) }]}>
                        <Text style={styles.planBadgeText}>{signup.plan}</Text>
                      </View>
                      <Text style={styles.signupDate}>{signup.date}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No recent signups</Text>
                </View>
              )}
            </View>
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            {/* Platform Activity */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Ionicons name="pulse" size={20} color={COLORS.cyan} />
                  <Text style={styles.cardTitle}>Platform Activity</Text>
                </View>
              </View>

              {activities.length > 0 ? (
                activities.map((activity) => (
                  <View key={activity.id} style={styles.activityItem}>
                    <View style={[styles.activityDot, { backgroundColor: getActivityColor(activity.type) }]} />
                    <View style={styles.activityContent}>
                      <Text style={styles.activityAction}>{activity.action}</Text>
                      <Text style={styles.activityDetail}>{activity.detail}</Text>
                      <Text style={styles.activityTime}>{activity.time}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No recent activity</Text>
                </View>
              )}
            </View>

            {/* Quick Actions */}
            <View style={[styles.card, { marginTop: 16 }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Ionicons name="flash" size={20} color={COLORS.yellow} />
                  <Text style={styles.cardTitle}>Quick Actions</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.quickAction} onPress={() => navigateTo('AdminSupport')}>
                <View style={[styles.quickActionIcon, { backgroundColor: COLORS.primary + '20' }]}>
                  <Ionicons name="people" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.quickActionText}>Manage Customers</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickAction} onPress={() => navigateTo('AdminPortal')}>
                <View style={[styles.quickActionIcon, { backgroundColor: COLORS.green + '20' }]}>
                  <Ionicons name="card" size={20} color={COLORS.green} />
                </View>
                <Text style={styles.quickActionText}>Billing & Subscriptions</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickAction} onPress={() => navigateTo('AdminPortal')}>
                <View style={[styles.quickActionIcon, { backgroundColor: COLORS.blue + '20' }]}>
                  <Ionicons name="key" size={20} color={COLORS.blue} />
                </View>
                <Text style={styles.quickActionText}>API Keys & Subscribers</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickAction} onPress={() => navigateTo('Reports')}>
                <View style={[styles.quickActionIcon, { backgroundColor: COLORS.cyan + '20' }]}>
                  <Ionicons name="analytics" size={20} color={COLORS.cyan} />
                </View>
                <Text style={styles.quickActionText}>Full Analytics</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickAction} onPress={() => navigateTo('AdminSupport')}>
                <View style={[styles.quickActionIcon, { backgroundColor: COLORS.yellow + '20' }]}>
                  <Ionicons name="help-buoy" size={20} color={COLORS.yellow} />
                </View>
                <Text style={styles.quickActionText}>Support Tickets</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickAction} onPress={() => navigateTo('Settings')}>
                <View style={[styles.quickActionIcon, { backgroundColor: COLORS.red + '20' }]}>
                  <Ionicons name="settings" size={20} color={COLORS.red} />
                </View>
                <Text style={styles.quickActionText}>Platform Settings</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* System Health */}
            <View style={[styles.card, { marginTop: 16 }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Ionicons name="server" size={20} color={COLORS.green} />
                  <Text style={styles.cardTitle}>System Health</Text>
                </View>
                <View style={styles.healthBadge}>
                  <View style={styles.healthDot} />
                  <Text style={styles.healthText}>All Systems Operational</Text>
                </View>
              </View>

              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>API Server</Text>
                <Text style={[styles.healthStatus, { color: COLORS.green }]}>Healthy</Text>
              </View>
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>Database</Text>
                <Text style={[styles.healthStatus, { color: COLORS.green }]}>Healthy</Text>
              </View>
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>Payment Gateway</Text>
                <Text style={[styles.healthStatus, { color: COLORS.green }]}>Healthy</Text>
              </View>
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>Email Service</Text>
                <Text style={[styles.healthStatus, { color: COLORS.green }]}>Healthy</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function getPlanColor(plan: string): string {
  switch (plan) {
    case 'free': return '#6B7280';
    case 'starter': return COLORS.blue;
    case 'professional': return COLORS.primary;
    case 'business': return COLORS.green;
    default: return '#6B7280';
  }
}

function getActivityColor(type: string): string {
  switch (type) {
    case 'success': return COLORS.green;
    case 'info': return COLORS.blue;
    case 'warning': return COLORS.yellow;
    case 'error': return COLORS.red;
    default: return COLORS.textMuted;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    maxWidth: 1400,
    marginHorizontal: 'auto',
    width: '100%',
  },
  hero: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  heroContent: {},
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.green,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metricCardLarge: {
    flex: 1,
    minWidth: 250,
  },
  metricIconBg: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  metricLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '500',
  },
  trendTextMuted: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  secondaryMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  smallMetricCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
    minWidth: 150,
  },
  smallMetricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  smallMetricLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  contentGrid: {
    flexDirection: isLargeScreen ? 'row' : 'column',
    gap: 16,
  },
  leftColumn: {
    flex: isLargeScreen ? 1.5 : 1,
  },
  rightColumn: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  subscriptionBars: {
    gap: 16,
  },
  subBar: {
    gap: 8,
  },
  subBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subBarLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  subBarCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  subBarTrack: {
    height: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  subBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  subscriptionSummary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  summaryHighlight: {
    fontWeight: '700',
    color: COLORS.green,
  },
  signupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  signupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  signupInfo: {
    flex: 1,
    marginLeft: 12,
  },
  signupCompany: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  signupEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  signupMeta: {
    alignItems: 'flex-end',
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
    textTransform: 'capitalize',
  },
  signupDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  activityDetail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  activityTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickActionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  healthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
  },
  healthText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.green,
  },
  healthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  healthLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  healthStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  // Engagement section styles
  engagementRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  engagementCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  engagementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  engagementStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  engagementStat: {
    alignItems: 'center',
  },
  engagementValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  engagementLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  // Growth row styles
  growthRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  growthCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  growthValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  growthLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
