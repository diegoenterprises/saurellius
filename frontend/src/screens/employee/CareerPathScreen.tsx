/**
 * EMPLOYEE CAREER PATH SCREEN
 * View career progression opportunities
 * Track skills, explore roles, set career goals
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
import { useTheme } from '../../context/ThemeContext';

interface CareerRole {
  id: string;
  title: string;
  level: number;
  department: string;
  salary_range_min: number;
  salary_range_max: number;
  is_current: boolean;
  is_target: boolean;
  requirements_met: number;
  total_requirements: number;
  skills_gap: string[];
}

interface Skill {
  id: string;
  name: string;
  category: string;
  current_level: number;
  target_level: number;
  importance: 'critical' | 'important' | 'nice_to_have';
}

interface CareerStats {
  current_level: number;
  years_in_role: number;
  skills_mastered: number;
  paths_available: number;
}

export default function CareerPathScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roles, setRoles] = useState<CareerRole[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [stats, setStats] = useState<CareerStats | null>(null);
  const [activeTab, setActiveTab] = useState<'path' | 'skills'>('path');

  const fetchData = useCallback(async () => {
    try {
      const [rolesRes, skillsRes, statsRes] = await Promise.all([
        api.get('/api/employee/career/roles'),
        api.get('/api/employee/career/skills'),
        api.get('/api/employee/career/stats'),
      ]);
      setRoles(rolesRes.data.roles || []);
      setSkills(skillsRes.data.skills || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch career data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return '#EF4444';
      case 'important': return '#F59E0B';
      case 'nice_to_have': return '#10B981';
      default: return '#6B7280';
    }
  };

  const renderRoleCard = (role: CareerRole, index: number) => {
    const readiness = role.total_requirements > 0 ? (role.requirements_met / role.total_requirements) * 100 : 0;
    return (
      <View key={role.id} style={styles.roleContainer}>
        {index > 0 && <View style={styles.pathLine} />}
        <View style={[styles.roleCard, role.is_current && styles.currentRole, role.is_target && styles.targetRole]}>
          <View style={styles.roleHeader}>
            <View style={[styles.levelBadge, role.is_current && styles.currentBadge, role.is_target && styles.targetBadge]}>
              <Text style={styles.levelText}>L{role.level}</Text>
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleTitle}>{role.title}</Text>
              <Text style={styles.roleDept}>{role.department}</Text>
              <Text style={styles.roleSalary}>{formatCurrency(role.salary_range_min)} - {formatCurrency(role.salary_range_max)}</Text>
            </View>
            {role.is_current && <View style={styles.youBadge}><Text style={styles.youText}>You</Text></View>}
            {role.is_target && <View style={styles.goalBadge}><Ionicons name="flag" size={14} color="#F59E0B" /></View>}
          </View>

          {!role.is_current && (
            <View style={styles.readinessSection}>
              <View style={styles.readinessHeader}>
                <Text style={styles.readinessLabel}>Readiness</Text>
                <Text style={styles.readinessValue}>{role.requirements_met}/{role.total_requirements} requirements</Text>
              </View>
              <View style={styles.readinessBar}>
                <View style={[styles.readinessFill, { width: `${readiness}%`, backgroundColor: readiness >= 80 ? '#10B981' : readiness >= 50 ? '#F59E0B' : '#EF4444' }]} />
              </View>
              {role.skills_gap.length > 0 && (
                <View style={styles.gapSection}>
                  <Text style={styles.gapLabel}>Skills to develop:</Text>
                  <View style={styles.gapTags}>
                    {role.skills_gap.slice(0, 3).map((skill, i) => (
                      <View key={i} style={styles.gapTag}><Text style={styles.gapText}>{skill}</Text></View>
                    ))}
                    {role.skills_gap.length > 3 && <Text style={styles.moreGap}>+{role.skills_gap.length - 3}</Text>}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSkillCard = (skill: Skill) => {
    const progress = skill.target_level > 0 ? (skill.current_level / skill.target_level) * 100 : 0;
    return (
      <View key={skill.id} style={styles.skillCard}>
        <View style={styles.skillHeader}>
          <View style={styles.skillInfo}>
            <Text style={styles.skillName}>{skill.name}</Text>
            <Text style={styles.skillCategory}>{skill.category}</Text>
          </View>
          <View style={[styles.importanceBadge, { backgroundColor: getImportanceColor(skill.importance) + '20' }]}>
            <Text style={[styles.importanceText, { color: getImportanceColor(skill.importance) }]}>{skill.importance.replace('_', ' ')}</Text>
          </View>
        </View>
        <View style={styles.skillProgress}>
          <View style={styles.skillLevels}>
            <Text style={styles.skillLevel}>Level {skill.current_level}</Text>
            <Text style={styles.skillTarget}>Target: {skill.target_level}</Text>
          </View>
          <View style={styles.skillBar}>
            <View style={[styles.skillFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
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
          <Text style={styles.headerTitle}>Career Path</Text>
          <TouchableOpacity><Ionicons name="settings-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Ionicons name="layers" size={20} color="#1473FF" /><Text style={styles.statValue}>L{stats.current_level}</Text><Text style={styles.statLabel}>Level</Text></View>
            <View style={styles.statCard}><Ionicons name="time" size={20} color="#F59E0B" /><Text style={styles.statValue}>{stats.years_in_role}y</Text><Text style={styles.statLabel}>In Role</Text></View>
            <View style={styles.statCard}><Ionicons name="checkmark-circle" size={20} color="#10B981" /><Text style={styles.statValue}>{stats.skills_mastered}</Text><Text style={styles.statLabel}>Skills</Text></View>
            <View style={styles.statCard}><Ionicons name="git-branch" size={20} color="#8B5CF6" /><Text style={styles.statValue}>{stats.paths_available}</Text><Text style={styles.statLabel}>Paths</Text></View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'path' && styles.tabActive]} onPress={() => setActiveTab('path')}>
          <Ionicons name="git-network" size={18} color={activeTab === 'path' ? '#FFF' : '#a0a0a0'} />
          <Text style={[styles.tabText, activeTab === 'path' && styles.tabTextActive]}>Career Path</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'skills' && styles.tabActive]} onPress={() => setActiveTab('skills')}>
          <Ionicons name="trophy" size={18} color={activeTab === 'skills' ? '#FFF' : '#a0a0a0'} />
          <Text style={[styles.tabText, activeTab === 'skills' && styles.tabTextActive]}>Skills</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {activeTab === 'path' ? (
            roles.length > 0 ? roles.map(renderRoleCard) : <View style={styles.emptyState}><Ionicons name="git-network-outline" size={48} color="#666" /><Text style={styles.emptyText}>No career paths defined</Text></View>
          ) : (
            skills.length > 0 ? skills.map(renderSkillCard) : <View style={styles.emptyState}><Ionicons name="trophy-outline" size={48} color="#666" /><Text style={styles.emptyText}>No skills tracked</Text></View>
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
  statsContainer: { flexDirection: 'row', marginHorizontal: 20, gap: 8 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginTop: 6 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2a2a4e', gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  tabActive: { backgroundColor: '#1473FF' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#a0a0a0' },
  tabTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: { padding: 16 },
  roleContainer: { position: 'relative' },
  pathLine: { position: 'absolute', left: 30, top: -16, width: 2, height: 16, backgroundColor: '#2a2a4e' },
  roleCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  currentRole: { borderColor: '#1473FF', backgroundColor: '#1473FF10' },
  targetRole: { borderColor: '#F59E0B' },
  roleHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  levelBadge: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#2a2a4e', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  currentBadge: { backgroundColor: '#1473FF' },
  targetBadge: { backgroundColor: '#F59E0B20' },
  levelText: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
  roleInfo: { flex: 1 },
  roleTitle: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  roleDept: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  roleSalary: { fontSize: 12, color: '#10B981', marginTop: 4 },
  youBadge: { backgroundColor: '#1473FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  youText: { fontSize: 11, fontWeight: '600', color: '#FFF' },
  goalBadge: { padding: 8 },
  readinessSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  readinessHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  readinessLabel: { fontSize: 12, color: '#a0a0a0' },
  readinessValue: { fontSize: 12, color: '#666' },
  readinessBar: { height: 6, backgroundColor: '#2a2a4e', borderRadius: 3 },
  readinessFill: { height: '100%', borderRadius: 3 },
  gapSection: { marginTop: 10 },
  gapLabel: { fontSize: 11, color: '#666', marginBottom: 6 },
  gapTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  gapTag: { backgroundColor: '#EF444420', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  gapText: { fontSize: 11, color: '#EF4444' },
  moreGap: { fontSize: 11, color: '#666', alignSelf: 'center' },
  skillCard: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a4e' },
  skillHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  skillInfo: { flex: 1 },
  skillName: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  skillCategory: { fontSize: 12, color: '#666', marginTop: 2 },
  importanceBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  importanceText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  skillProgress: { marginTop: 12 },
  skillLevels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  skillLevel: { fontSize: 12, color: '#FFF', fontWeight: '500' },
  skillTarget: { fontSize: 12, color: '#666' },
  skillBar: { height: 6, backgroundColor: '#2a2a4e', borderRadius: 3 },
  skillFill: { height: '100%', backgroundColor: '#1473FF', borderRadius: 3 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
