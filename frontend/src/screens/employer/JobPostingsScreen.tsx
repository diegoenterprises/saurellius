/**
 * EMPLOYER JOB POSTINGS SCREEN
 * Create and manage job listings
 * Track applications, manage hiring pipeline
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

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full_time' | 'part_time' | 'contract' | 'internship';
  salary_min?: number;
  salary_max?: number;
  status: 'draft' | 'open' | 'paused' | 'closed' | 'filled';
  applicants_count: number;
  new_applicants: number;
  created_at: string;
  posted_at?: string;
  closes_at?: string;
  views_count: number;
}

interface JobStats {
  total_postings: number;
  open_positions: number;
  total_applicants: number;
  new_this_week: number;
}

export default function JobPostingsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('open');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', department: '', location: '', type: 'full_time', salary_min: '', salary_max: '', description: '' });

  const fetchData = useCallback(async () => {
    try {
      const [postingsRes, statsRes] = await Promise.all([
        api.get('/api/employer/job-postings', { params: { status: filterStatus !== 'all' ? filterStatus : undefined } }),
        api.get('/api/employer/job-postings/stats'),
      ]);
      setPostings(postingsRes.data.postings || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch job postings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#10B981';
      case 'paused': return '#F59E0B';
      case 'closed': return '#6B7280';
      case 'filled': return '#3B82F6';
      case 'draft': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'full_time': return 'Full-time';
      case 'part_time': return 'Part-time';
      case 'contract': return 'Contract';
      case 'internship': return 'Internship';
      default: return type;
    }
  };

  const handleCreatePosting = async () => {
    if (!formData.title.trim() || !formData.department.trim()) {
      Alert.alert('Error', 'Title and department are required');
      return;
    }
    try {
      await api.post('/api/employer/job-postings', {
        ...formData,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : undefined,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : undefined,
      });
      setShowAddModal(false);
      setFormData({ title: '', department: '', location: '', type: 'full_time', salary_min: '', salary_max: '', description: '' });
      fetchData();
      Alert.alert('Success', 'Job posting created as draft');
    } catch (error) {
      Alert.alert('Error', 'Failed to create posting');
    }
  };

  const handlePublish = async (posting: JobPosting) => {
    try {
      await api.post(`/api/employer/job-postings/${posting.id}/publish`);
      fetchData();
      Alert.alert('Success', 'Job posting published');
    } catch (error) {
      Alert.alert('Error', 'Failed to publish');
    }
  };

  const handlePause = async (posting: JobPosting) => {
    try {
      await api.post(`/api/employer/job-postings/${posting.id}/pause`);
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to pause');
    }
  };

  const handleClose = async (posting: JobPosting) => {
    Alert.alert('Close Posting', 'Close this job posting?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Close', onPress: async () => {
        try {
          await api.post(`/api/employer/job-postings/${posting.id}/close`);
          fetchData();
        } catch (error) {
          Alert.alert('Error', 'Failed to close');
        }
      }},
    ]);
  };

  const renderPostingCard = (posting: JobPosting) => (
    <View key={posting.id} style={styles.postingCard}>
      <View style={styles.postingHeader}>
        <View style={styles.postingInfo}>
          <Text style={styles.postingTitle}>{posting.title}</Text>
          <Text style={styles.postingDept}>{posting.department}</Text>
          <View style={styles.postingMeta}>
            <View style={styles.metaItem}><Ionicons name="location" size={12} color="#666" /><Text style={styles.metaText}>{posting.location}</Text></View>
            <View style={styles.metaItem}><Ionicons name="briefcase" size={12} color="#666" /><Text style={styles.metaText}>{getTypeLabel(posting.type)}</Text></View>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(posting.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(posting.status) }]}>{posting.status}</Text>
        </View>
      </View>

      {(posting.salary_min || posting.salary_max) && (
        <View style={styles.salaryRow}>
          <Ionicons name="cash" size={14} color="#10B981" />
          <Text style={styles.salaryText}>
            {posting.salary_min && posting.salary_max ? `${formatCurrency(posting.salary_min)} - ${formatCurrency(posting.salary_max)}` : posting.salary_min ? `From ${formatCurrency(posting.salary_min)}` : `Up to ${formatCurrency(posting.salary_max!)}`}
          </Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="people" size={16} color="#1473FF" />
          <Text style={styles.statValue}>{posting.applicants_count}</Text>
          <Text style={styles.statLabel}>Applicants</Text>
        </View>
        {posting.new_applicants > 0 && (
          <View style={styles.statItem}>
            <Ionicons name="sparkles" size={16} color="#F59E0B" />
            <Text style={styles.statValue}>{posting.new_applicants}</Text>
            <Text style={styles.statLabel}>New</Text>
          </View>
        )}
        <View style={styles.statItem}>
          <Ionicons name="eye" size={16} color="#8B5CF6" />
          <Text style={styles.statValue}>{posting.views_count}</Text>
          <Text style={styles.statLabel}>Views</Text>
        </View>
      </View>

      <View style={styles.postingActions}>
        {posting.status === 'draft' && (
          <TouchableOpacity style={[styles.actionButton, styles.publishButton]} onPress={() => handlePublish(posting)}>
            <Ionicons name="rocket" size={16} color="#FFF" />
            <Text style={styles.publishText}>Publish</Text>
          </TouchableOpacity>
        )}
        {posting.status === 'open' && (
          <>
            <TouchableOpacity style={styles.actionButton} onPress={() => handlePause(posting)}>
              <Ionicons name="pause" size={16} color="#F59E0B" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleClose(posting)}>
              <Ionicons name="close-circle" size={16} color="#EF4444" />
            </TouchableOpacity>
          </>
        )}
        {posting.status === 'paused' && (
          <TouchableOpacity style={[styles.actionButton, styles.resumeButton]} onPress={() => handlePublish(posting)}>
            <Ionicons name="play" size={16} color="#FFF" />
            <Text style={styles.resumeText}>Resume</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="create-outline" size={16} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.dateRow}>
        <Text style={styles.dateText}>Posted: {posting.posted_at ? formatDate(posting.posted_at) : 'Not published'}</Text>
        {posting.closes_at && <Text style={styles.dateText}>Closes: {formatDate(posting.closes_at)}</Text>}
      </View>
    </View>
  );

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Job Postings</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statCardValue}>{stats.total_postings}</Text><Text style={styles.statCardLabel}>Total</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statCardValue, { color: '#10B981' }]}>{stats.open_positions}</Text><Text style={styles.statCardLabel}>Open</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statCardValue}>{stats.total_applicants}</Text><Text style={styles.statCardLabel}>Applicants</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statCardValue, { color: '#F59E0B' }]}>{stats.new_this_week}</Text><Text style={styles.statCardLabel}>New</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {['open', 'draft', 'paused', 'closed', 'filled', 'all'].map(status => (
          <TouchableOpacity key={status} style={[styles.filterChip, filterStatus === status && styles.filterChipActive]} onPress={() => { setFilterStatus(status); setLoading(true); }}>
            <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {postings.length > 0 ? postings.map(renderPostingCard) : (
            <View style={styles.emptyState}><Ionicons name="briefcase-outline" size={48} color="#666" /><Text style={styles.emptyText}>No job postings</Text></View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>New Job Posting</Text>
            <TouchableOpacity onPress={handleCreatePosting}><Text style={styles.modalSave}>Create</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Job Title *</Text><TextInput style={styles.input} value={formData.title} onChangeText={t => setFormData(p => ({...p, title: t}))} placeholder="e.g., Software Engineer" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Department *</Text><TextInput style={styles.input} value={formData.department} onChangeText={t => setFormData(p => ({...p, department: t}))} placeholder="e.g., Engineering" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Location</Text><TextInput style={styles.input} value={formData.location} onChangeText={t => setFormData(p => ({...p, location: t}))} placeholder="e.g., Remote, New York, NY" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Employment Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['full_time', 'part_time', 'contract', 'internship'].map(type => (
                  <TouchableOpacity key={type} style={[styles.typeOption, formData.type === type && styles.typeOptionActive]} onPress={() => setFormData(p => ({...p, type}))}>
                    <Text style={[styles.typeOptionText, formData.type === type && styles.typeOptionTextActive]}>{getTypeLabel(type)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.inputLabel}>Min Salary</Text><TextInput style={styles.input} value={formData.salary_min} onChangeText={t => setFormData(p => ({...p, salary_min: t}))} placeholder="50000" placeholderTextColor="#666" keyboardType="number-pad" /></View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}><Text style={styles.inputLabel}>Max Salary</Text><TextInput style={styles.input} value={formData.salary_max} onChangeText={t => setFormData(p => ({...p, salary_max: t}))} placeholder="80000" placeholderTextColor="#666" keyboardType="number-pad" /></View>
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
  statCardValue: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  statCardLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.card, marginRight: 8, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 13, color: '#a0a0a0', fontWeight: '500' },
  filterChipTextActive: { color: colors.text },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  postingCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  postingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  postingInfo: { flex: 1 },
  postingTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  postingDept: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  postingMeta: { flexDirection: 'row', marginTop: 8, gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#666' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  salaryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  salaryText: { fontSize: 14, fontWeight: '500', color: '#10B981' },
  statsRow: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 20 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValue: { fontSize: 15, fontWeight: '600', color: colors.text },
  statLabel: { fontSize: 11, color: '#666' },
  postingActions: { flexDirection: 'row', marginTop: 14, gap: 8 },
  actionButton: { padding: 10, backgroundColor: colors.background, borderRadius: 8 },
  publishButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981', gap: 6 },
  publishText: { fontSize: 14, fontWeight: '600', color: colors.text },
  resumeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3B82F6', gap: 6 },
  resumeText: { fontSize: 14, fontWeight: '600', color: colors.text },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  dateText: { fontSize: 11, color: '#666' },
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
  inputRow: { flexDirection: 'row' },
  typeOption: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#2a2a4e', borderRadius: 10, marginRight: 8 },
  typeOptionActive: { backgroundColor: '#1473FF' },
  typeOptionText: { fontSize: 13, color: '#a0a0a0' },
  typeOptionTextActive: { color: colors.text },
});
