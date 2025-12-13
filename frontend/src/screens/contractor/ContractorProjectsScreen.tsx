/**
 * CONTRACTOR PROJECT TRACKING SCREEN
 * Track active projects, time spent, and deliverables
 * Manage project milestones and task completion
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

interface Task {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  hours_estimated?: number;
  hours_logged: number;
  due_date?: string;
}

interface Project {
  id: string;
  name: string;
  client_name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  budget_type: 'fixed' | 'hourly';
  budget_amount: number;
  hours_budget?: number;
  hours_logged: number;
  amount_billed: number;
  start_date: string;
  end_date?: string;
  progress: number;
  tasks: Task[];
  recent_activity?: {
    type: string;
    description: string;
    timestamp: string;
  }[];
}

interface ProjectStats {
  active_projects: number;
  total_hours_this_month: number;
  total_billed_this_month: number;
  pending_tasks: number;
}

export default function ContractorProjectsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{ project: Project; task: Task } | null>(null);
  const [timeEntry, setTimeEntry] = useState({ hours: '', notes: '' });

  const fetchProjects = useCallback(async () => {
    try {
      const [projectsRes, statsRes] = await Promise.all([
        api.get(`/api/contractor/projects?status=${filterStatus}`),
        api.get('/api/contractor/projects/stats'),
      ]);
      
      setProjects(projectsRes.data.projects || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
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
    });
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'completed': return '#3B82F6';
      case 'paused': return '#F59E0B';
      case 'archived': return '#6B7280';
      case 'in_progress': return '#1473FF';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const handleLogTime = (project: Project, task: Task) => {
    setSelectedTask({ project, task });
    setTimeEntry({ hours: '', notes: '' });
    setShowTimeModal(true);
  };

  const handleSubmitTime = async () => {
    if (!selectedTask || !timeEntry.hours) {
      Alert.alert('Error', 'Please enter hours');
      return;
    }

    try {
      await api.post('/api/contractor/time-entries', {
        project_id: selectedTask.project.id,
        task_id: selectedTask.task.id,
        hours: parseFloat(timeEntry.hours),
        notes: timeEntry.notes,
      });
      
      setShowTimeModal(false);
      fetchProjects();
      Alert.alert('Success', 'Time logged successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to log time');
    }
  };

  const handleUpdateTaskStatus = async (project: Project, task: Task, newStatus: Task['status']) => {
    try {
      await api.put(`/api/contractor/projects/${project.id}/tasks/${task.id}`, {
        status: newStatus,
      });
      fetchProjects();
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const renderTaskItem = (project: Project, task: Task) => (
    <View key={task.id} style={styles.taskItem}>
      <TouchableOpacity
        style={styles.taskCheckbox}
        onPress={() => handleUpdateTaskStatus(
          project, 
          task, 
          task.status === 'completed' ? 'pending' : 'completed'
        )}
      >
        {task.status === 'completed' ? (
          <Ionicons name="checkbox" size={24} color="#10B981" />
        ) : task.status === 'in_progress' ? (
          <Ionicons name="time" size={24} color="#1473FF" />
        ) : (
          <Ionicons name="square-outline" size={24} color="#666" />
        )}
      </TouchableOpacity>
      
      <View style={styles.taskInfo}>
        <Text style={[styles.taskName, task.status === 'completed' && styles.taskNameCompleted]}>
          {task.name}
        </Text>
        <View style={styles.taskMeta}>
          <Text style={styles.taskHours}>{formatHours(task.hours_logged)} logged</Text>
          {task.hours_estimated && (
            <Text style={styles.taskEstimate}>/ {formatHours(task.hours_estimated)} est.</Text>
          )}
          {task.due_date && (
            <Text style={styles.taskDue}>Due {formatDate(task.due_date)}</Text>
          )}
        </View>
      </View>

      <TouchableOpacity 
        style={styles.logTimeButton}
        onPress={() => handleLogTime(project, task)}
      >
        <Ionicons name="add-circle" size={24} color="#1473FF" />
      </TouchableOpacity>
    </View>
  );

  const renderProjectCard = ({ item }: { item: Project }) => {
    const isExpanded = expandedProject === item.id;
    const budgetUsed = item.budget_type === 'hourly' && item.hours_budget
      ? (item.hours_logged / item.hours_budget) * 100
      : (item.amount_billed / item.budget_amount) * 100;

    return (
      <View style={styles.projectCard}>
        <TouchableOpacity 
          style={styles.projectHeader}
          onPress={() => setExpandedProject(isExpanded ? null : item.id)}
        >
          <View style={styles.projectHeaderLeft}>
            <View style={[styles.progressCircle]}>
              <Text style={styles.progressText}>{item.progress}%</Text>
            </View>
            <View style={styles.projectInfo}>
              <Text style={styles.projectName}>{item.name}</Text>
              <Text style={styles.clientName}>{item.client_name}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.projectStats}>
          <View style={styles.projectStat}>
            <Text style={styles.projectStatLabel}>Hours</Text>
            <Text style={styles.projectStatValue}>{formatHours(item.hours_logged)}</Text>
          </View>
          <View style={styles.projectStatDivider} />
          <View style={styles.projectStat}>
            <Text style={styles.projectStatLabel}>Billed</Text>
            <Text style={[styles.projectStatValue, { color: '#10B981' }]}>
              {formatCurrency(item.amount_billed)}
            </Text>
          </View>
          <View style={styles.projectStatDivider} />
          <View style={styles.projectStat}>
            <Text style={styles.projectStatLabel}>Budget</Text>
            <Text style={styles.projectStatValue}>{formatCurrency(item.budget_amount)}</Text>
          </View>
        </View>

        <View style={styles.budgetProgress}>
          <View style={styles.budgetProgressHeader}>
            <Text style={styles.budgetProgressLabel}>
              {item.budget_type === 'hourly' ? 'Hours Used' : 'Budget Used'}
            </Text>
            <Text style={styles.budgetProgressPercent}>{Math.min(budgetUsed, 100).toFixed(0)}%</Text>
          </View>
          <View style={styles.budgetProgressBar}>
            <View 
              style={[
                styles.budgetProgressFill, 
                { 
                  width: `${Math.min(budgetUsed, 100)}%`,
                  backgroundColor: budgetUsed > 90 ? '#EF4444' : budgetUsed > 75 ? '#F59E0B' : '#10B981'
                }
              ]} 
            />
          </View>
        </View>

        {isExpanded && (
          <View style={styles.projectExpanded}>
            <View style={styles.tasksSection}>
              <View style={styles.tasksSectionHeader}>
                <Text style={styles.tasksSectionTitle}>Tasks</Text>
                <Text style={styles.tasksCount}>
                  {item.tasks.filter(t => t.status === 'completed').length}/{item.tasks.length} complete
                </Text>
              </View>
              
              {item.tasks.length > 0 ? (
                item.tasks.map(task => renderTaskItem(item, task))
              ) : (
                <Text style={styles.noTasks}>No tasks added</Text>
              )}
            </View>

            {item.recent_activity && item.recent_activity.length > 0 && (
              <View style={styles.activitySection}>
                <Text style={styles.activityTitle}>Recent Activity</Text>
                {item.recent_activity.slice(0, 3).map((activity, index) => (
                  <View key={index} style={styles.activityItem}>
                    <View style={styles.activityDot} />
                    <View style={styles.activityContent}>
                      <Text style={styles.activityText}>{activity.description}</Text>
                      <Text style={styles.activityTime}>{formatDate(activity.timestamp)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.projectActions}>
              <TouchableOpacity style={styles.projectAction}>
                <Ionicons name="time-outline" size={18} color="#1473FF" />
                <Text style={styles.projectActionText}>Log Time</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.projectAction}>
                <Ionicons name="receipt-outline" size={18} color="#10B981" />
                <Text style={[styles.projectActionText, { color: '#10B981' }]}>Create Invoice</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => setExpandedProject(isExpanded ? null : item.id)}
        >
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderTimeModal = () => (
    <Modal
      visible={showTimeModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowTimeModal(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Log Time</Text>
          <TouchableOpacity onPress={handleSubmitTime}>
            <Text style={styles.modalSave}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          {selectedTask && (
            <View style={styles.timeEntryContext}>
              <Text style={styles.timeEntryProject}>{selectedTask.project.name}</Text>
              <Text style={styles.timeEntryTask}>{selectedTask.task.name}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hours *</Text>
            <TextInput
              style={styles.hoursInput}
              value={timeEntry.hours}
              onChangeText={(text) => setTimeEntry(prev => ({ ...prev, hours: text }))}
              keyboardType="decimal-pad"
              placeholder="0.0"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={timeEntry.notes}
              onChangeText={(text) => setTimeEntry(prev => ({ ...prev, notes: text }))}
              placeholder="What did you work on?"
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.quickHours}>
            <Text style={styles.quickHoursLabel}>Quick Add:</Text>
            <View style={styles.quickHoursButtons}>
              {[0.5, 1, 2, 4, 8].map((hours) => (
                <TouchableOpacity
                  key={hours}
                  style={styles.quickHourButton}
                  onPress={() => setTimeEntry(prev => ({ ...prev, hours: hours.toString() }))}
                >
                  <Text style={styles.quickHourText}>{hours}h</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
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
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Projects</Text>
          <View style={{ width: 24 }} />
        </View>

        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.active_projects}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatHours(stats.total_hours_this_month)}</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>
                {formatCurrency(stats.total_billed_this_month)}
              </Text>
              <Text style={styles.statLabel}>Billed</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['active', 'completed', 'paused', 'all'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
              onPress={() => {
                setFilterStatus(status);
                setLoading(true);
              }}
            >
              <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>
                {status === 'all' ? 'All Projects' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={projects}
        renderItem={renderProjectCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color="#666" />
            <Text style={styles.emptyStateTitle}>No Projects Found</Text>
            <Text style={styles.emptyStateText}>
              Your projects will appear here once you start working
            </Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 40 }} />}
      />

      {renderTimeModal()}
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
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
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
    marginHorizontal: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1a1a2e',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  filterChipActive: {
    backgroundColor: '#1473FF',
    borderColor: '#1473FF',
  },
  filterChipText: {
    fontSize: 13,
    color: '#a0a0a0',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: 16,
  },
  projectCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
    overflow: 'hidden',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  projectHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1473FF20',
    borderWidth: 2,
    borderColor: '#1473FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1473FF',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  clientName: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  projectStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  projectStat: {
    flex: 1,
    alignItems: 'center',
  },
  projectStatDivider: {
    width: 1,
    backgroundColor: '#2a2a4e',
    marginHorizontal: 8,
  },
  projectStatLabel: {
    fontSize: 11,
    color: '#666',
  },
  projectStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 2,
  },
  budgetProgress: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  budgetProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  budgetProgressLabel: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  budgetProgressPercent: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '500',
  },
  budgetProgressBar: {
    height: 6,
    backgroundColor: '#2a2a4e',
    borderRadius: 3,
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  projectExpanded: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    padding: 16,
  },
  tasksSection: {
    marginBottom: 16,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tasksSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  tasksCount: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  taskCheckbox: {
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  taskNameCompleted: {
    color: '#666',
    textDecorationLine: 'line-through',
  },
  taskMeta: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 8,
  },
  taskHours: {
    fontSize: 11,
    color: '#a0a0a0',
  },
  taskEstimate: {
    fontSize: 11,
    color: '#666',
  },
  taskDue: {
    fontSize: 11,
    color: '#F59E0B',
  },
  logTimeButton: {},
  noTasks: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  activitySection: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    paddingTop: 16,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1473FF',
    marginRight: 10,
    marginTop: 4,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 13,
    color: '#a0a0a0',
  },
  activityTime: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  projectActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  projectAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1473FF20',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  projectActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1473FF',
  },
  expandButton: {
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
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
    padding: 20,
  },
  timeEntryContext: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  timeEntryProject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  timeEntryTask: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 20,
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
  hoursInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#2a2a4e',
    textAlign: 'center',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  quickHours: {
    marginTop: 8,
  },
  quickHoursLabel: {
    fontSize: 13,
    color: '#a0a0a0',
    marginBottom: 10,
  },
  quickHoursButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  quickHourButton: {
    flex: 1,
    backgroundColor: '#2a2a4e',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  quickHourText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});
