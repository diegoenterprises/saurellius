/**
 * EMPLOYER BULK ACTIONS SCREEN
 * Perform mass operations on employees
 * Salary adjustments, status changes, communications
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  status: string;
  salary: number;
}

interface BulkAction {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requires_confirmation: boolean;
}

const BULK_ACTIONS: BulkAction[] = [
  { id: 'salary_adjust', name: 'Salary Adjustment', description: 'Apply percentage or flat rate change', icon: 'cash', color: '#10B981', requires_confirmation: true },
  { id: 'department_change', name: 'Department Transfer', description: 'Move employees to another department', icon: 'business', color: '#3B82F6', requires_confirmation: true },
  { id: 'status_change', name: 'Status Change', description: 'Update employment status', icon: 'toggle', color: '#8B5CF6', requires_confirmation: true },
  { id: 'send_notification', name: 'Send Notification', description: 'Mass communication to employees', icon: 'notifications', color: '#F59E0B', requires_confirmation: false },
  { id: 'export_data', name: 'Export Data', description: 'Download employee data as CSV', icon: 'download', color: '#6366F1', requires_confirmation: false },
  { id: 'assign_training', name: 'Assign Training', description: 'Enroll in training programs', icon: 'school', color: '#EC4899', requires_confirmation: false },
];

export default function BulkActionsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<BulkAction | null>(null);
  const [actionValue, setActionValue] = useState('');

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await api.get('/api/employer/employees', { params: { search: searchQuery } });
      setEmployees(response.data.employees || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
  const onRefresh = () => { setRefreshing(true); fetchEmployees(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const toggleEmployee = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === employees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(employees.map(e => e.id)));
    }
  };

  const handleExecuteAction = async () => {
    if (!selectedAction || selectedIds.size === 0) return;

    const confirmMessage = `Apply "${selectedAction.name}" to ${selectedIds.size} employee(s)?`;
    
    if (selectedAction.requires_confirmation) {
      Alert.alert('Confirm Action', confirmMessage, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Execute', onPress: executeAction },
      ]);
    } else {
      executeAction();
    }
  };

  const executeAction = async () => {
    try {
      await api.post('/api/employer/bulk-actions/execute', {
        action_id: selectedAction?.id,
        employee_ids: Array.from(selectedIds),
        value: actionValue,
      });
      Alert.alert('Success', `Action completed for ${selectedIds.size} employee(s)`);
      setSelectedIds(new Set());
      setSelectedAction(null);
      setActionValue('');
      fetchEmployees();
    } catch (error) {
      Alert.alert('Error', 'Failed to execute bulk action');
    }
  };

  const renderEmployeeItem = (employee: Employee) => {
    const isSelected = selectedIds.has(employee.id);
    return (
      <TouchableOpacity key={employee.id} style={[styles.employeeCard, isSelected && styles.employeeCardSelected]} onPress={() => toggleEmployee(employee.id)}>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
        </View>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{employee.name}</Text>
          <Text style={styles.employeePosition}>{employee.position}</Text>
          <View style={styles.employeeMeta}>
            <Text style={styles.metaText}>{employee.department}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{formatCurrency(employee.salary)}/yr</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Bulk Actions</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionText}>{selectedIds.size} of {employees.length} selected</Text>
          <TouchableOpacity onPress={selectAll}><Text style={styles.selectAllText}>{selectedIds.size === employees.length ? 'Deselect All' : 'Select All'}</Text></TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput style={styles.searchInput} placeholder="Search employees..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      <Text style={styles.sectionTitle}>Select Action</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsScroll}>
        {BULK_ACTIONS.map(action => (
          <TouchableOpacity key={action.id} style={[styles.actionCard, selectedAction?.id === action.id && styles.actionCardSelected]} onPress={() => setSelectedAction(action)}>
            <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
              <Ionicons name={action.icon as any} size={24} color={action.color} />
            </View>
            <Text style={styles.actionName}>{action.name}</Text>
            <Text style={styles.actionDesc} numberOfLines={2}>{action.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedAction && (
        <View style={styles.actionConfig}>
          {selectedAction.id === 'salary_adjust' && (
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Adjustment %</Text>
              <TextInput style={styles.valueInput} value={actionValue} onChangeText={setActionValue} placeholder="e.g., 5 or -3" placeholderTextColor="#666" keyboardType="numeric" />
            </View>
          )}
          <TouchableOpacity style={[styles.executeButton, selectedIds.size === 0 && styles.executeButtonDisabled]} onPress={handleExecuteAction} disabled={selectedIds.size === 0}>
            <LinearGradient colors={selectedIds.size > 0 ? ['#1473FF', '#BE01FF'] : ['#2a2a4e', '#2a2a4e']} style={styles.executeGradient}>
              <Ionicons name="flash" size={20} color="#FFF" />
              <Text style={styles.executeText}>Execute for {selectedIds.size} Employee(s)</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Employees</Text>
      <ScrollView style={styles.employeeList} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        {employees.map(renderEmployeeItem)}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingBottom: 16 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  selectionInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 12 },
  selectionText: { fontSize: 14, color: colors.text },
  selectAllText: { fontSize: 14, color: '#1473FF', fontWeight: '600' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, marginHorizontal: 16, marginTop: 12, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: colors.text },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginHorizontal: 16, marginTop: 16, marginBottom: 10 },
  actionsScroll: { paddingHorizontal: 16 },
  actionCard: { width: 130, backgroundColor: colors.card, borderRadius: 12, padding: 14, marginRight: 10, borderWidth: 2, borderColor: 'transparent' },
  actionCardSelected: { borderColor: '#1473FF' },
  actionIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  actionName: { fontSize: 13, fontWeight: '600', color: colors.text },
  actionDesc: { fontSize: 10, color: '#666', marginTop: 4, lineHeight: 14 },
  actionConfig: { marginHorizontal: 16, marginTop: 12, backgroundColor: colors.card, borderRadius: 12, padding: 14 },
  inputRow: { marginBottom: 12 },
  inputLabel: { fontSize: 12, color: '#a0a0a0', marginBottom: 6 },
  valueInput: { backgroundColor: colors.background, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: '#2a2a4e' },
  executeButton: { borderRadius: 10, overflow: 'hidden' },
  executeButtonDisabled: { opacity: 0.5 },
  executeGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  executeText: { fontSize: 15, fontWeight: '600', color: colors.text },
  employeeList: { flex: 1, paddingHorizontal: 16 },
  employeeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#2a2a4e' },
  employeeCardSelected: { borderColor: '#1473FF', backgroundColor: '#1473FF10' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#2a2a4e', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkboxSelected: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  employeeInfo: { flex: 1 },
  employeeName: { fontSize: 15, fontWeight: '600', color: colors.text },
  employeePosition: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  employeeMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaText: { fontSize: 12, color: '#666' },
  metaDot: { fontSize: 12, color: '#666', marginHorizontal: 6 },
});
