/**
 * CONTRACTOR MILEAGE TRACKER SCREEN
 * Track business miles for tax deductions
 * Log trips, calculate deductions, generate reports
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

interface Trip {
  id: string;
  purpose: string;
  start_location: string;
  end_location: string;
  distance: number;
  date: string;
  category: 'client_visit' | 'business_errand' | 'travel' | 'other';
  is_round_trip: boolean;
  deduction_amount: number;
  notes?: string;
}

interface MileageStats {
  total_miles_ytd: number;
  total_deduction_ytd: number;
  trips_this_month: number;
  miles_this_month: number;
  irs_rate: number;
}

const CATEGORIES = [
  { id: 'client_visit', name: 'Client Visit', icon: 'business', color: '#3B82F6' },
  { id: 'business_errand', name: 'Business Errand', icon: 'cart', color: '#10B981' },
  { id: 'travel', name: 'Travel', icon: 'airplane', color: '#8B5CF6' },
  { id: 'other', name: 'Other', icon: 'car', color: '#6B7280' },
];

export default function ContractorMileageTrackerScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [stats, setStats] = useState<MileageStats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ purpose: '', start_location: '', end_location: '', distance: '', category: 'client_visit', is_round_trip: false, notes: '' });

  const fetchData = useCallback(async () => {
    try {
      const [tripsRes, statsRes] = await Promise.all([
        api.get('/api/contractor/mileage'),
        api.get('/api/contractor/mileage/stats'),
      ]);
      setTrips(tripsRes.data.trips || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch mileage data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const getCategoryInfo = (categoryId: string) => CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[3];

  const handleAddTrip = async () => {
    if (!formData.purpose.trim() || !formData.distance) {
      Alert.alert('Error', 'Purpose and distance are required');
      return;
    }
    try {
      const distance = parseFloat(formData.distance);
      await api.post('/api/contractor/mileage', {
        ...formData,
        distance: formData.is_round_trip ? distance * 2 : distance,
        date: new Date().toISOString(),
      });
      setShowAddModal(false);
      setFormData({ purpose: '', start_location: '', end_location: '', distance: '', category: 'client_visit', is_round_trip: false, notes: '' });
      fetchData();
      Alert.alert('Success', 'Trip logged');
    } catch (error) {
      Alert.alert('Error', 'Failed to log trip');
    }
  };

  const handleDeleteTrip = (trip: Trip) => {
    Alert.alert('Delete Trip', `Delete this trip to "${trip.purpose}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/api/contractor/mileage/${trip.id}`);
          fetchData();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete');
        }
      }},
    ]);
  };

  const renderTripCard = (trip: Trip) => {
    const catInfo = getCategoryInfo(trip.category);
    return (
      <TouchableOpacity key={trip.id} style={styles.tripCard} onLongPress={() => handleDeleteTrip(trip)}>
        <View style={styles.tripHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: catInfo.color + '20' }]}>
            <Ionicons name={catInfo.icon as any} size={20} color={catInfo.color} />
          </View>
          <View style={styles.tripInfo}>
            <Text style={styles.tripPurpose}>{trip.purpose}</Text>
            <Text style={styles.tripDate}>{formatDate(trip.date)}</Text>
          </View>
          <View style={styles.tripRight}>
            <Text style={styles.tripMiles}>{trip.distance.toFixed(1)} mi</Text>
            <Text style={styles.tripDeduction}>{formatCurrency(trip.deduction_amount)}</Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <View style={styles.locationItem}>
            <Ionicons name="location" size={14} color="#10B981" />
            <Text style={styles.locationText} numberOfLines={1}>{trip.start_location || 'Start'}</Text>
          </View>
          <Ionicons name="arrow-forward" size={14} color="#666" />
          <View style={styles.locationItem}>
            <Ionicons name="location" size={14} color="#EF4444" />
            <Text style={styles.locationText} numberOfLines={1}>{trip.end_location || 'End'}</Text>
          </View>
          {trip.is_round_trip && (
            <View style={styles.roundTripBadge}><Ionicons name="repeat" size={12} color="#8B5CF6" /><Text style={styles.roundTripText}>Round</Text></View>
          )}
        </View>

        {trip.notes && <Text style={styles.tripNotes} numberOfLines={1}>{trip.notes}</Text>}
      </TouchableOpacity>
    );
  };

  // Group trips by date
  const groupedTrips = trips.reduce((groups: { [key: string]: Trip[] }, trip) => {
    const date = trip.date.split('T')[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(trip);
    return groups;
  }, {});

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Mileage Tracker</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsCard}>
            <View style={styles.mainStat}>
              <Ionicons name="car-sport" size={24} color="#1473FF" />
              <Text style={styles.mainStatValue}>{stats.total_miles_ytd.toFixed(0)}</Text>
              <Text style={styles.mainStatLabel}>Miles YTD</Text>
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.secondaryStats}>
              <View style={styles.secondaryStat}>
                <Text style={[styles.secondaryValue, { color: '#10B981' }]}>{formatCurrency(stats.total_deduction_ytd)}</Text>
                <Text style={styles.secondaryLabel}>Tax Deduction</Text>
              </View>
              <View style={styles.secondaryStat}>
                <Text style={styles.secondaryValue}>{stats.trips_this_month}</Text>
                <Text style={styles.secondaryLabel}>Trips/Month</Text>
              </View>
              <View style={styles.secondaryStat}>
                <Text style={styles.secondaryValue}>${stats.irs_rate}</Text>
                <Text style={styles.secondaryLabel}>IRS Rate/mi</Text>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {Object.keys(groupedTrips).length > 0 ? (
            Object.entries(groupedTrips).sort(([a], [b]) => b.localeCompare(a)).map(([date, dayTrips]) => (
              <View key={date}>
                <Text style={styles.dateHeader}>{formatDate(date)}</Text>
                {dayTrips.map(renderTripCard)}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>No trips logged</Text>
              <Text style={styles.emptySubtext}>Start tracking your business miles</Text>
            </View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <TouchableOpacity style={styles.quickLogButton} onPress={() => setShowAddModal(true)}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Log Trip</Text>
            <TouchableOpacity onPress={handleAddTrip}><Text style={styles.modalSave}>Save</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Purpose *</Text><TextInput style={styles.input} value={formData.purpose} onChangeText={t => setFormData(p => ({...p, purpose: t}))} placeholder="e.g., Client meeting, Supply run" placeholderTextColor="#666" /></View>
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.inputLabel}>Distance (miles) *</Text><TextInput style={styles.input} value={formData.distance} onChangeText={t => setFormData(p => ({...p, distance: t}))} placeholder="0.0" placeholderTextColor="#666" keyboardType="decimal-pad" /></View>
            </View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Start Location</Text><TextInput style={styles.input} value={formData.start_location} onChangeText={t => setFormData(p => ({...p, start_location: t}))} placeholder="Where did you start?" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>End Location</Text><TextInput style={styles.input} value={formData.end_location} onChangeText={t => setFormData(p => ({...p, end_location: t}))} placeholder="Where did you go?" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat.id} style={[styles.categoryOption, formData.category === cat.id && styles.categoryActive]} onPress={() => setFormData(p => ({...p, category: cat.id}))}>
                    <Ionicons name={cat.icon as any} size={18} color={formData.category === cat.id ? '#FFF' : cat.color} />
                    <Text style={[styles.categoryText, formData.category === cat.id && styles.categoryTextActive]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={styles.roundTripToggle} onPress={() => setFormData(p => ({...p, is_round_trip: !p.is_round_trip}))}>
              <Ionicons name={formData.is_round_trip ? 'checkbox' : 'square-outline'} size={22} color={formData.is_round_trip ? '#8B5CF6' : '#666'} />
              <Text style={styles.roundTripLabel}>Round trip (distance will be doubled)</Text>
            </TouchableOpacity>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Notes</Text><TextInput style={[styles.input, styles.textArea]} value={formData.notes} onChangeText={t => setFormData(p => ({...p, notes: t}))} placeholder="Additional details..." placeholderTextColor="#666" multiline numberOfLines={2} /></View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingBottom: 16 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  statsCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 14, padding: 16 },
  mainStat: { alignItems: 'center', paddingRight: 16 },
  mainStatValue: { fontSize: 28, fontWeight: 'bold', color: '#FFF', marginTop: 6 },
  mainStatLabel: { fontSize: 11, color: '#a0a0a0' },
  statsDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  secondaryStats: { flex: 1, paddingLeft: 16, justifyContent: 'center' },
  secondaryStat: { marginVertical: 4 },
  secondaryValue: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  secondaryLabel: { fontSize: 10, color: '#a0a0a0' },
  content: { flex: 1 },
  section: { padding: 16 },
  dateHeader: { fontSize: 14, fontWeight: '600', color: '#a0a0a0', marginBottom: 10, marginTop: 10 },
  tripCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a4e' },
  tripHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  categoryIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  tripInfo: { flex: 1 },
  tripPurpose: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  tripDate: { fontSize: 12, color: '#666', marginTop: 2 },
  tripRight: { alignItems: 'flex-end' },
  tripMiles: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  tripDeduction: { fontSize: 12, color: '#10B981', marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 8 },
  locationItem: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 4 },
  locationText: { fontSize: 12, color: '#a0a0a0', flex: 1 },
  roundTripBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8B5CF620', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  roundTripText: { fontSize: 10, color: '#8B5CF6' },
  tripNotes: { fontSize: 12, color: '#666', marginTop: 8, fontStyle: 'italic' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#FFF', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#666', marginTop: 4 },
  quickLogButton: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center', shadowColor: '#1473FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  modalContainer: { flex: 1, backgroundColor: '#0f0f23' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  modalCancel: { fontSize: 16, color: '#a0a0a0' },
  modalSave: { fontSize: 16, fontWeight: '600', color: '#1473FF' },
  modalContent: { padding: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, color: '#a0a0a0', marginBottom: 6 },
  input: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14, fontSize: 16, color: '#FFF', borderWidth: 1, borderColor: '#2a2a4e' },
  inputRow: { flexDirection: 'row', gap: 12 },
  textArea: { height: 60, textAlignVertical: 'top' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#2a2a4e', borderRadius: 10, gap: 6 },
  categoryActive: { backgroundColor: '#1473FF' },
  categoryText: { fontSize: 12, color: '#a0a0a0' },
  categoryTextActive: { color: '#FFF' },
  roundTripToggle: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10, marginBottom: 16 },
  roundTripLabel: { fontSize: 15, color: '#FFF' },
});
