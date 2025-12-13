/**
 * EMPLOYEE TIMESHEET ENTRY SCREEN
 * Clock in/out, log hours, track breaks
 * Weekly timesheet view with submission workflow
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface TimeEntry {
  id: string;
  date: string;
  clock_in?: string;
  clock_out?: string;
  break_duration: number;
  total_hours: number;
  overtime_hours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  notes?: string;
  project?: string;
}

interface WeekSummary {
  week_start: string;
  week_end: string;
  total_regular: number;
  total_overtime: number;
  total_hours: number;
  status: 'incomplete' | 'complete' | 'submitted' | 'approved';
  entries: TimeEntry[];
}

interface ClockStatus {
  is_clocked_in: boolean;
  clock_in_time?: string;
  current_break?: {
    start_time: string;
  };
}

export default function TimesheetEntryScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clockStatus, setClockStatus] = useState<ClockStatus | null>(null);
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [entryForm, setEntryForm] = useState({
    clock_in: '',
    clock_out: '',
    break_duration: '0',
    notes: '',
    project: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const weekStart = getWeekStart(selectedDate);
      const [statusRes, weekRes] = await Promise.all([
        api.get('/api/employee/timesheet/status'),
        api.get(`/api/employee/timesheet/week?start=${weekStart.toISOString()}`),
      ]);
      
      setClockStatus(statusRes.data.status || null);
      setWeekSummary(weekRes.data.summary || null);
    } catch (error) {
      console.error('Failed to fetch timesheet data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getWeekDays = () => {
    const weekStart = getWeekStart(selectedDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '--:--';
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleClockIn = async () => {
    try {
      await api.post('/api/employee/timesheet/clock-in');
      fetchData();
      Alert.alert('Clocked In', `You clocked in at ${formatTime(new Date().toISOString())}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    Alert.alert(
      'Clock Out',
      'Are you sure you want to clock out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clock Out',
          onPress: async () => {
            try {
              await api.post('/api/employee/timesheet/clock-out');
              fetchData();
              Alert.alert('Clocked Out', 'Your time has been recorded');
            } catch (error) {
              Alert.alert('Error', 'Failed to clock out');
            }
          },
        },
      ]
    );
  };

  const handleStartBreak = async () => {
    try {
      await api.post('/api/employee/timesheet/break/start');
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to start break');
    }
  };

  const handleEndBreak = async () => {
    try {
      await api.post('/api/employee/timesheet/break/end');
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to end break');
    }
  };

  const handleEditEntry = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setEntryForm({
      clock_in: entry.clock_in || '',
      clock_out: entry.clock_out || '',
      break_duration: entry.break_duration.toString(),
      notes: entry.notes || '',
      project: entry.project || '',
    });
    setShowEntryModal(true);
  };

  const handleSaveEntry = async () => {
    if (!selectedEntry) return;
    
    setSubmitting(true);
    try {
      await api.put(`/api/employee/timesheet/entry/${selectedEntry.id}`, {
        clock_in: entryForm.clock_in,
        clock_out: entryForm.clock_out,
        break_duration: parseInt(entryForm.break_duration) || 0,
        notes: entryForm.notes,
        project: entryForm.project,
      });
      
      setShowEntryModal(false);
      fetchData();
      Alert.alert('Success', 'Time entry updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to save entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitTimesheet = async () => {
    if (!weekSummary) return;
    
    Alert.alert(
      'Submit Timesheet',
      `Submit timesheet for ${formatDate(new Date(weekSummary.week_start))} - ${formatDate(new Date(weekSummary.week_end))}?\n\nTotal: ${formatHours(weekSummary.total_hours)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.post('/api/employee/timesheet/submit', {
                week_start: weekSummary.week_start,
              });
              fetchData();
              Alert.alert('Success', 'Timesheet submitted for approval');
            } catch (error) {
              Alert.alert('Error', 'Failed to submit timesheet');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const getEntryForDate = (date: Date) => {
    if (!weekSummary) return null;
    const dateStr = date.toISOString().split('T')[0];
    return weekSummary.entries.find(e => e.date.split('T')[0] === dateStr);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'submitted': return '#3B82F6';
      case 'rejected': return '#EF4444';
      case 'draft': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const renderClockWidget = () => (
    <View style={styles.clockWidget}>
      <View style={styles.clockStatus}>
        <View style={[
          styles.clockIndicator, 
          { backgroundColor: clockStatus?.is_clocked_in ? '#10B981' : '#6B7280' }
        ]} />
        <View>
          <Text style={styles.clockStatusText}>
            {clockStatus?.is_clocked_in ? 'Currently Working' : 'Not Clocked In'}
          </Text>
          {clockStatus?.clock_in_time && (
            <Text style={styles.clockTimeText}>
              Since {formatTime(clockStatus.clock_in_time)}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.clockActions}>
        {!clockStatus?.is_clocked_in ? (
          <TouchableOpacity style={styles.clockInButton} onPress={handleClockIn}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.clockButtonGradient}
            >
              <Ionicons name="play" size={24} color="#FFF" />
              <Text style={styles.clockButtonText}>Clock In</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <>
            {clockStatus.current_break ? (
              <TouchableOpacity style={styles.breakButton} onPress={handleEndBreak}>
                <Ionicons name="cafe" size={20} color="#F59E0B" />
                <Text style={styles.breakButtonText}>End Break</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.breakButton} onPress={handleStartBreak}>
                <Ionicons name="cafe-outline" size={20} color="#F59E0B" />
                <Text style={styles.breakButtonText}>Take Break</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.clockOutButton} onPress={handleClockOut}>
              <Ionicons name="stop" size={20} color="#EF4444" />
              <Text style={styles.clockOutButtonText}>Clock Out</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  const renderWeekNavigation = () => (
    <View style={styles.weekNavigation}>
      <TouchableOpacity 
        onPress={() => {
          const newDate = new Date(selectedDate);
          newDate.setDate(newDate.getDate() - 7);
          setSelectedDate(newDate);
        }}
      >
        <Ionicons name="chevron-back" size={24} color="#1473FF" />
      </TouchableOpacity>
      <View style={styles.weekInfo}>
        <Text style={styles.weekLabel}>Week of</Text>
        <Text style={styles.weekDate}>{formatDate(getWeekStart(selectedDate))}</Text>
      </View>
      <TouchableOpacity 
        onPress={() => {
          const newDate = new Date(selectedDate);
          newDate.setDate(newDate.getDate() + 7);
          setSelectedDate(newDate);
        }}
      >
        <Ionicons name="chevron-forward" size={24} color="#1473FF" />
      </TouchableOpacity>
    </View>
  );

  const renderDayRow = (date: Date) => {
    const entry = getEntryForDate(date);
    const isToday = date.toDateString() === new Date().toDateString();

    return (
      <TouchableOpacity 
        key={date.toISOString()} 
        style={[styles.dayRow, isToday && styles.dayRowToday]}
        onPress={() => entry && handleEditEntry(entry)}
      >
        <View style={styles.dayInfo}>
          <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
            {date.toLocaleDateString('en-US', { weekday: 'short' })}
          </Text>
          <Text style={styles.dayDate}>
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        </View>

        {entry ? (
          <View style={styles.dayEntry}>
            <View style={styles.entryTimes}>
              <Text style={styles.entryTime}>{formatTime(entry.clock_in)}</Text>
              <Ionicons name="arrow-forward" size={14} color="#666" />
              <Text style={styles.entryTime}>{formatTime(entry.clock_out)}</Text>
            </View>
            <View style={styles.entryHours}>
              <Text style={styles.hoursText}>{formatHours(entry.total_hours)}</Text>
              {entry.overtime_hours > 0 && (
                <Text style={styles.overtimeText}>+{formatHours(entry.overtime_hours)} OT</Text>
              )}
            </View>
          </View>
        ) : (
          <Text style={styles.noEntry}>No time logged</Text>
        )}

        {entry && (
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(entry.status) }]} />
        )}
      </TouchableOpacity>
    );
  };

  const renderEntryModal = () => (
    <Modal
      visible={showEntryModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowEntryModal(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Time Entry</Text>
          <TouchableOpacity onPress={handleSaveEntry} disabled={submitting}>
            <Text style={[styles.modalSave, submitting && { opacity: 0.5 }]}>
              {submitting ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {selectedEntry && (
            <Text style={styles.entryDate}>
              {formatDate(new Date(selectedEntry.date))}
            </Text>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Clock In Time</Text>
            <TextInput
              style={styles.input}
              value={entryForm.clock_in ? formatTime(entryForm.clock_in) : ''}
              placeholder="HH:MM AM/PM"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Clock Out Time</Text>
            <TextInput
              style={styles.input}
              value={entryForm.clock_out ? formatTime(entryForm.clock_out) : ''}
              placeholder="HH:MM AM/PM"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Break Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={entryForm.break_duration}
              onChangeText={(text) => setEntryForm(prev => ({ ...prev, break_duration: text }))}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Project/Task (optional)</Text>
            <TextInput
              style={styles.input}
              value={entryForm.project}
              onChangeText={(text) => setEntryForm(prev => ({ ...prev, project: text }))}
              placeholder="Enter project or task name"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={entryForm.notes}
              onChangeText={(text) => setEntryForm(prev => ({ ...prev, notes: text }))}
              placeholder="Add any notes about this time entry"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Timesheet</Text>
          <View style={{ width: 24 }} />
        </View>

        {renderClockWidget()}
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />
        }
      >
        {renderWeekNavigation()}

        <View style={styles.weekSummaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Weekly Summary</Text>
            {weekSummary && (
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(weekSummary.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(weekSummary.status) }]}>
                  {weekSummary.status.charAt(0).toUpperCase() + weekSummary.status.slice(1)}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{formatHours(weekSummary?.total_regular || 0)}</Text>
              <Text style={styles.summaryStatLabel}>Regular</Text>
            </View>
            <View style={styles.summaryStatDivider} />
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryStatValue, { color: '#F59E0B' }]}>
                {formatHours(weekSummary?.total_overtime || 0)}
              </Text>
              <Text style={styles.summaryStatLabel}>Overtime</Text>
            </View>
            <View style={styles.summaryStatDivider} />
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryStatValue, { color: '#1473FF' }]}>
                {formatHours(weekSummary?.total_hours || 0)}
              </Text>
              <Text style={styles.summaryStatLabel}>Total</Text>
            </View>
          </View>
        </View>

        <View style={styles.weekEntries}>
          {getWeekDays().map(renderDayRow)}
        </View>

        {weekSummary?.status === 'complete' && (
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmitTimesheet}
            disabled={submitting}
          >
            <LinearGradient
              colors={['#1473FF', '#BE01FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#FFF" />
                  <Text style={styles.submitText}>Submit Timesheet</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {weekSummary?.status === 'submitted' && (
          <View style={styles.pendingCard}>
            <Ionicons name="time" size={24} color="#3B82F6" />
            <Text style={styles.pendingText}>Timesheet pending approval</Text>
          </View>
        )}

        {weekSummary?.status === 'approved' && (
          <View style={styles.approvedCard}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.approvedText}>Timesheet approved</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {renderEntryModal()}
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
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  clockWidget: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 16,
  },
  clockStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  clockIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  clockStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  clockTimeText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  clockActions: {
    flexDirection: 'row',
    gap: 10,
  },
  clockInButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  clockButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  clockButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  breakButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B20',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  breakButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  clockOutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF444420',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  clockOutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  content: {
    flex: 1,
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  weekInfo: {
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  weekDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 2,
  },
  weekSummaryCard: {
    backgroundColor: '#1a1a2e',
    margin: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryStats: {
    flexDirection: 'row',
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatDivider: {
    width: 1,
    backgroundColor: '#2a2a4e',
    marginHorizontal: 12,
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 4,
  },
  weekEntries: {
    marginHorizontal: 16,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  dayRowToday: {
    borderColor: '#1473FF',
    backgroundColor: '#1473FF10',
  },
  dayInfo: {
    width: 60,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  dayNameToday: {
    color: '#1473FF',
  },
  dayDate: {
    fontSize: 11,
    color: '#a0a0a0',
    marginTop: 2,
  },
  dayEntry: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 12,
  },
  entryTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryTime: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  entryHours: {
    alignItems: 'flex-end',
  },
  hoursText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  overtimeText: {
    fontSize: 11,
    color: '#F59E0B',
    marginTop: 2,
  },
  noEntry: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 10,
  },
  submitButton: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F620',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  pendingText: {
    fontSize: 15,
    color: '#3B82F6',
    fontWeight: '500',
  },
  approvedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B98120',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  approvedText: {
    fontSize: 15,
    color: '#10B981',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
  },
  modalCancel: {
    fontSize: 16,
    color: '#a0a0a0',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1473FF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  entryDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#a0a0a0',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
});
