/**
 * EMPLOYEE PARKING SCREEN
 * Manage parking permits and reservations
 * View availability, request spots
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
import { useTheme } from '../../context/ThemeContext';

interface ParkingSpot {
  id: string;
  spot_number: string;
  level: string;
  zone: string;
  type: 'regular' | 'reserved' | 'handicap' | 'ev_charging' | 'visitor';
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  assigned_to?: string;
  vehicle_info?: string;
}

interface ParkingPermit {
  id: string;
  permit_number: string;
  type: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_color: string;
  license_plate: string;
  valid_from: string;
  valid_until: string;
  status: 'active' | 'expired' | 'pending';
  assigned_spot?: string;
}

interface ParkingStats {
  total_spots: number;
  available_spots: number;
  your_permits: number;
  ev_spots_available: number;
}

const SPOT_TYPES = [
  { id: 'regular', name: 'Regular', icon: 'car', color: '#3B82F6' },
  { id: 'reserved', name: 'Reserved', icon: 'ribbon', color: '#F59E0B' },
  { id: 'handicap', name: 'Accessible', icon: 'accessibility', color: '#8B5CF6' },
  { id: 'ev_charging', name: 'EV Charging', icon: 'flash', color: '#10B981' },
  { id: 'visitor', name: 'Visitor', icon: 'people', color: '#EC4899' },
];

export default function ParkingScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [permits, setPermits] = useState<ParkingPermit[]>([]);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [stats, setStats] = useState<ParkingStats | null>(null);
  const [activeTab, setActiveTab] = useState<'permits' | 'spots'>('permits');

  const fetchData = useCallback(async () => {
    try {
      const [permitsRes, spotsRes, statsRes] = await Promise.all([
        api.get('/api/employee/parking/permits'),
        api.get('/api/employee/parking/spots'),
        api.get('/api/employee/parking/stats'),
      ]);
      setPermits(permitsRes.data.permits || []);
      setSpots(spotsRes.data.spots || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch parking data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getSpotTypeInfo = (typeId: string) => SPOT_TYPES.find(t => t.id === typeId) || SPOT_TYPES[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'available': return '#10B981';
      case 'occupied': case 'reserved': return '#F59E0B';
      case 'expired': case 'maintenance': return '#EF4444';
      case 'pending': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const handleReserveSpot = async (spot: ParkingSpot) => {
    Alert.alert('Reserve Spot', `Reserve spot ${spot.spot_number}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reserve', onPress: async () => {
        try {
          await api.post(`/api/employee/parking/spots/${spot.id}/reserve`);
          fetchData();
          Alert.alert('Success', 'Spot reserved');
        } catch (error) {
          Alert.alert('Error', 'Failed to reserve spot');
        }
      }},
    ]);
  };

  const handleRequestPermit = () => {
    navigation.navigate('RequestParkingPermit');
  };

  const renderPermitCard = (permit: ParkingPermit) => {
    const isExpiringSoon = new Date(permit.valid_until) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return (
      <View key={permit.id} style={[styles.permitCard, permit.status === 'expired' && styles.expiredCard]}>
        {isExpiringSoon && permit.status === 'active' && (
          <View style={styles.expiringBadge}><Ionicons name="warning" size={12} color="#F59E0B" /><Text style={styles.expiringText}>Expiring Soon</Text></View>
        )}
        <View style={styles.permitHeader}>
          <View style={styles.permitIcon}><Ionicons name="car" size={28} color="#1473FF" /></View>
          <View style={styles.permitInfo}>
            <Text style={styles.permitNumber}>Permit #{permit.permit_number}</Text>
            <Text style={styles.permitType}>{permit.type}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(permit.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(permit.status) }]}>{permit.status}</Text>
          </View>
        </View>

        <View style={styles.vehicleInfo}>
          <View style={styles.vehicleRow}>
            <Ionicons name="car-sport" size={16} color="#666" />
            <Text style={styles.vehicleText}>{permit.vehicle_color} {permit.vehicle_make} {permit.vehicle_model}</Text>
          </View>
          <View style={styles.vehicleRow}>
            <Ionicons name="document" size={16} color="#666" />
            <Text style={styles.vehicleText}>{permit.license_plate}</Text>
          </View>
          {permit.assigned_spot && (
            <View style={styles.vehicleRow}>
              <Ionicons name="location" size={16} color="#10B981" />
              <Text style={[styles.vehicleText, { color: '#10B981' }]}>Spot: {permit.assigned_spot}</Text>
            </View>
          )}
        </View>

        <View style={styles.permitDates}>
          <View style={styles.dateItem}><Text style={styles.dateLabel}>Valid From</Text><Text style={styles.dateValue}>{formatDate(permit.valid_from)}</Text></View>
          <View style={styles.dateItem}><Text style={styles.dateLabel}>Valid Until</Text><Text style={[styles.dateValue, isExpiringSoon && { color: '#F59E0B' }]}>{formatDate(permit.valid_until)}</Text></View>
        </View>

        {permit.status === 'active' && (
          <TouchableOpacity style={styles.renewButton}>
            <Ionicons name="refresh" size={16} color="#1473FF" />
            <Text style={styles.renewText}>Renew Permit</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderSpotCard = (spot: ParkingSpot) => {
    const typeInfo = getSpotTypeInfo(spot.type);
    return (
      <View key={spot.id} style={styles.spotCard}>
        <View style={styles.spotHeader}>
          <View style={[styles.spotIcon, { backgroundColor: typeInfo.color + '20' }]}>
            <Ionicons name={typeInfo.icon as any} size={20} color={typeInfo.color} />
          </View>
          <View style={styles.spotInfo}>
            <Text style={styles.spotNumber}>{spot.spot_number}</Text>
            <Text style={styles.spotLocation}>Level {spot.level} • Zone {spot.zone}</Text>
          </View>
          <View style={[styles.spotStatus, { backgroundColor: getStatusColor(spot.status) + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(spot.status) }]} />
            <Text style={[styles.spotStatusText, { color: getStatusColor(spot.status) }]}>{spot.status}</Text>
          </View>
        </View>
        {spot.status === 'available' && (
          <TouchableOpacity style={styles.reserveButton} onPress={() => handleReserveSpot(spot)}>
            <Ionicons name="bookmark" size={16} color="#FFF" />
            <Text style={styles.reserveText}>Reserve</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Parking</Text>
          <TouchableOpacity onPress={handleRequestPermit}><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_spots}</Text><Text style={styles.statLabel}>Total</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.available_spots}</Text><Text style={styles.statLabel}>Available</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.your_permits}</Text><Text style={styles.statLabel}>Permits</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.ev_spots_available}</Text><Text style={styles.statLabel}>EV</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'permits' && styles.tabActive]} onPress={() => setActiveTab('permits')}>
          <Text style={[styles.tabText, activeTab === 'permits' && styles.tabTextActive]}>My Permits</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'spots' && styles.tabActive]} onPress={() => setActiveTab('spots')}>
          <Text style={[styles.tabText, activeTab === 'spots' && styles.tabTextActive]}>Find Spot</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {activeTab === 'permits' ? (
            permits.length > 0 ? permits.map(renderPermitCard) : (
              <View style={styles.emptyState}><Ionicons name="car-outline" size={48} color="#666" /><Text style={styles.emptyText}>No parking permits</Text><TouchableOpacity style={styles.requestButton} onPress={handleRequestPermit}><Ionicons name="add" size={18} color="#FFF" /><Text style={styles.requestText}>Request Permit</Text></TouchableOpacity></View>
            )
          ) : (
            spots.length > 0 ? spots.map(renderSpotCard) : <View style={styles.emptyState}><Ionicons name="location-outline" size={48} color="#666" /><Text style={styles.emptyText}>No spots available</Text></View>
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
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: '#1473FF' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#a0a0a0' },
  tabTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  permitCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#2a2a4e' },
  expiredCard: { borderColor: '#EF4444', opacity: 0.7 },
  expiringBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#F59E0B20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 10, gap: 4 },
  expiringText: { fontSize: 11, fontWeight: '600', color: '#F59E0B' },
  permitHeader: { flexDirection: 'row', alignItems: 'center' },
  permitIcon: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#1473FF20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  permitInfo: { flex: 1 },
  permitNumber: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  permitType: { fontSize: 13, color: '#666', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  vehicleInfo: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 8 },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vehicleText: { fontSize: 14, color: '#a0a0a0' },
  permitDates: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  dateItem: { flex: 1 },
  dateLabel: { fontSize: 11, color: '#666' },
  dateValue: { fontSize: 14, fontWeight: '500', color: '#FFF', marginTop: 2 },
  renewButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#0f0f23', gap: 6 },
  renewText: { fontSize: 14, color: '#1473FF' },
  spotCard: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a4e' },
  spotHeader: { flexDirection: 'row', alignItems: 'center' },
  spotIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  spotInfo: { flex: 1 },
  spotNumber: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  spotLocation: { fontSize: 12, color: '#666', marginTop: 2 },
  spotStatus: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  spotStatusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  reserveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: '#10B981', gap: 6 },
  reserveText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
  requestButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1473FF', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, marginTop: 16, gap: 6 },
  requestText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});
