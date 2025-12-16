/**
 * EMPLOYER WORKFORCE ANALYTICS SCREEN
 * Advanced workforce metrics and insights
 * Headcount, turnover, demographics, trends
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

interface WorkforceMetrics {
  total_headcount: number;
  active_employees: number;
  contractors: number;
  new_hires_ytd: number;
  terminations_ytd: number;
  turnover_rate: number;
  avg_tenure_years: number;
  open_positions: number;
}

interface DepartmentBreakdown {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface TrendData {
  month: string;
  headcount: number;
  hires: number;
  departures: number;
}

interface DemographicData {
  category: string;
  segments: { label: string; value: number; color: string }[];
}

export default function WorkforceAnalyticsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<WorkforceMetrics | null>(null);
  const [departments, setDepartments] = useState<DepartmentBreakdown[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [demographics, setDemographics] = useState<DemographicData[]>([]);
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('quarter');

  const fetchData = useCallback(async () => {
    try {
      const [metricsRes, deptRes, trendsRes, demoRes] = await Promise.all([
        api.get('/api/employer/workforce-analytics/metrics', { params: { range: timeRange } }),
        api.get('/api/employer/workforce-analytics/departments'),
        api.get('/api/employer/workforce-analytics/trends', { params: { range: timeRange } }),
        api.get('/api/employer/workforce-analytics/demographics'),
      ]);
      setMetrics(metricsRes.data.metrics || null);
      setDepartments(deptRes.data.departments || []);
      setTrends(trendsRes.data.trends || []);
      setDemographics(demoRes.data.demographics || []);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const renderMetricCard = (icon: string, label: string, value: string | number, color: string, trend?: number) => (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {trend !== undefined && (
        <View style={[styles.trendBadge, { backgroundColor: trend >= 0 ? '#10B98120' : '#EF444420' }]}>
          <Ionicons name={trend >= 0 ? 'trending-up' : 'trending-down'} size={12} color={trend >= 0 ? '#10B981' : '#EF4444'} />
          <Text style={[styles.trendText, { color: trend >= 0 ? '#10B981' : '#EF4444' }]}>{Math.abs(trend)}%</Text>
        </View>
      )}
    </View>
  );

  const renderDepartmentBar = (dept: DepartmentBreakdown) => (
    <View key={dept.name} style={styles.deptRow}>
      <View style={styles.deptInfo}>
        <Text style={styles.deptName}>{dept.name}</Text>
        <Text style={styles.deptCount}>{dept.count}</Text>
      </View>
      <View style={styles.deptBarContainer}>
        <View style={[styles.deptBar, { width: `${dept.percentage}%`, backgroundColor: dept.color }]} />
      </View>
      <Text style={styles.deptPercent}>{dept.percentage}%</Text>
    </View>
  );

  const renderTrendChart = () => {
    const maxHeadcount = Math.max(...trends.map(t => t.headcount), 1);
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartBars}>
          {trends.map((t, i) => (
            <View key={i} style={styles.chartColumn}>
              <View style={[styles.chartBar, { height: `${(t.headcount / maxHeadcount) * 100}%` }]} />
              <Text style={styles.chartLabel}>{t.month}</Text>
            </View>
          ))}
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#1473FF' }]} /><Text style={styles.legendText}>Headcount</Text></View>
        </View>
      </View>
    );
  };

  const renderDemographicSection = (demo: DemographicData) => (
    <View key={demo.category} style={styles.demoSection}>
      <Text style={styles.demoTitle}>{demo.category}</Text>
      <View style={styles.demoBar}>
        {demo.segments.map((seg, i) => (
          <View key={i} style={[styles.demoSegment, { flex: seg.value, backgroundColor: seg.color }]} />
        ))}
      </View>
      <View style={styles.demoLegend}>
        {demo.segments.map((seg, i) => (
          <View key={i} style={styles.demoLegendItem}>
            <View style={[styles.demoLegendDot, { backgroundColor: seg.color }]} />
            <Text style={styles.demoLegendText}>{seg.label}</Text>
            <Text style={styles.demoLegendValue}>{seg.value}%</Text>
          </View>
        ))}
      </View>
    </View>
  );

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Workforce Analytics</Text>
          <TouchableOpacity><Ionicons name="download-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        <View style={styles.timeFilter}>
          {(['month', 'quarter', 'year'] as const).map(range => (
            <TouchableOpacity key={range} style={[styles.timeOption, timeRange === range && styles.timeOptionActive]} onPress={() => { setTimeRange(range); setLoading(true); }}>
              <Text style={[styles.timeOptionText, timeRange === range && styles.timeOptionTextActive]}>{range.charAt(0).toUpperCase() + range.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        {metrics && (
          <>
            <View style={styles.metricsGrid}>
              {renderMetricCard('people', 'Headcount', metrics.total_headcount, '#1473FF')}
              {renderMetricCard('person-add', 'New Hires', metrics.new_hires_ytd, '#10B981', 12)}
              {renderMetricCard('exit', 'Departures', metrics.terminations_ytd, '#EF4444', -5)}
              {renderMetricCard('trending-down', 'Turnover', `${metrics.turnover_rate}%`, '#F59E0B')}
            </View>
            <View style={styles.metricsGrid}>
              {renderMetricCard('business', 'Contractors', metrics.contractors, '#8B5CF6')}
              {renderMetricCard('time', 'Avg Tenure', `${metrics.avg_tenure_years}y`, '#6366F1')}
              {renderMetricCard('briefcase', 'Open Roles', metrics.open_positions, '#EC4899')}
              {renderMetricCard('checkmark-circle', 'Active', metrics.active_employees, '#10B981')}
            </View>
          </>
        )}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Headcount Trend</Text>
          {trends.length > 0 ? renderTrendChart() : <Text style={styles.noData}>No trend data</Text>}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>By Department</Text>
          {departments.length > 0 ? departments.map(renderDepartmentBar) : <Text style={styles.noData}>No department data</Text>}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Demographics</Text>
          {demographics.length > 0 ? demographics.map(renderDemographicSection) : <Text style={styles.noData}>No demographic data</Text>}
        </View>

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
  timeFilter: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 4 },
  timeOption: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  timeOptionActive: { backgroundColor: '#1473FF' },
  timeOptionText: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  timeOptionTextActive: { color: colors.text, fontWeight: '600' },
  content: { flex: 1 },
  metricsGrid: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 12 },
  metricCard: { flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12, marginHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a4e' },
  metricIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  metricValue: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  metricLabel: { fontSize: 10, color: '#666', marginTop: 2 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4, gap: 2 },
  trendText: { fontSize: 10, fontWeight: '600' },
  sectionCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginHorizontal: 16, marginTop: 16, borderWidth: 1, borderColor: '#2a2a4e' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 14 },
  chartContainer: {},
  chartBars: { flexDirection: 'row', height: 120, alignItems: 'flex-end', justifyContent: 'space-around' },
  chartColumn: { flex: 1, alignItems: 'center', marginHorizontal: 4 },
  chartBar: { width: '80%', backgroundColor: '#1473FF', borderRadius: 4, minHeight: 4 },
  chartLabel: { fontSize: 10, color: '#666', marginTop: 6 },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#666' },
  deptRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  deptInfo: { width: 100 },
  deptName: { fontSize: 13, color: colors.text },
  deptCount: { fontSize: 11, color: '#666' },
  deptBarContainer: { flex: 1, height: 8, backgroundColor: '#2a2a4e', borderRadius: 4, marginHorizontal: 10 },
  deptBar: { height: '100%', borderRadius: 4 },
  deptPercent: { width: 40, fontSize: 12, color: '#a0a0a0', textAlign: 'right' },
  demoSection: { marginBottom: 16 },
  demoTitle: { fontSize: 13, color: '#a0a0a0', marginBottom: 8 },
  demoBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden' },
  demoSegment: { height: '100%' },
  demoLegend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 12 },
  demoLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  demoLegendDot: { width: 8, height: 8, borderRadius: 4 },
  demoLegendText: { fontSize: 11, color: '#666' },
  demoLegendValue: { fontSize: 11, fontWeight: '600', color: '#a0a0a0' },
  noData: { fontSize: 13, color: '#666', textAlign: 'center', paddingVertical: 20 },
});
