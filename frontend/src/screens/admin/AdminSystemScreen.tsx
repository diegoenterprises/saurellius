/**
 * ADMIN SYSTEM MONITORING SCREEN
 * Infrastructure health, performance metrics, error tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import adminDashboardService from '../../services/adminDashboard';

export default function AdminSystemScreen() {
  const navigation = useNavigation<any>();
  const { colors, gradients } = useTheme();
  const [loading, setLoading] = useState(true);
  const [systemData, setSystemData] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await adminDashboardService.getSystemHealth();
      if (response.success) setSystemData(response.data);
    } catch (error) {
      console.error('Error fetching system data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const StatusIndicator = ({ status }: { status: string }) => (
    <View style={[styles.statusDot, { backgroundColor: status === 'healthy' ? '#22C55E' : status === 'warning' ? '#F59E0B' : '#EF4444' }]} />
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
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>System Health</Text>
          <TouchableOpacity>
            <Ionicons name="refresh" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}>
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.metricValue, { color: '#22C55E' }]}>{systemData?.api_uptime || 99.98}%</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>API Uptime</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.metricValue, { color: colors.text }]}>{systemData?.response_time || 187}ms</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Response Time</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.metricValue, { color: '#22C55E' }]}>{systemData?.error_rate || 0.02}%</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Error Rate</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.metricValue, { color: colors.text }]}>{systemData?.queue_depth || 12}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Queue Depth</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Infrastructure Status</Text>
          {[
            { name: 'Web Servers (5)', status: 'healthy', detail: 'All operational' },
            { name: 'API Servers (8)', status: 'healthy', detail: 'All operational' },
            { name: 'Database Primary', status: 'healthy', detail: 'Online (42% load)' },
            { name: 'Database Replica', status: 'healthy', detail: 'Online, in sync' },
            { name: 'Redis Cache', status: 'healthy', detail: '1.2GB / 4GB' },
            { name: 'Job Queue', status: 'healthy', detail: '12 jobs pending' },
            { name: 'Storage (S3)', status: 'warning', detail: '87TB / 100TB (87%)' },
          ].map((item, idx) => (
            <View key={idx} style={styles.statusRow}>
              <StatusIndicator status={item.status} />
              <Text style={[styles.statusName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.statusDetail, { color: colors.textSecondary }]}>{item.detail}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Database Metrics</Text>
          <View style={styles.dbMetrics}>
            <View style={styles.dbMetricItem}>
              <Text style={[styles.dbMetricValue, { color: colors.text }]}>42/100</Text>
              <Text style={[styles.dbMetricLabel, { color: colors.textSecondary }]}>Connections</Text>
            </View>
            <View style={styles.dbMetricItem}>
              <Text style={[styles.dbMetricValue, { color: colors.text }]}>1,247</Text>
              <Text style={[styles.dbMetricLabel, { color: colors.textSecondary }]}>QPS</Text>
            </View>
            <View style={styles.dbMetricItem}>
              <Text style={[styles.dbMetricValue, { color: colors.text }]}>94.7%</Text>
              <Text style={[styles.dbMetricLabel, { color: colors.textSecondary }]}>Cache Hit</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Deployments</Text>
          {[
            { version: 'v2.4.1', date: 'Dec 10 2024', status: 'success', changes: 'Tax rate updates' },
            { version: 'v2.4.0', date: 'Dec 1 2024', status: 'success', changes: 'Benefits enhancement' },
            { version: 'v2.3.9', date: 'Nov 20 2024', status: 'success', changes: 'Performance fixes' },
          ].map((item, idx) => (
            <View key={idx} style={styles.deployRow}>
              <View style={[styles.deployBadge, { backgroundColor: item.status === 'success' ? '#22C55E' : '#EF4444' }]}>
                <Text style={styles.deployVersion}>{item.version}</Text>
              </View>
              <View style={styles.deployInfo}>
                <Text style={[styles.deployChanges, { color: colors.text }]}>{item.changes}</Text>
                <Text style={[styles.deployDate, { color: colors.textSecondary }]}>{item.date}</Text>
              </View>
            </View>
          ))}
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
  metricCard: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  metricValue: { fontSize: 28, fontWeight: '700' },
  metricLabel: { fontSize: 14, marginTop: 4 },
  section: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  statusName: { flex: 1, fontSize: 14, fontWeight: '500' },
  statusDetail: { fontSize: 12 },
  dbMetrics: { flexDirection: 'row', justifyContent: 'space-around' },
  dbMetricItem: { alignItems: 'center' },
  dbMetricValue: { fontSize: 20, fontWeight: '700' },
  dbMetricLabel: { fontSize: 12, marginTop: 4 },
  deployRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  deployBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginRight: 12 },
  deployVersion: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  deployInfo: { flex: 1 },
  deployChanges: { fontSize: 14, fontWeight: '500' },
  deployDate: { fontSize: 12, marginTop: 2 },
});
