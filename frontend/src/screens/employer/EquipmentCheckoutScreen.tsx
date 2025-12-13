/**
 * EMPLOYER EQUIPMENT CHECKOUT SCREEN
 * Manage company equipment loans and checkouts
 * Track assets, returns, and inventory
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

interface EquipmentCheckout {
  id: string;
  asset_tag: string;
  equipment_name: string;
  category: string;
  employee_name: string;
  department: string;
  checkout_date: string;
  expected_return?: string;
  actual_return?: string;
  status: 'checked_out' | 'returned' | 'overdue' | 'lost';
  condition_out: string;
  condition_in?: string;
  notes?: string;
}

interface EquipmentStats {
  total_assets: number;
  checked_out: number;
  available: number;
  overdue: number;
}

const CATEGORIES = [
  { id: 'laptop', name: 'Laptops', icon: 'laptop', color: '#3B82F6' },
  { id: 'phone', name: 'Phones', icon: 'phone-portrait', color: '#10B981' },
  { id: 'monitor', name: 'Monitors', icon: 'desktop', color: '#8B5CF6' },
  { id: 'accessory', name: 'Accessories', icon: 'headset', color: '#F59E0B' },
  { id: 'vehicle', name: 'Vehicles', icon: 'car', color: '#EC4899' },
  { id: 'other', name: 'Other', icon: 'cube', color: '#6B7280' },
];

export default function EquipmentCheckoutScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkouts, setCheckouts] = useState<EquipmentCheckout[]>([]);
  const [stats, setStats] = useState<EquipmentStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      const [checkoutsRes, statsRes] = await Promise.all([
        api.get('/api/employer/equipment-checkout', { params: { search: searchQuery || undefined, status: filterStatus !== 'all' ? filterStatus : undefined } }),
        api.get('/api/employer/equipment-checkout/stats'),
      ]);
      setCheckouts(checkoutsRes.data.checkouts || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch checkouts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getCategoryInfo = (categoryId: string) => CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[5];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_out': return '#3B82F6';
      case 'returned': return '#10B981';
      case 'overdue': return '#EF4444';
      case 'lost': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const handleCheckIn = async (checkout: EquipmentCheckout) => {
    Alert.alert('Check In Equipment', `Mark ${checkout.equipment_name} as returned?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Check In', onPress: async () => {
        try {
          await api.post(`/api/employer/equipment-checkout/${checkout.id}/checkin`);
          fetchData();
          Alert.alert('Success', 'Equipment checked in');
        } catch (error) {
          Alert.alert('Error', 'Failed to check in');
        }
      }},
    ]);
  };

  const handleSendReminder = async (checkout: EquipmentCheckout) => {
    try {
      await api.post(`/api/employer/equipment-checkout/${checkout.id}/remind`);
      Alert.alert('Success', 'Return reminder sent');
    } catch (error) {
      Alert.alert('Error', 'Failed to send reminder');
    }
  };

  const renderCheckoutCard = (checkout: EquipmentCheckout) => {
    const catInfo = getCategoryInfo(checkout.category);
    return (
      <View key={checkout.id} style={[styles.checkoutCard, checkout.status === 'overdue' && styles.overdueCard]}>
        <View style={styles.checkoutHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: catInfo.color + '20' }]}>
            <Ionicons name={catInfo.icon as any} size={22} color={catInfo.color} />
          </View>
          <View style={styles.equipmentInfo}>
            <Text style={styles.equipmentName}>{checkout.equipment_name}</Text>
            <Text style={styles.assetTag}>Asset: {checkout.asset_tag}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(checkout.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(checkout.status) }]}>{checkout.status.replace('_', ' ')}</Text>
          </View>
        </View>

        <View style={styles.employeeRow}>
          <View style={styles.employeeAvatar}><Text style={styles.avatarText}>{checkout.employee_name.split(' ').map(n => n[0]).join('')}</Text></View>
          <View style={styles.employeeInfo}>
            <Text style={styles.employeeName}>{checkout.employee_name}</Text>
            <Text style={styles.employeeDept}>{checkout.department}</Text>
          </View>
        </View>

        <View style={styles.datesRow}>
          <View style={styles.dateItem}>
            <Ionicons name="log-out" size={14} color="#3B82F6" />
            <Text style={styles.dateLabel}>Out:</Text>
            <Text style={styles.dateValue}>{formatDate(checkout.checkout_date)}</Text>
          </View>
          {checkout.expected_return && (
            <View style={styles.dateItem}>
              <Ionicons name="calendar" size={14} color={checkout.status === 'overdue' ? '#EF4444' : '#666'} />
              <Text style={styles.dateLabel}>Due:</Text>
              <Text style={[styles.dateValue, checkout.status === 'overdue' && { color: '#EF4444' }]}>{formatDate(checkout.expected_return)}</Text>
            </View>
          )}
          {checkout.actual_return && (
            <View style={styles.dateItem}>
              <Ionicons name="log-in" size={14} color="#10B981" />
              <Text style={styles.dateLabel}>Returned:</Text>
              <Text style={styles.dateValue}>{formatDate(checkout.actual_return)}</Text>
            </View>
          )}
        </View>

        {checkout.status === 'checked_out' || checkout.status === 'overdue' ? (
          <View style={styles.checkoutActions}>
            <TouchableOpacity style={[styles.actionButton, styles.checkinButton]} onPress={() => handleCheckIn(checkout)}>
              <Ionicons name="log-in" size={18} color="#FFF" />
              <Text style={styles.checkinText}>Check In</Text>
            </TouchableOpacity>
            {checkout.status === 'overdue' && (
              <TouchableOpacity style={styles.actionButton} onPress={() => handleSendReminder(checkout)}>
                <Ionicons name="notifications" size={18} color="#F59E0B" />
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </View>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Equipment Checkout</Text>
          <TouchableOpacity><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_assets}</Text><Text style={styles.statLabel}>Total</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.checked_out}</Text><Text style={styles.statLabel}>Out</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.available}</Text><Text style={styles.statLabel}>Available</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.overdue}</Text><Text style={styles.statLabel}>Overdue</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput style={styles.searchInput} placeholder="Search equipment..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={fetchData} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {['all', 'checked_out', 'returned', 'overdue'].map(status => (
          <TouchableOpacity key={status} style={[styles.filterChip, filterStatus === status && styles.filterChipActive]} onPress={() => { setFilterStatus(status); setLoading(true); }}>
            <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>{status === 'all' ? 'All' : status.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {checkouts.length > 0 ? checkouts.map(renderCheckoutCard) : (
            <View style={styles.emptyState}><Ionicons name="cube-outline" size={48} color="#666" /><Text style={styles.emptyText}>No checkouts found</Text></View>
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
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', marginHorizontal: 16, marginTop: 12, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: '#FFF' },
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1a1a2e', marginRight: 8, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 13, color: '#a0a0a0', fontWeight: '500', textTransform: 'capitalize' },
  filterChipTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: { padding: 16 },
  checkoutCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  overdueCard: { borderColor: '#EF4444' },
  checkoutHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  categoryIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  equipmentInfo: { flex: 1 },
  equipmentName: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  assetTag: { fontSize: 12, color: '#666', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  employeeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  employeeAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { fontSize: 12, fontWeight: 'bold', color: '#FFF' },
  employeeInfo: {},
  employeeName: { fontSize: 14, fontWeight: '500', color: '#FFF' },
  employeeDept: { fontSize: 12, color: '#666' },
  datesRow: { flexDirection: 'row', marginTop: 12, gap: 16 },
  dateItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateLabel: { fontSize: 11, color: '#666' },
  dateValue: { fontSize: 11, fontWeight: '500', color: '#FFF' },
  checkoutActions: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 8 },
  actionButton: { padding: 10, backgroundColor: '#0f0f23', borderRadius: 8 },
  checkinButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981', gap: 6 },
  checkinText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
