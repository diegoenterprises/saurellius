/**
 * 👑 ADMIN PORTAL SCREEN
 * Complete administrative dashboard for platform owner
 * - Platform Analytics & KPIs
 * - User Management
 * - Subscription Analytics
 * - Tax Engine API Usage Tracking
 * - System Health Monitoring
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'overview' | 'users' | 'subscriptions' | 'api' | 'system';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changePositive?: boolean;
  icon: string;
  color: string;
}

// Mock data for demonstration
const MOCK_METRICS = {
  total_users: 1847,
  active_users: 1523,
  new_users_today: 23,
  new_users_this_month: 312,
  total_companies: 456,
  total_paystubs_generated: 45892,
  total_payroll_processed: 12450000,
  mrr: 48500,
  arr: 582000,
  churn_rate: 2.3,
  conversion_rate: 12.8,
};

const MOCK_API_CLIENTS = [
  { 
    id: '1', 
    name: 'ADP Integration', 
    tier: 'Enterprise', 
    requests_today: 45230, 
    daily_limit: 100000, 
    status: 'active', 
    annual_revenue: 10000,
    overage_requests: 0,
    overage_cost: 0,
    overage_rate: 0.10,
    stripe_subscription_id: 'sub_1A2B3C4D5E',
    stripe_customer_id: 'cus_ADPIntegration',
  },
  { 
    id: '2', 
    name: 'Gusto Partner', 
    tier: 'Professional', 
    requests_today: 12450, 
    daily_limit: 20000, 
    status: 'active', 
    annual_revenue: 5000,
    overage_requests: 0,
    overage_cost: 0,
    overage_rate: 0.25,
    stripe_subscription_id: 'sub_2B3C4D5E6F',
    stripe_customer_id: 'cus_GustoPartner',
  },
  { 
    id: '3', 
    name: 'QuickBooks Connect', 
    tier: 'Ultimate', 
    requests_today: 89120, 
    daily_limit: -1, 
    status: 'active', 
    annual_revenue: 15000,
    overage_requests: 0,
    overage_cost: 0,
    overage_rate: 0,
    stripe_subscription_id: 'sub_3C4D5E6F7G',
    stripe_customer_id: 'cus_QuickBooks',
  },
  { 
    id: '4', 
    name: 'Paylocity API', 
    tier: 'Standard', 
    requests_today: 6890, 
    daily_limit: 5000, 
    status: 'over_limit', 
    annual_revenue: 2000,
    overage_requests: 1890,
    overage_cost: 945.00,
    overage_rate: 0.50,
    stripe_subscription_id: 'sub_4D5E6F7G8H',
    stripe_customer_id: 'cus_Paylocity',
  },
];

const TIER_PRICING = {
  Standard: { annual: 2000, daily_limit: 5000, overage_rate: 0.50 },
  Professional: { annual: 5000, daily_limit: 20000, overage_rate: 0.25 },
  Enterprise: { annual: 10000, daily_limit: 100000, overage_rate: 0.10 },
  Ultimate: { annual: 15000, daily_limit: -1, overage_rate: 0 },
};

const MOCK_USERS = [
  { id: '1', name: 'John Smith', email: 'john@company.com', tier: 'Professional', status: 'active', joined: '2024-01-15', paystubs: 234 },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@startup.io', tier: 'Starter', status: 'active', joined: '2024-03-22', paystubs: 45 },
  { id: '3', name: 'Mike Davis', email: 'mike@enterprise.com', tier: 'Business', status: 'active', joined: '2023-11-08', paystubs: 1234 },
  { id: '4', name: 'Emily Chen', email: 'emily@tech.co', tier: 'Professional', status: 'suspended', joined: '2024-02-14', paystubs: 89 },
];

const { width } = Dimensions.get('window');

export default function AdminPortalScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const MetricCard = ({ title, value, change, changePositive, icon, color }: MetricCardProps) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        {change && (
          <View style={[styles.changeBadge, { backgroundColor: changePositive ? '#10B98120' : '#EF444420' }]}>
            <Ionicons 
              name={changePositive ? 'arrow-up' : 'arrow-down'} 
              size={12} 
              color={changePositive ? '#10B981' : '#EF4444'} 
            />
            <Text style={[styles.changeText, { color: changePositive ? '#10B981' : '#EF4444' }]}>
              {change}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
    </View>
  );

  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Hero Stats */}
      <LinearGradient
        colors={['#1473FF', '#BE01FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.heroCard}
      >
        <View style={styles.heroRow}>
          <View style={styles.heroStat}>
            <Text style={styles.heroValue}>{formatCurrency(MOCK_METRICS.mrr)}</Text>
            <Text style={styles.heroLabel}>Monthly Recurring Revenue</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroValue}>{formatCurrency(MOCK_METRICS.arr)}</Text>
            <Text style={styles.heroLabel}>Annual Run Rate</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Key Metrics Grid */}
      <View style={styles.metricsGrid}>
        <MetricCard 
          title="Total Users" 
          value={formatNumber(MOCK_METRICS.total_users)} 
          change="+8.2%" 
          changePositive 
          icon="people" 
          color="#1473FF" 
        />
        <MetricCard 
          title="Active Users" 
          value={formatNumber(MOCK_METRICS.active_users)} 
          change="+5.4%" 
          changePositive 
          icon="pulse" 
          color="#10B981" 
        />
        <MetricCard 
          title="New Today" 
          value={MOCK_METRICS.new_users_today} 
          change="+12" 
          changePositive 
          icon="person-add" 
          color="#8B5CF6" 
        />
        <MetricCard 
          title="Churn Rate" 
          value={`${MOCK_METRICS.churn_rate}%`} 
          change="-0.5%" 
          changePositive 
          icon="trending-down" 
          color="#F59E0B" 
        />
      </View>

      {/* Charts Section */}
      <View style={styles.chartsSection}>
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Revenue Trend (Last 6 Months)</Text>
          <View style={styles.chartContainer}>
            {[35, 42, 38, 48, 52, 58].map((value, index) => (
              <View key={index} style={styles.barWrapper}>
                <View style={[styles.bar, { height: value * 2 }]}>
                  <LinearGradient
                    colors={['#1473FF', '#BE01FF']}
                    style={styles.barGradient}
                  />
                </View>
                <Text style={styles.barLabel}>
                  {['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Subscription Distribution</Text>
          <View style={styles.pieStats}>
            {[
              { tier: 'Starter', count: 892, color: '#6B7280', percent: 48 },
              { tier: 'Professional', count: 612, color: '#1473FF', percent: 33 },
              { tier: 'Business', count: 343, color: '#8B5CF6', percent: 19 },
            ].map((tier) => (
              <View key={tier.tier} style={styles.pieStat}>
                <View style={[styles.pieIndicator, { backgroundColor: tier.color }]} />
                <View style={styles.pieInfo}>
                  <Text style={styles.pieTier}>{tier.tier}</Text>
                  <Text style={styles.pieCount}>{tier.count} users ({tier.percent}%)</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Quick Stats Row */}
      <View style={styles.quickStatsRow}>
        <View style={styles.quickStat}>
          <Ionicons name="document-text" size={24} color="#1473FF" />
          <Text style={styles.quickStatValue}>{formatNumber(MOCK_METRICS.total_paystubs_generated)}</Text>
          <Text style={styles.quickStatLabel}>Paystubs Generated</Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStat}>
          <Ionicons name="business" size={24} color="#10B981" />
          <Text style={styles.quickStatValue}>{formatNumber(MOCK_METRICS.total_companies)}</Text>
          <Text style={styles.quickStatLabel}>Companies</Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStat}>
          <Ionicons name="cash" size={24} color="#8B5CF6" />
          <Text style={styles.quickStatValue}>{formatCurrency(MOCK_METRICS.total_payroll_processed)}</Text>
          <Text style={styles.quickStatLabel}>Payroll Processed</Text>
        </View>
      </View>
    </View>
  );

  const renderUsers = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>User Management</Text>
        <View style={styles.sectionActions}>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="filter" size={18} color="#666" />
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportBtn}>
            <Ionicons name="download-outline" size={18} color="#1473FF" />
            <Text style={styles.exportText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.usersList}>
        {MOCK_USERS.map((user) => (
          <TouchableOpacity key={user.id} style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.userMeta}>
                <View style={[styles.tierBadge, { 
                  backgroundColor: user.tier === 'Business' ? '#8B5CF620' : 
                                   user.tier === 'Professional' ? '#1473FF20' : '#6B728020' 
                }]}>
                  <Text style={[styles.tierText, { 
                    color: user.tier === 'Business' ? '#8B5CF6' : 
                           user.tier === 'Professional' ? '#1473FF' : '#6B7280' 
                  }]}>{user.tier}</Text>
                </View>
                <Text style={styles.userStats}>{user.paystubs} paystubs</Text>
              </View>
            </View>
            <View style={styles.userActions}>
              <View style={[styles.statusDot, { 
                backgroundColor: user.status === 'active' ? '#10B981' : '#EF4444' 
              }]} />
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAPIManagement = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Tax Engine API Clients</Text>
          <Text style={styles.sectionSubtitle}>Enterprise API usage tracking</Text>
        </View>
        <TouchableOpacity style={styles.addClientBtn}>
          <LinearGradient
            colors={['#1473FF', '#BE01FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addClientGradient}
          >
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.addClientText}>Add Client</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* API Revenue Summary */}
      <View style={styles.apiRevenueCard}>
        <View style={styles.apiRevenueItem}>
          <Text style={styles.apiRevenueLabel}>Total API Revenue (YTD)</Text>
          <Text style={styles.apiRevenueValue}>{formatCurrency(384000)}</Text>
        </View>
        <View style={styles.apiRevenueDivider} />
        <View style={styles.apiRevenueItem}>
          <Text style={styles.apiRevenueLabel}>Requests Today</Text>
          <Text style={styles.apiRevenueValue}>{formatNumber(151690)}</Text>
        </View>
        <View style={styles.apiRevenueDivider} />
        <View style={styles.apiRevenueItem}>
          <Text style={styles.apiRevenueLabel}>Avg Response Time</Text>
          <Text style={styles.apiRevenueValue}>3.2ms</Text>
        </View>
      </View>

      {/* API Clients List */}
      <View style={styles.apiClientsList}>
        {MOCK_API_CLIENTS.map((client) => (
          <TouchableOpacity key={client.id} style={styles.apiClientCard}>
            <View style={styles.apiClientHeader}>
              <View style={styles.apiClientInfo}>
                <Text style={styles.apiClientName}>{client.name}</Text>
                <View style={[styles.tierBadge, { 
                  backgroundColor: client.tier === 'Ultimate' ? '#10B98120' : 
                                   client.tier === 'Enterprise' ? '#8B5CF620' : 
                                   client.tier === 'Professional' ? '#1473FF20' : '#6B728020' 
                }]}>
                  <Text style={[styles.tierText, { 
                    color: client.tier === 'Ultimate' ? '#10B981' : 
                           client.tier === 'Enterprise' ? '#8B5CF6' : 
                           client.tier === 'Professional' ? '#1473FF' : '#6B7280' 
                  }]}>{client.tier}</Text>
                </View>
              </View>
              <Text style={styles.apiClientRevenue}>{formatCurrency(client.annual_revenue)}/yr</Text>
            </View>

            <View style={styles.apiUsageContainer}>
              <View style={styles.apiUsageHeader}>
                <Text style={styles.apiUsageLabel}>Today's Usage</Text>
                <Text style={styles.apiUsageValue}>
                  {formatNumber(client.requests_today)} / {client.daily_limit === -1 ? 'Unlimited' : formatNumber(client.daily_limit)}
                </Text>
              </View>
              <View style={styles.usageBar}>
                <View style={[
                  styles.usageFill, 
                  { 
                    width: client.daily_limit === -1 ? '30%' : `${Math.min((client.requests_today / client.daily_limit) * 100, 100)}%`,
                    backgroundColor: client.status === 'over_limit' ? '#EF4444' : '#1473FF'
                  }
                ]} />
              </View>
            </View>

            {/* Overage Info */}
            {client.overage_requests > 0 && (
              <View style={styles.overageInfo}>
                <Ionicons name="warning" size={16} color="#F59E0B" />
                <Text style={styles.overageText}>
                  {formatNumber(client.overage_requests)} overage requests • {formatCurrency(client.overage_cost)} billed
                </Text>
              </View>
            )}

            <View style={styles.apiClientFooter}>
              <View style={[styles.statusBadge, { 
                backgroundColor: client.status === 'active' ? '#10B98120' : '#EF444420' 
              }]}>
                <View style={[styles.statusDotSmall, { 
                  backgroundColor: client.status === 'active' ? '#10B981' : '#EF4444' 
                }]} />
                <Text style={[styles.statusText, { 
                  color: client.status === 'active' ? '#10B981' : '#EF4444' 
                }]}>
                  {client.status === 'active' ? 'Active' : 'Over Limit'}
                </Text>
              </View>
              <View style={styles.stripeInfo}>
                <Ionicons name="card" size={12} color="#6B7280" />
                <Text style={styles.stripeIdText}>Stripe: {client.stripe_subscription_id.slice(0, 12)}...</Text>
              </View>
              <TouchableOpacity style={styles.viewDetailsBtn}>
                <Text style={styles.viewDetailsText}>Manage</Text>
                <Ionicons name="arrow-forward" size={14} color="#1473FF" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSystem = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>System Health</Text>

      <View style={styles.healthGrid}>
        {[
          { name: 'API Server', status: 'operational', uptime: '99.99%', icon: 'server' },
          { name: 'Database', status: 'operational', uptime: '99.97%', icon: 'grid' },
          { name: 'Payment Processor', status: 'operational', uptime: '100%', icon: 'card' },
          { name: 'Email Service', status: 'operational', uptime: '99.95%', icon: 'mail' },
        ].map((service, index) => (
          <View key={index} style={styles.healthCard}>
            <View style={styles.healthIcon}>
              <Ionicons name={service.icon as any} size={24} color="#10B981" />
            </View>
            <Text style={styles.healthName}>{service.name}</Text>
            <View style={styles.healthStatus}>
              <View style={styles.healthDot} />
              <Text style={styles.healthStatusText}>Operational</Text>
            </View>
            <Text style={styles.healthUptime}>{service.uptime} uptime</Text>
          </View>
        ))}
      </View>

      <View style={styles.recentErrors}>
        <Text style={styles.subsectionTitle}>Recent Errors</Text>
        <View style={styles.noErrors}>
          <Ionicons name="checkmark-circle" size={48} color="#10B981" />
          <Text style={styles.noErrorsText}>No critical errors in the last 24 hours</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Admin Portal</Text>
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#10B981" />
              <Text style={styles.adminBadgeText}>Owner Access</Text>
            </View>
          </View>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
          {[
            { key: 'overview', label: 'Overview', icon: 'analytics' },
            { key: 'users', label: 'Users', icon: 'people' },
            { key: 'subscriptions', label: 'Revenue', icon: 'cash' },
            { key: 'api', label: 'Tax Engine API', icon: 'code-slash' },
            { key: 'system', label: 'System', icon: 'server' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key as TabType)}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={activeTab === tab.key ? '#FFF' : 'rgba(255,255,255,0.5)'}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'api' && renderAPIManagement()}
        {activeTab === 'system' && renderSystem()}
        {activeTab === 'subscriptions' && renderOverview()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '500',
  },
  tabBar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tabText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  heroCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  heroValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  heroLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  metricTitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  chartsSection: {
    gap: 16,
    marginBottom: 16,
  },
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 24,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barGradient: {
    flex: 1,
  },
  barLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 6,
  },
  pieStats: {
    gap: 12,
  },
  pieStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pieIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  pieInfo: {},
  pieTier: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  pieCount: {
    fontSize: 12,
    color: '#666',
  },
  quickStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  quickStatLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  sectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFF',
    gap: 4,
  },
  filterText: {
    fontSize: 13,
    color: '#666',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EBF5FF',
    gap: 4,
  },
  exportText: {
    fontSize: 13,
    color: '#1473FF',
    fontWeight: '500',
  },
  usersList: {
    gap: 10,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1473FF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '600',
  },
  userStats: {
    fontSize: 12,
    color: '#999',
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  addClientBtn: {},
  addClientGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  addClientText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  apiRevenueCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  apiRevenueItem: {
    flex: 1,
    alignItems: 'center',
  },
  apiRevenueDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
  apiRevenueLabel: {
    fontSize: 12,
    color: '#666',
  },
  apiRevenueValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  apiClientsList: {
    gap: 12,
  },
  apiClientCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  apiClientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  apiClientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  apiClientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  apiClientRevenue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  apiUsageContainer: {
    marginBottom: 12,
  },
  apiUsageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  apiUsageLabel: {
    fontSize: 13,
    color: '#666',
  },
  apiUsageValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  usageBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  usageFill: {
    height: '100%',
    borderRadius: 4,
  },
  apiClientFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 13,
    color: '#1473FF',
    fontWeight: '500',
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  healthCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  healthIcon: {
    marginBottom: 12,
  },
  healthName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  healthStatusText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
  },
  healthUptime: {
    fontSize: 12,
    color: '#666',
  },
  recentErrors: {
    marginTop: 8,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  noErrors: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  noErrorsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  overageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    gap: 8,
  },
  overageText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  stripeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stripeIdText: {
    fontSize: 11,
    color: '#6B7280',
  },
});
