/**
 * SAURELLIUS TIME CLOCK
 * Employee clock in/out with break tracking
 * Supports California daily OT, meal/rest break compliance
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  useColorScheme,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

interface TimeEntry {
  id: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  totalHours: number;
  breaks: Break[];
  status: 'active' | 'complete' | 'approved';
}

interface Break {
  type: 'meal' | 'rest';
  start: string;
  end?: string;
  durationMinutes: number;
}

interface WeekSummary {
  day: string;
  date: string;
  hours: number;
  status: 'worked' | 'off' | 'today';
}

const TimeClockScreen: React.FC = () => {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [breakElapsed, setBreakElapsed] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));
  
  const [weekSummary, setWeekSummary] = useState<WeekSummary[]>([
    { day: 'Mon', date: '12/9', hours: 8.5, status: 'worked' },
    { day: 'Tue', date: '12/10', hours: 9.0, status: 'worked' },
    { day: 'Wed', date: '12/11', hours: 0, status: 'today' },
    { day: 'Thu', date: '12/12', hours: 0, status: 'off' },
    { day: 'Fri', date: '12/13', hours: 0, status: 'off' },
    { day: 'Sat', date: '12/14', hours: 0, status: 'off' },
    { day: 'Sun', date: '12/15', hours: 0, status: 'off' },
  ]);
  
  const weeklyTotal = weekSummary.reduce((sum, d) => sum + d.hours, 0) + (elapsedTime / 3600);
  const overtimeHours = Math.max(0, weeklyTotal - 40);
  
  // Pulse animation for active clock
  useEffect(() => {
    if (isClockedIn && !isOnBreak) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isClockedIn, isOnBreak]);
  
  // Timer for elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isClockedIn && !isOnBreak) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isClockedIn, isOnBreak]);
  
  // Break timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOnBreak) {
      interval = setInterval(() => {
        setBreakElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOnBreak]);
  
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };
  
  const handleClockIn = () => {
    Alert.alert(
      'Clock In',
      `Clock in at ${getCurrentTime()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clock In',
          onPress: () => {
            setIsClockedIn(true);
            setElapsedTime(0);
            setCurrentEntry({
              id: Date.now().toString(),
              date: new Date().toISOString().split('T')[0],
              clockIn: new Date().toISOString(),
              totalHours: 0,
              breaks: [],
              status: 'active',
            });
          }
        },
      ]
    );
  };
  
  const handleClockOut = () => {
    const hours = elapsedTime / 3600;
    
    // Check for meal break compliance (California)
    if (hours > 5 && (!currentEntry?.breaks.some(b => b.type === 'meal'))) {
      Alert.alert(
        'Meal Break Warning',
        'You worked over 5 hours without a meal break. This may result in a meal break premium. Continue clocking out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clock Out', onPress: confirmClockOut, style: 'destructive' },
        ]
      );
    } else {
      confirmClockOut();
    }
  };
  
  const confirmClockOut = () => {
    setIsClockedIn(false);
    setIsOnBreak(false);
    
    // Update weekly summary
    const updatedWeek = [...weekSummary];
    const todayIndex = updatedWeek.findIndex(d => d.status === 'today');
    if (todayIndex >= 0) {
      updatedWeek[todayIndex].hours = elapsedTime / 3600;
      updatedWeek[todayIndex].status = 'worked';
    }
    setWeekSummary(updatedWeek);
    
    Alert.alert('Clocked Out', `Total time: ${formatTime(elapsedTime)}`);
    setElapsedTime(0);
    setCurrentEntry(null);
  };
  
  const handleStartBreak = (type: 'meal' | 'rest') => {
    setIsOnBreak(true);
    setBreakElapsed(0);
    
    if (currentEntry) {
      const newBreak: Break = {
        type,
        start: new Date().toISOString(),
        durationMinutes: 0,
      };
      setCurrentEntry({
        ...currentEntry,
        breaks: [...currentEntry.breaks, newBreak],
      });
    }
  };
  
  const handleEndBreak = () => {
    setIsOnBreak(false);
    
    if (currentEntry && currentEntry.breaks.length > 0) {
      const breaks = [...currentEntry.breaks];
      const lastBreak = breaks[breaks.length - 1];
      lastBreak.end = new Date().toISOString();
      lastBreak.durationMinutes = Math.round(breakElapsed / 60);
      setCurrentEntry({ ...currentEntry, breaks });
    }
    
    setBreakElapsed(0);
  };
  
  const styles = createStyles(isDarkMode);
  
  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={isClockedIn ? ['#10B981', '#059669'] : ['#6366F1', '#8B5CF6']} 
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Time Clock</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </LinearGradient>
      
      <ScrollView style={styles.content}>
        {/* Main Clock Display */}
        <View style={styles.clockSection}>
          <Text style={styles.currentTime}>{getCurrentTime()}</Text>
          
          {isClockedIn ? (
            <>
              <Animated.View style={[styles.timerContainer, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.timerLabel}>{isOnBreak ? 'On Break' : 'Working'}</Text>
                <Text style={styles.timerValue}>
                  {isOnBreak ? formatTime(breakElapsed) : formatTime(elapsedTime)}
                </Text>
              </Animated.View>
              
              {isOnBreak ? (
                <TouchableOpacity style={styles.endBreakButton} onPress={handleEndBreak}>
                  <Ionicons name="play" size={24} color="#FFFFFF" />
                  <Text style={styles.endBreakText}>End Break</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.breakButtons}>
                  <TouchableOpacity 
                    style={styles.mealBreakButton}
                    onPress={() => handleStartBreak('meal')}
                  >
                    <Ionicons name="restaurant" size={20} color="#FFFFFF" />
                    <Text style={styles.breakButtonText}>Meal Break</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.restBreakButton}
                    onPress={() => handleStartBreak('rest')}
                  >
                    <Ionicons name="cafe" size={20} color="#6366F1" />
                    <Text style={styles.restBreakText}>Rest Break</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <TouchableOpacity style={styles.clockOutButton} onPress={handleClockOut}>
                <Ionicons name="log-out" size={24} color="#FFFFFF" />
                <Text style={styles.clockOutText}>Clock Out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.clockInButton} onPress={handleClockIn}>
              <View style={styles.clockInInner}>
                <Ionicons name="finger-print" size={48} color="#FFFFFF" />
                <Text style={styles.clockInText}>CLOCK IN</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Today's Breaks */}
        {currentEntry && currentEntry.breaks.length > 0 && (
          <View style={styles.breaksCard}>
            <Text style={styles.cardTitle}>Today's Breaks</Text>
            {currentEntry.breaks.map((brk, index) => (
              <View key={index} style={styles.breakItem}>
                <Ionicons 
                  name={brk.type === 'meal' ? 'restaurant' : 'cafe'} 
                  size={16} 
                  color={brk.type === 'meal' ? '#F59E0B' : '#6366F1'} 
                />
                <Text style={styles.breakType}>
                  {brk.type === 'meal' ? 'Meal' : 'Rest'} Break
                </Text>
                <Text style={styles.breakDuration}>
                  {brk.end ? `${brk.durationMinutes} min` : 'In progress...'}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Weekly Summary */}
        <View style={styles.weekCard}>
          <View style={styles.weekHeader}>
            <Text style={styles.cardTitle}>This Week</Text>
            <View style={styles.weekTotals}>
              <Text style={styles.weekTotal}>{weeklyTotal.toFixed(1)} hrs</Text>
              {overtimeHours > 0 && (
                <Text style={styles.overtimeLabel}>+{overtimeHours.toFixed(1)} OT</Text>
              )}
            </View>
          </View>
          
          <View style={styles.weekDays}>
            {weekSummary.map((day, index) => (
              <View 
                key={index} 
                style={[
                  styles.dayColumn,
                  day.status === 'today' && styles.dayColumnToday
                ]}
              >
                <Text style={styles.dayLabel}>{day.day}</Text>
                <View style={[
                  styles.dayBar,
                  { height: Math.max(4, (day.hours / 12) * 80) },
                  day.hours > 8 && styles.dayBarOvertime,
                  day.status === 'today' && isClockedIn && styles.dayBarActive,
                ]} />
                <Text style={styles.dayHours}>
                  {day.status === 'today' && isClockedIn 
                    ? (elapsedTime / 3600).toFixed(1) 
                    : day.hours > 0 ? day.hours.toFixed(1) : '-'}
                </Text>
              </View>
            ))}
          </View>
          
          <View style={styles.weekLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#6366F1' }]} />
              <Text style={styles.legendText}>Regular</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>Overtime</Text>
            </View>
          </View>
        </View>
        
        {/* Compliance Reminders */}
        <View style={styles.complianceCard}>
          <View style={styles.complianceHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            <Text style={styles.complianceTitle}>California Compliance</Text>
          </View>
          <View style={styles.complianceItems}>
            <View style={styles.complianceItem}>
              <Ionicons 
                name={currentEntry?.breaks.some(b => b.type === 'meal') ? 'checkmark-circle' : 'alert-circle'} 
                size={20} 
                color={currentEntry?.breaks.some(b => b.type === 'meal') ? '#10B981' : '#F59E0B'} 
              />
              <Text style={styles.complianceText}>
                30-min meal break required after 5 hours
              </Text>
            </View>
            <View style={styles.complianceItem}>
              <Ionicons name="information-circle" size={20} color="#6366F1" />
              <Text style={styles.complianceText}>
                10-min rest break per 4 hours worked
              </Text>
            </View>
            <View style={styles.complianceItem}>
              <Ionicons name="information-circle" size={20} color="#6366F1" />
              <Text style={styles.complianceText}>
                Daily OT: Over 8 hrs @ 1.5x, over 12 hrs @ 2x
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDarkMode ? '#111827' : '#F3F4F6' },
  header: { padding: 20, paddingTop: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  content: { flex: 1, padding: 20 },
  clockSection: { alignItems: 'center', marginBottom: 24 },
  currentTime: { fontSize: 48, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#1F2937' },
  timerContainer: { alignItems: 'center', marginTop: 24, marginBottom: 24 },
  timerLabel: { fontSize: 14, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 2 },
  timerValue: { fontSize: 56, fontWeight: 'bold', color: '#10B981', fontVariant: ['tabular-nums'] },
  clockInButton: { width: 180, height: 180, borderRadius: 90, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center', marginTop: 24, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  clockInInner: { alignItems: 'center' },
  clockInText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginTop: 8, letterSpacing: 2 },
  breakButtons: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  mealBreakButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F59E0B', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  breakButtonText: { color: '#FFFFFF', fontWeight: '600' },
  restBreakButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#6366F1' },
  restBreakText: { color: '#6366F1', fontWeight: '600' },
  endBreakButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#10B981', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 8, marginBottom: 20 },
  endBreakText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  clockOutButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EF4444', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 8 },
  clockOutText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  breaksCard: { backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: isDarkMode ? '#374151' : '#E5E7EB' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: isDarkMode ? '#FFFFFF' : '#1F2937', marginBottom: 12 },
  breakItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB' },
  breakType: { flex: 1, fontSize: 14, color: isDarkMode ? '#D1D5DB' : '#6B7280' },
  breakDuration: { fontSize: 14, fontWeight: '600', color: isDarkMode ? '#FFFFFF' : '#1F2937' },
  weekCard: { backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: isDarkMode ? '#374151' : '#E5E7EB' },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  weekTotals: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weekTotal: { fontSize: 18, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#1F2937' },
  overtimeLabel: { fontSize: 12, fontWeight: '600', color: '#F59E0B', backgroundColor: isDarkMode ? '#422006' : '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  weekDays: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, marginBottom: 12 },
  dayColumn: { alignItems: 'center', flex: 1 },
  dayColumnToday: { opacity: 1 },
  dayLabel: { fontSize: 11, color: '#6B7280', marginBottom: 8 },
  dayBar: { width: 24, backgroundColor: '#6366F1', borderRadius: 4, minHeight: 4 },
  dayBarOvertime: { backgroundColor: '#F59E0B' },
  dayBarActive: { backgroundColor: '#10B981' },
  dayHours: { fontSize: 11, fontWeight: '600', color: isDarkMode ? '#D1D5DB' : '#6B7280', marginTop: 8 },
  weekLegend: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: isDarkMode ? '#374151' : '#E5E7EB' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#6B7280' },
  complianceCard: { backgroundColor: isDarkMode ? '#064E3B' : '#D1FAE5', borderRadius: 12, padding: 16, marginBottom: 24 },
  complianceHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  complianceTitle: { fontSize: 16, fontWeight: '600', color: isDarkMode ? '#A7F3D0' : '#065F46' },
  complianceItems: { gap: 8 },
  complianceItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  complianceText: { flex: 1, fontSize: 13, color: isDarkMode ? '#6EE7B7' : '#047857' },
});

export default TimeClockScreen;
