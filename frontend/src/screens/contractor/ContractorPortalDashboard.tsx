/**
 * CONTRACTOR PORTAL DASHBOARD
 * Main dashboard for contractor self-service portal
 * YTD earnings, invoices, expenses, tax center
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
import contractorSelfServiceAPI, { ContractorDashboard } from '../../services/contractorSelfService';
import { colors, gradients } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

interface QuickActionProps {
  icon: string;
  label: string;
  onPress: () => void;
  badge?: number;
  color?: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, label, onPress, badge, color }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress}>
    <View style={[styles.quickActionIcon, color && { backgroundColor: color + '20' }]}>
      <Ionicons name={icon as any} size={24} color={color || colors.primary.purple} />
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
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, onPress }) => (
  <TouchableOpacity 
    style={[styles.statCard, { borderLeftColor: color }]} 
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={styles.statHeader}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={styles.statTitle}>{title}</Text>
    </View>
    <Text style={styles.statValue}>{value}</Text>
    {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
  </TouchableOpacity>
);

export default function ContractorPortalDashboard() {
  const navigation = useNavigation();
  const { colors: themeColors, gradients: themeGradients } = useTheme();
  const [dashboard, setDashboard] = useState<ContractorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    try {
      const response = await contractorSelfServiceAPI.getDashboard();
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
        colors={['#059669', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>
            {dashboard?.business_name || 'Contractor Portal'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Independent Contractor Dashboard
          </Text>
        </View>
        <View style={styles.ytdEarningsCard}>
          <Text style={styles.ytdLabel}>YTD Earnings</Text>
          <Text style={styles.ytdAmount}>
            {stats ? formatCurrency(stats.ytd_earnings) : '$0'}
          </Text>
        </View>
      </LinearGradient>

      {/* Onboarding Alert */}
      {!dashboard?.onboarding_complete && (
        <TouchableOpacity
          style={styles.alertBanner}
          onPress={() => navigation.navigate('Onboarding' as never)}
        >
          <Ionicons name="alert-circle" size={24} color="#F59E0B" />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Complete Your Setup</Text>
            <Text style={styles.alertText}>
              Finish onboarding to start invoicing clients
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#F59E0B" />
        </TouchableOpacity>
      )}

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Outstanding"
          value={stats ? formatCurrency(stats.outstanding_amount) : '$0'}
          subtitle={`${stats?.outstanding_invoices || 0} invoices`}
          icon="receipt"
          color={colors.status.warning}
          onPress={() => navigation.navigate('Paystubs' as never)}
        />
        <StatCard
          title="Clients"
          value={String(stats?.clients_count || 0)}
          subtitle="Active clients"
          icon="people"
          color={colors.primary.blue}
          onPress={() => navigation.navigate('Employees' as never)}
        />
        <StatCard
          title="Draft Invoices"
          value={String(stats?.pending_invoices || 0)}
          subtitle="Ready to send"
          icon="document-text"
          color={colors.primary.purple}
          onPress={() => navigation.navigate('Paystubs' as never)}
        />
        <StatCard
          title="W-9 Status"
          value={dashboard?.w9_status === 'complete' ? '✓' : '!'}
          subtitle={dashboard?.w9_status === 'complete' ? 'Complete' : 'Required'}
          icon="document-attach"
          color={dashboard?.w9_status === 'complete' ? colors.status.success : colors.status.error}
          onPress={() => navigation.navigate('Compliance' as never)}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickAction
            icon="add-circle"
            label="New Invoice"
            onPress={() => navigation.navigate('GeneratePaystub' as never)}
            color={colors.status.success}
          />
          <QuickAction
            icon="receipt"
            label="Log Expense"
            onPress={() => navigation.navigate('Accounting' as never)}
            color={colors.primary.purple}
          />
          <QuickAction
            icon="car"
            label="Log Mileage"
            onPress={() => navigation.navigate('Accounting' as never)}
            color={colors.primary.blue}
          />
          <QuickAction
            icon="calculator"
            label="Tax Center"
            onPress={() => navigation.navigate('TaxCenter' as never)}
            color={colors.status.warning}
          />
          <QuickAction
            icon="document-text"
            label="1099 Forms"
            onPress={() => navigation.navigate('TaxCenter' as never)}
          />
          <QuickAction
            icon="person"
            label="Profile"
            onPress={() => navigation.navigate('Profile' as never)}
          />
        </View>
      </View>

      {/* Recent Invoices */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Recent Invoices</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Paystubs' as never)}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {dashboard?.recent_invoices && dashboard.recent_invoices.length > 0 ? (
          dashboard.recent_invoices.slice(0, 3).map((invoice: any, index: number) => (
            <View key={index} style={[styles.invoiceItem, { backgroundColor: themeColors.card }]}>
              <View style={styles.invoiceInfo}>
                <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
                <Text style={styles.invoiceClient}>Client ID: {invoice.client_id}</Text>
              </View>
              <View style={styles.invoiceRight}>
                <Text style={styles.invoiceAmount}>{formatCurrency(invoice.total)}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(invoice.status) + '20' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(invoice.status) }
                  ]}>
                    {invoice.status}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No invoices yet</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('GeneratePaystub' as never)}
            >
              <Text style={styles.createButtonText}>Create First Invoice</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Recent Payments */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Recent Payments</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Wallet' as never)}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {dashboard?.recent_payments && dashboard.recent_payments.length > 0 ? (
          dashboard.recent_payments.slice(0, 3).map((payment: any, index: number) => (
            <View key={index} style={[styles.paymentItem, { backgroundColor: themeColors.card }]}>
              <View style={styles.paymentIcon}>
                <Ionicons name="checkmark-circle" size={24} color={colors.status.success} />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                <Text style={styles.paymentDate}>{payment.payment_date}</Text>
              </View>
              <Text style={styles.paymentMethod}>{payment.payment_method}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="cash-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No payments received yet</Text>
          </View>
        )}
      </View>

      {/* Tax Reminder */}
      <View style={styles.taxReminderCard}>
        <View style={styles.taxReminderHeader}>
          <Ionicons name="calendar" size={24} color={colors.status.warning} />
          <Text style={styles.taxReminderTitle}>Quarterly Tax Reminder</Text>
        </View>
        <Text style={styles.taxReminderText}>
          Don't forget to make your estimated quarterly tax payments to avoid penalties.
        </Text>
        <TouchableOpacity
          style={styles.taxReminderButton}
          onPress={() => navigation.navigate('TaxCenter' as never)}
        >
          <Text style={styles.taxReminderButtonText}>View Tax Center</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary.purple} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid': return colors.status.success;
    case 'sent': return colors.primary.blue;
    case 'overdue': return colors.status.error;
    case 'partial': return colors.status.warning;
    default: return '#6B7280';
  }
};

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
  headerContent: {
    marginBottom: 16,
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
  ytdEarningsCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 16,
  },
  ytdLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  ytdAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  alertText: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary.purple,
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
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
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  invoiceClient: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  invoiceRight: {
    alignItems: 'flex-end',
  },
  invoiceAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  createButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary.purple,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  paymentIcon: {
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  paymentDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  paymentMethod: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  taxReminderCard: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  taxReminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taxReminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  taxReminderText: {
    fontSize: 14,
    color: '#B45309',
    lineHeight: 20,
    marginBottom: 12,
  },
  taxReminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taxReminderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.purple,
    marginRight: 4,
  },
  bottomPadding: {
    height: 32,
  },
});
