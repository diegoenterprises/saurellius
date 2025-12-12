/**
 * ADMIN DASHBOARD
 * Platform owner dashboard with SaaS metrics, analytics, and subscriber management
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Header from '../../components/dashboard/Header';

const { width } = Dimensions.get('window');
const isLargeScreen = width >= 1024;
const isMediumScreen = width >= 768;

// Mock data - In production, fetch from API
const PLATFORM_METRICS = {
  totalUsers: 1247,
  activeUsers: 892,
  newUsersThisMonth: 156,
  userGrowth: 14.2,
  totalCompanies: 324,
  activeCompanies: 298,
  
  // Revenue
  mrr: 48750,
  arr: 585000,
  revenueGrowth: 18.5,
  avgRevenuePerUser: 39.09,
  
  // API Usage
  apiCallsToday: 45892,
  apiCallsThisMonth: 1247650,
  avgResponseTime: 42,
  apiUptime: 99.98,
  
  // Subscriptions
  freeUsers: 412,
  starterUsers: 298,
  professionalUsers: 387,
  businessUsers: 150,
  churnRate: 2.3,
};

const RECENT_SIGNUPS = [
  { id: 1, company: 'TechStart Inc', email: 'admin@techstart.com', plan: 'professional', date: '2 hours ago' },
  { id: 2, company: 'Green Valley LLC', email: 'hr@greenvalley.com', plan: 'starter', date: '5 hours ago' },
  { id: 3, company: 'Apex Solutions', email: 'payroll@apex.io', plan: 'business', date: '1 day ago' },
  { id: 4, company: 'Swift Logistics', email: 'admin@swiftlog.com', plan: 'professional', date: '1 day ago' },
  { id: 5, company: 'Bloom Marketing', email: 'team@bloom.co', plan: 'starter', date: '2 days ago' },
];

const RECENT_ACTIVITY = [
  { id: 1, action: 'New subscription', detail: 'TechStart Inc upgraded to Professional', time: '2 hours ago', type: 'success' },
  { id: 2, action: 'API key generated', detail: 'Apex Solutions created new API key', time: '4 hours ago', type: 'info' },
  { id: 3, action: 'Payment received', detail: '$299/mo from Swift Logistics', time: '6 hours ago', type: 'success' },
  { id: 4, action: 'Support ticket', detail: 'Green Valley LLC - Integration help', time: '8 hours ago', type: 'warning' },
  { id: 5, action: 'Subscription cancelled', detail: 'Beta Corp downgraded to Free', time: '1 day ago', type: 'error' },
];

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
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState(PLATFORM_METRICS);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
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
          colors={['#1E1B4B', '#312E81', '#4C1D95']}
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
              <Text style={styles.metricValue}>{formatNumber(metrics.totalUsers)}</Text>
              <Text style={styles.metricLabel}>Total Users</Text>
              <View style={styles.metricTrend}>
                <Ionicons name="trending-up" size={14} color={COLORS.green} />
                <Text style={[styles.trendText, { color: COLORS.green }]}>
                  +{metrics.userGrowth}% this month
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
                  +{metrics.revenueGrowth}% growth
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
              <Text style={styles.metricValue}>{formatNumber(metrics.activeCompanies)}</Text>
              <Text style={styles.metricLabel}>Active Companies</Text>
              <View style={styles.metricTrend}>
                <Text style={styles.trendTextMuted}>
                  of {metrics.totalCompanies} total
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
              <Text style={styles.metricValue}>{formatNumber(metrics.apiCallsToday)}</Text>
              <Text style={styles.metricLabel}>API Calls Today</Text>
              <View style={styles.metricTrend}>
                <Text style={styles.trendTextMuted}>
                  {metrics.avgResponseTime}ms avg response
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
            <Text style={styles.smallMetricValue}>{formatCurrency(metrics.avgRevenuePerUser)}</Text>
            <Text style={styles.smallMetricLabel}>Avg Revenue Per User</Text>
          </View>
          <View style={styles.smallMetricCard}>
            <Text style={styles.smallMetricValue}>{metrics.apiUptime}%</Text>
            <Text style={styles.smallMetricLabel}>API Uptime</Text>
          </View>
          <View style={styles.smallMetricCard}>
            <Text style={[styles.smallMetricValue, { color: COLORS.yellow }]}>{metrics.churnRate}%</Text>
            <Text style={styles.smallMetricLabel}>Churn Rate</Text>
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
                    <Text style={styles.subBarCount}>{metrics.freeUsers}</Text>
                  </View>
                  <View style={styles.subBarTrack}>
                    <View style={[styles.subBarFill, { width: `${(metrics.freeUsers / metrics.totalUsers) * 100}%`, backgroundColor: '#6B7280' }]} />
                  </View>
                </View>

                <View style={styles.subBar}>
                  <View style={styles.subBarHeader}>
                    <Text style={styles.subBarLabel}>Starter ($29/mo)</Text>
                    <Text style={styles.subBarCount}>{metrics.starterUsers}</Text>
                  </View>
                  <View style={styles.subBarTrack}>
                    <View style={[styles.subBarFill, { width: `${(metrics.starterUsers / metrics.totalUsers) * 100}%`, backgroundColor: COLORS.blue }]} />
                  </View>
                </View>

                <View style={styles.subBar}>
                  <View style={styles.subBarHeader}>
                    <Text style={styles.subBarLabel}>Professional ($79/mo)</Text>
                    <Text style={styles.subBarCount}>{metrics.professionalUsers}</Text>
                  </View>
                  <View style={styles.subBarTrack}>
                    <View style={[styles.subBarFill, { width: `${(metrics.professionalUsers / metrics.totalUsers) * 100}%`, backgroundColor: COLORS.primary }]} />
                  </View>
                </View>

                <View style={styles.subBar}>
                  <View style={styles.subBarHeader}>
                    <Text style={styles.subBarLabel}>Business ($199/mo)</Text>
                    <Text style={styles.subBarCount}>{metrics.businessUsers}</Text>
                  </View>
                  <View style={styles.subBarTrack}>
                    <View style={[styles.subBarFill, { width: `${(metrics.businessUsers / metrics.totalUsers) * 100}%`, backgroundColor: COLORS.green }]} />
                  </View>
                </View>
              </View>

              <View style={styles.subscriptionSummary}>
                <Text style={styles.summaryText}>
                  Paid Conversion Rate: <Text style={styles.summaryHighlight}>{((metrics.totalUsers - metrics.freeUsers) / metrics.totalUsers * 100).toFixed(1)}%</Text>
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

              {RECENT_SIGNUPS.map((signup) => (
                <View key={signup.id} style={styles.signupItem}>
                  <View style={styles.signupAvatar}>
                    <Text style={styles.signupAvatarText}>
                      {signup.company.charAt(0)}
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
              ))}
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

              {RECENT_ACTIVITY.map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={[styles.activityDot, { backgroundColor: getActivityColor(activity.type) }]} />
                  <View style={styles.activityContent}>
                    <Text style={styles.activityAction}>{activity.action}</Text>
                    <Text style={styles.activityDetail}>{activity.detail}</Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Quick Actions */}
            <View style={[styles.card, { marginTop: 16 }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Ionicons name="flash" size={20} color={COLORS.yellow} />
                  <Text style={styles.cardTitle}>Quick Actions</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.quickAction}>
                <View style={[styles.quickActionIcon, { backgroundColor: COLORS.primary + '20' }]}>
                  <Ionicons name="people" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.quickActionText}>Manage Users</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickAction}>
                <View style={[styles.quickActionIcon, { backgroundColor: COLORS.green + '20' }]}>
                  <Ionicons name="card" size={20} color={COLORS.green} />
                </View>
                <Text style={styles.quickActionText}>Billing & Invoices</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickAction}>
                <View style={[styles.quickActionIcon, { backgroundColor: COLORS.blue + '20' }]}>
                  <Ionicons name="key" size={20} color={COLORS.blue} />
                </View>
                <Text style={styles.quickActionText}>API Keys</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickAction}>
                <View style={[styles.quickActionIcon, { backgroundColor: COLORS.cyan + '20' }]}>
                  <Ionicons name="analytics" size={20} color={COLORS.cyan} />
                </View>
                <Text style={styles.quickActionText}>Full Analytics</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickAction}>
                <View style={[styles.quickActionIcon, { backgroundColor: COLORS.yellow + '20' }]}>
                  <Ionicons name="help-buoy" size={20} color={COLORS.yellow} />
                </View>
                <Text style={styles.quickActionText}>Support Tickets</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickAction}>
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
});
