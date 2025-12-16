/**
 * ADMIN REVENUE & FINANCIAL ANALYTICS SCREEN
 * Comprehensive revenue tracking, subscriptions, and financial metrics
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import adminDashboardService from '../../services/adminDashboard';
import BackButton from '../../components/common/BackButton';

const { width } = Dimensions.get('window');

export default function AdminRevenueScreen() {
  const navigation = useNavigation<any>();
  const { colors, gradients } = useTheme();
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await adminDashboardService.getRevenueOverview();
      if (response.success) setRevenueData(response.data);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const MetricCard = ({ title, value, change, color, icon }: any) => (
    <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>{title}</Text>
      <View style={[styles.changeBadge, { backgroundColor: change > 0 ? '#22C55E20' : '#EF444420' }]}>
        <Ionicons name={change > 0 ? 'trending-up' : 'trending-down'} size={14} color={change > 0 ? '#22C55E' : '#EF4444'} />
        <Text style={{ color: change > 0 ? '#22C55E' : '#EF4444', fontSize: 12, fontWeight: '600' }}>
          {change > 0 ? '+' : ''}{change}%
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerRow}>
          <BackButton variant="gradient" />
          <Text style={styles.headerTitle}>Revenue Analytics</Text>
          <TouchableOpacity>
            <Ionicons name="download-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}>
        <View style={styles.metricsGrid}>
          <MetricCard title="MRR" value={formatCurrency(revenueData?.mrr || 0)} change={revenueData?.mrr_change || 0} color="#8B5CF6" icon="cash-outline" />
          <MetricCard title="ARR" value={formatCurrency(revenueData?.arr || 0)} change={revenueData?.arr_change || 0} color="#3B82F6" icon="trending-up-outline" />
          <MetricCard title="YTD Revenue" value={formatCurrency(revenueData?.ytd_revenue || 0)} change={revenueData?.ytd_change || 0} color="#22C55E" icon="wallet-outline" />
          <MetricCard title="Profit Margin" value={`${revenueData?.profit_margin || 0}%`} change={revenueData?.margin_change || 0} color="#F59E0B" icon="pie-chart-outline" />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Revenue by Plan</Text>
          <View style={styles.planRows}>
            {(revenueData?.plan_breakdown || []).map((item: any, idx: number) => (
              <View key={idx} style={styles.planRow}>
                <View style={styles.planInfo}>
                  <View style={[styles.planDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.planName, { color: colors.text }]}>{item.plan}</Text>
                </View>
                <Text style={[styles.planRevenue, { color: colors.text }]}>${item.revenue.toLocaleString()}</Text>
                <View style={styles.planBarContainer}>
                  <View style={[styles.planBar, { width: `${item.pct}%`, backgroundColor: item.color }]} />
                </View>
                <Text style={[styles.planPct, { color: colors.textSecondary }]}>{item.pct}%</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Subscription Metrics</Text>
          <View style={styles.subMetrics}>
            <View style={styles.subMetricItem}>
              <Text style={[styles.subMetricValue, { color: '#22C55E' }]}>{revenueData?.churn_rate || 0}%</Text>
              <Text style={[styles.subMetricLabel, { color: colors.textSecondary }]}>Churn Rate</Text>
            </View>
            <View style={styles.subMetricItem}>
              <Text style={[styles.subMetricValue, { color: colors.text }]}>${revenueData?.avg_ltv || 0}</Text>
              <Text style={[styles.subMetricLabel, { color: colors.textSecondary }]}>Avg LTV</Text>
            </View>
            <View style={styles.subMetricItem}>
              <Text style={[styles.subMetricValue, { color: colors.text }]}>{revenueData?.ltv_cac || '0:1'}</Text>
              <Text style={[styles.subMetricLabel, { color: colors.textSecondary }]}>LTV:CAC</Text>
            </View>
            <View style={styles.subMetricItem}>
              <Text style={[styles.subMetricValue, { color: colors.text }]}>{revenueData?.nrr || 0}%</Text>
              <Text style={[styles.subMetricLabel, { color: colors.textSecondary }]}>NRR</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingVertical: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  content: { flex: 1, padding: 16 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  metricCard: { width: (width - 44) / 2, padding: 16, borderRadius: 12, borderWidth: 1 },
  metricIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  metricValue: { fontSize: 24, fontWeight: '700' },
  metricTitle: { fontSize: 14, marginTop: 4 },
  changeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 8, alignSelf: 'flex-start' },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  planRows: { gap: 12 },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  planInfo: { flexDirection: 'row', alignItems: 'center', width: 100 },
  planDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  planName: { fontSize: 14, fontWeight: '500' },
  planRevenue: { fontSize: 14, fontWeight: '600', width: 80, textAlign: 'right' },
  planBarContainer: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginHorizontal: 12 },
  planBar: { height: 8, borderRadius: 4 },
  planPct: { fontSize: 12, width: 40, textAlign: 'right' },
  subMetrics: { flexDirection: 'row', justifyContent: 'space-between' },
  subMetricItem: { alignItems: 'center' },
  subMetricValue: { fontSize: 20, fontWeight: '700' },
  subMetricLabel: { fontSize: 12, marginTop: 4 },
});
