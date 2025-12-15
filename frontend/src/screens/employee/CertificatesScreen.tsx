/**
 * EMPLOYEE CERTIFICATES SCREEN
 * View and manage professional certificates
 * Track expiration dates, upload new certificates
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
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface Certificate {
  id: string;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiration_date?: string;
  credential_id?: string;
  credential_url?: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'pending_verification';
  category: string;
  file_url?: string;
  skills: string[];
  earned_from_training?: boolean;
}

interface CertificateStats {
  total_certificates: number;
  active: number;
  expiring_soon: number;
  expired: number;
}

export default function CertificatesScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<CertificateStats | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      const [certsRes, statsRes] = await Promise.all([
        api.get('/api/employee/certificates', { params: { status: filterStatus !== 'all' ? filterStatus : undefined } }),
        api.get('/api/employee/certificates/stats'),
      ]);
      setCertificates(certsRes.data.certificates || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getDaysUntilExpiry = (expirationDate: string) => {
    const expiry = new Date(expirationDate);
    const today = new Date();
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'expiring_soon': return '#F59E0B';
      case 'expired': return '#EF4444';
      case 'pending_verification': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const handleShare = async (cert: Certificate) => {
    try {
      const message = `${cert.name}\nIssued by: ${cert.issuing_organization}\n${cert.credential_id ? `Credential ID: ${cert.credential_id}` : ''}`;
      await Share.share({ message, title: cert.name });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handleRenew = (cert: Certificate) => {
    Alert.alert('Renew Certificate', `Would you like to start the renewal process for "${cert.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Renew', onPress: () => navigation.navigate('CertificateRenewal', { certificateId: cert.id }) },
    ]);
  };

  const renderCertificateCard = (cert: Certificate) => {
    const daysUntilExpiry = cert.expiration_date ? getDaysUntilExpiry(cert.expiration_date) : null;
    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;

    return (
      <View key={cert.id} style={[styles.certCard, cert.status === 'expired' && styles.expiredCard]}>
        <View style={styles.certHeader}>
          <View style={styles.certIcon}>
            <Ionicons name="ribbon" size={24} color={getStatusColor(cert.status)} />
          </View>
          <View style={styles.certInfo}>
            <Text style={styles.certName}>{cert.name}</Text>
            <Text style={styles.certOrg}>{cert.issuing_organization}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(cert.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(cert.status) }]}>{cert.status.replace('_', ' ')}</Text>
          </View>
        </View>

        {cert.credential_id && (
          <View style={styles.credentialRow}>
            <Text style={styles.credentialLabel}>Credential ID:</Text>
            <Text style={styles.credentialValue}>{cert.credential_id}</Text>
          </View>
        )}

        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar" size={14} color="#666" />
            <Text style={styles.dateLabel}>Issued: {formatDate(cert.issue_date)}</Text>
          </View>
          {cert.expiration_date && (
            <View style={styles.dateItem}>
              <Ionicons name="time" size={14} color={isExpiringSoon || cert.status === 'expired' ? '#EF4444' : '#666'} />
              <Text style={[styles.dateLabel, (isExpiringSoon || cert.status === 'expired') && { color: '#EF4444' }]}>
                {cert.status === 'expired' ? 'Expired' : 'Expires'}: {formatDate(cert.expiration_date)}
              </Text>
            </View>
          )}
        </View>

        {daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30 && (
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={16} color="#F59E0B" />
            <Text style={styles.warningText}>Expires in {daysUntilExpiry} days</Text>
          </View>
        )}

        {cert.skills.length > 0 && (
          <View style={styles.skillsRow}>
            {cert.skills.slice(0, 3).map((skill, i) => (
              <View key={i} style={styles.skillTag}><Text style={styles.skillText}>{skill}</Text></View>
            ))}
            {cert.skills.length > 3 && <Text style={styles.moreSkills}>+{cert.skills.length - 3}</Text>}
          </View>
        )}

        {cert.earned_from_training && (
          <View style={styles.trainingBadge}>
            <Ionicons name="school" size={14} color="#8B5CF6" />
            <Text style={styles.trainingText}>Earned from company training</Text>
          </View>
        )}

        <View style={styles.certActions}>
          {cert.credential_url && (
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="open-outline" size={18} color="#1473FF" />
              <Text style={styles.actionText}>Verify</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(cert)}>
            <Ionicons name="share-outline" size={18} color="#666" />
            <Text style={[styles.actionText, { color: '#666' }]}>Share</Text>
          </TouchableOpacity>
          {(cert.status === 'expiring_soon' || cert.status === 'expired') && (
            <TouchableOpacity style={[styles.actionButton, styles.renewButton]} onPress={() => handleRenew(cert)}>
              <Ionicons name="refresh" size={18} color="#FFF" />
              <Text style={styles.renewText}>Renew</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Certificates</Text>
          <TouchableOpacity><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_certificates}</Text><Text style={styles.statLabel}>Total</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.active}</Text><Text style={styles.statLabel}>Active</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.expiring_soon}</Text><Text style={styles.statLabel}>Expiring</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.expired}</Text><Text style={styles.statLabel}>Expired</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {['all', 'active', 'expiring_soon', 'expired', 'pending_verification'].map(status => (
          <TouchableOpacity key={status} style={[styles.filterChip, filterStatus === status && styles.filterChipActive]} onPress={() => { setFilterStatus(status); setLoading(true); }}>
            <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>{status === 'all' ? 'All' : status.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {certificates.length > 0 ? certificates.map(renderCertificateCard) : (
            <View style={styles.emptyState}><Ionicons name="ribbon-outline" size={48} color="#666" /><Text style={styles.emptyText}>No certificates found</Text></View>
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
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1a1a2e', marginRight: 8, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 12, color: '#a0a0a0', fontWeight: '500', textTransform: 'capitalize' },
  filterChipTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  certCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  expiredCard: { opacity: 0.7 },
  certHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  certIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#0f0f23', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  certInfo: { flex: 1 },
  certName: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  certOrg: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  credentialRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  credentialLabel: { fontSize: 12, color: '#666' },
  credentialValue: { fontSize: 12, color: '#a0a0a0', fontFamily: 'monospace' },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  dateItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateLabel: { fontSize: 12, color: '#666' },
  warningBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B20', padding: 10, borderRadius: 8, marginTop: 10, gap: 8 },
  warningText: { fontSize: 12, color: '#F59E0B', fontWeight: '500' },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 6 },
  skillTag: { backgroundColor: '#2a2a4e', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  skillText: { fontSize: 11, color: '#a0a0a0' },
  moreSkills: { fontSize: 11, color: '#666', alignSelf: 'center' },
  trainingBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  trainingText: { fontSize: 12, color: '#8B5CF6' },
  certActions: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 10 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#0f0f23', borderRadius: 8, gap: 6 },
  actionText: { fontSize: 13, color: '#1473FF' },
  renewButton: { flex: 1, justifyContent: 'center', backgroundColor: '#F59E0B' },
  renewText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
