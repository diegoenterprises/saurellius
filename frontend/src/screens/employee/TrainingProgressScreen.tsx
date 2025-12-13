/**
 * EMPLOYEE TRAINING PROGRESS SCREEN
 * Track required and optional training courses
 * View certifications, deadlines, and completion status
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
import { useTheme } from '../../context/ThemeContext';

interface Course {
  id: string;
  title: string;
  description?: string;
  category: string;
  type: 'required' | 'recommended' | 'optional';
  duration_minutes: number;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  due_date?: string;
  completed_at?: string;
  certificate_url?: string;
  modules: {
    id: string;
    title: string;
    completed: boolean;
  }[];
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  issued_date: string;
  expiry_date?: string;
  status: 'valid' | 'expiring_soon' | 'expired';
  document_url?: string;
}

interface TrainingStats {
  total_courses: number;
  completed_courses: number;
  in_progress: number;
  overdue: number;
  total_hours_completed: number;
  certifications_count: number;
}

const CATEGORIES = [
  { id: 'compliance', name: 'Compliance', icon: 'shield-checkmark', color: '#3B82F6' },
  { id: 'safety', name: 'Safety', icon: 'warning', color: '#EF4444' },
  { id: 'skills', name: 'Skills', icon: 'bulb', color: '#F59E0B' },
  { id: 'leadership', name: 'Leadership', icon: 'people', color: '#8B5CF6' },
  { id: 'technical', name: 'Technical', icon: 'code', color: '#10B981' },
];

export default function TrainingProgressScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'certifications'>('courses');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  const fetchTrainingData = useCallback(async () => {
    try {
      const [coursesRes, certsRes, statsRes] = await Promise.all([
        api.get('/api/employee/training/courses'),
        api.get('/api/employee/training/certifications'),
        api.get('/api/employee/training/stats'),
      ]);
      
      setCourses(coursesRes.data.courses || []);
      setCertifications(certsRes.data.certifications || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch training data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainingData();
  }, [fetchTrainingData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrainingData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': case 'valid': return '#10B981';
      case 'in_progress': return '#3B82F6';
      case 'not_started': return '#6B7280';
      case 'expiring_soon': return '#F59E0B';
      case 'expired': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const handleStartCourse = async (course: Course) => {
    try {
      await api.post(`/api/employee/training/courses/${course.id}/start`);
      Alert.alert('Course Started', `You've started "${course.title}"`);
      fetchTrainingData();
    } catch (error) {
      Alert.alert('Error', 'Failed to start course');
    }
  };

  const handleResumeCourse = (course: Course) => {
    navigation.navigate('CourseViewer', { courseId: course.id });
  };

  const filteredCourses = courses.filter(course => 
    filterCategory === 'all' || course.category === filterCategory
  );

  const renderCourseCard = (course: Course) => {
    const isExpanded = expandedCourse === course.id;
    const categoryInfo = CATEGORIES.find(c => c.id === course.category);
    const daysUntilDue = course.due_date ? getDaysUntilDue(course.due_date) : null;
    const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && course.status !== 'completed';

    return (
      <View key={course.id} style={[styles.courseCard, isOverdue && styles.courseCardOverdue]}>
        <TouchableOpacity 
          style={styles.courseHeader}
          onPress={() => setExpandedCourse(isExpanded ? null : course.id)}
        >
          <View style={[styles.courseIcon, { backgroundColor: (categoryInfo?.color || '#666') + '20' }]}>
            <Ionicons name={categoryInfo?.icon as any || 'book'} size={24} color={categoryInfo?.color || '#666'} />
          </View>
          <View style={styles.courseInfo}>
            <View style={styles.courseTitleRow}>
              <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
              {course.type === 'required' && (
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Required</Text>
                </View>
              )}
            </View>
            <Text style={styles.courseMeta}>
              {formatDuration(course.duration_minutes)} • {categoryInfo?.name || course.category}
            </Text>
          </View>
          <View style={styles.courseStatus}>
            {course.status === 'completed' ? (
              <Ionicons name="checkmark-circle" size={28} color="#10B981" />
            ) : (
              <View style={styles.progressRing}>
                <Text style={styles.progressRingText}>{course.progress}%</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {course.status !== 'completed' && course.due_date && (
          <View style={[styles.dueDateBar, isOverdue && styles.dueDateBarOverdue]}>
            <Ionicons name={isOverdue ? "alert-circle" : "calendar"} size={14} color={isOverdue ? "#EF4444" : "#F59E0B"} />
            <Text style={[styles.dueDateText, isOverdue && styles.dueDateTextOverdue]}>
              {isOverdue ? `Overdue by ${Math.abs(daysUntilDue!)} days` : `Due ${formatDate(course.due_date)}`}
            </Text>
          </View>
        )}

        {course.status === 'in_progress' && (
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
            </View>
          </View>
        )}

        {isExpanded && (
          <View style={styles.courseExpanded}>
            {course.description && (
              <Text style={styles.courseDescription}>{course.description}</Text>
            )}

            <View style={styles.modulesSection}>
              <Text style={styles.modulesTitle}>Modules</Text>
              {course.modules.map((module, index) => (
                <View key={module.id} style={styles.moduleRow}>
                  <Ionicons 
                    name={module.completed ? "checkbox" : "square-outline"} 
                    size={20} 
                    color={module.completed ? "#10B981" : "#666"} 
                  />
                  <Text style={[styles.moduleName, module.completed && styles.moduleCompleted]}>
                    {index + 1}. {module.title}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.courseActions}>
              {course.status === 'not_started' && (
                <TouchableOpacity 
                  style={styles.startButton}
                  onPress={() => handleStartCourse(course)}
                >
                  <LinearGradient
                    colors={['#1473FF', '#BE01FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.startGradient}
                  >
                    <Ionicons name="play" size={18} color="#FFF" />
                    <Text style={styles.startButtonText}>Start Course</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              {course.status === 'in_progress' && (
                <TouchableOpacity 
                  style={styles.startButton}
                  onPress={() => handleResumeCourse(course)}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.startGradient}
                  >
                    <Ionicons name="play" size={18} color="#FFF" />
                    <Text style={styles.startButtonText}>Continue</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              {course.status === 'completed' && course.certificate_url && (
                <TouchableOpacity style={styles.certificateButton}>
                  <Ionicons name="ribbon" size={18} color="#10B981" />
                  <Text style={styles.certificateButtonText}>View Certificate</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderCertificationCard = (cert: Certification) => (
    <View key={cert.id} style={styles.certCard}>
      <View style={[styles.certIcon, { backgroundColor: getStatusColor(cert.status) + '20' }]}>
        <Ionicons name="ribbon" size={24} color={getStatusColor(cert.status)} />
      </View>
      <View style={styles.certInfo}>
        <Text style={styles.certName}>{cert.name}</Text>
        <Text style={styles.certIssuer}>{cert.issuer}</Text>
        <View style={styles.certDates}>
          <Text style={styles.certDate}>Issued: {formatDate(cert.issued_date)}</Text>
          {cert.expiry_date && (
            <Text style={[styles.certDate, cert.status === 'expired' && styles.certDateExpired]}>
              {cert.status === 'expired' ? 'Expired' : 'Expires'}: {formatDate(cert.expiry_date)}
            </Text>
          )}
        </View>
      </View>
      <View style={[styles.certStatusBadge, { backgroundColor: getStatusColor(cert.status) + '20' }]}>
        <Text style={[styles.certStatusText, { color: getStatusColor(cert.status) }]}>
          {cert.status.replace('_', ' ').charAt(0).toUpperCase() + cert.status.replace('_', ' ').slice(1)}
        </Text>
      </View>
    </View>
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
          <Text style={styles.headerTitle}>Training</Text>
          <View style={{ width: 24 }} />
        </View>

        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.completed_courses}/{stats.total_courses}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.overdue}</Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total_hours_completed}h</Text>
              <Text style={styles.statLabel}>Total Hours</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'courses' && styles.tabActive]}
          onPress={() => setActiveTab('courses')}
        >
          <Text style={[styles.tabText, activeTab === 'courses' && styles.tabTextActive]}>
            Courses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'certifications' && styles.tabActive]}
          onPress={() => setActiveTab('certifications')}
        >
          <Text style={[styles.tabText, activeTab === 'certifications' && styles.tabTextActive]}>
            Certifications
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'courses' && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoryFilter}
          contentContainerStyle={styles.categoryFilterContent}
        >
          <TouchableOpacity
            style={[styles.categoryChip, filterCategory === 'all' && styles.categoryChipActive]}
            onPress={() => setFilterCategory('all')}
          >
            <Text style={[styles.categoryChipText, filterCategory === 'all' && styles.categoryChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, filterCategory === cat.id && styles.categoryChipActive]}
              onPress={() => setFilterCategory(cat.id)}
            >
              <Ionicons name={cat.icon as any} size={14} color={filterCategory === cat.id ? '#FFF' : cat.color} />
              <Text style={[styles.categoryChipText, filterCategory === cat.id && styles.categoryChipTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />
        }
      >
        {activeTab === 'courses' ? (
          <View style={styles.section}>
            {filteredCourses.length > 0 ? (
              filteredCourses.map(renderCourseCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="school-outline" size={48} color="#666" />
                <Text style={styles.emptyText}>No courses found</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            {certifications.length > 0 ? (
              certifications.map(renderCertificationCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="ribbon-outline" size={48} color="#666" />
                <Text style={styles.emptyText}>No certifications yet</Text>
              </View>
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#1473FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#a0a0a0',
  },
  tabTextActive: {
    color: '#FFF',
  },
  categoryFilter: {
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  categoryFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1a1a2e',
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  categoryChipActive: {
    backgroundColor: '#1473FF',
    borderColor: '#1473FF',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#a0a0a0',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  courseCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
    overflow: 'hidden',
  },
  courseCardOverdue: {
    borderColor: '#EF4444',
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  courseIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: '#EF444420',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EF4444',
  },
  courseMeta: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 4,
  },
  courseStatus: {},
  progressRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#1473FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1473FF',
  },
  dueDateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  dueDateBarOverdue: {
    backgroundColor: '#EF444420',
  },
  dueDateText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  dueDateTextOverdue: {
    color: '#EF4444',
  },
  progressBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2a2a4e',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1473FF',
    borderRadius: 2,
  },
  courseExpanded: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    padding: 16,
  },
  courseDescription: {
    fontSize: 14,
    color: '#a0a0a0',
    lineHeight: 20,
    marginBottom: 16,
  },
  modulesSection: {
    marginBottom: 16,
  },
  modulesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 10,
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  moduleName: {
    fontSize: 14,
    color: '#FFF',
    flex: 1,
  },
  moduleCompleted: {
    color: '#666',
    textDecorationLine: 'line-through',
  },
  courseActions: {
    flexDirection: 'row',
    gap: 10,
  },
  startButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  startGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  certificateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B98120',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  certificateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
  certCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  certIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  certInfo: {
    flex: 1,
  },
  certName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  certIssuer: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 2,
  },
  certDates: {
    marginTop: 6,
  },
  certDate: {
    fontSize: 11,
    color: '#666',
  },
  certDateExpired: {
    color: '#EF4444',
  },
  certStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  certStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
});
