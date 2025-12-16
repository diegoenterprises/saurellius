/**
 * EMPLOYER ORG CHART SCREEN
 * Visualize company organizational structure
 * View hierarchy, reporting lines, and team compositions
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

interface OrgNode {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  avatar_url?: string;
  direct_reports: number;
  level: number;
  children?: OrgNode[];
  is_expanded?: boolean;
}

interface OrgStats {
  total_employees: number;
  departments: number;
  avg_span_of_control: number;
  levels: number;
}

export default function OrgChartScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orgData, setOrgData] = useState<OrgNode | null>(null);
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [orgRes, statsRes] = await Promise.all([
        api.get('/api/employer/org-chart'),
        api.get('/api/employer/org-chart/stats'),
      ]);
      setOrgData(orgRes.data.org || null);
      setStats(statsRes.data.stats || null);
      if (orgRes.data.org) setExpandedNodes(new Set([orgRes.data.org.id]));
    } catch (error) {
      console.error('Failed to fetch org chart:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const getLevelColor = (level: number) => {
    const colors = ['#1473FF', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#6366F1'];
    return colors[level % colors.length];
  };

  const renderOrgNode = (node: OrgNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const levelColor = getLevelColor(node.level);

    return (
      <View key={node.id} style={[styles.nodeContainer, { marginLeft: depth * 20 }]}>
        <TouchableOpacity style={[styles.nodeCard, selectedNode?.id === node.id && styles.selectedNode]} onPress={() => setSelectedNode(node)}>
          <View style={styles.nodeLeft}>
            {hasChildren && (
              <TouchableOpacity style={styles.expandButton} onPress={() => toggleExpand(node.id)}>
                <Ionicons name={isExpanded ? 'chevron-down' : 'chevron-forward'} size={18} color="#666" />
              </TouchableOpacity>
            )}
            {!hasChildren && <View style={styles.expandPlaceholder} />}
            <View style={[styles.levelIndicator, { backgroundColor: levelColor }]} />
            <View style={styles.avatar}><Text style={styles.avatarText}>{node.name.split(' ').map(n => n[0]).join('')}</Text></View>
          </View>
          <View style={styles.nodeInfo}>
            <Text style={styles.nodeName}>{node.name}</Text>
            <Text style={styles.nodeTitle}>{node.title}</Text>
            <View style={styles.nodeMeta}>
              <View style={styles.metaItem}><Ionicons name="business" size={12} color="#666" /><Text style={styles.metaText}>{node.department}</Text></View>
              {node.direct_reports > 0 && (
                <View style={styles.metaItem}><Ionicons name="people" size={12} color="#666" /><Text style={styles.metaText}>{node.direct_reports} reports</Text></View>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.nodeAction}><Ionicons name="ellipsis-vertical" size={18} color="#666" /></TouchableOpacity>
        </TouchableOpacity>

        {isExpanded && hasChildren && (
          <View style={styles.childrenContainer}>
            {node.children!.map(child => renderOrgNode(child, depth + 1))}
          </View>
        )}
      </View>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Org Chart</Text>
          <TouchableOpacity><Ionicons name="search-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_employees}</Text><Text style={styles.statLabel}>Employees</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.departments}</Text><Text style={styles.statLabel}>Depts</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.levels}</Text><Text style={styles.statLabel}>Levels</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.avg_span_of_control.toFixed(1)}</Text><Text style={styles.statLabel}>Avg Span</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />} horizontal>
        <ScrollView style={styles.chartContainer}>
          <View style={styles.section}>
            {orgData ? renderOrgNode(orgData) : (
              <View style={styles.emptyState}><Ionicons name="git-network-outline" size={48} color="#666" /><Text style={styles.emptyText}>No org chart data</Text></View>
            )}
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      </ScrollView>

      {selectedNode && (
        <View style={styles.detailPanel}>
          <View style={styles.detailHeader}>
            <View style={styles.detailAvatar}><Text style={styles.detailAvatarText}>{selectedNode.name.split(' ').map(n => n[0]).join('')}</Text></View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailName}>{selectedNode.name}</Text>
              <Text style={styles.detailTitle}>{selectedNode.title}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedNode(null)}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
          </View>
          <View style={styles.detailBody}>
            <View style={styles.detailRow}><Ionicons name="business" size={16} color="#666" /><Text style={styles.detailText}>{selectedNode.department}</Text></View>
            <View style={styles.detailRow}><Ionicons name="mail" size={16} color="#666" /><Text style={styles.detailText}>{selectedNode.email}</Text></View>
            <View style={styles.detailRow}><Ionicons name="people" size={16} color="#666" /><Text style={styles.detailText}>{selectedNode.direct_reports} direct reports</Text></View>
          </View>
          <View style={styles.detailActions}>
            <TouchableOpacity style={styles.detailButton}><Ionicons name="mail" size={18} color="#1473FF" /><Text style={styles.detailButtonText}>Email</Text></TouchableOpacity>
            <TouchableOpacity style={styles.detailButton}><Ionicons name="person" size={18} color="#1473FF" /><Text style={styles.detailButtonText}>Profile</Text></TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingBottom: 16 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  statsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 12, padding: 12 },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 6 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  content: { flex: 1 },
  chartContainer: { minWidth: '100%' },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16, minWidth: 400 },
  nodeContainer: { marginBottom: 4 },
  nodeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  selectedNode: { borderColor: '#1473FF', backgroundColor: '#1473FF10' },
  nodeLeft: { flexDirection: 'row', alignItems: 'center' },
  expandButton: { padding: 4, marginRight: 4 },
  expandPlaceholder: { width: 26 },
  levelIndicator: { width: 4, height: 36, borderRadius: 2, marginRight: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  nodeInfo: { flex: 1 },
  nodeName: { fontSize: 14, fontWeight: '600', color: colors.text },
  nodeTitle: { fontSize: 12, color: '#a0a0a0', marginTop: 2 },
  nodeMeta: { flexDirection: 'row', marginTop: 4, gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 10, color: '#666' },
  nodeAction: { padding: 8 },
  childrenContainer: { marginTop: 4, borderLeftWidth: 2, borderLeftColor: '#2a2a4e', marginLeft: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
  detailPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  detailAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1473FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  detailAvatarText: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  detailInfo: { flex: 1 },
  detailName: { fontSize: 18, fontWeight: '600', color: colors.text },
  detailTitle: { fontSize: 14, color: '#a0a0a0', marginTop: 2 },
  detailBody: { gap: 10, marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailText: { fontSize: 14, color: '#a0a0a0' },
  detailActions: { flexDirection: 'row', gap: 10 },
  detailButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1473FF20', paddingVertical: 12, borderRadius: 10, gap: 6 },
  detailButtonText: { fontSize: 14, fontWeight: '500', color: '#1473FF' },
});
