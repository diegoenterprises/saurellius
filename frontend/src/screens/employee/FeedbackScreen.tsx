/**
 * EMPLOYEE FEEDBACK SCREEN
 * Submit feedback, suggestions, and concerns
 * Anonymous options, track responses, view history
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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface Feedback {
  id: string;
  type: 'suggestion' | 'concern' | 'praise' | 'question';
  subject: string;
  message: string;
  anonymous: boolean;
  status: 'submitted' | 'under_review' | 'responded' | 'closed';
  created_at: string;
  response?: string;
  responded_at?: string;
  responder_name?: string;
}

interface FeedbackStats {
  total_submitted: number;
  pending_response: number;
  responded: number;
}

const FEEDBACK_TYPES = [
  { id: 'suggestion', name: 'Suggestion', icon: 'bulb', color: '#F59E0B', description: 'Ideas to improve' },
  { id: 'concern', name: 'Concern', icon: 'alert-circle', color: '#EF4444', description: 'Issues or problems' },
  { id: 'praise', name: 'Praise', icon: 'heart', color: '#EC4899', description: 'Recognition & thanks' },
  { id: 'question', name: 'Question', icon: 'help-circle', color: '#3B82F6', description: 'Ask something' },
];

export default function FeedbackScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [formData, setFormData] = useState({ type: 'suggestion', subject: '', message: '', anonymous: false });

  const fetchData = useCallback(async () => {
    try {
      const [feedbackRes, statsRes] = await Promise.all([
        api.get('/api/employee/feedback'),
        api.get('/api/employee/feedback/stats'),
      ]);
      setFeedbacks(feedbackRes.data.feedbacks || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
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
      case 'responded': return '#10B981';
      case 'under_review': return '#3B82F6';
      case 'submitted': return '#F59E0B';
      case 'closed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getTypeInfo = (typeId: string) => FEEDBACK_TYPES.find(t => t.id === typeId) || FEEDBACK_TYPES[0];

  const handleSubmitFeedback = async () => {
    if (!formData.subject.trim() || !formData.message.trim()) {
      Alert.alert('Error', 'Subject and message are required');
      return;
    }
    try {
      await api.post('/api/employee/feedback', formData);
      setShowAddModal(false);
      setFormData({ type: 'suggestion', subject: '', message: '', anonymous: false });
      fetchData();
      Alert.alert('Success', 'Feedback submitted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback');
    }
  };

  const renderFeedbackCard = (feedback: Feedback) => {
    const typeInfo = getTypeInfo(feedback.type);
    const isExpanded = expandedFeedback === feedback.id;

    return (
      <TouchableOpacity key={feedback.id} style={styles.feedbackCard} onPress={() => setExpandedFeedback(isExpanded ? null : feedback.id)}>
        <View style={styles.feedbackHeader}>
          <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + '20' }]}>
            <Ionicons name={typeInfo.icon as any} size={20} color={typeInfo.color} />
          </View>
          <View style={styles.feedbackInfo}>
            <Text style={styles.feedbackSubject}>{feedback.subject}</Text>
            <View style={styles.feedbackMeta}>
              <Text style={styles.metaText}>{typeInfo.name}</Text>
              {feedback.anonymous && <><Text style={styles.metaDot}>•</Text><Text style={styles.metaText}>Anonymous</Text></>}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(feedback.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(feedback.status) }]}>{feedback.status.replace('_', ' ')}</Text>
          </View>
        </View>

        <Text style={styles.feedbackMessage} numberOfLines={isExpanded ? undefined : 2}>{feedback.message}</Text>
        <Text style={styles.feedbackDate}>{formatDate(feedback.created_at)}</Text>

        {isExpanded && feedback.response && (
          <View style={styles.responseBox}>
            <View style={styles.responseHeader}>
              <Ionicons name="chatbubble" size={16} color="#10B981" />
              <Text style={styles.responseTitle}>Response</Text>
              {feedback.responder_name && <Text style={styles.responderName}>from {feedback.responder_name}</Text>}
            </View>
            <Text style={styles.responseText}>{feedback.response}</Text>
            {feedback.responded_at && <Text style={styles.responseDate}>{formatDate(feedback.responded_at)}</Text>}
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
          <Text style={styles.headerTitle}>Feedback</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_submitted}</Text><Text style={styles.statLabel}>Submitted</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pending_response}</Text><Text style={styles.statLabel}>Pending</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.responded}</Text><Text style={styles.statLabel}>Responded</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {feedbacks.length > 0 ? feedbacks.map(renderFeedbackCard) : (
            <View style={styles.emptyState}><Ionicons name="chatbubbles-outline" size={48} color="#666" /><Text style={styles.emptyText}>No feedback submitted yet</Text><Text style={styles.emptySubtext}>Share your thoughts with us</Text></View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>New Feedback</Text>
            <TouchableOpacity onPress={handleSubmitFeedback}><Text style={styles.modalSave}>Submit</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeGrid}>
                {FEEDBACK_TYPES.map(type => (
                  <TouchableOpacity key={type.id} style={[styles.typeOption, formData.type === type.id && styles.typeOptionActive]} onPress={() => setFormData(p => ({...p, type: type.id}))}>
                    <View style={[styles.typeOptionIcon, { backgroundColor: type.color + '20' }]}>
                      <Ionicons name={type.icon as any} size={24} color={type.color} />
                    </View>
                    <Text style={[styles.typeOptionName, formData.type === type.id && styles.typeOptionNameActive]}>{type.name}</Text>
                    <Text style={styles.typeOptionDesc}>{type.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Subject *</Text><TextInput style={styles.input} value={formData.subject} onChangeText={t => setFormData(p => ({...p, subject: t}))} placeholder="Brief summary" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Message *</Text><TextInput style={[styles.input, styles.textArea]} value={formData.message} onChangeText={t => setFormData(p => ({...p, message: t}))} placeholder="Provide details..." placeholderTextColor="#666" multiline numberOfLines={5} /></View>
            <View style={styles.anonymousRow}>
              <View style={styles.anonymousInfo}>
                <Text style={styles.anonymousLabel}>Submit Anonymously</Text>
                <Text style={styles.anonymousDesc}>Your name won't be shared</Text>
              </View>
              <Switch value={formData.anonymous} onValueChange={v => setFormData(p => ({...p, anonymous: v}))} trackColor={{ false: '#2a2a4e', true: '#1473FF' }} thumbColor="#FFF" />
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
  statsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 12, padding: 14 },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 12 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  feedbackCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  typeIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  feedbackInfo: { flex: 1 },
  feedbackSubject: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  feedbackMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { fontSize: 12, color: '#666' },
  metaDot: { fontSize: 12, color: '#666', marginHorizontal: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  feedbackMessage: { fontSize: 14, color: '#a0a0a0', lineHeight: 20 },
  feedbackDate: { fontSize: 12, color: '#666', marginTop: 10 },
  responseBox: { marginTop: 14, padding: 14, backgroundColor: '#10B98110', borderRadius: 10, borderWidth: 1, borderColor: '#10B98130' },
  responseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  responseTitle: { fontSize: 13, fontWeight: '600', color: '#10B981' },
  responderName: { fontSize: 11, color: '#666', marginLeft: 'auto' },
  responseText: { fontSize: 14, color: '#FFF', lineHeight: 20 },
  responseDate: { fontSize: 11, color: '#666', marginTop: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#FFF', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#666', marginTop: 4 },
  modalContainer: { flex: 1, backgroundColor: '#0f0f23' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  modalCancel: { fontSize: 16, color: '#a0a0a0' },
  modalSave: { fontSize: 16, fontWeight: '600', color: '#1473FF' },
  modalContent: { padding: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, color: '#a0a0a0', marginBottom: 8 },
  input: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14, fontSize: 16, color: '#FFF', borderWidth: 1, borderColor: '#2a2a4e' },
  textArea: { height: 120, textAlignVertical: 'top' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeOption: { width: '47%', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, borderWidth: 2, borderColor: 'transparent', alignItems: 'center' },
  typeOptionActive: { borderColor: '#1473FF' },
  typeOptionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  typeOptionName: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  typeOptionNameActive: { color: '#1473FF' },
  typeOptionDesc: { fontSize: 11, color: '#666', marginTop: 2, textAlign: 'center' },
  anonymousRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginTop: 8 },
  anonymousInfo: { flex: 1 },
  anonymousLabel: { fontSize: 15, fontWeight: '500', color: '#FFF' },
  anonymousDesc: { fontSize: 12, color: '#666', marginTop: 2 },
});
