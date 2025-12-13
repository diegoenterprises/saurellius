/**
 * CONTRACTOR AVAILABILITY CALENDAR SCREEN
 * Set and manage availability for clients
 * Block time, set working hours, manage schedule
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface BlockedTime {
  id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  all_day: boolean;
}

interface AvailabilityData {
  weekly_schedule: WeeklySchedule;
  blocked_times: BlockedTime[];
  timezone: string;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DEFAULT_SCHEDULE: WeeklySchedule = {
  monday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  tuesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  wednesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  thursday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  friday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  saturday: { enabled: false, slots: [] },
  sunday: { enabled: false, slots: [] },
};

export default function ContractorAvailabilityScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [schedule, setSchedule] = useState<WeeklySchedule>(DEFAULT_SCHEDULE);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [editingDay, setEditingDay] = useState<typeof DAYS[number] | null>(null);

  const fetchAvailability = useCallback(async () => {
    try {
      const response = await api.get('/api/contractor/availability');
      const data = response.data.availability || { weekly_schedule: DEFAULT_SCHEDULE, blocked_times: [] };
      setAvailability(data);
      setSchedule(data.weekly_schedule || DEFAULT_SCHEDULE);
    } catch (error) {
      console.error('Failed to fetch availability:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAvailability();
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const toggleDay = async (day: typeof DAYS[number]) => {
    const newSchedule = {
      ...schedule,
      [day]: {
        ...schedule[day],
        enabled: !schedule[day].enabled,
        slots: !schedule[day].enabled ? [{ start: '09:00', end: '17:00' }] : [],
      },
    };
    setSchedule(newSchedule);
    await saveSchedule(newSchedule);
  };

  const saveSchedule = async (newSchedule: WeeklySchedule) => {
    setSaving(true);
    try {
      await api.put('/api/contractor/availability/schedule', { weekly_schedule: newSchedule });
    } catch (error) {
      Alert.alert('Error', 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlockedTime = async (startDate: Date, endDate: Date, reason: string, allDay: boolean) => {
    try {
      await api.post('/api/contractor/availability/block', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        reason,
        all_day: allDay,
      });
      setShowBlockModal(false);
      fetchAvailability();
      Alert.alert('Success', 'Time blocked successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to block time');
    }
  };

  const handleRemoveBlockedTime = (blocked: BlockedTime) => {
    Alert.alert(
      'Remove Blocked Time',
      'Are you sure you want to remove this blocked time?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/contractor/availability/block/${blocked.id}`);
              fetchAvailability();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove blocked time');
            }
          },
        },
      ]
    );
  };

  const getCalendarDays = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days: (Date | null)[] = [];

    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isDateBlocked = (date: Date) => {
    if (!availability?.blocked_times) return false;
    return availability.blocked_times.some(blocked => {
      const start = new Date(blocked.start_date);
      const end = new Date(blocked.end_date);
      return date >= start && date <= end;
    });
  };

  const getDayOfWeek = (date: Date) => {
    return DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1];
  };

  const isWorkingDay = (date: Date) => {
    const day = getDayOfWeek(date);
    return schedule[day]?.enabled || false;
  };

  const renderWeeklySchedule = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Weekly Schedule</Text>
      <Text style={styles.sectionSubtitle}>Set your regular working hours</Text>

      <View style={styles.scheduleCard}>
        {DAYS.map((day, index) => (
          <View key={day} style={styles.dayRow}>
            <TouchableOpacity
              style={styles.dayToggle}
              onPress={() => toggleDay(day)}
            >
              <View style={[styles.dayCheckbox, schedule[day].enabled && styles.dayCheckboxActive]}>
                {schedule[day].enabled && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
              <Text style={[styles.dayLabel, !schedule[day].enabled && styles.dayLabelDisabled]}>
                {DAY_LABELS[index]}
              </Text>
            </TouchableOpacity>

            {schedule[day].enabled ? (
              <TouchableOpacity 
                style={styles.timeSlots}
                onPress={() => setEditingDay(day)}
              >
                {schedule[day].slots.map((slot, i) => (
                  <View key={i} style={styles.timeSlot}>
                    <Text style={styles.timeText}>
                      {formatTime(slot.start)} - {formatTime(slot.end)}
                    </Text>
                  </View>
                ))}
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </TouchableOpacity>
            ) : (
              <Text style={styles.unavailableText}>Unavailable</Text>
            )}
          </View>
        ))}
      </View>

      {saving && (
        <View style={styles.savingIndicator}>
          <ActivityIndicator size="small" color="#1473FF" />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      )}
    </View>
  );

  const renderCalendar = () => {
    const days = getCalendarDays();
    const today = new Date();

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Calendar View</Text>
        
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            onPress={() => {
              const newMonth = new Date(selectedMonth);
              newMonth.setMonth(newMonth.getMonth() - 1);
              setSelectedMonth(newMonth);
            }}
          >
            <Ionicons name="chevron-back" size={24} color="#1473FF" />
          </TouchableOpacity>
          <Text style={styles.calendarMonth}>
            {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity
            onPress={() => {
              const newMonth = new Date(selectedMonth);
              newMonth.setMonth(newMonth.getMonth() + 1);
              setSelectedMonth(newMonth);
            }}
          >
            <Ionicons name="chevron-forward" size={24} color="#1473FF" />
          </TouchableOpacity>
        </View>

        <View style={styles.calendarGrid}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <Text key={i} style={styles.calendarWeekday}>{d}</Text>
          ))}
          
          {days.map((date, index) => {
            if (!date) {
              return <View key={`empty-${index}`} style={styles.calendarDay} />;
            }

            const isToday = date.toDateString() === today.toDateString();
            const blocked = isDateBlocked(date);
            const working = isWorkingDay(date);
            const isPast = date < today;

            return (
              <TouchableOpacity
                key={date.toISOString()}
                style={[
                  styles.calendarDay,
                  isToday && styles.calendarDayToday,
                  blocked && styles.calendarDayBlocked,
                  !working && !blocked && styles.calendarDayOff,
                  isPast && styles.calendarDayPast,
                ]}
                onPress={() => {
                  if (!isPast) {
                    Alert.alert(
                      formatDate(date.toISOString()),
                      blocked ? 'This time is blocked' : working ? 'Available' : 'Not a working day',
                      blocked ? [
                        { text: 'OK' },
                        { text: 'Unblock', onPress: () => {
                          const blockedItem = availability?.blocked_times.find(b => 
                            new Date(b.start_date) <= date && new Date(b.end_date) >= date
                          );
                          if (blockedItem) handleRemoveBlockedTime(blockedItem);
                        }}
                      ] : [{ text: 'OK' }]
                    );
                  }
                }}
              >
                <Text style={[
                  styles.calendarDayText,
                  isToday && styles.calendarDayTextToday,
                  blocked && styles.calendarDayTextBlocked,
                  isPast && styles.calendarDayTextPast,
                ]}>
                  {date.getDate()}
                </Text>
                {blocked && <View style={styles.blockedDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Blocked</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2a2a4e' }]} />
            <Text style={styles.legendText}>Off</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderBlockedTimes = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Blocked Time</Text>
        <TouchableOpacity 
          style={styles.addBlockButton}
          onPress={() => setShowBlockModal(true)}
        >
          <Ionicons name="add" size={20} color="#1473FF" />
          <Text style={styles.addBlockText}>Block Time</Text>
        </TouchableOpacity>
      </View>

      {availability?.blocked_times && availability.blocked_times.length > 0 ? (
        availability.blocked_times.map((blocked) => (
          <View key={blocked.id} style={styles.blockedCard}>
            <View style={styles.blockedIcon}>
              <Ionicons name="ban" size={20} color="#EF4444" />
            </View>
            <View style={styles.blockedInfo}>
              <Text style={styles.blockedDates}>
                {formatDate(blocked.start_date)} - {formatDate(blocked.end_date)}
              </Text>
              {blocked.reason && (
                <Text style={styles.blockedReason}>{blocked.reason}</Text>
              )}
              <Text style={styles.blockedType}>
                {blocked.all_day ? 'All day' : 'Partial day'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleRemoveBlockedTime(blocked)}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View style={styles.noBlockedTime}>
          <Ionicons name="calendar-outline" size={32} color="#666" />
          <Text style={styles.noBlockedText}>No blocked time periods</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1473FF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Availability</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.headerInfo}>
          <Ionicons name="time" size={20} color="#10B981" />
          <Text style={styles.headerInfoText}>
            Timezone: {availability?.timezone || 'UTC'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />
        }
      >
        {renderWeeklySchedule()}
        {renderCalendar()}
        {renderBlockedTimes()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerInfoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#a0a0a0',
    marginBottom: 16,
  },
  scheduleCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  dayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  dayCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dayCheckboxActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
  },
  dayLabelDisabled: {
    color: '#666',
  },
  timeSlots: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  timeSlot: {
    backgroundColor: '#1473FF20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  timeText: {
    fontSize: 13,
    color: '#1473FF',
    fontWeight: '500',
  },
  unavailableText: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  savingText: {
    fontSize: 13,
    color: '#1473FF',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  calendarWeekday: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    paddingVertical: 8,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  calendarDayToday: {
    backgroundColor: '#1473FF',
  },
  calendarDayBlocked: {
    backgroundColor: '#EF444420',
  },
  calendarDayOff: {
    backgroundColor: '#2a2a4e',
  },
  calendarDayPast: {
    opacity: 0.4,
  },
  calendarDayText: {
    fontSize: 14,
    color: '#FFF',
  },
  calendarDayTextToday: {
    fontWeight: 'bold',
  },
  calendarDayTextBlocked: {
    color: '#EF4444',
  },
  calendarDayTextPast: {
    color: '#666',
  },
  blockedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EF4444',
    marginTop: 2,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  addBlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addBlockText: {
    fontSize: 14,
    color: '#1473FF',
    fontWeight: '500',
  },
  blockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  blockedIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EF444420',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  blockedInfo: {
    flex: 1,
  },
  blockedDates: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFF',
  },
  blockedReason: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 2,
  },
  blockedType: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  noBlockedTime: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noBlockedText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
});
