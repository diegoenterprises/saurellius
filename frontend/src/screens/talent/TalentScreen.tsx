// Talent Management Screen
// ATS, Performance Reviews, Goals, LMS, 360 Feedback

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Theme colors
const theme = {
  colors: {
    primary: '#6366F1',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  }
};

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  status: string;
  applications_count: number;
  created_at: string;
}

interface Application {
  id: string;
  job_id: string;
  candidate: {
    name: string;
    email: string;
  };
  status: string;
  stage: string;
  applied_at: string;
}

const TalentScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications' | 'reviews' | 'goals' | 'training'>('jobs');
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewJobModal, setShowNewJobModal] = useState(false);

  const tabs = [
    { id: 'jobs', label: 'Job Postings', icon: 'briefcase-outline' },
    { id: 'applications', label: 'Applications', icon: 'people-outline' },
    { id: 'reviews', label: 'Reviews', icon: 'star-outline' },
    { id: 'goals', label: 'Goals', icon: 'flag-outline' },
    { id: 'training', label: 'Training', icon: 'school-outline' },
  ];

  const mockJobs: JobPosting[] = [
    {
      id: '1',
      title: 'Senior Software Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      status: 'active',
      applications_count: 45,
      created_at: '2024-12-01',
    },
    {
      id: '2',
      title: 'Product Manager',
      department: 'Product',
      location: 'New York, NY',
      type: 'Full-time',
      status: 'active',
      applications_count: 28,
      created_at: '2024-12-05',
    },
    {
      id: '3',
      title: 'UX Designer',
      department: 'Design',
      location: 'San Francisco, CA',
      type: 'Full-time',
      status: 'active',
      applications_count: 32,
      created_at: '2024-12-08',
    },
  ];

  useEffect(() => {
    setJobs(mockJobs);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderJobCard = (job: JobPosting) => (
    <TouchableOpacity
      key={job.id}
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="briefcase" size={20} color={theme.colors.primary} />
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{job.title}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: theme.colors.success + '20' }]}>
          <Text style={[styles.statusText, { color: theme.colors.success }]}>{job.status}</Text>
        </View>
      </View>
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="business-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>{job.department}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>{job.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
            {job.applications_count} applications
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderApplicationsTab = () => (
    <View style={styles.pipelineContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Hiring Pipeline</Text>
      <View style={styles.pipeline}>
        {['Applied', 'Screening', 'Interview', 'Offer', 'Hired'].map((stage, index) => (
          <View key={stage} style={styles.pipelineStage}>
            <View style={[styles.pipelineCircle, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.pipelineCount}>{Math.floor(Math.random() * 20) + 5}</Text>
            </View>
            <Text style={[styles.pipelineLabel, { color: theme.colors.textSecondary }]}>{stage}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderReviewsTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
        <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
        <Text style={[styles.statValue, { color: theme.colors.text }]}>Q4 2024</Text>
        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Current Review Cycle</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.miniStat, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.miniStatValue, { color: theme.colors.success }]}>85%</Text>
          <Text style={[styles.miniStatLabel, { color: theme.colors.textSecondary }]}>Completed</Text>
        </View>
        <View style={[styles.miniStat, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.miniStatValue, { color: theme.colors.warning }]}>12</Text>
          <Text style={[styles.miniStatLabel, { color: theme.colors.textSecondary }]}>Pending</Text>
        </View>
        <View style={[styles.miniStat, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.miniStatValue, { color: theme.colors.primary }]}>4.2</Text>
          <Text style={[styles.miniStatLabel, { color: theme.colors.textSecondary }]}>Avg Rating</Text>
        </View>
      </View>
    </View>
  );

  const renderGoalsTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.goalHeader}>
          <Text style={[styles.goalTitle, { color: theme.colors.text }]}>Increase Customer Retention</Text>
          <Text style={[styles.goalProgress, { color: theme.colors.success }]}>75%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '75%', backgroundColor: theme.colors.success }]} />
        </View>
        <Text style={[styles.goalDue, { color: theme.colors.textSecondary }]}>Due: Dec 31, 2024</Text>
      </View>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.goalHeader}>
          <Text style={[styles.goalTitle, { color: theme.colors.text }]}>Launch Mobile App v2</Text>
          <Text style={[styles.goalProgress, { color: theme.colors.warning }]}>45%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '45%', backgroundColor: theme.colors.warning }]} />
        </View>
        <Text style={[styles.goalDue, { color: theme.colors.textSecondary }]}>Due: Jan 15, 2025</Text>
      </View>
    </View>
  );

  const renderTrainingTab = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Required Training</Text>
      {['Compliance Training 2024', 'Security Awareness', 'Anti-Harassment'].map((course, i) => (
        <View key={i} style={[styles.courseCard, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="book-outline" size={20} color={theme.colors.primary} />
          <View style={styles.courseInfo}>
            <Text style={[styles.courseName, { color: theme.colors.text }]}>{course}</Text>
            <Text style={[styles.courseDuration, { color: theme.colors.textSecondary }]}>45 min</Text>
          </View>
          <TouchableOpacity style={[styles.startButton, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>Talent Management</Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowNewJobModal(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.id ? '#FFFFFF' : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === tab.id ? '#FFFFFF' : theme.colors.textSecondary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'jobs' && jobs.map(renderJobCard)}
        {activeTab === 'applications' && renderApplicationsTab()}
        {activeTab === 'reviews' && renderReviewsTab()}
        {activeTab === 'goals' && renderGoalsTab()}
        {activeTab === 'training' && renderTrainingTab()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(99,102,241,0.1)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: { paddingHorizontal: 16, marginBottom: 16 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  tabLabel: { marginLeft: 6, fontSize: 14, fontWeight: '500' },
  content: { flex: 1, paddingHorizontal: 16 },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '500' },
  cardDetails: { gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailText: { marginLeft: 8, fontSize: 14 },
  tabContent: { paddingBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  pipelineContainer: { marginBottom: 20 },
  pipeline: { flexDirection: 'row', justifyContent: 'space-between' },
  pipelineStage: { alignItems: 'center' },
  pipelineCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipelineCount: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  pipelineLabel: { marginTop: 8, fontSize: 12 },
  statCard: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: { fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  statLabel: { fontSize: 14, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12 },
  miniStat: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  miniStatValue: { fontSize: 20, fontWeight: 'bold' },
  miniStatLabel: { fontSize: 12, marginTop: 4 },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: { fontSize: 16, fontWeight: '500', flex: 1 },
  goalProgress: { fontSize: 16, fontWeight: 'bold' },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: { height: '100%', borderRadius: 4 },
  goalDue: { fontSize: 12 },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  courseInfo: { flex: 1, marginLeft: 12 },
  courseName: { fontSize: 14, fontWeight: '500' },
  courseDuration: { fontSize: 12, marginTop: 2 },
  startButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: { color: colors.text, fontSize: 14, fontWeight: '600' },
});

export default TalentScreen;
