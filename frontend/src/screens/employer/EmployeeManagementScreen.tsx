/**
 * EMPLOYER EMPLOYEE MANAGEMENT SCREEN
 * Comprehensive employee roster and management
 * Add, edit, terminate employees with bulk actions
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
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profile_photo_url?: string;
  department: string;
  job_title: string;
  employment_type: 'full_time' | 'part_time' | 'contractor';
  status: 'active' | 'on_leave' | 'terminated' | 'pending';
  hire_date: string;
  pay_rate: number;
  pay_type: 'hourly' | 'salary';
  manager_id?: string;
  manager_name?: string;
}

interface EmployeeStats {
  total: number;
  active: number;
  on_leave: number;
  pending: number;
  by_department: { name: string; count: number }[];
}

export default function EmployeeManagementScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      const [employeesRes, statsRes] = await Promise.all([
        api.get('/api/employer/employees', {
          params: { 
            search: searchQuery,
            department: filterDepartment !== 'all' ? filterDepartment : undefined,
            status: filterStatus !== 'all' ? filterStatus : undefined,
          }
        }),
        api.get('/api/employer/employees/stats'),
      ]);
      
      setEmployees(employeesRes.data.employees || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filterDepartment, filterStatus]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEmployees();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'on_leave': return '#F59E0B';
      case 'terminated': return '#EF4444';
      case 'pending': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getEmploymentTypeLabel = (type: string) => {
    switch (type) {
      case 'full_time': return 'Full-Time';
      case 'part_time': return 'Part-Time';
      case 'contractor': return 'Contractor';
      default: return type;
    }
  };

  const toggleEmployeeSelection = (id: string) => {
    setSelectedEmployees(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const selectAllEmployees = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(e => e.id));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedEmployees.length === 0) {
      Alert.alert('No Selection', 'Please select employees first');
      return;
    }

    const actionLabels: { [key: string]: string } = {
      'send_reminder': 'Send Reminder',
      'update_department': 'Update Department',
      'export': 'Export Data',
      'terminate': 'Terminate',
    };

    Alert.alert(
      actionLabels[action] || action,
      `Apply to ${selectedEmployees.length} selected employee(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: action === 'terminate' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await api.post(`/api/employer/employees/bulk/${action}`, {
                employee_ids: selectedEmployees,
              });
              Alert.alert('Success', 'Action completed successfully');
              setSelectedEmployees([]);
              fetchEmployees();
            } catch (error) {
              Alert.alert('Error', 'Failed to perform action');
            }
          },
        },
      ]
    );
    setShowActions(false);
  };

  const handleViewEmployee = (employee: Employee) => {
    navigation.navigate('EmployeeDetail', { employeeId: employee.id });
  };

  const handleAddEmployee = () => {
    navigation.navigate('AddEmployee');
  };

  const renderEmployeeCard = ({ item }: { item: Employee }) => {
    const isSelected = selectedEmployees.includes(item.id);

    return (
      <TouchableOpacity 
        style={[styles.employeeCard, isSelected && styles.employeeCardSelected]}
        onPress={() => handleViewEmployee(item)}
        onLongPress={() => toggleEmployeeSelection(item.id)}
      >
        <View style={styles.employeeHeader}>
          {selectedEmployees.length > 0 && (
            <TouchableOpacity 
              style={styles.checkbox}
              onPress={() => toggleEmployeeSelection(item.id)}
            >
              {isSelected ? (
                <Ionicons name="checkbox" size={24} color="#1473FF" />
              ) : (
                <Ionicons name="square-outline" size={24} color="#666" />
              )}
            </TouchableOpacity>
          )}
          
          <View style={styles.avatar}>
            {item.profile_photo_url ? (
              <View style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {item.first_name[0]}{item.last_name[0]}
              </Text>
            )}
          </View>

          <View style={styles.employeeInfo}>
            <Text style={styles.employeeName}>{item.first_name} {item.last_name}</Text>
            <Text style={styles.employeeTitle}>{item.job_title}</Text>
            <Text style={styles.employeeDept}>{item.department}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.employeeDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="mail-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{item.email}</Text>
          </View>
          {item.phone && (
            <View style={styles.detailItem}>
              <Ionicons name="call-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{item.phone}</Text>
            </View>
          )}
        </View>

        <View style={styles.employeeFooter}>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Type</Text>
            <Text style={styles.footerValue}>{getEmploymentTypeLabel(item.employment_type)}</Text>
          </View>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Pay</Text>
            <Text style={styles.footerValue}>
              {formatCurrency(item.pay_rate)}{item.pay_type === 'hourly' ? '/hr' : '/yr'}
            </Text>
          </View>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Hired</Text>
            <Text style={styles.footerValue}>{formatDate(item.hire_date)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filters</Text>
          <TouchableOpacity onPress={() => {
            setFilterDepartment('all');
            setFilterStatus('all');
            setShowFilters(false);
          }}>
            <Text style={styles.modalReset}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.filterSectionTitle}>Status</Text>
          <View style={styles.filterOptions}>
            {['all', 'active', 'on_leave', 'pending', 'terminated'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.filterOption, filterStatus === status && styles.filterOptionActive]}
                onPress={() => setFilterStatus(status)}
              >
                <Text style={[styles.filterOptionText, filterStatus === status && styles.filterOptionTextActive]}>
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterSectionTitle}>Department</Text>
          <View style={styles.filterOptions}>
            <TouchableOpacity
              style={[styles.filterOption, filterDepartment === 'all' && styles.filterOptionActive]}
              onPress={() => setFilterDepartment('all')}
            >
              <Text style={[styles.filterOptionText, filterDepartment === 'all' && styles.filterOptionTextActive]}>
                All Departments
              </Text>
            </TouchableOpacity>
            {stats?.by_department.map((dept) => (
              <TouchableOpacity
                key={dept.name}
                style={[styles.filterOption, filterDepartment === dept.name && styles.filterOptionActive]}
                onPress={() => setFilterDepartment(dept.name)}
              >
                <Text style={[styles.filterOptionText, filterDepartment === dept.name && styles.filterOptionTextActive]}>
                  {dept.name} ({dept.count})
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.applyButton}
            onPress={() => {
              setShowFilters(false);
              setLoading(true);
            }}
          >
            <LinearGradient
              colors={['#1473FF', '#BE01FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.applyGradient}
            >
              <Text style={styles.applyText}>Apply Filters</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderActionsModal = () => (
    <Modal
      visible={showActions}
      animationType="slide"
      transparent
    >
      <TouchableOpacity 
        style={styles.actionsOverlay}
        activeOpacity={1}
        onPress={() => setShowActions(false)}
      >
        <View style={styles.actionsSheet}>
          <View style={styles.actionsHandle} />
          <Text style={styles.actionsTitle}>
            Bulk Actions ({selectedEmployees.length} selected)
          </Text>
          
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => handleBulkAction('send_reminder')}
          >
            <Ionicons name="mail" size={22} color="#3B82F6" />
            <Text style={styles.actionItemText}>Send Reminder Email</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => handleBulkAction('update_department')}
          >
            <Ionicons name="business" size={22} color="#8B5CF6" />
            <Text style={styles.actionItemText}>Update Department</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => handleBulkAction('export')}
          >
            <Ionicons name="download" size={22} color="#10B981" />
            <Text style={styles.actionItemText}>Export Selected</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionItem, styles.actionItemDestructive]}
            onPress={() => handleBulkAction('terminate')}
          >
            <Ionicons name="close-circle" size={22} color="#EF4444" />
            <Text style={[styles.actionItemText, { color: '#EF4444' }]}>Terminate</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Employees</Text>
          <TouchableOpacity onPress={handleAddEmployee}>
            <Ionicons name="person-add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.active}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.on_leave}</Text>
              <Text style={styles.statLabel}>On Leave</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchText}
            placeholder="Search employees..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => {
              setLoading(true);
              fetchEmployees();
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.filterButton, (filterDepartment !== 'all' || filterStatus !== 'all') && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="filter" size={20} color={filterDepartment !== 'all' || filterStatus !== 'all' ? '#1473FF' : '#666'} />
        </TouchableOpacity>
      </View>

      {selectedEmployees.length > 0 && (
        <View style={styles.selectionBar}>
          <TouchableOpacity onPress={selectAllEmployees}>
            <Text style={styles.selectAllText}>
              {selectedEmployees.length === employees.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.selectionCount}>{selectedEmployees.length} selected</Text>
          <TouchableOpacity 
            style={styles.bulkActionButton}
            onPress={() => setShowActions(true)}
          >
            <Text style={styles.bulkActionText}>Actions</Text>
            <Ionicons name="chevron-down" size={16} color="#1473FF" />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={employees}
        renderItem={renderEmployeeCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#666" />
            <Text style={styles.emptyStateTitle}>No Employees Found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery || filterDepartment !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first employee to get started'}
            </Text>
            {!searchQuery && filterDepartment === 'all' && filterStatus === 'all' && (
              <TouchableOpacity style={styles.addButton} onPress={handleAddEmployee}>
                <LinearGradient
                  colors={['#1473FF', '#BE01FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addGradient}
                >
                  <Ionicons name="person-add" size={20} color="#FFF" />
                  <Text style={styles.addText}>Add Employee</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        }
        ListFooterComponent={<View style={{ height: 40 }} />}
      />

      {renderFiltersModal()}
      {renderActionsModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  searchText: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
    color: colors.text,
  },
  filterButton: {
    width: 46,
    height: 46,
    backgroundColor: colors.card,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  filterButtonActive: {
    borderColor: '#1473FF',
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1473FF20',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  selectAllText: {
    fontSize: 14,
    color: '#1473FF',
    fontWeight: '500',
  },
  selectionCount: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#a0a0a0',
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bulkActionText: {
    fontSize: 14,
    color: '#1473FF',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  employeeCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  employeeCardSelected: {
    borderColor: '#1473FF',
    backgroundColor: '#1473FF10',
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    marginRight: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1473FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  employeeTitle: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 2,
  },
  employeeDept: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  employeeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#a0a0a0',
  },
  employeeFooter: {
    flexDirection: 'row',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  footerItem: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 11,
    color: '#666',
  },
  footerValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  addButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  addText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.text,
  },
  modalCancel: {
    fontSize: 16,
    color: '#a0a0a0',
  },
  modalReset: {
    fontSize: 16,
    color: '#1473FF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginTop: 16,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  filterOptionActive: {
    backgroundColor: '#1473FF20',
    borderColor: '#1473FF',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  filterOptionTextActive: {
    color: '#1473FF',
    fontWeight: '500',
  },
  applyButton: {
    marginTop: 30,
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyGradient: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  applyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  actionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionsSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  actionsHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#2a2a4e',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
    gap: 14,
  },
  actionItemDestructive: {
    borderBottomWidth: 0,
  },
  actionItemText: {
    fontSize: 16,
    color: colors.text,
  },
});
