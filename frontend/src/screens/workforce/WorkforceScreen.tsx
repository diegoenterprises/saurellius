/**
 * SAURELLIUS WORKFORCE
 * The Captain's Observation Tower - Bird's eye view of the entire workforce
 * Real-time monitoring of who is where, doing what, and when
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = (SCREEN_WIDTH - 180) / 7; // 180px for employee column

interface Shift {
  id: string;
  employee_id: number;
  employee_name: string;
  date: string;
  start_time: string;
  end_time: string;
  display_time: string;
  duration_hours: number;
  position: string;
  position_color: {
    bg: string;
    text: string;
    border: string;
  };
  is_time_off: boolean;
  time_off_type?: string;
}

interface Employee {
  id: number;
  name: string;
  position: string;
  position_color: {
    bg: string;
    text: string;
    border: string;
  };
  scheduled_hours: number;
  overtime_hours: number;
}

interface ScheduleRow {
  employee: Employee;
  scheduled_hours: number;
  overtime_hours: number;
  has_overtime: boolean;
  days: {
    date: string;
    shift: Shift | null;
    has_shift: boolean;
    is_time_off: boolean;
  }[];
}

interface DateInfo {
  date: string;
  day_name: string;
  day_number: number;
  is_today: boolean;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Position filter options
const POSITIONS = [
  { key: 'all', label: 'All Positions', color: '#6B7280' },
  { key: 'manager', label: 'Manager', color: '#7C3AED' },
  { key: 'designer', label: 'Designer', color: '#E11D48' },
  { key: 'developer', label: 'Developer', color: '#0D9488' },
  { key: 'assistant', label: 'Assistant', color: '#4F46E5' },
  { key: 'chef', label: 'Chef', color: '#EA580C' },
  { key: 'server', label: 'Server', color: '#2563EB' },
];

const WorkforceScreen: React.FC = () => {
  const navigation = useNavigation();
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [dates, setDates] = useState<DateInfo[]>([]);
  const [weekStart, setWeekStart] = useState<string>('');
  const [weekEnd, setWeekEnd] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPositions, setSelectedPositions] = useState<string[]>(['all']);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch weekly schedule
      const response = await api.get('/workforce/schedule', {
        params: {
          positions: selectedPositions.includes('all') ? undefined : selectedPositions,
        },
      });
      
      if (response.data.success) {
        setSchedule(response.data.schedule);
        setDates(response.data.dates);
        setWeekStart(response.data.week_start);
        setWeekEnd(response.data.week_end);
      }
      
      // Fetch stats
      const statsResponse = await api.get('/workforce/stats');
      if (statsResponse.data.success) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching workforce data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPositions]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSchedule();
    setRefreshing(false);
  };

  const togglePosition = (key: string) => {
    if (key === 'all') {
      setSelectedPositions(['all']);
    } else {
      const newPositions = selectedPositions.filter(p => p !== 'all');
      if (newPositions.includes(key)) {
        const filtered = newPositions.filter(p => p !== key);
        setSelectedPositions(filtered.length > 0 ? filtered : ['all']);
      } else {
        setSelectedPositions([...newPositions, key]);
      }
    }
  };

  const publishSchedule = async () => {
    try {
      await api.post('/workforce/schedule/publish', {
        week_start: weekStart,
        notify: true,
      });
      Alert.alert('Success', 'Schedule published and employees notified!');
    } catch (error) {
      Alert.alert('Error', 'Failed to publish schedule');
    }
  };

  const formatWeekRange = () => {
    if (!weekStart || !weekEnd) return '';
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  // Shift cell component
  const ShiftCell: React.FC<{ shift: Shift | null; isTimeOff: boolean }> = ({ shift, isTimeOff }) => {
    if (!shift) {
      return <View style={styles.emptyCell} />;
    }

    if (isTimeOff || shift.is_time_off) {
      return (
        <View style={[styles.shiftCell, styles.timeOffCell]}>
          <Text style={styles.timeOffText}>Time Off</Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.shiftCell,
          {
            backgroundColor: shift.position_color.bg,
            borderLeftColor: shift.position_color.border,
          },
        ]}
      >
        <Text style={[styles.shiftTime, { color: shift.position_color.text }]}>
          {shift.display_time}
        </Text>
        <Text style={[styles.shiftPosition, { color: shift.position_color.text }]}>
          {shift.position}
        </Text>
      </View>
    );
  };

  // Employee row component
  const EmployeeRow: React.FC<{ row: ScheduleRow }> = ({ row }) => (
    <View style={styles.scheduleRow}>
      {/* Employee info */}
      <View style={styles.employeeCell}>
        <View style={styles.employeeAvatar}>
          <Text style={styles.avatarText}>
            {row.employee.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName} numberOfLines={1}>
            {row.employee.name}
          </Text>
          <View style={styles.hoursContainer}>
            <Text style={styles.hoursText}>{row.scheduled_hours}h</Text>
            {row.has_overtime && (
              <View style={styles.overtimeBadge}>
                <Text style={styles.overtimeText}>+{row.overtime_hours}h OT</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Day cells */}
      {row.days.map((day, index) => (
        <View key={day.date} style={styles.dayCell}>
          <ShiftCell shift={day.shift} isTimeOff={day.is_time_off} />
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#334155', '#1E293B']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Workforce</Text>
            <Text style={styles.headerSubtitle}>Schedule Management</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.publishButton}
              onPress={publishSchedule}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.publishGradient}
              >
                <Text style={styles.publishText}>Publish & Notify</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Week Navigation */}
        <View style={styles.weekNav}>
          <TouchableOpacity style={styles.navButton}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.weekText}>{formatWeekRange()}</Text>
          <TouchableOpacity style={styles.navButton}>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.viewToggle}>
            <TouchableOpacity style={[styles.toggleButton, styles.toggleActive]}>
              <Text style={styles.toggleTextActive}>Week</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toggleButton}>
              <Text style={styles.toggleText}>Month</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {POSITIONS.map((pos) => (
            <TouchableOpacity
              key={pos.key}
              style={[
                styles.filterChip,
                selectedPositions.includes(pos.key) && {
                  backgroundColor: pos.color + '20',
                  borderColor: pos.color,
                },
              ]}
              onPress={() => togglePosition(pos.key)}
            >
              {pos.key !== 'all' && (
                <View
                  style={[styles.filterDot, { backgroundColor: pos.color }]}
                />
              )}
              <Text
                style={[
                  styles.filterText,
                  selectedPositions.includes(pos.key) && { color: pos.color },
                ]}
              >
                {pos.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats Bar */}
      {stats && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total_employees}</Text>
            <Text style={styles.statLabel}>Employees</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total_scheduled_hours}h</Text>
            <Text style={styles.statLabel}>Scheduled</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, stats.total_overtime_hours > 0 && styles.overtimeValue]}>
              {stats.total_overtime_hours}h
            </Text>
            <Text style={styles.statLabel}>Overtime</Text>
          </View>
        </View>
      )}

      {/* Schedule Grid */}
      <ScrollView
        style={styles.scheduleContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Row */}
        <View style={styles.scheduleHeader}>
          <View style={styles.employeeHeaderCell}>
            <Text style={styles.headerCellText}>Employee</Text>
          </View>
          {dates.map((date) => (
            <View
              key={date.date}
              style={[
                styles.dayHeaderCell,
                date.is_today && styles.todayHeader,
              ]}
            >
              <Text style={[styles.dayName, date.is_today && styles.todayText]}>
                {date.day_name}
              </Text>
              <Text style={[styles.dayNumber, date.is_today && styles.todayText]}>
                {date.day_number}
              </Text>
            </View>
          ))}
        </View>

        {/* Employee Rows */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading schedule...</Text>
          </View>
        ) : (
          schedule.map((row) => (
            <EmployeeRow key={row.employee.id} row={row} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  publishButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  publishGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  publishText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    minWidth: 120,
    textAlign: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 4,
    marginLeft: 'auto',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: colors.card,
  },
  toggleText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a4e',
    marginRight: 8,
    backgroundColor: colors.card,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  filterText: {
    fontSize: 13,
    color: '#a0a0a0',
    fontWeight: '500',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  overtimeValue: {
    color: '#EF4444',
  },
  statLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2a2a4e',
    marginHorizontal: 16,
  },
  scheduleContainer: {
    flex: 1,
  },
  scheduleHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  employeeHeaderCell: {
    width: 160,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  headerCellText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a0a0a0',
    textTransform: 'uppercase',
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  todayHeader: {
    backgroundColor: '#DBEAFE',
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#a0a0a0',
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 2,
  },
  todayText: {
    color: '#2563EB',
  },
  scheduleRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: colors.card,
  },
  employeeCell: {
    width: 160,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 8,
  },
  employeeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a4e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a0a0a0',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  hoursText: {
    fontSize: 11,
    color: '#a0a0a0',
  },
  overtimeBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  overtimeText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '600',
  },
  dayCell: {
    flex: 1,
    padding: 4,
    minHeight: 60,
  },
  emptyCell: {
    flex: 1,
  },
  shiftCell: {
    flex: 1,
    borderRadius: 6,
    padding: 6,
    borderLeftWidth: 3,
    justifyContent: 'center',
  },
  shiftTime: {
    fontSize: 11,
    fontWeight: '600',
  },
  shiftPosition: {
    fontSize: 10,
    marginTop: 2,
  },
  timeOffCell: {
    backgroundColor: '#FEF3C7',
    borderLeftColor: '#F59E0B',
  },
  timeOffText: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#a0a0a0',
  },
});

export default WorkforceScreen;
