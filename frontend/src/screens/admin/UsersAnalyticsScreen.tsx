/**
 * USERS ANALYTICS SCREEN
 * Comprehensive user analytics for admin dashboard
 * ALL DATA FROM REAL DATABASE QUERIES - NO MOCK DATA
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import adminDashboardService from '../../services/adminDashboard';
import BackButton from '../../components/common/BackButton';

const { width: screenWidth } = Dimensions.get('window');

interface UserAnalyticsData {
  total_users: number;
  total_employers: number;
  total_employees: number;
  total_contractors: number;
  employer_percentage: number;
  employee_percentage: number;
  contractor_percentage: number;
  active_users_30d: number;
  active_employers_30d: number;
  active_employees_30d: number;
  active_contractors_30d: number;
  user_growth: Array<{
    month: string;
    employers: number;
    employees: number;
    contractors: number;
    total: number;
  }>;
  timestamp: string;
}

export default function UsersAnalyticsScreen() {
  const { colors, gradients } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<UserAnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUserAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminDashboardService.getUsersOverview();
      if (response.success) {
        setUserData(response.data);
      } else {
        setError(response.message || 'Failed to load user analytics');
      }
    } catch (err: any) {
      console.error('Error loading user analytics:', err);
      setError('Failed to load user analytics. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUserAnalytics();
  }, [loadUserAnalytics]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUserAnalytics();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={gradients.header} style={styles.header}>
          <View style={styles.headerRow}>
            <BackButton variant="gradient" />
            <Text style={styles.headerTitle}>User Analytics</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading analytics...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={gradients.header} style={styles.header}>
          <View style={styles.headerRow}>
            <BackButton variant="gradient" />
            <Text style={styles.headerTitle}>User Analytics</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.primary} />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadUserAnalytics}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerRow}>
          <BackButton variant="gradient" />
          <Text style={styles.headerTitle}>User Analytics</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        {userData?.timestamp && (
          <Text style={styles.headerSubtext}>
            Last updated: {new Date(userData.timestamp).toLocaleString()}
          </Text>
        )}
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
              <Ionicons name="people" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.cardValue, { color: colors.text }]}>
              {formatNumber(userData?.total_users || 0)}
            </Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Total Users</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: '#3B82F620' }]}>
              <Ionicons name="business" size={24} color="#3B82F6" />
            </View>
            <Text style={[styles.cardValue, { color: colors.text }]}>
              {formatNumber(userData?.total_employers || 0)}
            </Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Employers</Text>
            <Text style={[styles.cardPercentage, { color: '#3B82F6' }]}>
              {(userData?.employer_percentage || 0).toFixed(1)}%
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: '#22C55E20' }]}>
              <Ionicons name="person" size={24} color="#22C55E" />
            </View>
            <Text style={[styles.cardValue, { color: colors.text }]}>
              {formatNumber(userData?.total_employees || 0)}
            </Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Employees</Text>
            <Text style={[styles.cardPercentage, { color: '#22C55E' }]}>
              {(userData?.employee_percentage || 0).toFixed(1)}%
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="briefcase" size={24} color="#F59E0B" />
            </View>
            <Text style={[styles.cardValue, { color: colors.text }]}>
              {formatNumber(userData?.total_contractors || 0)}
            </Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Contractors</Text>
            <Text style={[styles.cardPercentage, { color: '#F59E0B' }]}>
              {(userData?.contractor_percentage || 0).toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Active Users Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Users (Last 30 Days)</Text>
          <Text style={[styles.largeNumber, { color: colors.primary }]}>
            {formatNumber(userData?.active_users_30d || 0)}
          </Text>
          <View style={styles.activeBreakdown}>
            <View style={styles.activeItem}>
              <Ionicons name="business-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.activeItemText, { color: colors.textSecondary }]}>
                {formatNumber(userData?.active_employers_30d || 0)} Employers
              </Text>
            </View>
            <View style={styles.activeItem}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.activeItemText, { color: colors.textSecondary }]}>
                {formatNumber(userData?.active_employees_30d || 0)} Employees
              </Text>
            </View>
            <View style={styles.activeItem}>
              <Ionicons name="briefcase-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.activeItemText, { color: colors.textSecondary }]}>
                {formatNumber(userData?.active_contractors_30d || 0)} Contractors
              </Text>
            </View>
          </View>
        </View>

        {/* User Distribution */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>User Type Distribution</Text>
          <View style={styles.distributionBars}>
            <View style={styles.distributionRow}>
              <Text style={[styles.distributionLabel, { color: colors.text }]}>Employers</Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    { width: `${userData?.employer_percentage || 0}%`, backgroundColor: '#3B82F6' },
                  ]}
                />
              </View>
              <Text style={[styles.distributionValue, { color: colors.textSecondary }]}>
                {(userData?.employer_percentage || 0).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.distributionRow}>
              <Text style={[styles.distributionLabel, { color: colors.text }]}>Employees</Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    { width: `${userData?.employee_percentage || 0}%`, backgroundColor: '#22C55E' },
                  ]}
                />
              </View>
              <Text style={[styles.distributionValue, { color: colors.textSecondary }]}>
                {(userData?.employee_percentage || 0).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.distributionRow}>
              <Text style={[styles.distributionLabel, { color: colors.text }]}>Contractors</Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    { width: `${userData?.contractor_percentage || 0}%`, backgroundColor: '#F59E0B' },
                  ]}
                />
              </View>
              <Text style={[styles.distributionValue, { color: colors.textSecondary }]}>
                {(userData?.contractor_percentage || 0).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* User Growth Trend */}
        {userData?.user_growth && userData.user_growth.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>User Growth (Last 6 Months)</Text>
            {userData.user_growth.map((item, index) => (
              <View key={index} style={styles.growthRow}>
                <Text style={[styles.growthMonth, { color: colors.text }]}>{item.month}</Text>
                <View style={styles.growthDetails}>
                  <Text style={[styles.growthValue, { color: '#3B82F6' }]}>
                    {formatNumber(item.employers)} emp
                  </Text>
                  <Text style={[styles.growthValue, { color: '#22C55E' }]}>
                    {formatNumber(item.employees)} staff
                  </Text>
                  <Text style={[styles.growthValue, { color: '#F59E0B' }]}>
                    {formatNumber(item.contractors)} cont
                  </Text>
                </View>
                <Text style={[styles.growthTotal, { color: colors.text }]}>
                  {formatNumber(item.total)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  headerSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  summaryCard: {
    width: '48%',
    margin: '1%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  cardLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  cardPercentage: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  largeNumber: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 16,
  },
  activeBreakdown: {
    marginTop: 16,
  },
  activeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeItemText: {
    marginLeft: 12,
    fontSize: 16,
  },
  distributionBars: {
    marginTop: 8,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  distributionLabel: {
    width: 90,
    fontSize: 14,
  },
  barContainer: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 6,
  },
  distributionValue: {
    width: 50,
    fontSize: 14,
    textAlign: 'right',
  },
  growthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  growthMonth: {
    width: 80,
    fontSize: 14,
    fontWeight: '500',
  },
  growthDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  growthValue: {
    fontSize: 12,
  },
  growthTotal: {
    width: 60,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
});
