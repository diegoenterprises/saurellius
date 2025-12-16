/**
 * CONTRACTOR AVAILABILITY CALENDAR SCREEN
 * Manage and share availability with clients
 * Block time, set working hours, sync calendars
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

interface TimeBlock {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: 'available' | 'busy' | 'tentative' | 'meeting';
  title?: string;
  client_name?: string;
  is_recurring: boolean;
}

interface DayAvailability {
  date: string;
  day_name: string;
  is_working_day: boolean;
  available_hours: number;
  blocks: TimeBlock[];
}

interface AvailabilityStats {
  hours_available_this_week: number;
  hours_booked_this_week: number;
  utilization_rate: number;
  upcoming_meetings: number;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ContractorAvailabilityCalendarScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weekData, setWeekData] = useState<DayAvailability[]>([]);
  const [stats, setStats] = useState<AvailabilityStats | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  }

  const fetchData = useCallback(async () => {
    try {
      const [weekRes, statsRes] = await Promise.all([
        api.get('/api/contractor/availability/week', { params: { start: currentWeekStart.toISOString() } }),
        api.get('/api/contractor/availability/stats'),
      ]);
      setWeekData(weekRes.data.days || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch availability:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentWeekStart]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    return `${h > 12 ? h - 12 : h}${minutes !== '00' ? ':' + minutes : ''}${h >= 12 ? 'pm' : 'am'}`;
  };

  const formatWeekRange = () => {
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    return `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const navigateWeek = (direction: number) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + (direction * 7));
    setCurrentWeekStart(newStart);
    setLoading(true);
  };

  const getBlockColor = (type: string) => {
    switch (type) {
      case 'available': return '#10B981';
      case 'busy': return '#EF4444';
      case 'tentative': return '#F59E0B';
      case 'meeting': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const handleAddBlock = (date: string) => {
    Alert.alert('Add Time Block', 'What would you like to add?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Available', onPress: () => navigation.navigate('AddTimeBlock', { date, type: 'available' }) },
      { text: 'Busy', onPress: () => navigation.navigate('AddTimeBlock', { date, type: 'busy' }) },
    ]);
  };

  const handleDeleteBlock = async (block: TimeBlock) => {
    Alert.alert('Delete Block', 'Remove this time block?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/api/contractor/availability/blocks/${block.id}`);
          fetchData();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete');
        }
      }},
    ]);
  };

  const renderDayColumn = (day: DayAvailability, index: number) => {
    const isToday = new Date().toDateString() === new Date(day.date).toDateString();
    const isSelected = selectedDate === day.date;

    return (
      <TouchableOpacity key={day.date} style={[styles.dayColumn, isSelected && styles.selectedDay]} onPress={() => setSelectedDate(day.date)}>
        <View style={[styles.dayHeader, isToday && styles.todayHeader]}>
          <Text style={[styles.dayName, isToday && styles.todayText]}>{DAYS_OF_WEEK[index]}</Text>
          <Text style={[styles.dayNumber, isToday && styles.todayText]}>{new Date(day.date).getDate()}</Text>
        </View>
        <View style={styles.dayContent}>
          {day.is_working_day ? (
            <>
              {day.blocks.slice(0, 3).map(block => (
                <TouchableOpacity key={block.id} style={[styles.miniBlock, { backgroundColor: getBlockColor(block.type) + '30' }]} onLongPress={() => handleDeleteBlock(block)}>
                  <View style={[styles.miniBlockIndicator, { backgroundColor: getBlockColor(block.type) }]} />
                  <Text style={styles.miniBlockTime}>{formatTime(block.start_time)}</Text>
                </TouchableOpacity>
              ))}
              {day.blocks.length > 3 && <Text style={styles.moreBlocks}>+{day.blocks.length - 3}</Text>}
              {day.blocks.length === 0 && <Text style={styles.noBlocks}>No blocks</Text>}
            </>
          ) : (
            <Text style={styles.dayOff}>Day off</Text>
          )}
        </View>
        <View style={styles.dayFooter}>
          <Text style={styles.availableHours}>{day.available_hours}h</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectedDayDetails = () => {
    const day = weekData.find(d => d.date === selectedDate);
    if (!day) return null;

    return (
      <View style={styles.detailsSection}>
        <View style={styles.detailsHeader}>
          <Text style={styles.detailsTitle}>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => handleAddBlock(day.date)}>
            <Ionicons name="add" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
        
        {day.blocks.length > 0 ? day.blocks.map(block => (
          <TouchableOpacity key={block.id} style={styles.blockCard} onLongPress={() => handleDeleteBlock(block)}>
            <View style={[styles.blockIndicator, { backgroundColor: getBlockColor(block.type) }]} />
            <View style={styles.blockInfo}>
              <Text style={styles.blockTime}>{formatTime(block.start_time)} - {formatTime(block.end_time)}</Text>
              <Text style={styles.blockTitle}>{block.title || block.type.charAt(0).toUpperCase() + block.type.slice(1)}</Text>
              {block.client_name && <Text style={styles.blockClient}>{block.client_name}</Text>}
            </View>
            <View style={[styles.blockType, { backgroundColor: getBlockColor(block.type) + '20' }]}>
              <Text style={[styles.blockTypeText, { color: getBlockColor(block.type) }]}>{block.type}</Text>
            </View>
          </TouchableOpacity>
        )) : (
          <View style={styles.emptyDay}>
            <Text style={styles.emptyDayText}>No time blocks scheduled</Text>
            <TouchableOpacity style={styles.addBlockButton} onPress={() => handleAddBlock(day.date)}>
              <Ionicons name="add-circle" size={18} color="#1473FF" />
              <Text style={styles.addBlockText}>Add availability</Text>
            </TouchableOpacity>
          </View>
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
          <Text style={styles.headerTitle}>Availability</Text>
          <TouchableOpacity><Ionicons name="settings-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.hours_available_this_week}h</Text><Text style={styles.statLabel}>Available</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.hours_booked_this_week}h</Text><Text style={styles.statLabel}>Booked</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.utilization_rate}%</Text><Text style={styles.statLabel}>Utilization</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.upcoming_meetings}</Text><Text style={styles.statLabel}>Meetings</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.weekNav}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigateWeek(-1)}><Ionicons name="chevron-back" size={24} color="#FFF" /></TouchableOpacity>
        <Text style={styles.weekRange}>{formatWeekRange()}</Text>
        <TouchableOpacity style={styles.navButton} onPress={() => navigateWeek(1)}><Ionicons name="chevron-forward" size={24} color="#FFF" /></TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekView}>
        <View style={styles.weekGrid}>
          {weekData.map((day, index) => renderDayColumn(day, index))}
        </View>
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        {selectedDate ? renderSelectedDayDetails() : (
          <View style={styles.selectPrompt}><Ionicons name="calendar-outline" size={32} color="#666" /><Text style={styles.selectText}>Select a day to view details</Text></View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingBottom: 16 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  statsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 12, padding: 12 },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 6 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  weekNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  navButton: { padding: 8 },
  weekRange: { fontSize: 16, fontWeight: '600', color: colors.text },
  weekView: { maxHeight: 160, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  weekGrid: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 10 },
  dayColumn: { width: 80, marginHorizontal: 4, backgroundColor: colors.card, borderRadius: 12, padding: 8, borderWidth: 1, borderColor: '#2a2a4e' },
  selectedDay: { borderColor: '#1473FF', backgroundColor: '#1473FF10' },
  dayHeader: { alignItems: 'center', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  todayHeader: { backgroundColor: '#1473FF', borderRadius: 8, padding: 4, marginBottom: 4 },
  dayName: { fontSize: 11, color: '#666' },
  todayText: { color: colors.text },
  dayNumber: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  dayContent: { minHeight: 60, paddingVertical: 6 },
  miniBlock: { borderRadius: 4, padding: 4, marginBottom: 4, flexDirection: 'row', alignItems: 'center' },
  miniBlockIndicator: { width: 3, height: '100%', borderRadius: 2, marginRight: 4 },
  miniBlockTime: { fontSize: 9, color: '#a0a0a0' },
  moreBlocks: { fontSize: 10, color: '#666', textAlign: 'center' },
  noBlocks: { fontSize: 10, color: '#666', textAlign: 'center', fontStyle: 'italic' },
  dayOff: { fontSize: 10, color: '#666', textAlign: 'center', fontStyle: 'italic' },
  dayFooter: { alignItems: 'center', paddingTop: 6, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  availableHours: { fontSize: 12, fontWeight: '600', color: '#10B981' },
  content: { flex: 1 },
  detailsSection: { padding: 16 },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  detailsTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  addButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center' },
  blockCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a4e' },
  blockIndicator: { width: 4, height: '100%', borderRadius: 2, marginRight: 12 },
  blockInfo: { flex: 1 },
  blockTime: { fontSize: 14, fontWeight: '600', color: colors.text },
  blockTitle: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  blockClient: { fontSize: 12, color: '#666', marginTop: 2 },
  blockType: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  blockTypeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  emptyDay: { alignItems: 'center', paddingVertical: 30 },
  emptyDayText: { fontSize: 14, color: '#666' },
  addBlockButton: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  addBlockText: { fontSize: 14, color: '#1473FF' },
  selectPrompt: { alignItems: 'center', paddingVertical: 40 },
  selectText: { fontSize: 14, color: '#666', marginTop: 10 },
});
