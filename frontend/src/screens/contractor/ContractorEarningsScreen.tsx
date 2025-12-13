/**
 * CONTRACTOR EARNINGS ANALYTICS SCREEN
 * Track earnings, trends, and financial metrics
 * Charts, comparisons, and projections
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

const { width } = Dimensions.get('window');

interface EarningsTrend {
  month: string;
  earnings: number;
  hours: number;
  projects: number;
}

interface ClientEarnings {
  client_name: string;
  amount: number;
  percentage: number;
  projects: number;
}

interface EarningsData {
  summary: {
    ytd_earnings: number;
    ytd_expenses: number;
    net_income: number;
    avg_hourly_rate: number;
    total_hours: number;
    active_clients: number;
  };
  trends: EarningsTrend[];
  by_client: ClientEarnings[];
  by_type: { type: string; amount: number; percentage: number }[];
  projections: {
    monthly_avg: number;
    projected_annual: number;
    best_month: { month: string; amount: number };
  };
  taxes: {
    estimated_quarterly: number;
    ytd_withheld: number;
    next_due_date: string;
  };
}

type TimeRange = '3m' | '6m' | 'ytd' | '1y';

export default function ContractorEarningsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<EarningsData | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('ytd');

  const fetchData = useCallback(async () => {
    try {
      const response = await api.get('/api/contractor/earnings/analytics', { params: { range: timeRange } });
      setData(response.data.analytics || null);
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getMaxEarnings = () => {
    if (!data?.trends.length) return 1;
    return Math.max(...data.trends.map(t => t.earnings));
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Earnings</Text>
          <TouchableOpacity><Ionicons name="download-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>

        {data && (
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Net Income (YTD)</Text>
            <Text style={styles.heroValue}>{formatCurrency(data.summary.net_income)}</Text>
            <View style={styles.heroMeta}>
              <View style={styles.heroMetaItem}>
                <Text style={styles.heroMetaValue}>{formatCurrency(data.summary.ytd_earnings)}</Text>
                <Text style={styles.heroMetaLabel}>Gross</Text>
              </View>
              <View style={styles.heroMetaDivider} />
              <View style={styles.heroMetaItem}>
                <Text style={[styles.heroMetaValue, { color: '#EF4444' }]}>{formatCurrency(data.summary.ytd_expenses)}</Text>
                <Text style={styles.heroMetaLabel}>Expenses</Text>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.rangeSelector}>
        {(['3m', '6m', 'ytd', '1y'] as TimeRange[]).map(range => (
          <TouchableOpacity key={range} style={[styles.rangeButton, timeRange === range && styles.rangeButtonActive]} onPress={() => { setTimeRange(range); setLoading(true); }}>
            <Text style={[styles.rangeText, timeRange === range && styles.rangeTextActive]}>{range.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        {data && (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="cash" size={20} color="#10B981" />
                <Text style={styles.statValue}>${data.summary.avg_hourly_rate}/hr</Text>
                <Text style={styles.statLabel}>Avg Rate</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="time" size={20} color="#3B82F6" />
                <Text style={styles.statValue}>{data.summary.total_hours}h</Text>
                <Text style={styles.statLabel}>Hours</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="people" size={20} color="#8B5CF6" />
                <Text style={styles.statValue}>{data.summary.active_clients}</Text>
                <Text style={styles.statLabel}>Clients</Text>
              </View>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.cardTitle}>Earnings Trend</Text>
              <View style={styles.chart}>
                {data.trends.map((trend, index) => (
                  <View key={index} style={styles.chartBar}>
                    <View style={[styles.bar, { height: `${(trend.earnings / getMaxEarnings()) * 100}%` }]}>
                      <LinearGradient colors={['#10B981', '#059669']} style={styles.barGradient} />
                    </View>
                    <Text style={styles.barLabel}>{trend.month.substring(0, 3)}</Text>
                    <Text style={styles.barValue}>{formatCurrency(trend.earnings)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.cardTitle}>Earnings by Client</Text>
              {data.by_client.map((client, index) => (
                <View key={index} style={styles.clientRow}>
                  <View style={styles.clientInfo}>
                    <View style={styles.clientAvatar}><Text style={styles.clientInitial}>{client.client_name[0]}</Text></View>
                    <View>
                      <Text style={styles.clientName}>{client.client_name}</Text>
                      <Text style={styles.clientProjects}>{client.projects} projects</Text>
                    </View>
                  </View>
                  <View style={styles.clientAmount}>
                    <Text style={styles.amountValue}>{formatCurrency(client.amount)}</Text>
                    <Text style={styles.amountPercent}>{client.percentage.toFixed(0)}%</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.cardTitle}>Income by Type</Text>
              {data.by_type.map((type, index) => (
                <View key={index} style={styles.typeRow}>
                  <Text style={styles.typeName}>{type.type}</Text>
                  <View style={styles.typeBar}>
                    <View style={[styles.typeBarFill, { width: `${type.percentage}%` }]} />
                  </View>
                  <Text style={styles.typeAmount}>{formatCurrency(type.amount)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.projectionCard}>
              <LinearGradient colors={['#1473FF20', '#BE01FF20']} style={styles.projectionGradient}>
                <Text style={styles.projectionTitle}>Projections</Text>
                <View style={styles.projectionRow}>
                  <View style={styles.projectionItem}>
                    <Text style={styles.projectionValue}>{formatCurrency(data.projections.monthly_avg)}</Text>
                    <Text style={styles.projectionLabel}>Monthly Avg</Text>
                  </View>
                  <View style={styles.projectionItem}>
                    <Text style={[styles.projectionValue, { color: '#10B981' }]}>{formatCurrency(data.projections.projected_annual)}</Text>
                    <Text style={styles.projectionLabel}>Annual Projection</Text>
                  </View>
                </View>
                <View style={styles.bestMonth}>
                  <Ionicons name="trophy" size={16} color="#F59E0B" />
                  <Text style={styles.bestMonthText}>Best: {data.projections.best_month.month} - {formatCurrency(data.projections.best_month.amount)}</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.taxCard}>
              <View style={styles.taxHeader}>
                <Ionicons name="calculator" size={24} color="#EF4444" />
                <Text style={styles.taxTitle}>Tax Estimates</Text>
              </View>
              <View style={styles.taxRow}>
                <View style={styles.taxItem}>
                  <Text style={styles.taxValue}>{formatCurrency(data.taxes.estimated_quarterly)}</Text>
                  <Text style={styles.taxLabel}>Est. Quarterly</Text>
                </View>
                <View style={styles.taxItem}>
                  <Text style={styles.taxValue}>{formatCurrency(data.taxes.ytd_withheld)}</Text>
                  <Text style={styles.taxLabel}>YTD Set Aside</Text>
                </View>
              </View>
              <View style={styles.taxDue}>
                <Ionicons name="calendar" size={14} color="#F59E0B" />
                <Text style={styles.taxDueText}>Next payment due: {formatDate(data.taxes.next_due_date)}</Text>
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
  container: { flex: 1, backgroundColor: '#0f0f23' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingBottom: 20 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  heroCard: { alignItems: 'center', marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 20 },
  heroLabel: { fontSize: 14, color: '#a0a0a0' },
  heroValue: { fontSize: 36, fontWeight: 'bold', color: '#10B981', marginVertical: 8 },
  heroMeta: { flexDirection: 'row', marginTop: 8 },
  heroMetaItem: { alignItems: 'center', paddingHorizontal: 20 },
  heroMetaDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  heroMetaValue: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  heroMetaLabel: { fontSize: 11, color: '#a0a0a0', marginTop: 2 },
  rangeSelector: { flexDirection: 'row', marginHorizontal: 16, marginVertical: 12, backgroundColor: '#1a1a2e', borderRadius: 10, padding: 4 },
  rangeButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  rangeButtonActive: { backgroundColor: '#1473FF' },
  rangeText: { fontSize: 13, color: '#666', fontWeight: '600' },
  rangeTextActive: { color: '#FFF' },
  content: { flex: 1 },
  statsGrid: { flexDirection: 'row', marginHorizontal: 16, gap: 8 },
  statCard: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginTop: 8 },
  statLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  chartCard: { backgroundColor: '#1a1a2e', marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#FFF', marginBottom: 16 },
  chart: { flexDirection: 'row', height: 140, alignItems: 'flex-end', justifyContent: 'space-between' },
  chartBar: { flex: 1, alignItems: 'center', marginHorizontal: 2 },
  bar: { width: '80%', borderRadius: 4, overflow: 'hidden', minHeight: 4 },
  barGradient: { flex: 1 },
  barLabel: { fontSize: 10, color: '#666', marginTop: 6 },
  barValue: { fontSize: 9, color: '#a0a0a0', marginTop: 2 },
  sectionCard: { backgroundColor: '#1a1a2e', marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 16 },
  clientRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  clientInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  clientAvatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  clientInitial: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
  clientName: { fontSize: 14, fontWeight: '500', color: '#FFF' },
  clientProjects: { fontSize: 11, color: '#666', marginTop: 2 },
  clientAmount: { alignItems: 'flex-end' },
  amountValue: { fontSize: 15, fontWeight: '600', color: '#10B981' },
  amountPercent: { fontSize: 11, color: '#666', marginTop: 2 },
  typeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  typeName: { width: 80, fontSize: 13, color: '#a0a0a0' },
  typeBar: { flex: 1, height: 8, backgroundColor: '#2a2a4e', borderRadius: 4, marginHorizontal: 10 },
  typeBarFill: { height: '100%', backgroundColor: '#1473FF', borderRadius: 4 },
  typeAmount: { width: 70, fontSize: 13, fontWeight: '500', color: '#FFF', textAlign: 'right' },
  projectionCard: { marginHorizontal: 16, marginTop: 12, borderRadius: 14, overflow: 'hidden' },
  projectionGradient: { padding: 16 },
  projectionTitle: { fontSize: 16, fontWeight: '600', color: '#FFF', marginBottom: 12 },
  projectionRow: { flexDirection: 'row' },
  projectionItem: { flex: 1, alignItems: 'center' },
  projectionValue: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  projectionLabel: { fontSize: 11, color: '#a0a0a0', marginTop: 4 },
  bestMonth: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 6 },
  bestMonthText: { fontSize: 12, color: '#F59E0B' },
  taxCard: { backgroundColor: '#1a1a2e', marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 16 },
  taxHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  taxTitle: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  taxRow: { flexDirection: 'row' },
  taxItem: { flex: 1, alignItems: 'center' },
  taxValue: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  taxLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  taxDue: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 6, backgroundColor: '#F59E0B20', padding: 10, borderRadius: 8 },
  taxDueText: { fontSize: 12, color: '#F59E0B' },
});
