/**
 * CONTRACTOR REFERRAL PROGRAM SCREEN
 * Refer other contractors and earn rewards
 * Track referrals, bonuses, and payouts
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
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface Referral {
  id: string;
  referred_name: string;
  referred_email: string;
  status: 'pending' | 'signed_up' | 'qualified' | 'paid';
  referred_date: string;
  qualified_date?: string;
  bonus_amount: number;
  paid_date?: string;
}

interface ReferralStats {
  total_referrals: number;
  qualified_referrals: number;
  total_earned: number;
  pending_payout: number;
}

interface ReferralProgram {
  referral_code: string;
  referral_link: string;
  bonus_per_referral: number;
  minimum_qualification: string;
}

export default function ContractorReferralProgramScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [program, setProgram] = useState<ReferralProgram | null>(null);
  const [newReferralEmail, setNewReferralEmail] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [referralsRes, statsRes, programRes] = await Promise.all([
        api.get('/api/contractor/referral-program/referrals'),
        api.get('/api/contractor/referral-program/stats'),
        api.get('/api/contractor/referral-program/info'),
      ]);
      setReferrals(referralsRes.data.referrals || []);
      setStats(statsRes.data.stats || null);
      setProgram(programRes.data.program || null);
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'qualified': return '#3B82F6';
      case 'signed_up': return '#F59E0B';
      case 'pending': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return 'checkmark-circle';
      case 'qualified': return 'ribbon';
      case 'signed_up': return 'person-add';
      case 'pending': return 'time';
      default: return 'time';
    }
  };

  const handleShareLink = async () => {
    if (!program) return;
    try {
      await Share.share({
        message: `Join me on Saurellius! Use my referral code: ${program.referral_code}\n\n${program.referral_link}`,
        title: 'Saurellius Referral',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleCopyCode = () => {
    if (!program) return;
    Alert.alert('Copied!', `Referral code ${program.referral_code} copied to clipboard`);
  };

  const handleSendInvite = async () => {
    if (!newReferralEmail.trim() || !newReferralEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    try {
      await api.post('/api/contractor/referral-program/invite', { email: newReferralEmail });
      setNewReferralEmail('');
      fetchData();
      Alert.alert('Success', 'Invitation sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send invitation');
    }
  };

  const renderReferralCard = (referral: Referral) => (
    <View key={referral.id} style={styles.referralCard}>
      <View style={styles.referralHeader}>
        <View style={[styles.statusIcon, { backgroundColor: getStatusColor(referral.status) + '20' }]}>
          <Ionicons name={getStatusIcon(referral.status) as any} size={20} color={getStatusColor(referral.status)} />
        </View>
        <View style={styles.referralInfo}>
          <Text style={styles.referralName}>{referral.referred_name}</Text>
          <Text style={styles.referralEmail}>{referral.referred_email}</Text>
        </View>
        <View style={styles.bonusSection}>
          <Text style={[styles.bonusAmount, { color: referral.status === 'paid' ? '#10B981' : '#666' }]}>{formatCurrency(referral.bonus_amount)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(referral.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(referral.status) }]}>{referral.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.timelineSection}>
        <View style={styles.timelineItem}>
          <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.timelineLabel}>Referred</Text>
          <Text style={styles.timelineDate}>{formatDate(referral.referred_date)}</Text>
        </View>
        {referral.qualified_date && (
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.timelineLabel}>Qualified</Text>
            <Text style={styles.timelineDate}>{formatDate(referral.qualified_date)}</Text>
          </View>
        )}
        {referral.paid_date && (
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.timelineLabel}>Paid</Text>
            <Text style={styles.timelineDate}>{formatDate(referral.paid_date)}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Referral Program</Text>
          <TouchableOpacity onPress={handleShareLink}><Ionicons name="share-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_referrals}</Text><Text style={styles.statLabel}>Referrals</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.qualified_referrals}</Text><Text style={styles.statLabel}>Qualified</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{formatCurrency(stats.total_earned)}</Text><Text style={styles.statLabel}>Earned</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        {program && (
          <View style={styles.programCard}>
            <View style={styles.programHeader}>
              <Ionicons name="gift" size={28} color="#F59E0B" />
              <Text style={styles.programTitle}>Earn {formatCurrency(program.bonus_per_referral)} per referral!</Text>
            </View>
            <Text style={styles.programDesc}>{program.minimum_qualification}</Text>
            
            <View style={styles.codeSection}>
              <Text style={styles.codeLabel}>Your Referral Code</Text>
              <View style={styles.codeRow}>
                <Text style={styles.codeText}>{program.referral_code}</Text>
                <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
                  <Ionicons name="copy" size={18} color="#1473FF" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.shareButtons}>
              <TouchableOpacity style={styles.shareButton} onPress={handleShareLink}>
                <Ionicons name="share-social" size={20} color="#FFF" />
                <Text style={styles.shareText}>Share Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.inviteSection}>
          <Text style={styles.sectionTitle}>Invite by Email</Text>
          <View style={styles.inviteRow}>
            <TextInput style={styles.inviteInput} value={newReferralEmail} onChangeText={setNewReferralEmail} placeholder="Enter email address" placeholderTextColor="#666" keyboardType="email-address" autoCapitalize="none" />
            <TouchableOpacity style={styles.inviteButton} onPress={handleSendInvite}>
              <Ionicons name="send" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Referrals</Text>
          {referrals.length > 0 ? referrals.map(renderReferralCard) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>No referrals yet</Text>
              <Text style={styles.emptySubtext}>Share your code to start earning!</Text>
            </View>
          )}
        </View>

        {stats && stats.pending_payout > 0 && (
          <View style={styles.payoutCard}>
            <Ionicons name="wallet" size={24} color="#10B981" />
            <View style={styles.payoutInfo}>
              <Text style={styles.payoutLabel}>Pending Payout</Text>
              <Text style={styles.payoutAmount}>{formatCurrency(stats.pending_payout)}</Text>
            </View>
            <TouchableOpacity style={styles.payoutButton}>
              <Text style={styles.payoutButtonText}>Request</Text>
            </TouchableOpacity>
          </View>
        )}

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
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  content: { flex: 1 },
  programCard: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20, margin: 16, borderWidth: 2, borderColor: '#F59E0B30' },
  programHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  programTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  programDesc: { fontSize: 13, color: '#a0a0a0', lineHeight: 18 },
  codeSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  codeLabel: { fontSize: 12, color: '#666', marginBottom: 8 },
  codeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f0f23', borderRadius: 12, padding: 14 },
  codeText: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#F59E0B', letterSpacing: 2 },
  copyButton: { padding: 8 },
  shareButtons: { marginTop: 16 },
  shareButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1473FF', paddingVertical: 14, borderRadius: 12, gap: 8 },
  shareText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  inviteSection: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#FFF', marginBottom: 12 },
  inviteRow: { flexDirection: 'row', gap: 10 },
  inviteInput: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, fontSize: 15, color: '#FFF', borderWidth: 1, borderColor: '#2a2a4e' },
  inviteButton: { width: 50, backgroundColor: '#1473FF', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  referralCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  referralHeader: { flexDirection: 'row', alignItems: 'center' },
  statusIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  referralInfo: { flex: 1 },
  referralName: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  referralEmail: { fontSize: 12, color: '#666', marginTop: 2 },
  bonusSection: { alignItems: 'flex-end' },
  bonusAmount: { fontSize: 18, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  timelineSection: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e', justifyContent: 'space-around' },
  timelineItem: { alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
  timelineLabel: { fontSize: 11, color: '#666' },
  timelineDate: { fontSize: 11, fontWeight: '500', color: '#a0a0a0', marginTop: 2 },
  payoutCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B98120', marginHorizontal: 16, borderRadius: 12, padding: 16, gap: 12 },
  payoutInfo: { flex: 1 },
  payoutLabel: { fontSize: 12, color: '#10B981' },
  payoutAmount: { fontSize: 20, fontWeight: 'bold', color: '#10B981' },
  payoutButton: { backgroundColor: '#10B981', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  payoutButtonText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
  emptySubtext: { fontSize: 12, color: '#666', marginTop: 4 },
});
