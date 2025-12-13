/**
 * EMPLOYER SCHEDULING SCREEN
 * Create and manage employee work schedules
 * Weekly calendar view, shift management, coverage tracking
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
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

interface Shift {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  start_time: string;
  end_time: string;
  department: string;
  position: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'no_show';
  notes?: string;
}

interface DaySchedule {
  date: string;
  day_name: string;
  shifts: Shift[];
  total_hours: number;
  coverage_status: 'adequate' | 'understaffed' | 'overstaffed';
}

interface ScheduleStats {
  total_shifts: number;
  total_hours: number;
  open_shifts: number;
  pending_requests: number;
}

export default function SchedulingScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([]);
  const [stats, setStats] = useState<ScheduleStats | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchSchedule = useCallback(async () => {
    try {
      const [scheduleRes, statsRes] = await Promise.all([
        api.get('/api/employer/schedule', { params: { week_start: currentWeekStart.toISOString() } }),
        api.get('/api/employer/schedule/stats'),
      ]);
      setWeekSchedule(scheduleRes.data.schedule || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentWeekStart]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);
  const onRefresh = () => { setRefreshing(true); fetchSchedule(); };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentWeekStart(newDate);
    setLoading(true);
  };

  const formatWeekRange = () => {
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    return `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#3B82F6';
      case 'confirmed': return '#8B5CF6';
      case 'scheduled': return '#F59E0B';
      case 'no_show': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getCoverageColor = (status: string) => {
    switch (status) {
      case 'adequate': return '#10B981';
      case 'understaffed': return '#EF4444';
      case 'overstaffed': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const handleDeleteShift = (shift: Shift) => {
    Alert.alert('Delete Shift', `Remove ${shift.employee_name}'s shift?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/api/employer/schedule/shifts/${shift.id}`);
          fetchSchedule();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete shift');
        }
      }},
    ]);
  };

  const renderDayColumn = (day: DaySchedule) => (
    <View key={day.date} style={styles.dayColumn}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayName}>{day.day_name}</Text>
        <Text style={styles.dayDate}>{new Date(day.date).getDate()}</Text>
        <View style={[styles.coverageDot, { backgroundColor: getCoverageColor(day.coverage_status) }]} />
      </View>
      <ScrollView style={styles.shiftsColumn} showsVerticalScrollIndicator={false}>
        {day.shifts.map(shift => (
          <TouchableOpacity key={shift.id} style={[styles.shiftCard, { borderLeftColor: getStatusColor(shift.status) }]} onPress={() => setSelectedShift(shift)} onLongPress={() => handleDeleteShift(shift)}>
            <Text style={styles.shiftTime}>{shift.start_time} - {shift.end_time}</Text>
            <Text style={styles.shiftEmployee} numberOfLines={1}>{shift.employee_name}</Text>
            <Text style={styles.shiftPosition} numberOfLines={1}>{shift.position}</Text>
          </TouchableOpacity>
        ))}
        {day.shifts.length === 0 && <Text style={styles.noShifts}>No shifts</Text>}
      </ScrollView>
      <Text style={styles.dayTotal}>{day.total_hours}h</Text>
    </View>
  );

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Scheduling</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_shifts}</Text><Text style={styles.statLabel}>Shifts</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_hours}h</Text><Text style={styles.statLabel}>Hours</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.open_shifts}</Text><Text style={styles.statLabel}>Open</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.pending_requests}</Text><Text style={styles.statLabel}>Requests</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => navigateWeek(-1)} style={styles.navButton}><Ionicons name="chevron-back" size={24} color="#FFF" /></TouchableOpacity>
        <Text style={styles.weekRange}>{formatWeekRange()}</Text>
        <TouchableOpacity onPress={() => navigateWeek(1)} style={styles.navButton}><Ionicons name="chevron-forward" size={24} color="#FFF" /></TouchableOpacity>
        <TouchableOpacity style={styles.todayButton} onPress={() => { setCurrentWeekStart(new Date()); setLoading(true); }}>
          <Text style={styles.todayText}>Today</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scheduleGrid} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        {weekSchedule.map(renderDayColumn)}
      </ScrollView>

      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#10B981' }]} /><Text style={styles.legendText}>Adequate</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} /><Text style={styles.legendText}>Understaffed</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} /><Text style={styles.legendText}>Overstaffed</Text></View>
      </View>

      <Modal visible={!!selectedShift} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedShift(null)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedShift(null)}><Text style={styles.modalCancel}>Close</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Shift Details</Text>
            <View style={{ width: 50 }} />
          </View>
          {selectedShift && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailCard}>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Employee</Text><Text style={styles.detailValue}>{selectedShift.employee_name}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Position</Text><Text style={styles.detailValue}>{selectedShift.position}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Department</Text><Text style={styles.detailValue}>{selectedShift.department}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Date</Text><Text style={styles.detailValue}>{new Date(selectedShift.date).toLocaleDateString()}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Time</Text><Text style={styles.detailValue}>{selectedShift.start_time} - {selectedShift.end_time}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Status</Text><Text style={[styles.detailValue, { color: getStatusColor(selectedShift.status) }]}>{selectedShift.status}</Text></View>
              </View>
            </ScrollView>
          )}
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
  statsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 12, padding: 12 },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 6 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  navButton: { padding: 8 },
  weekRange: { fontSize: 16, fontWeight: '600', color: '#FFF', marginHorizontal: 12 },
  todayButton: { backgroundColor: '#1473FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginLeft: 12 },
  todayText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  scheduleGrid: { flex: 1, paddingHorizontal: 8 },
  dayColumn: { width: 140, marginHorizontal: 4, marginTop: 12 },
  dayHeader: { alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 10, padding: 10, marginBottom: 8 },
  dayName: { fontSize: 12, color: '#a0a0a0' },
  dayDate: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginTop: 2 },
  coverageDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  shiftsColumn: { maxHeight: 350 },
  shiftCard: { backgroundColor: '#1a1a2e', borderRadius: 8, padding: 10, marginBottom: 6, borderLeftWidth: 3 },
  shiftTime: { fontSize: 11, fontWeight: '600', color: '#1473FF' },
  shiftEmployee: { fontSize: 13, fontWeight: '500', color: '#FFF', marginTop: 4 },
  shiftPosition: { fontSize: 11, color: '#666', marginTop: 2 },
  noShifts: { fontSize: 12, color: '#666', textAlign: 'center', paddingVertical: 20 },
  dayTotal: { fontSize: 12, color: '#a0a0a0', textAlign: 'center', marginTop: 8 },
  legend: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 12, gap: 20, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: '#666' },
  modalContainer: { flex: 1, backgroundColor: '#0f0f23' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  modalCancel: { fontSize: 16, color: '#1473FF' },
  modalContent: { padding: 20 },
  detailCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  detailLabel: { fontSize: 14, color: '#666' },
  detailValue: { fontSize: 14, color: '#FFF', fontWeight: '500' },
});
