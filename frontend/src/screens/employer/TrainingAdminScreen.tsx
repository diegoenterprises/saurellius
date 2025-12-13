/**
 * EMPLOYER TRAINING ADMIN SCREEN
 * Manage company training programs and courses
 * Assign training, track completion, manage content
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_hours: number;
  is_required: boolean;
  assigned_count: number;
  completed_count: number;
  completion_rate: number;
  status: 'active' | 'draft' | 'archived';
  due_date?: string;
  created_at: string;
}

interface TrainingStats {
  total_courses: number;
  active_courses: number;
  total_enrollments: number;
  avg_completion_rate: number;
  overdue_count: number;
}

const CATEGORIES = [
  { id: 'compliance', name: 'Compliance', icon: 'shield-checkmark', color: '#EF4444' },
  { id: 'safety', name: 'Safety', icon: 'warning', color: '#F59E0B' },
  { id: 'skills', name: 'Skills', icon: 'rocket', color: '#3B82F6' },
  { id: 'leadership', name: 'Leadership', icon: 'people', color: '#8B5CF6' },
  { id: 'onboarding', name: 'Onboarding', icon: 'person-add', color: '#10B981' },
];

export default function TrainingAdminScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      const [coursesRes, statsRes] = await Promise.all([
        api.get('/api/employer/training/courses', { params: { category: filterCategory !== 'all' ? filterCategory : undefined } }),
        api.get('/api/employer/training/stats'),
      ]);
      setCourses(coursesRes.data.courses || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch training data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'draft': return '#F59E0B';
      case 'archived': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getCategoryInfo = (categoryId: string) => CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[2];

  const handlePublish = async (course: TrainingCourse) => {
    try {
      await api.post(`/api/employer/training/courses/${course.id}/publish`);
      fetchData();
      Alert.alert('Success', 'Course published');
    } catch (error) {
      Alert.alert('Error', 'Failed to publish');
    }
  };

  const handleArchive = (course: TrainingCourse) => {
    Alert.alert('Archive Course', `Archive "${course.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', onPress: async () => {
        try {
          await api.post(`/api/employer/training/courses/${course.id}/archive`);
          fetchData();
        } catch (error) {
          Alert.alert('Error', 'Failed to archive');
        }
      }},
    ]);
  };

  const renderCourseCard = (course: TrainingCourse) => {
    const catInfo = getCategoryInfo(course.category);
    return (
      <View key={course.id} style={styles.courseCard}>
        <View style={styles.courseHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: catInfo.color + '20' }]}>
            <Ionicons name={catInfo.icon as any} size={22} color={catInfo.color} />
          </View>
          <View style={styles.courseInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
              {course.is_required && <View style={styles.requiredBadge}><Text style={styles.requiredText}>Required</Text></View>}
            </View>
            <Text style={styles.courseDesc} numberOfLines={1}>{course.description}</Text>
            <View style={styles.courseMeta}>
              <View style={styles.metaItem}><Ionicons name="time" size={12} color="#666" /><Text style={styles.metaText}>{course.duration_hours}h</Text></View>
              <View style={styles.metaItem}><Ionicons name="people" size={12} color="#666" /><Text style={styles.metaText}>{course.assigned_count} assigned</Text></View>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(course.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(course.status) }]}>{course.status}</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>{course.completed_count}/{course.assigned_count} completed</Text>
            <Text style={[styles.progressPercent, { color: course.completion_rate >= 80 ? '#10B981' : course.completion_rate >= 50 ? '#F59E0B' : '#EF4444' }]}>{course.completion_rate}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${course.completion_rate}%`, backgroundColor: course.completion_rate >= 80 ? '#10B981' : course.completion_rate >= 50 ? '#F59E0B' : '#EF4444' }]} />
          </View>
        </View>

        {course.due_date && (
          <View style={styles.dueRow}>
            <Ionicons name="calendar" size={14} color="#EF4444" />
            <Text style={styles.dueText}>Due: {formatDate(course.due_date)}</Text>
          </View>
        )}

        <View style={styles.courseActions}>
          <TouchableOpacity style={styles.actionButton}><Ionicons name="people" size={18} color="#1473FF" /><Text style={styles.actionText}>Enrollees</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}><Ionicons name="create-outline" size={18} color="#666" /></TouchableOpacity>
          {course.status === 'draft' && (
            <TouchableOpacity style={[styles.actionButton, styles.publishButton]} onPress={() => handlePublish(course)}>
              <Ionicons name="rocket" size={18} color="#FFF" />
              <Text style={styles.publishText}>Publish</Text>
            </TouchableOpacity>
          )}
          {course.status === 'active' && (
            <TouchableOpacity style={styles.actionButton} onPress={() => handleArchive(course)}><Ionicons name="archive-outline" size={18} color="#F59E0B" /></TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Training Admin</Text>
          <TouchableOpacity><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_courses}</Text><Text style={styles.statLabel}>Courses</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_enrollments}</Text><Text style={styles.statLabel}>Enrolled</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.avg_completion_rate}%</Text><Text style={styles.statLabel}>Completed</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.overdue_count}</Text><Text style={styles.statLabel}>Overdue</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        <TouchableOpacity style={[styles.filterChip, filterCategory === 'all' && styles.filterChipActive]} onPress={() => { setFilterCategory('all'); setLoading(true); }}>
          <Text style={[styles.filterChipText, filterCategory === 'all' && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat.id} style={[styles.filterChip, filterCategory === cat.id && styles.filterChipActive]} onPress={() => { setFilterCategory(cat.id); setLoading(true); }}>
            <Ionicons name={cat.icon as any} size={14} color={filterCategory === cat.id ? '#FFF' : cat.color} />
            <Text style={[styles.filterChipText, filterCategory === cat.id && styles.filterChipTextActive]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {courses.length > 0 ? courses.map(renderCourseCard) : (
            <View style={styles.emptyState}><Ionicons name="school-outline" size={48} color="#666" /><Text style={styles.emptyText}>No training courses</Text></View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
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
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1a1a2e', marginRight: 8, gap: 6, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 12, color: '#a0a0a0', fontWeight: '500' },
  filterChipTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: { padding: 16 },
  courseCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  courseHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  categoryIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  courseInfo: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  courseTitle: { fontSize: 15, fontWeight: '600', color: '#FFF', flex: 1 },
  requiredBadge: { backgroundColor: '#EF444420', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  requiredText: { fontSize: 10, fontWeight: '600', color: '#EF4444' },
  courseDesc: { fontSize: 12, color: '#666', marginTop: 4 },
  courseMeta: { flexDirection: 'row', marginTop: 6, gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#666' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  progressSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: '#a0a0a0' },
  progressPercent: { fontSize: 12, fontWeight: '600' },
  progressBar: { height: 6, backgroundColor: '#2a2a4e', borderRadius: 3 },
  progressFill: { height: '100%', borderRadius: 3 },
  dueRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  dueText: { fontSize: 12, color: '#EF4444' },
  courseActions: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#0f0f23', borderRadius: 8, gap: 6 },
  actionText: { fontSize: 13, color: '#1473FF' },
  publishButton: { flex: 1, justifyContent: 'center', backgroundColor: '#10B981' },
  publishText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
