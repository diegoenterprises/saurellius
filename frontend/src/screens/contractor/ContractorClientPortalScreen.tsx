/**
 * CONTRACTOR CLIENT PORTAL SCREEN
 * Manage client relationships and communications
 * Share documents, track projects, handle requests
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

interface ClientPortal {
  id: string;
  client_name: string;
  client_company: string;
  portal_url?: string;
  status: 'active' | 'pending' | 'expired';
  shared_documents: number;
  pending_approvals: number;
  active_projects: number;
  last_activity: string;
  unread_messages: number;
  total_invoiced: number;
}

interface PortalStats {
  total_portals: number;
  active_clients: number;
  pending_approvals: number;
  unread_messages: number;
}

export default function ContractorClientPortalScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [portals, setPortals] = useState<ClientPortal[]>([]);
  const [stats, setStats] = useState<PortalStats | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [portalsRes, statsRes] = await Promise.all([
        api.get('/api/contractor/client-portals'),
        api.get('/api/contractor/client-portals/stats'),
      ]);
      setPortals(portalsRes.data.portals || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch client portals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'expired': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const handleInviteClient = () => {
    Alert.alert('Invite Client', 'Send portal invitation to a new client?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send Invite', onPress: () => navigation.navigate('InviteClient') },
    ]);
  };

  const renderPortalCard = (portal: ClientPortal) => (
    <TouchableOpacity key={portal.id} style={styles.portalCard}>
      <View style={styles.portalHeader}>
        <View style={styles.clientAvatar}><Text style={styles.avatarText}>{portal.client_company.substring(0, 2).toUpperCase()}</Text></View>
        <View style={styles.portalInfo}>
          <Text style={styles.clientName}>{portal.client_name}</Text>
          <Text style={styles.clientCompany}>{portal.client_company}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(portal.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(portal.status) }]}>{portal.status}</Text>
        </View>
      </View>

      <View style={styles.portalStats}>
        <View style={styles.portalStat}>
          <Ionicons name="folder" size={16} color="#3B82F6" />
          <Text style={styles.portalStatValue}>{portal.shared_documents}</Text>
          <Text style={styles.portalStatLabel}>Docs</Text>
        </View>
        <View style={styles.portalStat}>
          <Ionicons name="briefcase" size={16} color="#10B981" />
          <Text style={styles.portalStatValue}>{portal.active_projects}</Text>
          <Text style={styles.portalStatLabel}>Projects</Text>
        </View>
        <View style={styles.portalStat}>
          <Ionicons name="cash" size={16} color="#F59E0B" />
          <Text style={styles.portalStatValue}>{formatCurrency(portal.total_invoiced)}</Text>
          <Text style={styles.portalStatLabel}>Invoiced</Text>
        </View>
      </View>

      {(portal.pending_approvals > 0 || portal.unread_messages > 0) && (
        <View style={styles.alertsRow}>
          {portal.pending_approvals > 0 && (
            <View style={styles.alertBadge}><Ionicons name="time" size={14} color="#F59E0B" /><Text style={styles.alertText}>{portal.pending_approvals} pending</Text></View>
          )}
          {portal.unread_messages > 0 && (
            <View style={[styles.alertBadge, styles.messageBadge]}><Ionicons name="chatbubble" size={14} color="#3B82F6" /><Text style={[styles.alertText, { color: '#3B82F6' }]}>{portal.unread_messages} new</Text></View>
          )}
        </View>
      )}

      <View style={styles.portalFooter}>
        <Text style={styles.lastActivity}>Active {formatDate(portal.last_activity)}</Text>
        <View style={styles.portalActions}>
          <TouchableOpacity style={styles.actionIcon}><Ionicons name="chatbubble-outline" size={18} color="#666" /></TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}><Ionicons name="document-outline" size={18} color="#666" /></TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}><Ionicons name="open-outline" size={18} color="#1473FF" /></TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Client Portal</Text>
          <TouchableOpacity onPress={handleInviteClient}><Ionicons name="person-add-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_portals}</Text><Text style={styles.statLabel}>Portals</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.active_clients}</Text><Text style={styles.statLabel}>Active</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pending_approvals}</Text><Text style={styles.statLabel}>Pending</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.unread_messages}</Text><Text style={styles.statLabel}>Messages</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {portals.length > 0 ? portals.map(renderPortalCard) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>No client portals</Text>
              <Text style={styles.emptySubtext}>Invite clients to share documents and updates</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleInviteClient}>
                <Ionicons name="person-add" size={18} color="#FFF" />
                <Text style={styles.emptyButtonText}>Invite Client</Text>
              </TouchableOpacity>
            </View>
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
  content: { flex: 1 },
  section: { padding: 16 },
  portalCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  portalHeader: { flexDirection: 'row', alignItems: 'center' },
  clientAvatar: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  portalInfo: { flex: 1 },
  clientName: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  clientCompany: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  portalStats: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  portalStat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  portalStatValue: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  portalStatLabel: { fontSize: 11, color: '#666' },
  alertsRow: { flexDirection: 'row', marginTop: 12, gap: 10 },
  alertBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B20', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 6 },
  messageBadge: { backgroundColor: '#3B82F620' },
  alertText: { fontSize: 12, fontWeight: '500', color: '#F59E0B' },
  portalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  lastActivity: { fontSize: 12, color: '#666' },
  portalActions: { flexDirection: 'row', gap: 12 },
  actionIcon: { padding: 6 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#FFF', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#666', marginTop: 4, textAlign: 'center' },
  emptyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1473FF', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, marginTop: 20, gap: 8 },
  emptyButtonText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});
