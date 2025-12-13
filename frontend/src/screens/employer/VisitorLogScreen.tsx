/**
 * EMPLOYER VISITOR LOG SCREEN
 * Track office visitors and guest check-ins
 * Manage badges, sign-ins, and visitor records
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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

interface Visitor {
  id: string;
  name: string;
  company?: string;
  purpose: 'meeting' | 'interview' | 'delivery' | 'contractor' | 'other';
  host_name: string;
  host_department: string;
  check_in_time: string;
  check_out_time?: string;
  badge_number?: string;
  status: 'checked_in' | 'checked_out' | 'expected';
  photo_captured: boolean;
  nda_signed: boolean;
}

interface VisitorStats {
  visitors_today: number;
  currently_onsite: number;
  expected_today: number;
  average_visit_time: string;
}

const PURPOSES = [
  { id: 'meeting', name: 'Meeting', icon: 'people', color: '#3B82F6' },
  { id: 'interview', name: 'Interview', icon: 'person-add', color: '#10B981' },
  { id: 'delivery', name: 'Delivery', icon: 'cube', color: '#F59E0B' },
  { id: 'contractor', name: 'Contractor', icon: 'construct', color: '#8B5CF6' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280' },
];

export default function VisitorLogScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      const [visitorsRes, statsRes] = await Promise.all([
        api.get('/api/employer/visitor-log', { params: { status: filterStatus !== 'all' ? filterStatus : undefined } }),
        api.get('/api/employer/visitor-log/stats'),
      ]);
      setVisitors(visitorsRes.data.visitors || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch visitors:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const getPurposeInfo = (purposeId: string) => PURPOSES.find(p => p.id === purposeId) || PURPOSES[4];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_in': return '#10B981';
      case 'checked_out': return '#6B7280';
      case 'expected': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const handleCheckOut = async (visitor: Visitor) => {
    Alert.alert('Check Out', `Check out ${visitor.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Check Out', onPress: async () => {
        try {
          await api.post(`/api/employer/visitor-log/${visitor.id}/checkout`);
          fetchData();
          Alert.alert('Success', 'Visitor checked out');
        } catch (error) {
          Alert.alert('Error', 'Failed to check out');
        }
      }},
    ]);
  };

  const handleCheckIn = async (visitor: Visitor) => {
    try {
      await api.post(`/api/employer/visitor-log/${visitor.id}/checkin`);
      fetchData();
      Alert.alert('Success', 'Visitor checked in');
    } catch (error) {
      Alert.alert('Error', 'Failed to check in');
    }
  };

  const renderVisitorCard = (visitor: Visitor) => {
    const purposeInfo = getPurposeInfo(visitor.purpose);
    return (
      <View key={visitor.id} style={styles.visitorCard}>
        <View style={styles.visitorHeader}>
          <View style={[styles.purposeIcon, { backgroundColor: purposeInfo.color + '20' }]}>
            <Ionicons name={purposeInfo.icon as any} size={22} color={purposeInfo.color} />
          </View>
          <View style={styles.visitorInfo}>
            <Text style={styles.visitorName}>{visitor.name}</Text>
            {visitor.company && <Text style={styles.visitorCompany}>{visitor.company}</Text>}
            <View style={[styles.purposeBadge, { backgroundColor: purposeInfo.color + '20' }]}>
              <Text style={[styles.purposeText, { color: purposeInfo.color }]}>{purposeInfo.name}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(visitor.status) + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(visitor.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(visitor.status) }]}>{visitor.status.replace('_', ' ')}</Text>
          </View>
        </View>

        <View style={styles.hostRow}>
          <Ionicons name="person" size={14} color="#666" />
          <Text style={styles.hostLabel}>Host:</Text>
          <Text style={styles.hostName}>{visitor.host_name}</Text>
          <Text style={styles.hostDept}>({visitor.host_department})</Text>
        </View>

        <View style={styles.timeRow}>
          {visitor.check_in_time && (
            <View style={styles.timeItem}>
              <Ionicons name="log-in" size={14} color="#10B981" />
              <Text style={styles.timeText}>In: {formatTime(visitor.check_in_time)}</Text>
            </View>
          )}
          {visitor.check_out_time && (
            <View style={styles.timeItem}>
              <Ionicons name="log-out" size={14} color="#EF4444" />
              <Text style={styles.timeText}>Out: {formatTime(visitor.check_out_time)}</Text>
            </View>
          )}
          {visitor.badge_number && (
            <View style={styles.timeItem}>
              <Ionicons name="card" size={14} color="#F59E0B" />
              <Text style={styles.timeText}>Badge: {visitor.badge_number}</Text>
            </View>
          )}
        </View>

        <View style={styles.badgesRow}>
          {visitor.photo_captured && <View style={styles.checkBadge}><Ionicons name="camera" size={14} color="#10B981" /><Text style={styles.checkText}>Photo</Text></View>}
          {visitor.nda_signed && <View style={styles.checkBadge}><Ionicons name="document-text" size={14} color="#10B981" /><Text style={styles.checkText}>NDA</Text></View>}
        </View>

        <View style={styles.visitorActions}>
          {visitor.status === 'expected' && (
            <TouchableOpacity style={[styles.actionButton, styles.checkinButton]} onPress={() => handleCheckIn(visitor)}>
              <Ionicons name="log-in" size={18} color="#FFF" />
              <Text style={styles.checkinText}>Check In</Text>
            </TouchableOpacity>
          )}
          {visitor.status === 'checked_in' && (
            <TouchableOpacity style={[styles.actionButton, styles.checkoutButton]} onPress={() => handleCheckOut(visitor)}>
              <Ionicons name="log-out" size={18} color="#FFF" />
              <Text style={styles.checkoutText}>Check Out</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionButton}><Ionicons name="print-outline" size={18} color="#666" /></TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Visitor Log</Text>
          <TouchableOpacity><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.visitors_today}</Text><Text style={styles.statLabel}>Today</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.currently_onsite}</Text><Text style={styles.statLabel}>Onsite</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.expected_today}</Text><Text style={styles.statLabel}>Expected</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.average_visit_time}</Text><Text style={styles.statLabel}>Avg Time</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {['all', 'checked_in', 'expected', 'checked_out'].map(status => (
          <TouchableOpacity key={status} style={[styles.filterChip, filterStatus === status && styles.filterChipActive]} onPress={() => { setFilterStatus(status); setLoading(true); }}>
            <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>{status === 'all' ? 'All' : status.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {visitors.length > 0 ? visitors.map(renderVisitorCard) : (
            <View style={styles.emptyState}><Ionicons name="people-outline" size={48} color="#666" /><Text style={styles.emptyText}>No visitors</Text></View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
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
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1a1a2e', marginRight: 8, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 13, color: '#a0a0a0', fontWeight: '500', textTransform: 'capitalize' },
  filterChipTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: { padding: 16 },
  visitorCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  visitorHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  purposeIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  visitorInfo: { flex: 1 },
  visitorName: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  visitorCompany: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  purposeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6 },
  purposeText: { fontSize: 11, fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  hostRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  hostLabel: { fontSize: 12, color: '#666' },
  hostName: { fontSize: 13, fontWeight: '500', color: '#FFF' },
  hostDept: { fontSize: 12, color: '#666' },
  timeRow: { flexDirection: 'row', marginTop: 10, gap: 16 },
  timeItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 12, color: '#a0a0a0' },
  badgesRow: { flexDirection: 'row', marginTop: 10, gap: 10 },
  checkBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10B98120', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  checkText: { fontSize: 11, color: '#10B981' },
  visitorActions: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 8 },
  actionButton: { padding: 10, backgroundColor: '#0f0f23', borderRadius: 8 },
  checkinButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981', gap: 6 },
  checkinText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  checkoutButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EF4444', gap: 6 },
  checkoutText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
