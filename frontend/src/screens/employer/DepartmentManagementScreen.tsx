/**
 * EMPLOYER DEPARTMENT MANAGEMENT SCREEN
 * Manage company departments and organizational structure
 * Assign managers, view headcount, budget allocation
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  manager_id?: string;
  manager_name?: string;
  parent_id?: string;
  employee_count: number;
  budget?: number;
  cost_center?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

interface DepartmentStats {
  total_departments: number;
  total_employees: number;
  total_budget: number;
  avg_department_size: number;
}

export default function DepartmentManagementScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', cost_center: '' });

  const fetchData = useCallback(async () => {
    try {
      const [deptRes, statsRes] = await Promise.all([
        api.get('/api/employer/departments'),
        api.get('/api/employer/departments/stats'),
      ]);
      setDepartments(deptRes.data.departments || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const handleAddDepartment = () => {
    setEditingDept(null);
    setFormData({ name: '', code: '', description: '', cost_center: '' });
    setShowAddModal(true);
  };

  const handleEditDepartment = (dept: Department) => {
    setEditingDept(dept);
    setFormData({ name: dept.name, code: dept.code, description: dept.description || '', cost_center: dept.cost_center || '' });
    setShowAddModal(true);
  };

  const handleSaveDepartment = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      Alert.alert('Error', 'Name and code are required');
      return;
    }
    try {
      if (editingDept) {
        await api.put(`/api/employer/departments/${editingDept.id}`, formData);
      } else {
        await api.post('/api/employer/departments', formData);
      }
      setShowAddModal(false);
      fetchData();
      Alert.alert('Success', editingDept ? 'Department updated' : 'Department created');
    } catch (error) {
      Alert.alert('Error', 'Failed to save department');
    }
  };

  const handleDeleteDepartment = (dept: Department) => {
    if (dept.employee_count > 0) {
      Alert.alert('Cannot Delete', 'Department has employees. Reassign them first.');
      return;
    }
    Alert.alert('Delete Department', `Delete "${dept.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/api/employer/departments/${dept.id}`);
          fetchData();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete department');
        }
      }},
    ]);
  };

  const filteredDepartments = departments.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Departments</Text>
          <TouchableOpacity onPress={handleAddDepartment}><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_departments}</Text><Text style={styles.statLabel}>Departments</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_employees}</Text><Text style={styles.statLabel}>Employees</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{formatCurrency(stats.total_budget)}</Text><Text style={styles.statLabel}>Budget</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput style={styles.searchInput} placeholder="Search departments..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {filteredDepartments.map(dept => (
            <TouchableOpacity key={dept.id} style={styles.deptCard} onPress={() => handleEditDepartment(dept)}>
              <View style={styles.deptIcon}><Ionicons name="business" size={24} color="#1473FF" /></View>
              <View style={styles.deptInfo}>
                <View style={styles.deptNameRow}>
                  <Text style={styles.deptName}>{dept.name}</Text>
                  <View style={styles.deptCode}><Text style={styles.deptCodeText}>{dept.code}</Text></View>
                </View>
                {dept.manager_name && <Text style={styles.deptManager}>Manager: {dept.manager_name}</Text>}
                <View style={styles.deptMeta}>
                  <View style={styles.metaItem}><Ionicons name="people" size={14} color="#666" /><Text style={styles.metaText}>{dept.employee_count}</Text></View>
                  {dept.budget && <View style={styles.metaItem}><Ionicons name="cash" size={14} color="#10B981" /><Text style={styles.metaText}>{formatCurrency(dept.budget)}</Text></View>}
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDeleteDepartment(dept)}><Ionicons name="trash-outline" size={20} color="#EF4444" /></TouchableOpacity>
            </TouchableOpacity>
          ))}
          {filteredDepartments.length === 0 && (
            <View style={styles.emptyState}><Ionicons name="business-outline" size={48} color="#666" /><Text style={styles.emptyText}>No departments found</Text></View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>{editingDept ? 'Edit Department' : 'Add Department'}</Text>
            <TouchableOpacity onPress={handleSaveDepartment}><Text style={styles.modalSave}>Save</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Name *</Text><TextInput style={styles.input} value={formData.name} onChangeText={t => setFormData(p => ({...p, name: t}))} placeholder="Department name" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Code *</Text><TextInput style={styles.input} value={formData.code} onChangeText={t => setFormData(p => ({...p, code: t.toUpperCase()}))} placeholder="e.g., ENG, HR, SALES" placeholderTextColor="#666" autoCapitalize="characters" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Description</Text><TextInput style={[styles.input, styles.textArea]} value={formData.description} onChangeText={t => setFormData(p => ({...p, description: t}))} placeholder="Optional description" placeholderTextColor="#666" multiline numberOfLines={3} /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Cost Center</Text><TextInput style={styles.input} value={formData.cost_center} onChangeText={t => setFormData(p => ({...p, cost_center: t}))} placeholder="Optional cost center code" placeholderTextColor="#666" /></View>
          </ScrollView>
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
  statsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 12, padding: 14 },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 10 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', marginHorizontal: 16, marginVertical: 12, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: '#FFF' },
  content: { flex: 1 },
  section: { padding: 16 },
  deptCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  deptIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#1473FF20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  deptInfo: { flex: 1 },
  deptNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deptName: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  deptCode: { backgroundColor: '#2a2a4e', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  deptCodeText: { fontSize: 10, fontWeight: '600', color: '#a0a0a0' },
  deptManager: { fontSize: 13, color: '#a0a0a0', marginTop: 4 },
  deptMeta: { flexDirection: 'row', marginTop: 8, gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#666' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
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
});
