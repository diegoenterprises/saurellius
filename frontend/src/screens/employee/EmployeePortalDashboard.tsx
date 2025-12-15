/**
 * EMPLOYEE PORTAL DASHBOARD
 * Main dashboard for employee self-service portal
 * Quick stats, upcoming events, recent activity
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import employeeSelfServiceAPI, { DashboardData } from '../../services/employeeSelfService';
import { colors, gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

interface QuickActionProps {
  icon: string;
  label: string;
  onPress: () => void;
  badge?: number;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, label, onPress, badge }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress}>
    <View style={styles.quickActionIcon}>
      <Ionicons name={icon as any} size={24} color={colors.primary.purple} />
      {badge && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={styles.statHeader}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={styles.statTitle}>{title}</Text>
    </View>
    <Text style={styles.statValue}>{value}</Text>
    {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
  </View>
);

export default function EmployeePortalDashboard() {
  const navigation = useNavigation();
  const { colors: themeColors, gradients: themeGradients } = useTheme();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    try {
      const response = await employeeSelfServiceAPI.getDashboard();
      if (response.success) {
        setDashboard(response.dashboard);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={colors.primary.purple} />
        <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Loading dashboard...</Text>
      </View>
    );
  }

  const stats = dashboard?.quick_stats;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.welcomeText}>{dashboard?.welcome_message}</Text>
        <Text style={styles.headerSubtitle}>
          {stats?.days_until_payday === 0
            ? "It's payday! 🎉"
            : `${stats?.days_until_payday} days until payday`}
        </Text>
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Next Payday"
          value={stats ? formatDate(stats.next_payday) : '-'}
          subtitle={stats?.days_until_payday === 0 ? 'Today!' : `In ${stats?.days_until_payday} days`}
          icon="calendar"
          color={colors.primary.purple}
        />
        <StatCard
          title="YTD Earnings"
          value={stats ? formatCurrency(stats.ytd_earnings) : '-'}
          icon="cash"
          color={colors.status.success}
        />
        <StatCard
          title="Available PTO"
          value={stats ? `${stats.available_pto} hrs` : '-'}
          icon="time"
          color={colors.primary.blue}
        />
        <StatCard
          title="Benefits Cost"
          value={stats ? `${formatCurrency(stats.benefits_cost_monthly)}/mo` : '-'}
          icon="heart"
          color={colors.status.warning}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickAction
            icon="document-text"
            label="View Paystubs"
            onPress={() => navigation.navigate('Paystubs' as never)}
          />
          <QuickAction
            icon="time"
            label="Request PTO"
            onPress={() => navigation.navigate('PTO' as never)}
          />
          <QuickAction
            icon="card"
            label="Direct Deposit"
            onPress={() => navigation.navigate('Settings' as never)}
          />
          <QuickAction
            icon="receipt"
            label="DocuGinuity Tax"
            onPress={() => navigation.navigate('TaxCenter' as never)}
          />
          <QuickAction
            icon="heart"
            label="Benefits"
            onPress={() => navigation.navigate('Benefits' as never)}
          />
          <QuickAction
            icon="person"
            label="My Profile"
            onPress={() => navigation.navigate('Profile' as never)}
          />
        </View>
      </View>

      {/* Upcoming Events */}
      {dashboard?.upcoming_events && dashboard.upcoming_events.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Upcoming</Text>
          {dashboard.upcoming_events.map((event, index) => (
            <View key={index} style={[styles.eventItem, { backgroundColor: themeColors.card }]}>
              <View style={styles.eventDate}>
                <Text style={styles.eventDateText}>{formatDate(event.date)}</Text>
              </View>
              <View style={styles.eventDetails}>
                <Text style={styles.eventDescription}>{event.description}</Text>
                <Text style={styles.eventType}>{event.type}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Recent Activity */}
      {dashboard?.recent_activity && dashboard.recent_activity.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Recent Activity</Text>
          {dashboard.recent_activity.slice(0, 5).map((activity, index) => (
            <View key={index} style={[styles.activityItem, { backgroundColor: themeColors.card }]}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.status.success}
              />
              <View style={styles.activityContent}>
                <Text style={styles.activityDescription}>{activity.description}</Text>
                <Text style={styles.activityDate}>{activity.date}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Notifications Banner */}
      {dashboard?.notifications && dashboard.notifications.filter(n => !n.read).length > 0 && (
        <TouchableOpacity
          style={styles.notificationBanner}
          onPress={() => navigation.navigate('Messages' as never)}
        >
          <Ionicons name="notifications" size={24} color="white" />
          <Text style={styles.notificationBannerText}>
            You have {dashboard.notifications.filter(n => !n.read).length} unread notifications
          </Text>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>
      )}

      {/* Profile Completion */}
      {dashboard?.profile_completion && dashboard.profile_completion < 100 && (
        <TouchableOpacity
          style={[styles.completionCard, { backgroundColor: themeColors.card }]}
          onPress={() => navigation.navigate('Profile' as never)}
        >
          <View style={styles.completionHeader}>
            <Ionicons name="person-circle" size={24} color={colors.primary.purple} />
            <Text style={[styles.completionTitle, { color: themeColors.text }]}>Complete Your Profile</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${dashboard.profile_completion}%` },
              ]}
            />
          </View>
          <Text style={[styles.completionText, { color: themeColors.textSecondary }]}>
            {dashboard.profile_completion}% complete
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.bottomPadding} />
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
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    marginTop: -20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
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
    color: '#1F2937',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '30%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.status.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  eventDate: {
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.purple,
  },
  eventDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  eventDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  eventType: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  activityContent: {
    marginLeft: 12,
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: '#1F2937',
  },
  activityDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  notificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.purple,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  notificationBannerText: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
  },
  completionCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary.purple,
    borderRadius: 4,
  },
  completionText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  bottomPadding: {
    height: 32,
  },
});
