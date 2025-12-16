/**
 * EMPLOYEE GOALS TRACKING SCREEN
 * Set, track, and manage personal and professional goals
 * Track progress, milestones, and achievements
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

interface Goal {
  id: string;
  title: string;
  description?: string;
  category: 'performance' | 'development' | 'career' | 'personal';
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  progress: number;
  target_date?: string;
  created_at: string;
  milestones?: { id: string; title: string; completed: boolean }[];
}

interface GoalStats {
  total_goals: number;
  completed: number;
  in_progress: number;
  completion_rate: number;
}

const CATEGORIES = [
  { id: 'performance', name: 'Performance', icon: 'trending-up', color: '#3B82F6' },
  { id: 'development', name: 'Development', icon: 'school', color: '#8B5CF6' },
  { id: 'career', name: 'Career', icon: 'rocket', color: '#10B981' },
  { id: 'personal', name: 'Personal', icon: 'person', color: '#F59E0B' },
];

export default function GoalsTrackingScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', category: 'performance', priority: 'medium', target_date: '' });

  const fetchData = useCallback(async () => {
    try {
      const [goalsRes, statsRes] = await Promise.all([
        api.get('/api/employee/goals'),
        api.get('/api/employee/goals/stats'),
      ]);
      setGoals(goalsRes.data.goals || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#3B82F6';
      case 'not_started': return '#6B7280';
      case 'overdue': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const handleAddGoal = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    try {
      await api.post('/api/employee/goals', formData);
      setShowAddModal(false);
      setFormData({ title: '', description: '', category: 'performance', priority: 'medium', target_date: '' });
      fetchData();
      Alert.alert('Success', 'Goal created');
    } catch (error) {
      Alert.alert('Error', 'Failed to create goal');
    }
  };

  const handleUpdateProgress = async (goal: Goal, newProgress: number) => {
    try {
      await api.put(`/api/employee/goals/${goal.id}`, { progress: newProgress });
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update progress');
    }
  };

  const handleToggleMilestone = async (goal: Goal, milestoneId: string) => {
    try {
      await api.put(`/api/employee/goals/${goal.id}/milestones/${milestoneId}/toggle`);
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update milestone');
    }
  };

  const filteredGoals = filterCategory === 'all' ? goals : goals.filter(g => g.category === filterCategory);

  const renderGoalCard = (goal: Goal) => {
    const category = CATEGORIES.find(c => c.id === goal.category);
    return (
      <View key={goal.id} style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: (category?.color || '#666') + '20' }]}>
            <Ionicons name={category?.icon as any || 'flag'} size={20} color={category?.color || '#666'} />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <View style={styles.goalMeta}>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(goal.priority) + '20' }]}>
                <Text style={[styles.priorityText, { color: getPriorityColor(goal.priority) }]}>{goal.priority}</Text>
              </View>
              {goal.target_date && <Text style={styles.goalDate}>Due: {formatDate(goal.target_date)}</Text>}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(goal.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(goal.status) }]}>{goal.status.replace('_', ' ')}</Text>
          </View>
        </View>

        {goal.description && <Text style={styles.goalDescription}>{goal.description}</Text>}

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressValue}>{goal.progress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${goal.progress}%`, backgroundColor: getStatusColor(goal.status) }]} />
          </View>
          <View style={styles.progressButtons}>
            {[25, 50, 75, 100].map(p => (
              <TouchableOpacity key={p} style={[styles.progressButton, goal.progress >= p && styles.progressButtonActive]} onPress={() => handleUpdateProgress(goal, p)}>
                <Text style={[styles.progressButtonText, goal.progress >= p && styles.progressButtonTextActive]}>{p}%</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {goal.milestones && goal.milestones.length > 0 && (
          <View style={styles.milestonesSection}>
            <Text style={styles.milestonesTitle}>Milestones</Text>
            {goal.milestones.map(m => (
              <TouchableOpacity key={m.id} style={styles.milestoneRow} onPress={() => handleToggleMilestone(goal, m.id)}>
                <Ionicons name={m.completed ? 'checkbox' : 'square-outline'} size={20} color={m.completed ? '#10B981' : '#666'} />
                <Text style={[styles.milestoneText, m.completed && styles.milestoneCompleted]}>{m.title}</Text>
              </TouchableOpacity>
            ))}
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
          <Text style={styles.headerTitle}>Goals</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_goals}</Text><Text style={styles.statLabel}>Total</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.in_progress}</Text><Text style={styles.statLabel}>In Progress</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.completed}</Text><Text style={styles.statLabel}>Completed</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.completion_rate}%</Text><Text style={styles.statLabel}>Rate</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        <TouchableOpacity style={[styles.filterChip, filterCategory === 'all' && styles.filterChipActive]} onPress={() => setFilterCategory('all')}>
          <Text style={[styles.filterChipText, filterCategory === 'all' && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat.id} style={[styles.filterChip, filterCategory === cat.id && styles.filterChipActive]} onPress={() => setFilterCategory(cat.id)}>
            <Ionicons name={cat.icon as any} size={14} color={filterCategory === cat.id ? '#FFF' : cat.color} />
            <Text style={[styles.filterChipText, filterCategory === cat.id && styles.filterChipTextActive]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {filteredGoals.length > 0 ? filteredGoals.map(renderGoalCard) : (
            <View style={styles.emptyState}><Ionicons name="flag-outline" size={48} color="#666" /><Text style={styles.emptyText}>No goals found</Text></View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>New Goal</Text>
            <TouchableOpacity onPress={handleAddGoal}><Text style={styles.modalSave}>Save</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Title *</Text><TextInput style={styles.input} value={formData.title} onChangeText={t => setFormData(p => ({...p, title: t}))} placeholder="Goal title" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Description</Text><TextInput style={[styles.input, styles.textArea]} value={formData.description} onChangeText={t => setFormData(p => ({...p, description: t}))} placeholder="Optional description" placeholderTextColor="#666" multiline numberOfLines={3} /></View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.optionRow}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat.id} style={[styles.optionButton, formData.category === cat.id && styles.optionButtonActive]} onPress={() => setFormData(p => ({...p, category: cat.id}))}>
                    <Ionicons name={cat.icon as any} size={16} color={formData.category === cat.id ? '#FFF' : cat.color} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.optionRow}>
                {['low', 'medium', 'high'].map(p => (
                  <TouchableOpacity key={p} style={[styles.priorityOption, formData.priority === p && { backgroundColor: getPriorityColor(p) }]} onPress={() => setFormData(prev => ({...prev, priority: p}))}>
                    <Text style={[styles.priorityOptionText, formData.priority === p && { color: colors.text }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  statValue: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.card, marginRight: 8, gap: 6, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 13, color: '#a0a0a0', fontWeight: '500' },
  filterChipTextActive: { color: colors.text },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  goalCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  goalHeader: { flexDirection: 'row', alignItems: 'center' },
  categoryIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  goalInfo: { flex: 1 },
  goalTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  goalMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  priorityText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  goalDate: { fontSize: 11, color: '#666' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  goalDescription: { fontSize: 13, color: '#a0a0a0', marginTop: 12, lineHeight: 18 },
  progressSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 12, color: '#a0a0a0' },
  progressValue: { fontSize: 12, color: colors.text, fontWeight: '600' },
  progressBar: { height: 6, backgroundColor: '#2a2a4e', borderRadius: 3 },
  progressFill: { height: '100%', borderRadius: 3 },
  progressButtons: { flexDirection: 'row', marginTop: 10, gap: 8 },
  progressButton: { flex: 1, paddingVertical: 8, backgroundColor: '#2a2a4e', borderRadius: 8, alignItems: 'center' },
  progressButtonActive: { backgroundColor: '#1473FF' },
  progressButtonText: { fontSize: 12, color: '#666', fontWeight: '500' },
  progressButtonTextActive: { color: colors.text },
  milestonesSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  milestonesTitle: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 10 },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 },
  milestoneText: { flex: 1, fontSize: 13, color: '#a0a0a0' },
  milestoneCompleted: { color: '#666', textDecorationLine: 'line-through' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  modalCancel: { fontSize: 16, color: '#a0a0a0' },
  modalSave: { fontSize: 16, fontWeight: '600', color: '#1473FF' },
  modalContent: { padding: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, color: '#a0a0a0', marginBottom: 6 },
  input: { backgroundColor: colors.card, borderRadius: 10, padding: 14, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: '#2a2a4e' },
  textArea: { height: 80, textAlignVertical: 'top' },
  optionRow: { flexDirection: 'row', gap: 10 },
  optionButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#2a2a4e', justifyContent: 'center', alignItems: 'center' },
  optionButtonActive: { backgroundColor: '#1473FF' },
  priorityOption: { flex: 1, paddingVertical: 10, backgroundColor: '#2a2a4e', borderRadius: 10, alignItems: 'center' },
  priorityOptionText: { fontSize: 13, color: '#a0a0a0', fontWeight: '500', textTransform: 'capitalize' },
});
