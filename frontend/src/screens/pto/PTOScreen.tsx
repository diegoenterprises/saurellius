/**
 * PTO SCREEN
 * Leave Management, Time Off Requests, Balance Tracking, Calendar
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'balances' | 'requests' | 'calendar';

interface LeaveBalance {
  type: string;
  available: number;
  used: number;
  pending: number;
  total: number;
  color: string;
}

interface LeaveRequest {
  id: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  hours: number;
  status: string;
  reason: string;
}

const MOCK_BALANCES: LeaveBalance[] = [
  { type: 'Vacation', available: 64, used: 40, pending: 8, total: 104, color: '#3B82F6' },
  { type: 'Sick', available: 32, used: 16, pending: 0, total: 48, color: '#10B981' },
  { type: 'Personal', available: 16, used: 8, pending: 0, total: 24, color: '#8B5CF6' },
];

const MOCK_REQUESTS: LeaveRequest[] = [
  { id: '1', employeeName: 'John Smith', type: 'Vacation', startDate: '2024-12-23', endDate: '2024-12-27', hours: 40, status: 'pending', reason: 'Holiday travel' },
  { id: '2', employeeName: 'Sarah Johnson', type: 'Sick', startDate: '2024-12-18', endDate: '2024-12-18', hours: 8, status: 'approved', reason: 'Doctor appointment' },
  { id: '3', employeeName: 'Mike Davis', type: 'Personal', startDate: '2024-12-20', endDate: '2024-12-20', hours: 8, status: 'approved', reason: 'Personal errands' },
  { id: '4', employeeName: 'Emily Chen', type: 'Vacation', startDate: '2024-12-30', endDate: '2025-01-03', hours: 32, status: 'pending', reason: 'New Year vacation' },
];

const MOCK_HOLIDAYS = [
  { date: '2024-12-24', name: 'Christmas Eve' },
  { date: '2024-12-25', name: 'Christmas Day' },
  { date: '2025-01-01', name: 'New Year\'s Day' },
];

export default function PTOScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabType>('balances');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#F59E0B',
      approved: '#10B981',
      denied: '#EF4444',
      cancelled: '#6B7280',
    };
    return colors[status] || '#6B7280';
  };

  const totalAvailable = MOCK_BALANCES.reduce((sum, b) => sum + b.available, 0);
  const totalUsed = MOCK_BALANCES.reduce((sum, b) => sum + b.used, 0);

  const renderBalances = () => (
    <View style={styles.tabContent}>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <LinearGradient
          colors={['#1473FF', '#BE01FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.summaryGradient}
        >
          <View style={styles.summaryMain}>
            <Text style={styles.summaryLabel}>Total Available</Text>
            <Text style={styles.summaryValue}>{totalAvailable} hours</Text>
            <Text style={styles.summaryDays}>{totalAvailable / 8} days</Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{totalUsed}h</Text>
              <Text style={styles.summaryStatLabel}>Used YTD</Text>
            </View>
            <View style={styles.summaryStatDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>8h</Text>
              <Text style={styles.summaryStatLabel}>Pending</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Balance Cards */}
      <Text style={styles.sectionTitle}>Leave Balances</Text>
      <View style={styles.balancesList}>
        {MOCK_BALANCES.map((balance, index) => (
          <View key={index} style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <View style={[styles.balanceIcon, { backgroundColor: balance.color + '20' }]}>
                <Ionicons 
                  name={balance.type === 'Vacation' ? 'airplane' : balance.type === 'Sick' ? 'medical' : 'calendar'} 
                  size={20} 
                  color={balance.color} 
                />
              </View>
              <Text style={styles.balanceType}>{balance.type}</Text>
            </View>
            
            <View style={styles.balanceNumbers}>
              <View style={styles.balanceAvailable}>
                <Text style={[styles.balanceValue, { color: balance.color }]}>{balance.available}h</Text>
                <Text style={styles.balanceSubtext}>Available</Text>
              </View>
              <View style={styles.balanceDetails}>
                <View style={styles.balanceDetailRow}>
                  <Text style={styles.balanceDetailLabel}>Used</Text>
                  <Text style={styles.balanceDetailValue}>{balance.used}h</Text>
                </View>
                <View style={styles.balanceDetailRow}>
                  <Text style={styles.balanceDetailLabel}>Pending</Text>
                  <Text style={styles.balanceDetailValue}>{balance.pending}h</Text>
                </View>
                <View style={styles.balanceDetailRow}>
                  <Text style={styles.balanceDetailLabel}>Annual</Text>
                  <Text style={styles.balanceDetailValue}>{balance.total}h</Text>
                </View>
              </View>
            </View>
            
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressUsed, { width: `${(balance.used / balance.total) * 100}%`, backgroundColor: balance.color }]} />
                <View style={[styles.progressPending, { width: `${(balance.pending / balance.total) * 100}%`, backgroundColor: balance.color + '50' }]} />
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Request Button */}
      <TouchableOpacity style={styles.requestButton} onPress={() => setShowRequestModal(true)}>
        <LinearGradient
          colors={['#1473FF', '#BE01FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.requestButtonGradient}
        >
          <Ionicons name="add-circle" size={22} color="#FFF" />
          <Text style={styles.requestButtonText}>Request Time Off</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Upcoming Holidays */}
      <Text style={styles.sectionTitle}>Upcoming Holidays</Text>
      <View style={styles.holidaysList}>
        {MOCK_HOLIDAYS.map((holiday, index) => (
          <View key={index} style={styles.holidayItem}>
            <View style={styles.holidayIcon}>
              <Ionicons name="star" size={16} color="#F59E0B" />
            </View>
            <View style={styles.holidayInfo}>
              <Text style={styles.holidayName}>{holiday.name}</Text>
              <Text style={styles.holidayDate}>{holiday.date}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderRequests = () => (
    <View style={styles.tabContent}>
      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterChip, styles.filterChipActive]}>
          <Text style={styles.filterChipTextActive}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterChipText}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterChipText}>Approved</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterChipText}>Denied</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.requestsList}>
        {MOCK_REQUESTS.map((request) => (
          <View key={request.id} style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <View style={styles.requestEmployee}>
                <View style={styles.employeeAvatar}>
                  <Text style={styles.employeeAvatarText}>{request.employeeName.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.employeeName}>{request.employeeName}</Text>
                  <Text style={styles.requestType}>{request.type}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                  {request.status}
                </Text>
              </View>
            </View>

            <View style={styles.requestDates}>
              <View style={styles.requestDateItem}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.requestDateText}>{request.startDate}</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color="#CCC" />
              <View style={styles.requestDateItem}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.requestDateText}>{request.endDate}</Text>
              </View>
              <View style={styles.requestHours}>
                <Text style={styles.requestHoursText}>{request.hours}h</Text>
              </View>
            </View>

            <Text style={styles.requestReason}>{request.reason}</Text>

            {request.status === 'pending' && (
              <View style={styles.requestActions}>
                <TouchableOpacity 
                  style={[styles.requestActionBtn, styles.approveBtn]}
                  onPress={() => Alert.alert('Approved', 'Request has been approved')}
                >
                  <Ionicons name="checkmark" size={18} color="#FFF" />
                  <Text style={styles.requestActionText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.requestActionBtn, styles.denyBtn]}
                  onPress={() => Alert.alert('Denied', 'Request has been denied')}
                >
                  <Ionicons name="close" size={18} color="#FFF" />
                  <Text style={styles.requestActionText}>Deny</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const renderCalendar = () => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();
    
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => {
            if (selectedMonth === 0) {
              setSelectedMonth(11);
              setSelectedYear(selectedYear - 1);
            } else {
              setSelectedMonth(selectedMonth - 1);
            }
          }}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.calendarMonth}>{monthNames[selectedMonth]} {selectedYear}</Text>
          <TouchableOpacity onPress={() => {
            if (selectedMonth === 11) {
              setSelectedMonth(0);
              setSelectedYear(selectedYear + 1);
            } else {
              setSelectedMonth(selectedMonth + 1);
            }
          }}>
            <Ionicons name="chevron-forward" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.calendarWeekDays}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Text key={day} style={styles.weekDay}>{day}</Text>
          ))}
        </View>

        <View style={styles.calendarDays}>
          {days.map((day, index) => (
            <View key={index} style={styles.calendarDay}>
              {day && (
                <>
                  <Text style={styles.calendarDayText}>{day}</Text>
                  {/* Indicators for holidays/leave */}
                  {MOCK_HOLIDAYS.some(h => h.date === `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`) && (
                    <View style={[styles.dayIndicator, { backgroundColor: '#F59E0B' }]} />
                  )}
                </>
              )}
            </View>
          ))}
        </View>

        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>Vacation</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Sick</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Holiday</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Upcoming Time Off</Text>
        <View style={styles.upcomingList}>
          {MOCK_REQUESTS.filter(r => r.status === 'approved').map((request) => (
            <View key={request.id} style={styles.upcomingItem}>
              <View style={styles.upcomingDates}>
                <Text style={styles.upcomingStartDate}>{request.startDate}</Text>
                <Text style={styles.upcomingEndDate}>to {request.endDate}</Text>
              </View>
              <View>
                <Text style={styles.upcomingName}>{request.employeeName}</Text>
                <Text style={styles.upcomingType}>{request.type} • {request.hours}h</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1473FF', '#BE01FF']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Time Off</Text>
          <TouchableOpacity>
            <Ionicons name="options-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          {[
            { key: 'balances', label: 'Balances', icon: 'wallet' },
            { key: 'requests', label: 'Requests', icon: 'document-text' },
            { key: 'calendar', label: 'Calendar', icon: 'calendar' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key as TabType)}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={activeTab === tab.key ? '#FFF' : 'rgba(255,255,255,0.6)'}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'balances' && renderBalances()}
        {activeTab === 'requests' && renderRequests()}
        {activeTab === 'calendar' && renderCalendar()}
      </ScrollView>

      {/* Request Modal */}
      <Modal visible={showRequestModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Time Off</Text>
              <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Leave Type</Text>
              <View style={styles.leaveTypeOptions}>
                {['Vacation', 'Sick', 'Personal'].map((type) => (
                  <TouchableOpacity key={type} style={styles.leaveTypeOption}>
                    <Text style={styles.leaveTypeText}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Start Date</Text>
                <TextInput style={styles.formInput} placeholder="YYYY-MM-DD" placeholderTextColor="#999" />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>End Date</Text>
                <TextInput style={styles.formInput} placeholder="YYYY-MM-DD" placeholderTextColor="#999" />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Reason (Optional)</Text>
              <TextInput 
                style={[styles.formInput, styles.formTextArea]} 
                placeholder="Enter reason for time off" 
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={() => {
              setShowRequestModal(false);
              Alert.alert('Success', 'Time off request submitted');
            }}>
              <LinearGradient
                colors={['#1473FF', '#BE01FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalButtonText}>Submit Request</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  summaryCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  summaryGradient: {
    padding: 20,
  },
  summaryMain: {
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
  },
  summaryDays: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  summaryStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 16,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  summaryStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  balancesList: {
    gap: 12,
    marginBottom: 20,
  },
  balanceCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  balanceIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  balanceNumbers: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  balanceAvailable: {
    flex: 1,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  balanceSubtext: {
    fontSize: 12,
    color: '#666',
  },
  balanceDetails: {
    flex: 1,
    gap: 4,
  },
  balanceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceDetailLabel: {
    fontSize: 13,
    color: '#666',
  },
  balanceDetailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  progressContainer: {},
  progressBar: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressUsed: {
    height: '100%',
  },
  progressPending: {
    height: '100%',
  },
  requestButton: {
    marginBottom: 20,
  },
  requestButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  requestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  holidaysList: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  holidayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  holidayIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  holidayInfo: {},
  holidayName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  holidayDate: {
    fontSize: 12,
    color: '#666',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
  },
  filterChipActive: {
    backgroundColor: '#1473FF',
  },
  filterChipText: {
    fontSize: 13,
    color: '#666',
  },
  filterChipTextActive: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '500',
  },
  requestsList: {
    gap: 12,
  },
  requestCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestEmployee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  employeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeeAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1473FF',
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  requestType: {
    fontSize: 13,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  requestDates: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  requestDateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requestDateText: {
    fontSize: 13,
    color: '#666',
  },
  requestHours: {
    marginLeft: 'auto',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  requestHoursText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  requestReason: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  requestActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  approveBtn: {
    backgroundColor: '#10B981',
  },
  denyBtn: {
    backgroundColor: '#EF4444',
  },
  requestActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  calendarWeekDays: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  calendarDay: {
    width: `${100/7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#333',
  },
  dayIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
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
    color: '#666',
  },
  upcomingList: {
    gap: 12,
  },
  upcomingItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  upcomingDates: {},
  upcomingStartDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  upcomingEndDate: {
    fontSize: 12,
    color: '#666',
  },
  upcomingName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  upcomingType: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  leaveTypeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  leaveTypeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  leaveTypeText: {
    fontSize: 14,
    color: '#666',
  },
  modalButton: {
    marginTop: 8,
  },
  modalButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
