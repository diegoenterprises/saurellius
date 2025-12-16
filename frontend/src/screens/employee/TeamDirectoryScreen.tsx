/**
 * EMPLOYEE TEAM DIRECTORY SCREEN
 * View company directory and team members
 * Search, filter by department, contact colleagues
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
  FlatList,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  job_title: string;
  department: string;
  manager_name?: string;
  location?: string;
  hire_date: string;
  is_manager: boolean;
  reports_count?: number;
  avatar_url?: string;
  status: 'active' | 'away' | 'busy' | 'offline';
}

interface Department {
  id: string;
  name: string;
  count: number;
}

export default function TeamDirectoryScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const fetchData = useCallback(async () => {
    try {
      const [membersRes, deptsRes] = await Promise.all([
        api.get('/api/employee/directory', { params: { search: searchQuery, department: selectedDept !== 'all' ? selectedDept : undefined } }),
        api.get('/api/employee/directory/departments'),
      ]);
      setMembers(membersRes.data.members || []);
      setDepartments(deptsRes.data.departments || []);
    } catch (error) {
      console.error('Failed to fetch directory:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedDept]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'away': return '#F59E0B';
      case 'busy': return '#EF4444';
      case 'offline': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const handleCall = (phone: string) => Linking.openURL(`tel:${phone}`);
  const handleEmail = (email: string) => Linking.openURL(`mailto:${email}`);
  const handleMessage = (member: TeamMember) => navigation.navigate('MessageCenter', { recipientId: member.id });

  const renderMemberCard = ({ item }: { item: TeamMember }) => (
    <View style={[styles.memberCard, viewMode === 'grid' && styles.memberCardGrid]}>
      <View style={styles.memberHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{item.first_name[0]}{item.last_name[0]}</Text></View>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.first_name} {item.last_name}</Text>
          <Text style={styles.memberTitle}>{item.job_title}</Text>
          <View style={styles.memberMeta}>
            <Ionicons name="business" size={12} color="#666" />
            <Text style={styles.metaText}>{item.department}</Text>
          </View>
        </View>
        {item.is_manager && <View style={styles.managerBadge}><Ionicons name="star" size={12} color="#F59E0B" /></View>}
      </View>

      {item.location && (
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color="#666" />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
      )}

      <View style={styles.contactActions}>
        {item.phone && (
          <TouchableOpacity style={styles.contactButton} onPress={() => handleCall(item.phone!)}>
            <Ionicons name="call" size={18} color="#10B981" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.contactButton} onPress={() => handleEmail(item.email)}>
          <Ionicons name="mail" size={18} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactButton} onPress={() => handleMessage(item)}>
          <Ionicons name="chatbubble" size={18} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      {item.reports_count !== undefined && item.reports_count > 0 && (
        <View style={styles.reportsRow}>
          <Ionicons name="people" size={14} color="#666" />
          <Text style={styles.reportsText}>{item.reports_count} direct reports</Text>
        </View>
      )}
    </View>
  );

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Team Directory</Text>
          <TouchableOpacity onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>
            <Ionicons name={viewMode === 'list' ? 'grid' : 'list'} size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput style={styles.searchInput} placeholder="Search by name or title..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={fetchData} />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); fetchData(); }}><Ionicons name="close-circle" size={20} color="#666" /></TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptFilter}>
        <TouchableOpacity style={[styles.deptChip, selectedDept === 'all' && styles.deptChipActive]} onPress={() => { setSelectedDept('all'); setLoading(true); }}>
          <Text style={[styles.deptChipText, selectedDept === 'all' && styles.deptChipTextActive]}>All ({members.length})</Text>
        </TouchableOpacity>
        {departments.map(dept => (
          <TouchableOpacity key={dept.id} style={[styles.deptChip, selectedDept === dept.id && styles.deptChipActive]} onPress={() => { setSelectedDept(dept.id); setLoading(true); }}>
            <Text style={[styles.deptChipText, selectedDept === dept.id && styles.deptChipTextActive]}>{dept.name} ({dept.count})</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={members}
        renderItem={renderMemberCard}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}
        ListEmptyComponent={
          <View style={styles.emptyState}><Ionicons name="people-outline" size={48} color="#666" /><Text style={styles.emptyText}>No team members found</Text></View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingBottom: 16 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 10, paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: colors.text },
  deptFilter: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  deptChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.card, marginRight: 8, borderWidth: 1, borderColor: '#2a2a4e' },
  deptChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  deptChipText: { fontSize: 13, color: '#a0a0a0', fontWeight: '500' },
  deptChipTextActive: { color: colors.text },
  listContent: { padding: 16 },
  memberCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  memberCardGrid: { flex: 1, marginHorizontal: 4, marginBottom: 8 },
  memberHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { position: 'relative', marginRight: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  statusDot: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#1a1a2e' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: '600', color: colors.text },
  memberTitle: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  memberMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  metaText: { fontSize: 12, color: '#666' },
  managerBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F59E0B20', justifyContent: 'center', alignItems: 'center' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 4 },
  locationText: { fontSize: 12, color: '#666' },
  contactActions: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 10 },
  contactButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  reportsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  reportsText: { fontSize: 12, color: '#666' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
