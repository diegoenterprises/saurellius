/**
 * EMPLOYER PAY GRADES SCREEN
 * Manage salary bands and compensation structures
 * Configure grades, ranges, and employee assignments
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

interface PayGrade {
  id: string;
  name: string;
  level: number;
  min_salary: number;
  mid_salary: number;
  max_salary: number;
  employees_count: number;
  avg_salary: number;
  department?: string;
  created_at: string;
}

interface PayGradeStats {
  total_grades: number;
  total_employees: number;
  avg_compa_ratio: number;
  below_range: number;
  above_range: number;
}

export default function PayGradesScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [grades, setGrades] = useState<PayGrade[]>([]);
  const [stats, setStats] = useState<PayGradeStats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<PayGrade | null>(null);
  const [formData, setFormData] = useState({ name: '', level: '', min_salary: '', max_salary: '' });

  const fetchData = useCallback(async () => {
    try {
      const [gradesRes, statsRes] = await Promise.all([
        api.get('/api/employer/pay-grades'),
        api.get('/api/employer/pay-grades/stats'),
      ]);
      setGrades(gradesRes.data.grades || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch pay grades:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const getCompaRatio = (avgSalary: number, midSalary: number) => {
    if (midSalary === 0) return 0;
    return ((avgSalary / midSalary) * 100).toFixed(0);
  };

  const getCompaRatioColor = (ratio: number) => {
    if (ratio < 90) return '#EF4444';
    if (ratio > 110) return '#F59E0B';
    return '#10B981';
  };

  const handleAddGrade = () => {
    setEditingGrade(null);
    setFormData({ name: '', level: '', min_salary: '', max_salary: '' });
    setShowAddModal(true);
  };

  const handleEditGrade = (grade: PayGrade) => {
    setEditingGrade(grade);
    setFormData({ name: grade.name, level: grade.level.toString(), min_salary: grade.min_salary.toString(), max_salary: grade.max_salary.toString() });
    setShowAddModal(true);
  };

  const handleSaveGrade = async () => {
    if (!formData.name.trim() || !formData.min_salary || !formData.max_salary) {
      Alert.alert('Error', 'Name, min and max salary are required');
      return;
    }
    try {
      const payload = { name: formData.name, level: parseInt(formData.level) || 1, min_salary: parseFloat(formData.min_salary), max_salary: parseFloat(formData.max_salary) };
      if (editingGrade) {
        await api.put(`/api/employer/pay-grades/${editingGrade.id}`, payload);
      } else {
        await api.post('/api/employer/pay-grades', payload);
      }
      setShowAddModal(false);
      fetchData();
      Alert.alert('Success', editingGrade ? 'Pay grade updated' : 'Pay grade created');
    } catch (error) {
      Alert.alert('Error', 'Failed to save pay grade');
    }
  };

  const handleDeleteGrade = (grade: PayGrade) => {
    if (grade.employees_count > 0) {
      Alert.alert('Cannot Delete', 'This grade has employees assigned. Reassign them first.');
      return;
    }
    Alert.alert('Delete Grade', `Delete "${grade.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/api/employer/pay-grades/${grade.id}`);
          fetchData();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete grade');
        }
      }},
    ]);
  };

  const renderGradeCard = (grade: PayGrade) => {
    const compaRatio = parseInt(getCompaRatio(grade.avg_salary, grade.mid_salary));
    const rangeWidth = grade.max_salary - grade.min_salary;
    const avgPosition = rangeWidth > 0 ? ((grade.avg_salary - grade.min_salary) / rangeWidth) * 100 : 50;

    return (
      <TouchableOpacity key={grade.id} style={styles.gradeCard} onPress={() => handleEditGrade(grade)} onLongPress={() => handleDeleteGrade(grade)}>
        <View style={styles.gradeHeader}>
          <View style={styles.levelBadge}><Text style={styles.levelText}>L{grade.level}</Text></View>
          <View style={styles.gradeInfo}>
            <Text style={styles.gradeName}>{grade.name}</Text>
            {grade.department && <Text style={styles.gradeDept}>{grade.department}</Text>}
          </View>
          <View style={styles.employeeCount}>
            <Ionicons name="people" size={14} color="#666" />
            <Text style={styles.countText}>{grade.employees_count}</Text>
          </View>
        </View>

        <View style={styles.salaryRange}>
          <View style={styles.rangeLabels}>
            <Text style={styles.rangeLabel}>{formatCurrency(grade.min_salary)}</Text>
            <Text style={styles.rangeMid}>{formatCurrency(grade.mid_salary)}</Text>
            <Text style={styles.rangeLabel}>{formatCurrency(grade.max_salary)}</Text>
          </View>
          <View style={styles.rangeBar}>
            <View style={styles.rangeFill} />
            {grade.employees_count > 0 && (
              <View style={[styles.avgMarker, { left: `${Math.min(Math.max(avgPosition, 5), 95)}%` }]}>
                <View style={[styles.avgDot, { backgroundColor: getCompaRatioColor(compaRatio) }]} />
              </View>
            )}
          </View>
        </View>

        {grade.employees_count > 0 && (
          <View style={styles.compaRow}>
            <Text style={styles.compaLabel}>Avg Salary: {formatCurrency(grade.avg_salary)}</Text>
            <View style={[styles.compaBadge, { backgroundColor: getCompaRatioColor(compaRatio) + '20' }]}>
              <Text style={[styles.compaText, { color: getCompaRatioColor(compaRatio) }]}>{compaRatio}% CR</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Pay Grades</Text>
          <TouchableOpacity onPress={handleAddGrade}><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_grades}</Text><Text style={styles.statLabel}>Grades</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.avg_compa_ratio}%</Text><Text style={styles.statLabel}>Avg CR</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.below_range}</Text><Text style={styles.statLabel}>Below</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.above_range}</Text><Text style={styles.statLabel}>Above</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {grades.length > 0 ? grades.sort((a, b) => a.level - b.level).map(renderGradeCard) : (
            <View style={styles.emptyState}><Ionicons name="layers-outline" size={48} color="#666" /><Text style={styles.emptyText}>No pay grades configured</Text></View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>{editingGrade ? 'Edit Pay Grade' : 'Add Pay Grade'}</Text>
            <TouchableOpacity onPress={handleSaveGrade}><Text style={styles.modalSave}>Save</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Grade Name *</Text><TextInput style={styles.input} value={formData.name} onChangeText={t => setFormData(p => ({...p, name: t}))} placeholder="e.g., Associate, Senior, Manager" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Level</Text><TextInput style={styles.input} value={formData.level} onChangeText={t => setFormData(p => ({...p, level: t}))} placeholder="1, 2, 3..." placeholderTextColor="#666" keyboardType="number-pad" /></View>
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.inputLabel}>Min Salary *</Text><TextInput style={styles.input} value={formData.min_salary} onChangeText={t => setFormData(p => ({...p, min_salary: t}))} placeholder="50000" placeholderTextColor="#666" keyboardType="number-pad" /></View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}><Text style={styles.inputLabel}>Max Salary *</Text><TextInput style={styles.input} value={formData.max_salary} onChangeText={t => setFormData(p => ({...p, max_salary: t}))} placeholder="80000" placeholderTextColor="#666" keyboardType="number-pad" /></View>
            </View>
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
  statsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 12, padding: 12 },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 6 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  gradeCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  gradeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  levelBadge: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  levelText: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
  gradeInfo: { flex: 1 },
  gradeName: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  gradeDept: { fontSize: 12, color: '#666', marginTop: 2 },
  employeeCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countText: { fontSize: 14, color: '#666' },
  salaryRange: { marginBottom: 12 },
  rangeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rangeLabel: { fontSize: 11, color: '#666' },
  rangeMid: { fontSize: 11, color: '#a0a0a0', fontWeight: '500' },
  rangeBar: { height: 8, backgroundColor: '#2a2a4e', borderRadius: 4, position: 'relative' },
  rangeFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#1473FF30', borderRadius: 4 },
  avgMarker: { position: 'absolute', top: -4, marginLeft: -8 },
  avgDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#0f0f23' },
  compaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compaLabel: { fontSize: 13, color: '#a0a0a0' },
  compaBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  compaText: { fontSize: 12, fontWeight: '600' },
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
  inputRow: { flexDirection: 'row' },
});
