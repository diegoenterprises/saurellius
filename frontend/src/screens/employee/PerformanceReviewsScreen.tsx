/**
 * EMPLOYEE PERFORMANCE REVIEWS SCREEN
 * View performance reviews, ratings, and feedback
 * Track review cycles and self-assessments
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

interface Review {
  id: string;
  period: string;
  type: 'annual' | 'quarterly' | 'probation' | 'project';
  status: 'pending_self' | 'pending_manager' | 'completed' | 'acknowledged';
  overall_rating?: number;
  reviewer_name?: string;
  review_date?: string;
  due_date?: string;
  strengths?: string[];
  improvements?: string[];
  goals_met?: number;
  goals_total?: number;
  comments?: string;
}

interface ReviewStats {
  avg_rating: number;
  total_reviews: number;
  pending_action: number;
  goals_achievement: number;
}

export default function PerformanceReviewsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [reviewsRes, statsRes] = await Promise.all([
        api.get('/api/employee/performance/reviews'),
        api.get('/api/employee/performance/stats'),
      ]);
      setReviews(reviewsRes.data.reviews || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
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
      case 'completed': case 'acknowledged': return '#10B981';
      case 'pending_self': return '#F59E0B';
      case 'pending_manager': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_self': return 'Self-Assessment Due';
      case 'pending_manager': return 'Awaiting Manager';
      case 'completed': return 'Completed';
      case 'acknowledged': return 'Acknowledged';
      default: return status;
    }
  };

  const renderRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={18} color={i <= rating ? '#F59E0B' : '#666'} />
      );
    }
    return <View style={styles.stars}>{stars}</View>;
  };

  const renderReviewCard = (review: Review) => {
    const isExpanded = expandedReview === review.id;
    return (
      <View key={review.id} style={styles.reviewCard}>
        <TouchableOpacity style={styles.reviewHeader} onPress={() => setExpandedReview(isExpanded ? null : review.id)}>
          <View style={styles.reviewIcon}>
            <Ionicons name={review.status === 'completed' || review.status === 'acknowledged' ? 'checkmark-circle' : 'time'} size={24} color={getStatusColor(review.status)} />
          </View>
          <View style={styles.reviewInfo}>
            <Text style={styles.reviewPeriod}>{review.period}</Text>
            <Text style={styles.reviewType}>{review.type.charAt(0).toUpperCase() + review.type.slice(1)} Review</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(review.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(review.status) }]}>{getStatusLabel(review.status)}</Text>
          </View>
        </TouchableOpacity>

        {review.overall_rating && (
          <View style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>Overall Rating:</Text>
            {renderRatingStars(review.overall_rating)}
            <Text style={styles.ratingValue}>{review.overall_rating}/5</Text>
          </View>
        )}

        {review.due_date && review.status.includes('pending') && (
          <View style={styles.dueDate}>
            <Ionicons name="calendar" size={14} color="#F59E0B" />
            <Text style={styles.dueDateText}>Due: {formatDate(review.due_date)}</Text>
          </View>
        )}

        {isExpanded && (
          <View style={styles.reviewExpanded}>
            {review.reviewer_name && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reviewer:</Text>
                <Text style={styles.detailValue}>{review.reviewer_name}</Text>
              </View>
            )}
            {review.review_date && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Review Date:</Text>
                <Text style={styles.detailValue}>{formatDate(review.review_date)}</Text>
              </View>
            )}
            {review.goals_met !== undefined && (
              <View style={styles.goalsSection}>
                <Text style={styles.goalsTitle}>Goals Achievement</Text>
                <View style={styles.goalsBar}>
                  <View style={[styles.goalsFill, { width: `${(review.goals_met / (review.goals_total || 1)) * 100}%` }]} />
                </View>
                <Text style={styles.goalsText}>{review.goals_met}/{review.goals_total} goals met</Text>
              </View>
            )}
            {review.strengths && review.strengths.length > 0 && (
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackTitle}>Strengths</Text>
                {review.strengths.map((s, i) => (
                  <View key={i} style={styles.feedbackItem}><Ionicons name="checkmark" size={16} color="#10B981" /><Text style={styles.feedbackText}>{s}</Text></View>
                ))}
              </View>
            )}
            {review.improvements && review.improvements.length > 0 && (
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackTitle}>Areas for Improvement</Text>
                {review.improvements.map((s, i) => (
                  <View key={i} style={styles.feedbackItem}><Ionicons name="arrow-forward" size={16} color="#F59E0B" /><Text style={styles.feedbackText}>{s}</Text></View>
                ))}
              </View>
            )}
            {review.status === 'pending_self' && (
              <TouchableOpacity style={styles.actionButton}>
                <LinearGradient colors={['#1473FF', '#BE01FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionGradient}>
                  <Ionicons name="create" size={18} color="#FFF" />
                  <Text style={styles.actionText}>Complete Self-Assessment</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Performance Reviews</Text>
          <View style={{ width: 24 }} />
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.avg_rating.toFixed(1)}</Text><Text style={styles.statLabel}>Avg Rating</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_reviews}</Text><Text style={styles.statLabel}>Reviews</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pending_action}</Text><Text style={styles.statLabel}>Pending</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.goals_achievement}%</Text><Text style={styles.statLabel}>Goals Met</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {reviews.length > 0 ? reviews.map(renderReviewCard) : (
            <View style={styles.emptyState}><Ionicons name="clipboard-outline" size={48} color="#666" /><Text style={styles.emptyText}>No performance reviews yet</Text></View>
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
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  content: { flex: 1 },
  section: { padding: 16 },
  reviewCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center' },
  reviewIcon: { marginRight: 12 },
  reviewInfo: { flex: 1 },
  reviewPeriod: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  reviewType: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  ratingLabel: { fontSize: 13, color: '#a0a0a0', marginRight: 8 },
  stars: { flexDirection: 'row', gap: 2 },
  ratingValue: { fontSize: 14, fontWeight: '600', color: '#FFF', marginLeft: 8 },
  dueDate: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  dueDateText: { fontSize: 12, color: '#F59E0B' },
  reviewExpanded: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { fontSize: 13, color: '#666' },
  detailValue: { fontSize: 13, color: '#FFF' },
  goalsSection: { marginTop: 12 },
  goalsTitle: { fontSize: 13, fontWeight: '600', color: '#FFF', marginBottom: 8 },
  goalsBar: { height: 8, backgroundColor: '#2a2a4e', borderRadius: 4 },
  goalsFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 4 },
  goalsText: { fontSize: 12, color: '#a0a0a0', marginTop: 6 },
  feedbackSection: { marginTop: 16 },
  feedbackTitle: { fontSize: 13, fontWeight: '600', color: '#FFF', marginBottom: 8 },
  feedbackItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 8 },
  feedbackText: { flex: 1, fontSize: 13, color: '#a0a0a0', lineHeight: 18 },
  actionButton: { marginTop: 16, borderRadius: 10, overflow: 'hidden' },
  actionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6 },
  actionText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
