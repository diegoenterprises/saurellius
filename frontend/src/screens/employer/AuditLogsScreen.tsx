/**
 * EMPLOYER AUDIT LOGS SCREEN
 * Track all system activities and changes
 * Filter, search, and export audit trails
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

interface AuditLog {
  id: string;
  action: string;
  category: 'payroll' | 'employee' | 'settings' | 'security' | 'document' | 'system';
  description: string;
  user_name: string;
  user_email: string;
  ip_address?: string;
  timestamp: string;
  details?: Record<string, any>;
  severity: 'info' | 'warning' | 'critical';
}

interface AuditStats {
  total_logs: number;
  today_count: number;
  critical_count: number;
  unique_users: number;
}

const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'list', color: '#1473FF' },
  { id: 'payroll', name: 'Payroll', icon: 'cash', color: '#10B981' },
  { id: 'employee', name: 'Employee', icon: 'people', color: '#3B82F6' },
  { id: 'settings', name: 'Settings', icon: 'settings', color: '#8B5CF6' },
  { id: 'security', name: 'Security', icon: 'shield', color: '#EF4444' },
  { id: 'document', name: 'Documents', icon: 'document', color: '#F59E0B' },
];

export default function AuditLogsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.get('/api/employer/audit-logs', { params: { search: searchQuery, category: filterCategory !== 'all' ? filterCategory : undefined } }),
        api.get('/api/employer/audit-logs/stats'),
      ]);
      setLogs(logsRes.data.logs || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filterCategory]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  const onRefresh = () => { setRefreshing(true); fetchLogs(); };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'info': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getCategoryInfo = (category: string) => CATEGORIES.find(c => c.id === category) || CATEGORIES[0];

  const handleExport = async () => {
    try {
      const response = await api.get('/api/employer/audit-logs/export');
      if (response.data.download_url) {
        await Share.share({ url: response.data.download_url, title: 'Audit Logs Export' });
      }
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const renderLogItem = ({ item }: { item: AuditLog }) => {
    const categoryInfo = getCategoryInfo(item.category);
    const isExpanded = expandedLog === item.id;

    return (
      <TouchableOpacity style={[styles.logCard, item.severity === 'critical' && styles.logCardCritical]} onPress={() => setExpandedLog(isExpanded ? null : item.id)}>
        <View style={styles.logHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
            <Ionicons name={categoryInfo.icon as any} size={18} color={categoryInfo.color} />
          </View>
          <View style={styles.logInfo}>
            <Text style={styles.logAction}>{item.action}</Text>
            <Text style={styles.logUser}>{item.user_name}</Text>
          </View>
          <View style={styles.logMeta}>
            <View style={[styles.severityDot, { backgroundColor: getSeverityColor(item.severity) }]} />
            <Text style={styles.logTime}>{formatTimestamp(item.timestamp)}</Text>
          </View>
        </View>

        <Text style={styles.logDescription} numberOfLines={isExpanded ? undefined : 1}>{item.description}</Text>

        {isExpanded && (
          <View style={styles.logExpanded}>
            <View style={styles.expandedRow}><Text style={styles.expandedLabel}>User Email</Text><Text style={styles.expandedValue}>{item.user_email}</Text></View>
            {item.ip_address && <View style={styles.expandedRow}><Text style={styles.expandedLabel}>IP Address</Text><Text style={styles.expandedValue}>{item.ip_address}</Text></View>}
            <View style={styles.expandedRow}><Text style={styles.expandedLabel}>Category</Text><Text style={styles.expandedValue}>{categoryInfo.name}</Text></View>
            <View style={styles.expandedRow}><Text style={styles.expandedLabel}>Severity</Text><Text style={[styles.expandedValue, { color: getSeverityColor(item.severity) }]}>{item.severity}</Text></View>
            {item.details && (
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Details</Text>
                <Text style={styles.detailsJson}>{JSON.stringify(item.details, null, 2)}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Audit Logs</Text>
          <TouchableOpacity onPress={handleExport}><Ionicons name="download-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_logs}</Text><Text style={styles.statLabel}>Total</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.today_count}</Text><Text style={styles.statLabel}>Today</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.critical_count}</Text><Text style={styles.statLabel}>Critical</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.unique_users}</Text><Text style={styles.statLabel}>Users</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput style={styles.searchInput} placeholder="Search logs..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={() => { setLoading(true); fetchLogs(); }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat.id} style={[styles.categoryChip, filterCategory === cat.id && styles.categoryChipActive]} onPress={() => { setFilterCategory(cat.id); setLoading(true); }}>
            <Ionicons name={cat.icon as any} size={14} color={filterCategory === cat.id ? '#FFF' : cat.color} />
            <Text style={[styles.categoryChipText, filterCategory === cat.id && styles.categoryChipTextActive]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={logs}
        renderItem={renderLogItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}
        ListEmptyComponent={<View style={styles.emptyState}><Ionicons name="document-text-outline" size={48} color="#666" /><Text style={styles.emptyText}>No audit logs found</Text></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingBottom: 16 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  statsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 12, padding: 12 },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 6 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', marginHorizontal: 16, marginTop: 12, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: '#FFF' },
  categoryFilter: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1a1a2e', marginRight: 8, gap: 6, borderWidth: 1, borderColor: '#2a2a4e' },
  categoryChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  categoryChipText: { fontSize: 12, color: '#a0a0a0', fontWeight: '500' },
  categoryChipTextActive: { color: '#FFF' },
  listContent: { padding: 16 },
  logCard: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a4e' },
  logCardCritical: { borderColor: '#EF4444' },
  logHeader: { flexDirection: 'row', alignItems: 'center' },
  categoryIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  logInfo: { flex: 1 },
  logAction: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  logUser: { fontSize: 12, color: '#666', marginTop: 2 },
  logMeta: { alignItems: 'flex-end' },
  severityDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  logTime: { fontSize: 11, color: '#666' },
  logDescription: { fontSize: 13, color: '#a0a0a0', marginTop: 10, lineHeight: 18 },
  logExpanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  expandedRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  expandedLabel: { fontSize: 12, color: '#666' },
  expandedValue: { fontSize: 12, color: '#FFF' },
  detailsSection: { marginTop: 10, backgroundColor: '#0f0f23', borderRadius: 8, padding: 10 },
  detailsTitle: { fontSize: 12, fontWeight: '600', color: '#FFF', marginBottom: 6 },
  detailsJson: { fontSize: 10, color: '#a0a0a0', fontFamily: 'monospace' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
