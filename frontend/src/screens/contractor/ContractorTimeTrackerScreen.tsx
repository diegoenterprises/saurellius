/**
 * CONTRACTOR TIME TRACKER SCREEN
 * Track billable time with timer and manual entry
 * View time logs, reports, and billing summaries
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface TimeEntry {
  id: string;
  project_id?: string;
  project_name?: string;
  client_name?: string;
  task_description: string;
  start_time: string;
  end_time?: string;
  duration_minutes: number;
  billable: boolean;
  billed: boolean;
  hourly_rate?: number;
  amount?: number;
  notes?: string;
}

interface TimeStats {
  today_hours: number;
  week_hours: number;
  month_hours: number;
  billable_amount: number;
  unbilled_amount: number;
}

interface ActiveTimer {
  id: string;
  project_name?: string;
  task_description: string;
  start_time: string;
  elapsed_seconds: number;
}

export default function ContractorTimeTrackerScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [stats, setStats] = useState<TimeStats | null>(null);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ task_description: '', project_id: '', hours: '', minutes: '', notes: '', billable: true });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [entriesRes, statsRes, timerRes] = await Promise.all([
        api.get('/api/contractor/time-entries'),
        api.get('/api/contractor/time-entries/stats'),
        api.get('/api/contractor/time-entries/active'),
      ]);
      setEntries(entriesRes.data.entries || []);
      setStats(statsRes.data.stats || null);
      if (timerRes.data.timer) {
        setActiveTimer(timerRes.data.timer);
        setTimerSeconds(timerRes.data.timer.elapsed_seconds || 0);
      }
    } catch (error) {
      console.error('Failed to fetch time data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (activeTimer) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeTimer]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatHours = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTimeRange = (start: string, end?: string) => {
    const startTime = new Date(start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (!end) return `${startTime} - now`;
    const endTime = new Date(end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${startTime} - ${endTime}`;
  };

  const handleStartTimer = async () => {
    const description = await new Promise<string | null>((resolve) => {
      Alert.prompt('Start Timer', 'What are you working on?', [
        { text: 'Cancel', onPress: () => resolve(null), style: 'cancel' },
        { text: 'Start', onPress: (text) => resolve(text || 'Working') },
      ], 'plain-text', '');
    });
    if (!description) return;

    try {
      const response = await api.post('/api/contractor/time-entries/start', { task_description: description });
      setActiveTimer(response.data.timer);
      setTimerSeconds(0);
    } catch (error) {
      Alert.alert('Error', 'Failed to start timer');
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;
    Alert.alert('Stop Timer', `Stop tracking "${activeTimer.task_description}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Stop', onPress: async () => {
        try {
          await api.post(`/api/contractor/time-entries/${activeTimer.id}/stop`);
          setActiveTimer(null);
          setTimerSeconds(0);
          fetchData();
        } catch (error) {
          Alert.alert('Error', 'Failed to stop timer');
        }
      }},
    ]);
  };

  const handleAddManualEntry = async () => {
    if (!formData.task_description.trim() || (!formData.hours && !formData.minutes)) {
      Alert.alert('Error', 'Description and duration are required');
      return;
    }
    try {
      const duration = (parseInt(formData.hours) || 0) * 60 + (parseInt(formData.minutes) || 0);
      await api.post('/api/contractor/time-entries', {
        task_description: formData.task_description,
        project_id: formData.project_id || undefined,
        duration_minutes: duration,
        notes: formData.notes,
        billable: formData.billable,
      });
      setShowAddModal(false);
      setFormData({ task_description: '', project_id: '', hours: '', minutes: '', notes: '', billable: true });
      fetchData();
      Alert.alert('Success', 'Time entry added');
    } catch (error) {
      Alert.alert('Error', 'Failed to add time entry');
    }
  };

  const handleDeleteEntry = (entry: TimeEntry) => {
    if (entry.billed) {
      Alert.alert('Cannot Delete', 'This entry has already been billed');
      return;
    }
    Alert.alert('Delete Entry', 'Delete this time entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/api/contractor/time-entries/${entry.id}`);
          fetchData();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete entry');
        }
      }},
    ]);
  };

  const groupEntriesByDate = () => {
    const groups: { [key: string]: TimeEntry[] } = {};
    entries.forEach(entry => {
      const date = new Date(entry.start_time).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(entry);
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Time Tracker</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>

        <View style={styles.timerCard}>
          {activeTimer ? (
            <>
              <Text style={styles.timerTask}>{activeTimer.task_description}</Text>
              {activeTimer.project_name && <Text style={styles.timerProject}>{activeTimer.project_name}</Text>}
              <Text style={styles.timerDisplay}>{formatTime(timerSeconds)}</Text>
              <TouchableOpacity style={styles.stopButton} onPress={handleStopTimer}>
                <Ionicons name="stop" size={24} color="#FFF" />
                <Text style={styles.stopButtonText}>Stop</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.timerIdle}>No active timer</Text>
              <TouchableOpacity style={styles.startButton} onPress={handleStartTimer}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.startGradient}>
                  <Ionicons name="play" size={24} color="#FFF" />
                  <Text style={styles.startButtonText}>Start Timer</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </LinearGradient>

      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}><Text style={styles.statValue}>{stats.today_hours.toFixed(1)}h</Text><Text style={styles.statLabel}>Today</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}><Text style={styles.statValue}>{stats.week_hours.toFixed(1)}h</Text><Text style={styles.statLabel}>Week</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}><Text style={styles.statValue}>{stats.month_hours.toFixed(1)}h</Text><Text style={styles.statLabel}>Month</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}><Text style={[styles.statValue, { color: '#10B981' }]}>{formatCurrency(stats.unbilled_amount)}</Text><Text style={styles.statLabel}>Unbilled</Text></View>
        </View>
      )}

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        {groupEntriesByDate().map(([date, dayEntries]) => (
          <View key={date} style={styles.daySection}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{formatDate(date)}</Text>
              <Text style={styles.dayTotal}>{formatHours(dayEntries.reduce((acc, e) => acc + e.duration_minutes, 0))}</Text>
            </View>
            {dayEntries.map(entry => (
              <TouchableOpacity key={entry.id} style={styles.entryCard} onLongPress={() => handleDeleteEntry(entry)}>
                <View style={styles.entryLeft}>
                  <View style={[styles.billableDot, { backgroundColor: entry.billable ? '#10B981' : '#6B7280' }]} />
                  <View style={styles.entryInfo}>
                    <Text style={styles.entryTask}>{entry.task_description}</Text>
                    {entry.project_name && <Text style={styles.entryProject}>{entry.project_name}</Text>}
                    <Text style={styles.entryTime}>{formatTimeRange(entry.start_time, entry.end_time)}</Text>
                  </View>
                </View>
                <View style={styles.entryRight}>
                  <Text style={styles.entryDuration}>{formatHours(entry.duration_minutes)}</Text>
                  {entry.amount && <Text style={styles.entryAmount}>{formatCurrency(entry.amount)}</Text>}
                  {entry.billed && <View style={styles.billedBadge}><Text style={styles.billedText}>Billed</Text></View>}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        {entries.length === 0 && (
          <View style={styles.emptyState}><Ionicons name="time-outline" size={48} color="#666" /><Text style={styles.emptyText}>No time entries yet</Text></View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Add Time Entry</Text>
            <TouchableOpacity onPress={handleAddManualEntry}><Text style={styles.modalSave}>Save</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Description *</Text><TextInput style={styles.input} value={formData.task_description} onChangeText={t => setFormData(p => ({...p, task_description: t}))} placeholder="What did you work on?" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Duration *</Text>
              <View style={styles.durationRow}>
                <View style={styles.durationInput}><TextInput style={styles.durationField} value={formData.hours} onChangeText={t => setFormData(p => ({...p, hours: t}))} placeholder="0" placeholderTextColor="#666" keyboardType="number-pad" /><Text style={styles.durationLabel}>hours</Text></View>
                <View style={styles.durationInput}><TextInput style={styles.durationField} value={formData.minutes} onChangeText={t => setFormData(p => ({...p, minutes: t}))} placeholder="0" placeholderTextColor="#666" keyboardType="number-pad" /><Text style={styles.durationLabel}>min</Text></View>
              </View>
            </View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Notes</Text><TextInput style={[styles.input, styles.textArea]} value={formData.notes} onChangeText={t => setFormData(p => ({...p, notes: t}))} placeholder="Optional notes" placeholderTextColor="#666" multiline numberOfLines={3} /></View>
            <TouchableOpacity style={styles.billableToggle} onPress={() => setFormData(p => ({...p, billable: !p.billable}))}>
              <Ionicons name={formData.billable ? 'checkbox' : 'square-outline'} size={24} color={formData.billable ? '#10B981' : '#666'} />
              <Text style={styles.billableLabel}>Billable time</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingBottom: 20 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  timerCard: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 16, padding: 24 },
  timerTask: { fontSize: 16, fontWeight: '600', color: '#FFF', textAlign: 'center' },
  timerProject: { fontSize: 13, color: '#a0a0a0', marginTop: 4 },
  timerDisplay: { fontSize: 48, fontWeight: 'bold', color: '#10B981', marginVertical: 16, fontVariant: ['tabular-nums'] },
  timerIdle: { fontSize: 16, color: '#a0a0a0', marginBottom: 16 },
  stopButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF4444', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, gap: 8 },
  stopButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  startButton: { borderRadius: 12, overflow: 'hidden' },
  startGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 14, gap: 8 },
  startButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  statsRow: { flexDirection: 'row', backgroundColor: '#1a1a2e', marginHorizontal: 16, marginTop: 16, borderRadius: 12, padding: 14 },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#2a2a4e', marginHorizontal: 8 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: '#666', marginTop: 2 },
  content: { flex: 1, marginTop: 8 },
  daySection: { marginBottom: 16 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  dayTitle: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  dayTotal: { fontSize: 13, color: '#a0a0a0' },
  entryCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a2e', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2a2a4e' },
  entryLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  billableDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  entryInfo: { flex: 1 },
  entryTask: { fontSize: 14, fontWeight: '500', color: '#FFF' },
  entryProject: { fontSize: 12, color: '#666', marginTop: 2 },
  entryTime: { fontSize: 11, color: '#a0a0a0', marginTop: 4 },
  entryRight: { alignItems: 'flex-end' },
  entryDuration: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  entryAmount: { fontSize: 12, color: '#10B981', marginTop: 2 },
  billedBadge: { backgroundColor: '#10B98120', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  billedText: { fontSize: 10, color: '#10B981', fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
  modalContainer: { flex: 1, backgroundColor: '#0f0f23' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  modalCancel: { fontSize: 16, color: '#a0a0a0' },
  modalSave: { fontSize: 16, fontWeight: '600', color: '#1473FF' },
  modalContent: { padding: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, color: '#a0a0a0', marginBottom: 6 },
  input: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14, fontSize: 16, color: '#FFF', borderWidth: 1, borderColor: '#2a2a4e' },
  textArea: { height: 80, textAlignVertical: 'top' },
  durationRow: { flexDirection: 'row', gap: 12 },
  durationInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 10, borderWidth: 1, borderColor: '#2a2a4e' },
  durationField: { flex: 1, padding: 14, fontSize: 18, fontWeight: '600', color: '#FFF', textAlign: 'center' },
  durationLabel: { fontSize: 14, color: '#666', paddingRight: 14 },
  billableToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  billableLabel: { fontSize: 15, color: '#FFF' },
});
