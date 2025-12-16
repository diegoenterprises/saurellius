/**
 * EMPLOYER COMPLIANCE DASHBOARD SCREEN
 * Monitor compliance status across regulations
 * Track deadlines, alerts, and required filings
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

interface ComplianceItem {
  id: string;
  category: string;
  name: string;
  description: string;
  status: 'compliant' | 'action_required' | 'warning' | 'non_compliant';
  due_date?: string;
  last_updated?: string;
  action_url?: string;
}

interface ComplianceStats {
  overall_score: number;
  compliant_count: number;
  action_required: number;
  warnings: number;
  non_compliant: number;
}

const CATEGORIES = [
  { id: 'tax', name: 'Tax Filings', icon: 'calculator', color: '#3B82F6' },
  { id: 'labor', name: 'Labor Law', icon: 'briefcase', color: '#8B5CF6' },
  { id: 'benefits', name: 'Benefits', icon: 'heart', color: '#EC4899' },
  { id: 'safety', name: 'Workplace Safety', icon: 'shield-checkmark', color: '#10B981' },
  { id: 'reporting', name: 'Reporting', icon: 'document-text', color: '#F59E0B' },
];

export default function ComplianceDashboardScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      const [itemsRes, statsRes] = await Promise.all([
        api.get('/api/employer/compliance/items'),
        api.get('/api/employer/compliance/stats'),
      ]);
      setItems(itemsRes.data.items || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch compliance data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'action_required': return '#F97316';
      case 'non_compliant': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return 'checkmark-circle';
      case 'warning': return 'alert-circle';
      case 'action_required': return 'time';
      case 'non_compliant': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const handleTakeAction = (item: ComplianceItem) => {
    Alert.alert(item.name, item.description, [
      { text: 'Later', style: 'cancel' },
      { text: 'Take Action', onPress: () => {} },
    ]);
  };

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(i => i.category === selectedCategory);

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 70) return '#F59E0B';
    return '#EF4444';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1473FF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Compliance</Text>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {stats && (
          <View style={styles.scoreCard}>
            <View style={styles.scoreCircle}>
              <Text style={[styles.scoreValue, { color: getScoreColor(stats.overall_score) }]}>
                {stats.overall_score}%
              </Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
            <View style={styles.scoreStats}>
              <View style={styles.scoreStat}>
                <View style={[styles.scoreStatDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.scoreStatValue}>{stats.compliant_count}</Text>
                <Text style={styles.scoreStatLabel}>Compliant</Text>
              </View>
              <View style={styles.scoreStat}>
                <View style={[styles.scoreStatDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.scoreStatValue}>{stats.warnings}</Text>
                <Text style={styles.scoreStatLabel}>Warnings</Text>
              </View>
              <View style={styles.scoreStat}>
                <View style={[styles.scoreStatDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.scoreStatValue}>{stats.action_required}</Text>
                <Text style={styles.scoreStatLabel}>Action Req.</Text>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar}>
        <TouchableOpacity
          style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.categoryChipTextActive]}>All</Text>
        </TouchableOpacity>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Ionicons name={cat.icon as any} size={14} color={selectedCategory === cat.id ? '#FFF' : cat.color} />
            <Text style={[styles.categoryChipText, selectedCategory === cat.id && styles.categoryChipTextActive]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {filteredItems.map(item => {
            const category = CATEGORIES.find(c => c.id === item.category);
            return (
              <TouchableOpacity key={item.id} style={styles.itemCard} onPress={() => handleTakeAction(item)}>
                <View style={[styles.itemIcon, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                  <Ionicons name={getStatusIcon(item.status) as any} size={24} color={getStatusColor(item.status)} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemCategory}>{category?.name || item.category}</Text>
                  {item.due_date && (
                    <Text style={[styles.itemDue, item.status !== 'compliant' && { color: '#F59E0B' }]}>
                      Due: {formatDate(item.due_date)}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingBottom: 16 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  scoreCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 14, padding: 16 },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  scoreValue: { fontSize: 24, fontWeight: 'bold' },
  scoreLabel: { fontSize: 11, color: '#a0a0a0' },
  scoreStats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  scoreStat: { alignItems: 'center' },
  scoreStatDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  scoreStatValue: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  scoreStatLabel: { fontSize: 10, color: '#a0a0a0' },
  categoryBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.card, marginRight: 8, gap: 6, borderWidth: 1, borderColor: '#2a2a4e' },
  categoryChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  categoryChipText: { fontSize: 13, color: '#a0a0a0', fontWeight: '500' },
  categoryChipTextActive: { color: colors.text },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a4e' },
  itemIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: colors.text },
  itemCategory: { fontSize: 12, color: '#666', marginTop: 2 },
  itemDue: { fontSize: 11, color: '#a0a0a0', marginTop: 4 },
});
