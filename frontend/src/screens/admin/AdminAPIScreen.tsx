/**
 * ADMIN API MANAGEMENT SCREEN
 * Tax Engine API analytics, partner management, rate limits
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

const { width } = Dimensions.get('window');

export default function AdminAPIScreen() {
  const navigation = useNavigation<any>();
  const { colors, gradients } = useTheme();
  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await adminDashboardService.getAPIOverview();
      if (response.success) setApiData(response.data);
    } catch (error) {
      console.error('Error fetching API data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

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
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>API Management</Text>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}>
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.metricValue, { color: colors.text }]}>{formatNumber(apiData?.monthly_requests || 2400000)}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Monthly Requests</Text>
            <Text style={styles.metricChange}>+22.1% ↑</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.metricValue, { color: colors.text }]}>{apiData?.total_partners || 347}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>API Partners</Text>
            <Text style={styles.metricChange}>+18 new</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.metricValue, { color: colors.text }]}>{apiData?.avg_response_time || 187}ms</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Avg Response</Text>
            <Text style={[styles.metricChange, { color: '#22C55E' }]}>↓ 15ms</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.metricValue, { color: colors.text }]}>{apiData?.error_rate || 0.02}%</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Error Rate</Text>
            <Text style={[styles.metricChange, { color: '#22C55E' }]}>↓ 0.01%</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Endpoints</Text>
          {[
            { endpoint: '/tax/calculate/gross-to-net', requests: 1234567, pct: 51.4 },
            { endpoint: '/geocoding/address-to-codes', requests: 487234, pct: 20.3 },
            { endpoint: '/tax/rates/lookup', requests: 342123, pct: 14.2 },
            { endpoint: '/tax/calculate/gross-up', requests: 187654, pct: 7.8 },
            { endpoint: '/tax/benefits/taxability', requests: 145892, pct: 6.1 },
          ].map((item, idx) => (
            <View key={idx} style={styles.endpointRow}>
              <Text style={[styles.endpointName, { color: colors.text }]} numberOfLines={1}>{item.endpoint}</Text>
              <Text style={[styles.endpointCount, { color: colors.textSecondary }]}>{formatNumber(item.requests)}</Text>
              <View style={styles.endpointBarContainer}>
                <View style={[styles.endpointBar, { width: `${item.pct}%` }]} />
              </View>
              <Text style={[styles.endpointPct, { color: colors.textSecondary }]}>{item.pct}%</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>API Revenue</Text>
          <View style={styles.revenueRow}>
            <View style={styles.revenueItem}>
              <Text style={[styles.revenueValue, { color: '#22C55E' }]}>$78,450</Text>
              <Text style={[styles.revenueLabel, { color: colors.textSecondary }]}>Monthly</Text>
            </View>
            <View style={styles.revenueItem}>
              <Text style={[styles.revenueValue, { color: colors.text }]}>$941,400</Text>
              <Text style={[styles.revenueLabel, { color: colors.textSecondary }]}>Annual</Text>
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
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  content: { flex: 1, padding: 16 },
  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  metricCard: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1 },
  metricValue: { fontSize: 24, fontWeight: '700' },
  metricLabel: { fontSize: 14, marginTop: 4 },
  metricChange: { fontSize: 12, color: '#22C55E', marginTop: 4 },
  section: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  endpointRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  endpointName: { width: 140, fontSize: 12 },
  endpointCount: { width: 60, fontSize: 12, textAlign: 'right' },
  endpointBarContainer: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, marginHorizontal: 8 },
  endpointBar: { height: 6, backgroundColor: '#3B82F6', borderRadius: 3 },
  endpointPct: { width: 40, fontSize: 12, textAlign: 'right' },
  revenueRow: { flexDirection: 'row', justifyContent: 'space-around' },
  revenueItem: { alignItems: 'center' },
  revenueValue: { fontSize: 28, fontWeight: '700' },
  revenueLabel: { fontSize: 14, marginTop: 4 },
});
