/**
 * ADMIN USERS MANAGEMENT SCREEN
 * Manage employers, employees, and contractors across the platform
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import adminDashboardService from '../../services/adminDashboard';
import BackButton from '../../components/common/BackButton';

type TabType = 'overview' | 'employers' | 'employees' | 'contractors' | 'activity';

export default function AdminUsersScreen() {
  const navigation = useNavigation<any>();
  const { colors, gradients } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [usersData, setUsersData] = useState<any>(null);
  const [employers, setEmployers] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, employersRes] = await Promise.all([
        adminDashboardService.getUsersOverview(),
        adminDashboardService.getEmployersList()
      ]);
      if (usersRes.success) setUsersData(usersRes.data);
      if (employersRes.success) setEmployers(employersRes.data.employers);
    } catch (error) {
      console.error('Error fetching users data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'analytics-outline' },
    { id: 'employers', label: 'Employers', icon: 'business-outline' },
    { id: 'employees', label: 'Employees', icon: 'people-outline' },
    { id: 'contractors', label: 'Contractors', icon: 'briefcase-outline' },
    { id: 'activity', label: 'Activity', icon: 'time-outline' },
  ];

  const StatCard = ({ title, value, subtitle, color }: any) => (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name="people" size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value.toLocaleString()}</Text>
      <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
      {subtitle && <Text style={[styles.statSubtitle, { color }]}>{subtitle}</Text>}
    </View>
  );

  const EmployerRow = ({ item }: any) => (
    <TouchableOpacity style={[styles.employerRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.employerInfo}>
        <Text style={[styles.employerName, { color: colors.text }]}>{item.company_name}</Text>
        <Text style={[styles.employerId, { color: colors.textSecondary }]}>{item.id}</Text>
      </View>
      <View style={styles.employerMeta}>
        <Text style={[styles.employerEmployees, { color: colors.text }]}>{item.employees} employees</Text>
        <View style={[styles.planBadge, { backgroundColor: item.subscription === 'Enterprise' ? '#8B5CF6' : '#3B82F6' }]}>
          <Text style={styles.planText}>{item.subscription}</Text>
        </View>
      </View>
      <Text style={[styles.employerMRR, { color: '#22C55E' }]}>${item.mrr.toLocaleString()}/mo</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerRow}>
          <BackButton variant="gradient" />
          <Text style={styles.headerTitle}>Users Management</Text>
          <TouchableOpacity>
            <Ionicons name="search" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id as TabType)}
            >
              <Ionicons name={tab.icon as any} size={18} color={activeTab === tab.id ? colors.primary : colors.textSecondary} />
              <Text style={[styles.tabText, { color: activeTab === tab.id ? colors.primary : colors.textSecondary }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {activeTab === 'overview' && usersData && (
          <View style={styles.content}>
            <View style={styles.statsGrid}>
              <StatCard title="Total Employers" value={usersData.stats.total_employers} subtitle="+82 this month" color="#8B5CF6" />
              <StatCard title="Total Employees" value={usersData.stats.total_employees} subtitle="+1,247 this month" color="#3B82F6" />
              <StatCard title="Total Contractors" value={usersData.stats.total_contractors} subtitle="+98 this month" color="#F59E0B" />
              <StatCard title="Active Today" value={usersData.stats.active_today} subtitle="+342 vs yesterday" color="#22C55E" />
            </View>
          </View>
        )}

        {activeTab === 'employers' && (
          <View style={styles.content}>
            <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search employers..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            {employers.map((emp, idx) => <EmployerRow key={idx} item={emp} />)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingVertical: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  tabsContainer: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 6 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#3B82F6' },
  tabText: { fontSize: 14, fontWeight: '500' },
  content: { padding: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '48%', padding: 16, borderRadius: 12, borderWidth: 1 },
  statIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: '700' },
  statTitle: { fontSize: 14, marginTop: 4 },
  statSubtitle: { fontSize: 12, marginTop: 2 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 16, gap: 8 },
  searchInput: { flex: 1, fontSize: 16 },
  employerRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  employerInfo: { flex: 1 },
  employerName: { fontSize: 16, fontWeight: '600' },
  employerId: { fontSize: 12, marginTop: 2 },
  employerMeta: { alignItems: 'flex-end', marginRight: 12 },
  employerEmployees: { fontSize: 14 },
  planBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  planText: { color: colors.text, fontSize: 10, fontWeight: '600' },
  employerMRR: { fontSize: 14, fontWeight: '600', marginRight: 8 },
});
