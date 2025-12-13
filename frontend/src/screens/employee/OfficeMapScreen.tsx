/**
 * EMPLOYEE OFFICE MAP SCREEN
 * Interactive office floor plans and navigation
 * Find desks, meeting rooms, facilities
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

interface Location {
  id: string;
  name: string;
  type: 'desk' | 'meeting_room' | 'restroom' | 'kitchen' | 'elevator' | 'exit' | 'printer' | 'lounge';
  floor: number;
  zone: string;
  capacity?: number;
  amenities?: string[];
  assigned_to?: string;
  is_available?: boolean;
  description?: string;
}

interface Floor {
  number: number;
  name: string;
  locations_count: number;
}

interface OfficeStats {
  total_floors: number;
  meeting_rooms: number;
  available_desks: number;
  total_capacity: number;
}

const LOCATION_TYPES = [
  { id: 'desk', name: 'Desks', icon: 'desktop', color: '#3B82F6' },
  { id: 'meeting_room', name: 'Meeting Rooms', icon: 'people', color: '#10B981' },
  { id: 'restroom', name: 'Restrooms', icon: 'water', color: '#8B5CF6' },
  { id: 'kitchen', name: 'Kitchen', icon: 'cafe', color: '#F59E0B' },
  { id: 'printer', name: 'Printers', icon: 'print', color: '#EC4899' },
  { id: 'lounge', name: 'Lounge', icon: 'leaf', color: '#6366F1' },
];

export default function OfficeMapScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [stats, setStats] = useState<OfficeStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [filterType, setFilterType] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      const [locationsRes, floorsRes, statsRes] = await Promise.all([
        api.get('/api/employee/office-map/locations', { params: { floor: selectedFloor, type: filterType !== 'all' ? filterType : undefined, search: searchQuery || undefined } }),
        api.get('/api/employee/office-map/floors'),
        api.get('/api/employee/office-map/stats'),
      ]);
      setLocations(locationsRes.data.locations || []);
      setFloors(floorsRes.data.floors || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch office map:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFloor, filterType, searchQuery]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const getTypeInfo = (typeId: string) => LOCATION_TYPES.find(t => t.id === typeId) || LOCATION_TYPES[0];

  const renderLocationCard = (location: Location) => {
    const typeInfo = getTypeInfo(location.type);
    return (
      <TouchableOpacity key={location.id} style={styles.locationCard}>
        <View style={styles.locationHeader}>
          <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + '20' }]}>
            <Ionicons name={typeInfo.icon as any} size={22} color={typeInfo.color} />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationName}>{location.name}</Text>
            <Text style={styles.locationZone}>Zone {location.zone} • Floor {location.floor}</Text>
            {location.description && <Text style={styles.locationDesc}>{location.description}</Text>}
          </View>
          {location.is_available !== undefined && (
            <View style={[styles.availabilityBadge, { backgroundColor: location.is_available ? '#10B98120' : '#EF444420' }]}>
              <View style={[styles.availabilityDot, { backgroundColor: location.is_available ? '#10B981' : '#EF4444' }]} />
              <Text style={[styles.availabilityText, { color: location.is_available ? '#10B981' : '#EF4444' }]}>{location.is_available ? 'Available' : 'Occupied'}</Text>
            </View>
          )}
        </View>

        {(location.capacity || location.assigned_to) && (
          <View style={styles.detailsRow}>
            {location.capacity && (
              <View style={styles.detailItem}><Ionicons name="people" size={14} color="#666" /><Text style={styles.detailText}>Capacity: {location.capacity}</Text></View>
            )}
            {location.assigned_to && (
              <View style={styles.detailItem}><Ionicons name="person" size={14} color="#666" /><Text style={styles.detailText}>{location.assigned_to}</Text></View>
            )}
          </View>
        )}

        {location.amenities && location.amenities.length > 0 && (
          <View style={styles.amenitiesRow}>
            {location.amenities.slice(0, 4).map((amenity, i) => (
              <View key={i} style={styles.amenityTag}><Text style={styles.amenityText}>{amenity}</Text></View>
            ))}
          </View>
        )}

        <View style={styles.locationActions}>
          <TouchableOpacity style={styles.actionButton}><Ionicons name="navigate" size={16} color="#1473FF" /><Text style={styles.actionText}>Navigate</Text></TouchableOpacity>
          {location.type === 'meeting_room' && location.is_available && (
            <TouchableOpacity style={[styles.actionButton, styles.bookButton]}><Ionicons name="calendar" size={16} color="#FFF" /><Text style={styles.bookText}>Book</Text></TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Office Map</Text>
          <TouchableOpacity><Ionicons name="map-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_floors}</Text><Text style={styles.statLabel}>Floors</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.meeting_rooms}</Text><Text style={styles.statLabel}>Rooms</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.available_desks}</Text><Text style={styles.statLabel}>Desks</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput style={styles.searchInput} placeholder="Search locations, people..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={fetchData} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorSelector}>
        {floors.map(floor => (
          <TouchableOpacity key={floor.number} style={[styles.floorChip, selectedFloor === floor.number && styles.floorChipActive]} onPress={() => { setSelectedFloor(floor.number); setLoading(true); }}>
            <Text style={[styles.floorNumber, selectedFloor === floor.number && styles.floorNumberActive]}>{floor.number}</Text>
            <Text style={[styles.floorName, selectedFloor === floor.number && styles.floorNameActive]}>{floor.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        <TouchableOpacity style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]} onPress={() => { setFilterType('all'); setLoading(true); }}>
          <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        {LOCATION_TYPES.map(type => (
          <TouchableOpacity key={type.id} style={[styles.filterChip, filterType === type.id && styles.filterChipActive]} onPress={() => { setFilterType(type.id); setLoading(true); }}>
            <Ionicons name={type.icon as any} size={14} color={filterType === type.id ? '#FFF' : type.color} />
            <Text style={[styles.filterChipText, filterType === type.id && styles.filterChipTextActive]}>{type.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {locations.length > 0 ? locations.map(renderLocationCard) : (
            <View style={styles.emptyState}><Ionicons name="map-outline" size={48} color="#666" /><Text style={styles.emptyText}>No locations found</Text></View>
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
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', marginHorizontal: 16, marginTop: 12, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: '#FFF' },
  floorSelector: { paddingHorizontal: 16, paddingVertical: 10 },
  floorChip: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#1a1a2e', marginRight: 8, borderWidth: 1, borderColor: '#2a2a4e' },
  floorChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  floorNumber: { fontSize: 18, fontWeight: 'bold', color: '#666' },
  floorNumberActive: { color: '#FFF' },
  floorName: { fontSize: 10, color: '#666', marginTop: 2 },
  floorNameActive: { color: 'rgba(255,255,255,0.8)' },
  filterBar: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: '#1a1a2e', marginRight: 8, gap: 4, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 11, color: '#a0a0a0', fontWeight: '500' },
  filterChipTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: { padding: 16 },
  locationCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  locationHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  typeIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  locationInfo: { flex: 1 },
  locationName: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  locationZone: { fontSize: 12, color: '#666', marginTop: 2 },
  locationDesc: { fontSize: 12, color: '#a0a0a0', marginTop: 4 },
  availabilityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  availabilityDot: { width: 6, height: 6, borderRadius: 3 },
  availabilityText: { fontSize: 10, fontWeight: '600' },
  detailsRow: { flexDirection: 'row', marginTop: 12, gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 12, color: '#a0a0a0' },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 6 },
  amenityTag: { backgroundColor: '#2a2a4e', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  amenityText: { fontSize: 10, color: '#a0a0a0' },
  locationActions: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#0f0f23', borderRadius: 8, gap: 4 },
  actionText: { fontSize: 13, color: '#1473FF' },
  bookButton: { flex: 1, justifyContent: 'center', backgroundColor: '#10B981' },
  bookText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
