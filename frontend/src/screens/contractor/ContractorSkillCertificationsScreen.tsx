/**
 * CONTRACTOR SKILL CERTIFICATIONS SCREEN
 * Manage professional certifications and skills
 * Track expiration, upload credentials
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

interface Certification {
  id: string;
  name: string;
  issuing_organization: string;
  category: string;
  credential_id?: string;
  issue_date: string;
  expiration_date?: string;
  status: 'active' | 'expired' | 'pending_renewal' | 'pending_verification';
  verification_url?: string;
  document_url?: string;
  skills: string[];
}

interface CertStats {
  total_certifications: number;
  active: number;
  expiring_soon: number;
  pending_verification: number;
}

const CATEGORIES = [
  { id: 'technical', name: 'Technical', icon: 'code-slash', color: '#3B82F6' },
  { id: 'cloud', name: 'Cloud', icon: 'cloud', color: '#10B981' },
  { id: 'security', name: 'Security', icon: 'shield-checkmark', color: '#EF4444' },
  { id: 'project_mgmt', name: 'Project Mgmt', icon: 'git-branch', color: '#F59E0B' },
  { id: 'data', name: 'Data', icon: 'analytics', color: '#8B5CF6' },
  { id: 'other', name: 'Other', icon: 'ribbon', color: '#6B7280' },
];

export default function ContractorSkillCertificationsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [stats, setStats] = useState<CertStats | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      const [certsRes, statsRes] = await Promise.all([
        api.get('/api/contractor/certifications', { params: { category: filterCategory !== 'all' ? filterCategory : undefined } }),
        api.get('/api/contractor/certifications/stats'),
      ]);
      setCertifications(certsRes.data.certifications || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch certifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getCategoryInfo = (categoryId: string) => CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[5];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'expired': return '#EF4444';
      case 'pending_renewal': return '#F59E0B';
      case 'pending_verification': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getDaysUntilExpiry = (expirationDate: string) => {
    const exp = new Date(expirationDate);
    const today = new Date();
    return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleRenew = (cert: Certification) => {
    Alert.alert('Renew Certification', `Start renewal process for ${cert.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Renew', onPress: () => navigation.navigate('RenewCertification', { certId: cert.id }) },
    ]);
  };

  const handleAddCertification = () => {
    navigation.navigate('AddCertification');
  };

  const renderCertificationCard = (cert: Certification) => {
    const catInfo = getCategoryInfo(cert.category);
    const daysUntilExpiry = cert.expiration_date ? getDaysUntilExpiry(cert.expiration_date) : null;
    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 60 && daysUntilExpiry > 0;

    return (
      <View key={cert.id} style={[styles.certCard, cert.status === 'expired' && styles.expiredCard]}>
        {isExpiringSoon && (
          <View style={styles.expiringBanner}>
            <Ionicons name="warning" size={14} color="#F59E0B" />
            <Text style={styles.expiringBannerText}>Expires in {daysUntilExpiry} days</Text>
          </View>
        )}
        
        <View style={styles.certHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: catInfo.color + '20' }]}>
            <Ionicons name={catInfo.icon as any} size={24} color={catInfo.color} />
          </View>
          <View style={styles.certInfo}>
            <Text style={styles.certName}>{cert.name}</Text>
            <Text style={styles.issuingOrg}>{cert.issuing_organization}</Text>
            {cert.credential_id && <Text style={styles.credentialId}>ID: {cert.credential_id}</Text>}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(cert.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(cert.status) }]}>{cert.status.replace('_', ' ')}</Text>
          </View>
        </View>

        <View style={styles.datesSection}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar" size={14} color="#10B981" />
            <Text style={styles.dateLabel}>Issued:</Text>
            <Text style={styles.dateValue}>{formatDate(cert.issue_date)}</Text>
          </View>
          {cert.expiration_date && (
            <View style={styles.dateItem}>
              <Ionicons name="time" size={14} color={isExpiringSoon || cert.status === 'expired' ? '#EF4444' : '#666'} />
              <Text style={styles.dateLabel}>Expires:</Text>
              <Text style={[styles.dateValue, (isExpiringSoon || cert.status === 'expired') && { color: '#EF4444' }]}>{formatDate(cert.expiration_date)}</Text>
            </View>
          )}
        </View>

        {cert.skills.length > 0 && (
          <View style={styles.skillsRow}>
            {cert.skills.slice(0, 4).map((skill, i) => (
              <View key={i} style={styles.skillTag}><Text style={styles.skillText}>{skill}</Text></View>
            ))}
            {cert.skills.length > 4 && <Text style={styles.moreSkills}>+{cert.skills.length - 4}</Text>}
          </View>
        )}

        <View style={styles.certActions}>
          {cert.document_url && (
            <TouchableOpacity style={styles.actionButton}><Ionicons name="document" size={16} color="#1473FF" /><Text style={styles.viewText}>View</Text></TouchableOpacity>
          )}
          {cert.verification_url && (
            <TouchableOpacity style={styles.actionButton}><Ionicons name="checkmark-circle" size={16} color="#10B981" /><Text style={styles.verifyText}>Verify</Text></TouchableOpacity>
          )}
          {(cert.status === 'pending_renewal' || isExpiringSoon) && (
            <TouchableOpacity style={[styles.actionButton, styles.renewButton]} onPress={() => handleRenew(cert)}>
              <Ionicons name="refresh" size={16} color="#FFF" />
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
          <Text style={styles.headerTitle}>Certifications</Text>
          <TouchableOpacity onPress={handleAddCertification}><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_certifications}</Text><Text style={styles.statLabel}>Total</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{stats.active}</Text><Text style={styles.statLabel}>Active</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.expiring_soon}</Text><Text style={styles.statLabel}>Expiring</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.pending_verification}</Text><Text style={styles.statLabel}>Pending</Text></View>
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
          {certifications.length > 0 ? certifications.map(renderCertificationCard) : (
            <View style={styles.emptyState}>
              <Ionicons name="ribbon-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>No certifications</Text>
              <TouchableOpacity style={styles.addButton} onPress={handleAddCertification}>
                <Ionicons name="add" size={18} color="#FFF" />
                <Text style={styles.addText}>Add Certification</Text>
              </TouchableOpacity>
            </View>
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
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1a1a2e', marginRight: 8, gap: 6, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 12, color: '#a0a0a0', fontWeight: '500' },
  filterChipTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  certCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#2a2a4e' },
  expiredCard: { borderColor: '#EF4444', opacity: 0.7 },
  expiringBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 12, gap: 6 },
  expiringBannerText: { fontSize: 12, fontWeight: '600', color: '#F59E0B' },
  certHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  categoryIcon: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  certInfo: { flex: 1 },
  certName: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  issuingOrg: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  credentialId: { fontSize: 11, color: '#666', marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  datesSection: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 20 },
  dateItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateLabel: { fontSize: 11, color: '#666' },
  dateValue: { fontSize: 11, fontWeight: '500', color: '#FFF' },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 6 },
  skillTag: { backgroundColor: '#2a2a4e', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  skillText: { fontSize: 10, color: '#a0a0a0' },
  moreSkills: { fontSize: 10, color: '#666', alignSelf: 'center' },
  certActions: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#0f0f23', borderRadius: 8, gap: 4 },
  viewText: { fontSize: 13, color: '#1473FF' },
  verifyText: { fontSize: 13, color: '#10B981' },
  renewButton: { flex: 1, justifyContent: 'center', backgroundColor: '#F59E0B' },
  renewText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1473FF', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, marginTop: 16, gap: 6 },
  addText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});
