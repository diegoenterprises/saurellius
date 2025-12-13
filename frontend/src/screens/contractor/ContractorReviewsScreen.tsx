/**
 * CONTRACTOR REVIEWS SCREEN
 * View and manage client reviews and ratings
 * Respond to reviews, track reputation score
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

interface Review {
  id: string;
  client_name: string;
  client_company?: string;
  project_name?: string;
  rating: number;
  title?: string;
  comment: string;
  created_at: string;
  response?: string;
  response_date?: string;
  helpful_count: number;
  verified: boolean;
}

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
  response_rate: number;
}

export default function ContractorReviewsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [respondingTo, setRespondingTo] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [reviewsRes, statsRes] = await Promise.all([
        api.get('/api/contractor/reviews', { params: { rating: filterRating || undefined } }),
        api.get('/api/contractor/reviews/stats'),
      ]);
      setReviews(reviewsRes.data.reviews || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterRating]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(<Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={size} color={i <= rating ? '#F59E0B' : '#666'} />);
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  const handleSubmitResponse = async () => {
    if (!responseText.trim() || !respondingTo) return;
    try {
      await api.post(`/api/contractor/reviews/${respondingTo.id}/respond`, { response: responseText });
      setRespondingTo(null);
      setResponseText('');
      fetchData();
      Alert.alert('Success', 'Response submitted');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit response');
    }
  };

  const renderReviewCard = (review: Review) => (
    <View key={review.id} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.clientAvatar}><Text style={styles.avatarText}>{review.client_name[0]}</Text></View>
        <View style={styles.reviewInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.clientName}>{review.client_name}</Text>
            {review.verified && <View style={styles.verifiedBadge}><Ionicons name="checkmark-circle" size={14} color="#10B981" /></View>}
          </View>
          {review.client_company && <Text style={styles.companyName}>{review.client_company}</Text>}
          {review.project_name && <Text style={styles.projectName}>Project: {review.project_name}</Text>}
        </View>
        <View style={styles.ratingBox}>
          {renderStars(review.rating)}
        </View>
      </View>

      {review.title && <Text style={styles.reviewTitle}>{review.title}</Text>}
      <Text style={styles.reviewComment}>{review.comment}</Text>

      <View style={styles.reviewFooter}>
        <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
        {review.helpful_count > 0 && (
          <View style={styles.helpfulBadge}><Ionicons name="thumbs-up" size={12} color="#666" /><Text style={styles.helpfulText}>{review.helpful_count}</Text></View>
        )}
      </View>

      {review.response ? (
        <View style={styles.responseBox}>
          <View style={styles.responseHeader}><Ionicons name="chatbubble" size={14} color="#1473FF" /><Text style={styles.responseLabel}>Your Response</Text></View>
          <Text style={styles.responseText}>{review.response}</Text>
          {review.response_date && <Text style={styles.responseDate}>{formatDate(review.response_date)}</Text>}
        </View>
      ) : (
        <TouchableOpacity style={styles.respondButton} onPress={() => { setRespondingTo(review); setResponseText(''); }}>
          <Ionicons name="chatbubble-outline" size={16} color="#1473FF" />
          <Text style={styles.respondText}>Respond</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Reviews</Text>
          <View style={{ width: 24 }} />
        </View>

        {stats && (
          <View style={styles.statsCard}>
            <View style={styles.overallRating}>
              <Text style={styles.ratingValue}>{stats.average_rating.toFixed(1)}</Text>
              {renderStars(Math.round(stats.average_rating), 20)}
              <Text style={styles.reviewCount}>{stats.total_reviews} reviews</Text>
            </View>
            <View style={styles.ratingBreakdown}>
              {[5, 4, 3, 2, 1].map(star => {
                const count = stats[`${['one', 'two', 'three', 'four', 'five'][star - 1]}_star` as keyof ReviewStats] as number;
                const percent = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
                return (
                  <TouchableOpacity key={star} style={styles.ratingRow} onPress={() => setFilterRating(filterRating === star ? null : star)}>
                    <Text style={[styles.starLabel, filterRating === star && styles.starLabelActive]}>{star}</Text>
                    <View style={styles.ratingBar}><View style={[styles.ratingFill, { width: `${percent}%` }]} /></View>
                    <Text style={styles.ratingCount}>{count}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </LinearGradient>

      {filterRating && (
        <View style={styles.filterBar}>
          <Text style={styles.filterText}>Showing {filterRating}-star reviews</Text>
          <TouchableOpacity onPress={() => { setFilterRating(null); setLoading(true); }}><Text style={styles.clearFilter}>Clear</Text></TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {reviews.length > 0 ? reviews.map(renderReviewCard) : (
            <View style={styles.emptyState}><Ionicons name="star-outline" size={48} color="#666" /><Text style={styles.emptyText}>No reviews yet</Text></View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={!!respondingTo} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setRespondingTo(null)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setRespondingTo(null)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Respond to Review</Text>
            <TouchableOpacity onPress={handleSubmitResponse}><Text style={styles.modalSave}>Send</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {respondingTo && (
              <View style={styles.reviewPreview}>
                <Text style={styles.previewName}>{respondingTo.client_name}</Text>
                {renderStars(respondingTo.rating)}
                <Text style={styles.previewComment} numberOfLines={2}>{respondingTo.comment}</Text>
              </View>
            )}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Response</Text>
              <TextInput style={[styles.input, styles.textArea]} value={responseText} onChangeText={setResponseText} placeholder="Write a professional response..." placeholderTextColor="#666" multiline numberOfLines={5} />
            </View>
            <Text style={styles.tipText}>Tip: Keep responses professional and thank the client for their feedback.</Text>
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
  statsCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 14, padding: 16 },
  overallRating: { alignItems: 'center', paddingRight: 20, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)' },
  ratingValue: { fontSize: 36, fontWeight: 'bold', color: '#FFF' },
  reviewCount: { fontSize: 12, color: '#a0a0a0', marginTop: 4 },
  ratingBreakdown: { flex: 1, paddingLeft: 16, justifyContent: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  starLabel: { width: 14, fontSize: 12, color: '#a0a0a0' },
  starLabelActive: { color: '#F59E0B', fontWeight: '600' },
  ratingBar: { flex: 1, height: 6, backgroundColor: '#2a2a4e', borderRadius: 3, marginHorizontal: 8 },
  ratingFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 3 },
  ratingCount: { width: 24, fontSize: 11, color: '#666', textAlign: 'right' },
  filterBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F59E0B20' },
  filterText: { fontSize: 13, color: '#F59E0B' },
  clearFilter: { fontSize: 13, color: '#F59E0B', fontWeight: '600' },
  content: { flex: 1 },
  section: { padding: 16 },
  starsRow: { flexDirection: 'row', gap: 2 },
  reviewCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  reviewHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  clientAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  reviewInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  clientName: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  verifiedBadge: { marginLeft: 4 },
  companyName: { fontSize: 12, color: '#666', marginTop: 2 },
  projectName: { fontSize: 11, color: '#a0a0a0', marginTop: 2 },
  ratingBox: { alignItems: 'flex-end' },
  reviewTitle: { fontSize: 15, fontWeight: '600', color: '#FFF', marginBottom: 6 },
  reviewComment: { fontSize: 14, color: '#a0a0a0', lineHeight: 20 },
  reviewFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  reviewDate: { fontSize: 12, color: '#666' },
  helpfulBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  helpfulText: { fontSize: 12, color: '#666' },
  responseBox: { marginTop: 12, backgroundColor: '#1473FF10', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#1473FF30' },
  responseHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  responseLabel: { fontSize: 12, fontWeight: '600', color: '#1473FF' },
  responseText: { fontSize: 14, color: '#FFF', lineHeight: 20 },
  responseDate: { fontSize: 11, color: '#666', marginTop: 8 },
  respondButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingVertical: 10, backgroundColor: '#1473FF20', borderRadius: 10, gap: 6 },
  respondText: { fontSize: 14, color: '#1473FF', fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
  modalContainer: { flex: 1, backgroundColor: '#0f0f23' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  modalCancel: { fontSize: 16, color: '#a0a0a0' },
  modalSave: { fontSize: 16, fontWeight: '600', color: '#1473FF' },
  modalContent: { padding: 20 },
  reviewPreview: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 16 },
  previewName: { fontSize: 14, fontWeight: '600', color: '#FFF', marginBottom: 4 },
  previewComment: { fontSize: 13, color: '#a0a0a0', marginTop: 6 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, color: '#a0a0a0', marginBottom: 6 },
  input: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14, fontSize: 16, color: '#FFF', borderWidth: 1, borderColor: '#2a2a4e' },
  textArea: { height: 120, textAlignVertical: 'top' },
  tipText: { fontSize: 12, color: '#666', fontStyle: 'italic' },
});
