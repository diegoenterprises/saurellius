/**
 * EMPLOYER ONBOARDING CHECKLIST SCREEN
 * Track new hire onboarding progress
 * Manage required documents, training, and setup tasks
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

interface ChecklistItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  required: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  due_date?: string;
  completed_at?: string;
  assigned_to?: string;
}

interface NewHire {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  department: string;
  hire_date: string;
  start_date: string;
  manager_name?: string;
  progress: number;
  checklist: ChecklistItem[];
  status: 'not_started' | 'in_progress' | 'completed';
}

interface OnboardingStats {
  total_new_hires: number;
  pending_onboarding: number;
  in_progress: number;
  completed_this_month: number;
  overdue_tasks: number;
}

const CHECKLIST_CATEGORIES = [
  { id: 'documents', name: 'Documents', icon: 'document-text', color: '#3B82F6' },
  { id: 'tax_forms', name: 'Tax Forms', icon: 'calculator', color: '#8B5CF6' },
  { id: 'benefits', name: 'Benefits', icon: 'heart', color: '#EC4899' },
  { id: 'equipment', name: 'Equipment', icon: 'laptop', color: '#F59E0B' },
  { id: 'training', name: 'Training', icon: 'school', color: '#10B981' },
  { id: 'access', name: 'System Access', icon: 'key', color: '#6366F1' },
];

export default function OnboardingChecklistScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newHires, setNewHires] = useState<NewHire[]>([]);
  const [stats, setStats] = useState<OnboardingStats | null>(null);
  const [selectedHire, setSelectedHire] = useState<NewHire | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchOnboardingData = useCallback(async () => {
    try {
      const [hiresRes, statsRes] = await Promise.all([
        api.get('/api/employer/onboarding/new-hires', {
          params: { status: filterStatus !== 'all' ? filterStatus : undefined }
        }),
        api.get('/api/employer/onboarding/stats'),
      ]);
      
      setNewHires(hiresRes.data.new_hires || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch onboarding data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchOnboardingData();
  }, [fetchOnboardingData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOnboardingData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilStart = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#3B82F6';
      case 'pending': return '#F59E0B';
      case 'overdue': return '#EF4444';
      case 'not_started': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const handleToggleTask = async (hire: NewHire, item: ChecklistItem) => {
    const newStatus = item.status === 'completed' ? 'pending' : 'completed';
    
    try {
      await api.put(`/api/employer/onboarding/${hire.id}/checklist/${item.id}`, {
        status: newStatus,
      });
      fetchOnboardingData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleSendReminder = async (hire: NewHire) => {
    Alert.alert(
      'Send Reminder',
      `Send onboarding reminder to ${hire.first_name} ${hire.last_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              await api.post(`/api/employer/onboarding/${hire.id}/reminder`);
              Alert.alert('Success', 'Reminder sent');
            } catch (error) {
              Alert.alert('Error', 'Failed to send reminder');
            }
          },
        },
      ]
    );
  };

  const renderNewHireCard = ({ item }: { item: NewHire }) => {
    const daysUntilStart = getDaysUntilStart(item.start_date);
    const isSelected = selectedHire?.id === item.id;

    return (
      <View style={styles.hireCard}>
        <TouchableOpacity 
          style={styles.hireHeader}
          onPress={() => setSelectedHire(isSelected ? null : item)}
        >
          <View style={styles.hireAvatar}>
            <Text style={styles.hireInitials}>
              {item.first_name[0]}{item.last_name[0]}
            </Text>
          </View>
          <View style={styles.hireInfo}>
            <Text style={styles.hireName}>{item.first_name} {item.last_name}</Text>
            <Text style={styles.hireTitle}>{item.job_title}</Text>
            <Text style={styles.hireDept}>{item.department}</Text>
          </View>
          <View style={styles.hireProgress}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressText}>{item.progress}%</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.hireMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar" size={14} color="#666" />
            <Text style={styles.metaText}>Starts {formatDate(item.start_date)}</Text>
          </View>
          {daysUntilStart > 0 && daysUntilStart <= 14 && (
            <View style={[styles.urgentBadge, daysUntilStart <= 3 && styles.urgentBadgeCritical]}>
              <Text style={styles.urgentText}>{daysUntilStart} days</Text>
            </View>
          )}
          {daysUntilStart <= 0 && (
            <View style={[styles.urgentBadge, styles.urgentBadgeStarted]}>
              <Text style={styles.urgentText}>Started</Text>
            </View>
          )}
        </View>

        {isSelected && (
          <View style={styles.hireExpanded}>
            {CHECKLIST_CATEGORIES.map((category) => {
              const categoryItems = item.checklist.filter(c => c.category === category.id);
              if (categoryItems.length === 0) return null;

              const completedCount = categoryItems.filter(c => c.status === 'completed').length;

              return (
                <View key={category.id} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                      <Ionicons name={category.icon as any} size={16} color={category.color} />
                    </View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryCount}>{completedCount}/{categoryItems.length}</Text>
                  </View>

                  {categoryItems.map((task) => (
                    <TouchableOpacity
                      key={task.id}
                      style={styles.taskRow}
                      onPress={() => handleToggleTask(item, task)}
                    >
                      <Ionicons 
                        name={task.status === 'completed' ? 'checkbox' : 'square-outline'} 
                        size={22} 
                        color={task.status === 'completed' ? '#10B981' : task.status === 'overdue' ? '#EF4444' : '#666'} 
                      />
                      <View style={styles.taskInfo}>
                        <Text style={[
                          styles.taskName,
                          task.status === 'completed' && styles.taskNameCompleted
                        ]}>
                          {task.name}
                          {task.required && <Text style={styles.requiredStar}> *</Text>}
                        </Text>
                        {task.due_date && task.status !== 'completed' && (
                          <Text style={[
                            styles.taskDue,
                            task.status === 'overdue' && styles.taskDueOverdue
                          ]}>
                            Due {formatDate(task.due_date)}
                          </Text>
                        )}
                      </View>
                      {task.status === 'overdue' && (
                        <Ionicons name="alert-circle" size={18} color="#EF4444" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })}

            <View style={styles.hireActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleSendReminder(item)}
              >
                <Ionicons name="mail" size={18} color="#1473FF" />
                <Text style={styles.actionButtonText}>Send Reminder</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="person" size={18} color="#1473FF" />
                <Text style={styles.actionButtonText}>View Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

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
          <Text style={styles.headerTitle}>Onboarding</Text>
          <TouchableOpacity>
            <Ionicons name="add-circle-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.pending_onboarding}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.in_progress}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.overdue_tasks}</Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.completed_this_month}</Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'not_started', 'in_progress', 'completed'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
              onPress={() => {
                setFilterStatus(status);
                setLoading(true);
              }}
            >
              <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>
                {status === 'all' ? 'All' : status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={newHires}
        renderItem={renderNewHireCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#666" />
            <Text style={styles.emptyStateTitle}>No New Hires</Text>
            <Text style={styles.emptyStateText}>
              New employee onboarding will appear here
            </Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 40 }} />}
      />
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 12,
  },
  statCard: {
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
    color: '#FFF',
  },
  statLabel: {
    fontSize: 10,
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
  hireCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
    overflow: 'hidden',
  },
  hireHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  hireAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1473FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hireInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  hireInfo: {
    flex: 1,
  },
  hireName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  hireTitle: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 2,
  },
  hireDept: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  hireProgress: {},
  progressCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B98120',
    borderWidth: 2,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10B981',
  },
  hireMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#a0a0a0',
  },
  urgentBadge: {
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  urgentBadgeCritical: {
    backgroundColor: '#EF444420',
  },
  urgentBadgeStarted: {
    backgroundColor: '#10B98120',
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },
  hireExpanded: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    padding: 16,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  categoryCount: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  taskInfo: {
    flex: 1,
    marginLeft: 10,
  },
  taskName: {
    fontSize: 14,
    color: '#FFF',
  },
  taskNameCompleted: {
    color: '#666',
    textDecorationLine: 'line-through',
  },
  requiredStar: {
    color: '#EF4444',
  },
  taskDue: {
    fontSize: 11,
    color: '#a0a0a0',
    marginTop: 2,
  },
  taskDueOverdue: {
    color: '#EF4444',
  },
  hireActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1473FF20',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1473FF',
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
});
