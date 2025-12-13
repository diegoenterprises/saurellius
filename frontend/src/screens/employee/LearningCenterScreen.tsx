/**
 * EMPLOYEE LEARNING CENTER SCREEN
 * Access training courses and educational content
 * Track progress, earn certificates, view assignments
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

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  lessons_count: number;
  completed_lessons: number;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  required: boolean;
  due_date?: string;
  certificate_earned?: boolean;
  thumbnail_url?: string;
  instructor_name?: string;
}

interface LearningStats {
  courses_completed: number;
  hours_learned: number;
  certificates_earned: number;
  streak_days: number;
}

const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'library' },
  { id: 'required', name: 'Required', icon: 'alert-circle' },
  { id: 'compliance', name: 'Compliance', icon: 'shield-checkmark' },
  { id: 'skills', name: 'Skills', icon: 'rocket' },
  { id: 'leadership', name: 'Leadership', icon: 'people' },
];

export default function LearningCenterScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      const [coursesRes, statsRes] = await Promise.all([
        api.get('/api/employee/learning/courses', { params: { category: filterCategory !== 'all' ? filterCategory : undefined } }),
        api.get('/api/employee/learning/stats'),
      ]);
      setCourses(coursesRes.data.courses || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch learning data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#3B82F6';
      case 'not_started': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const handleStartCourse = async (course: Course) => {
    try {
      if (course.status === 'not_started') {
        await api.post(`/api/employee/learning/courses/${course.id}/start`);
      }
      navigation.navigate('CourseViewer', { courseId: course.id });
    } catch (error) {
      Alert.alert('Error', 'Failed to start course');
    }
  };

  const renderCourseCard = (course: Course) => (
    <TouchableOpacity key={course.id} style={styles.courseCard} onPress={() => handleStartCourse(course)}>
      <View style={styles.courseHeader}>
        <View style={[styles.categoryBadge, course.required && styles.requiredBadge]}>
          <Text style={[styles.categoryText, course.required && styles.requiredText]}>{course.required ? 'Required' : course.category}</Text>
        </View>
        {course.certificate_earned && <Ionicons name="ribbon" size={20} color="#F59E0B" />}
      </View>

      <Text style={styles.courseTitle}>{course.title}</Text>
      <Text style={styles.courseDescription} numberOfLines={2}>{course.description}</Text>

      {course.instructor_name && (
        <View style={styles.instructorRow}>
          <Ionicons name="person" size={12} color="#666" />
          <Text style={styles.instructorText}>{course.instructor_name}</Text>
        </View>
      )}

      <View style={styles.courseMeta}>
        <View style={styles.metaItem}><Ionicons name="time" size={14} color="#666" /><Text style={styles.metaText}>{formatDuration(course.duration_minutes)}</Text></View>
        <View style={styles.metaItem}><Ionicons name="book" size={14} color="#666" /><Text style={styles.metaText}>{course.lessons_count} lessons</Text></View>
        {course.due_date && (
          <View style={styles.metaItem}><Ionicons name="calendar" size={14} color="#EF4444" /><Text style={[styles.metaText, { color: '#EF4444' }]}>Due {formatDate(course.due_date)}</Text></View>
        )}
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{course.completed_lessons}/{course.lessons_count} completed</Text>
          <Text style={[styles.progressPercent, { color: getStatusColor(course.status) }]}>{course.progress}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${course.progress}%`, backgroundColor: getStatusColor(course.status) }]} />
        </View>
      </View>

      <View style={styles.actionRow}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(course.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(course.status) }]}>{course.status.replace('_', ' ')}</Text>
        </View>
        <View style={styles.startButton}>
          <Text style={styles.startText}>{course.status === 'completed' ? 'Review' : course.status === 'in_progress' ? 'Continue' : 'Start'}</Text>
          <Ionicons name="arrow-forward" size={16} color="#1473FF" />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Learning Center</Text>
          <TouchableOpacity><Ionicons name="trophy-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Ionicons name="school" size={20} color="#10B981" /><Text style={styles.statValue}>{stats.courses_completed}</Text><Text style={styles.statLabel}>Completed</Text></View>
            <View style={styles.statCard}><Ionicons name="time" size={20} color="#3B82F6" /><Text style={styles.statValue}>{stats.hours_learned}h</Text><Text style={styles.statLabel}>Learned</Text></View>
            <View style={styles.statCard}><Ionicons name="ribbon" size={20} color="#F59E0B" /><Text style={styles.statValue}>{stats.certificates_earned}</Text><Text style={styles.statLabel}>Certificates</Text></View>
            <View style={styles.statCard}><Ionicons name="flame" size={20} color="#EF4444" /><Text style={styles.statValue}>{stats.streak_days}</Text><Text style={styles.statLabel}>Day Streak</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat.id} style={[styles.filterChip, filterCategory === cat.id && styles.filterChipActive]} onPress={() => { setFilterCategory(cat.id); setLoading(true); }}>
            <Ionicons name={cat.icon as any} size={14} color={filterCategory === cat.id ? '#FFF' : '#a0a0a0'} />
            <Text style={[styles.filterChipText, filterCategory === cat.id && styles.filterChipTextActive]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {courses.length > 0 ? courses.map(renderCourseCard) : (
            <View style={styles.emptyState}><Ionicons name="library-outline" size={48} color="#666" /><Text style={styles.emptyText}>No courses available</Text></View>
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
  statsContainer: { flexDirection: 'row', marginHorizontal: 20, gap: 8 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginTop: 6 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1a1a2e', marginRight: 8, gap: 6, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 12, color: '#a0a0a0', fontWeight: '500' },
  filterChipTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: { padding: 16 },
  courseCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  courseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  categoryBadge: { backgroundColor: '#3B82F620', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  requiredBadge: { backgroundColor: '#EF444420' },
  categoryText: { fontSize: 11, fontWeight: '600', color: '#3B82F6' },
  requiredText: { color: '#EF4444' },
  courseTitle: { fontSize: 17, fontWeight: '600', color: '#FFF', marginBottom: 6 },
  courseDescription: { fontSize: 13, color: '#a0a0a0', lineHeight: 18 },
  instructorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  instructorText: { fontSize: 12, color: '#666' },
  courseMeta: { flexDirection: 'row', marginTop: 12, gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#666' },
  progressSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 12, color: '#a0a0a0' },
  progressPercent: { fontSize: 12, fontWeight: '600' },
  progressBar: { height: 6, backgroundColor: '#2a2a4e', borderRadius: 3 },
  progressFill: { height: '100%', borderRadius: 3 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  startButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  startText: { fontSize: 14, fontWeight: '600', color: '#1473FF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
