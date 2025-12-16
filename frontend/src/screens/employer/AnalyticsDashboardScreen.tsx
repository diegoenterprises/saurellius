/**
 * EMPLOYER ANALYTICS DASHBOARD SCREEN
 * Comprehensive payroll and workforce analytics
 * Charts, trends, and KPI tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

interface PayrollTrend {
  month: string;
  gross_pay: number;
  net_pay: number;
  taxes: number;
  headcount: number;
}

interface DepartmentCost {
  name: string;
  cost: number;
  headcount: number;
  percentage: number;
}

interface Analytics {
  summary: {
    total_employees: number;
    total_contractors: number;
    avg_salary: number;
    total_payroll_ytd: number;
    total_taxes_ytd: number;
    turnover_rate: number;
  };
  trends: PayrollTrend[];
  department_costs: DepartmentCost[];
  top_earners: { name: string; amount: number; department: string }[];
  overtime_hours: number;
  benefits_cost: number;
}

type TimeRange = 'month' | 'quarter' | 'year';

export default function AnalyticsDashboardScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('quarter');

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await api.get('/api/employer/analytics', { params: { range: timeRange } });
      setAnalytics(response.data.analytics || null);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);
  const onRefresh = () => { setRefreshing(true); fetchAnalytics(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const getMaxTrend = () => {
    if (!analytics?.trends.length) return 1;
    return Math.max(...analytics.trends.map(t => t.gross_pay));
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
          <TouchableOpacity><Ionicons name="download-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>

        <View style={styles.timeRangeSelector}>
          {(['month', 'quarter', 'year'] as TimeRange[]).map(range => (
            <TouchableOpacity key={range} style={[styles.rangeButton, timeRange === range && styles.rangeButtonActive]} onPress={() => { setTimeRange(range); setLoading(true); }}>
              <Text style={[styles.rangeText, timeRange === range && styles.rangeTextActive]}>{range === 'month' ? 'Month' : range === 'quarter' ? 'Quarter' : 'Year'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        {analytics && (
          <>
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIcon, { backgroundColor: '#3B82F620' }]}><Ionicons name="people" size={20} color="#3B82F6" /></View>
                <Text style={styles.kpiValue}>{analytics.summary.total_employees}</Text>
                <Text style={styles.kpiLabel}>Employees</Text>
              </View>
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIcon, { backgroundColor: '#8B5CF620' }]}><Ionicons name="construct" size={20} color="#8B5CF6" /></View>
                <Text style={styles.kpiValue}>{analytics.summary.total_contractors}</Text>
                <Text style={styles.kpiLabel}>Contractors</Text>
              </View>
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIcon, { backgroundColor: '#10B98120' }]}><Ionicons name="cash" size={20} color="#10B981" /></View>
                <Text style={styles.kpiValue}>{formatCurrency(analytics.summary.avg_salary)}</Text>
                <Text style={styles.kpiLabel}>Avg Salary</Text>
              </View>
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIcon, { backgroundColor: '#F59E0B20' }]}><Ionicons name="trending-down" size={20} color="#F59E0B" /></View>
                <Text style={styles.kpiValue}>{formatPercent(analytics.summary.turnover_rate)}</Text>
                <Text style={styles.kpiLabel}>Turnover</Text>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>YTD Summary</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Payroll</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(analytics.summary.total_payroll_ytd)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Taxes</Text>
                  <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{formatCurrency(analytics.summary.total_taxes_ytd)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Benefits</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(analytics.benefits_cost)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.cardTitle}>Payroll Trend</Text>
              <View style={styles.chart}>
                {analytics.trends.map((trend, index) => (
                  <View key={index} style={styles.chartBar}>
                    <View style={[styles.bar, { height: `${(trend.gross_pay / getMaxTrend()) * 100}%` }]}>
                      <LinearGradient colors={['#1473FF', '#BE01FF']} style={styles.barGradient} />
                    </View>
                    <Text style={styles.barLabel}>{trend.month.substring(0, 3)}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#1473FF' }]} /><Text style={styles.legendText}>Gross Pay</Text></View>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.cardTitle}>Cost by Department</Text>
              {analytics.department_costs.map((dept, index) => (
                <View key={index} style={styles.deptRow}>
                  <View style={styles.deptInfo}>
                    <Text style={styles.deptName}>{dept.name}</Text>
                    <Text style={styles.deptMeta}>{dept.headcount} employees</Text>
                  </View>
                  <View style={styles.deptCost}>
                    <Text style={styles.deptAmount}>{formatCurrency(dept.cost)}</Text>
                    <Text style={styles.deptPercent}>{formatPercent(dept.percentage)}</Text>
                  </View>
                  <View style={styles.deptBar}>
                    <View style={[styles.deptBarFill, { width: `${dept.percentage}%` }]} />
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.cardTitle}>Top Earners</Text>
              {analytics.top_earners.map((earner, index) => (
                <View key={index} style={styles.earnerRow}>
                  <View style={styles.earnerRank}><Text style={styles.rankText}>{index + 1}</Text></View>
                  <View style={styles.earnerInfo}>
                    <Text style={styles.earnerName}>{earner.name}</Text>
                    <Text style={styles.earnerDept}>{earner.department}</Text>
                  </View>
                  <Text style={styles.earnerAmount}>{formatCurrency(earner.amount)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Ionicons name="time" size={24} color="#F59E0B" />
                <Text style={styles.metricValue}>{analytics.overtime_hours}h</Text>
                <Text style={styles.metricLabel}>Overtime</Text>
              </View>
              <View style={styles.metricCard}>
                <Ionicons name="heart" size={24} color="#EC4899" />
                <Text style={styles.metricValue}>{formatCurrency(analytics.benefits_cost)}</Text>
                <Text style={styles.metricLabel}>Benefits Cost</Text>
              </View>
            </View>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingBottom: 16 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  timeRangeSelector: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 4 },
  rangeButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  rangeButtonActive: { backgroundColor: '#1473FF' },
  rangeText: { fontSize: 14, color: '#a0a0a0', fontWeight: '500' },
  rangeTextActive: { color: colors.text },
  content: { flex: 1 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  kpiCard: { width: (width - 40) / 2, backgroundColor: colors.card, borderRadius: 12, padding: 14, alignItems: 'center' },
  kpiIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  kpiValue: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  kpiLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  summaryCard: { backgroundColor: colors.card, marginHorizontal: 16, borderRadius: 14, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16 },
  summaryRow: { flexDirection: 'row' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: '#2a2a4e', marginHorizontal: 10 },
  summaryLabel: { fontSize: 12, color: '#666' },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 4 },
  chartCard: { backgroundColor: colors.card, marginHorizontal: 16, borderRadius: 14, padding: 16, marginBottom: 12 },
  chart: { flexDirection: 'row', height: 120, alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 },
  chartBar: { flex: 1, alignItems: 'center', marginHorizontal: 4 },
  bar: { width: '100%', borderRadius: 4, overflow: 'hidden', minHeight: 4 },
  barGradient: { flex: 1 },
  barLabel: { fontSize: 10, color: '#666', marginTop: 6 },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#a0a0a0' },
  sectionCard: { backgroundColor: colors.card, marginHorizontal: 16, borderRadius: 14, padding: 16, marginBottom: 12 },
  deptRow: { marginBottom: 14 },
  deptInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deptName: { fontSize: 14, fontWeight: '500', color: colors.text },
  deptMeta: { fontSize: 11, color: '#666' },
  deptCost: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  deptAmount: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  deptPercent: { fontSize: 12, color: '#a0a0a0' },
  deptBar: { height: 6, backgroundColor: '#2a2a4e', borderRadius: 3, marginTop: 6 },
  deptBarFill: { height: '100%', backgroundColor: '#1473FF', borderRadius: 3 },
  earnerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  earnerRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1473FF20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rankText: { fontSize: 12, fontWeight: 'bold', color: '#1473FF' },
  earnerInfo: { flex: 1 },
  earnerName: { fontSize: 14, fontWeight: '500', color: colors.text },
  earnerDept: { fontSize: 11, color: '#666', marginTop: 2 },
  earnerAmount: { fontSize: 15, fontWeight: '600', color: '#10B981' },
  metricsRow: { flexDirection: 'row', marginHorizontal: 16, gap: 12, marginBottom: 12 },
  metricCard: { flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 16, alignItems: 'center' },
  metricValue: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: 8 },
  metricLabel: { fontSize: 12, color: '#666', marginTop: 4 },
});
