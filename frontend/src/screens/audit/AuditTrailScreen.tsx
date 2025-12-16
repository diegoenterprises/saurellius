/**
 * SAURELLIUS AUDIT TRAIL
 * Complete change log for compliance and auditing
 * View all payroll changes, approvals, and security events
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

interface AuditLog {
  id: string;
  timestamp: string;
  category: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName?: string;
  changes: Change[];
  ipAddress?: string;
}

interface Change {
  field: string;
  oldValue: string | number | null;
  newValue: string | number;
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'list' },
  { id: 'EMPLOYEE', label: 'Employee', icon: 'person' },
  { id: 'PAYROLL', label: 'Payroll', icon: 'cash' },
  { id: 'TAX', label: 'Tax', icon: 'document-text' },
  { id: 'COMPENSATION', label: 'Compensation', icon: 'trending-up' },
  { id: 'SECURITY', label: 'Security', icon: 'shield' },
];

const MOCK_LOGS: AuditLog[] = [
  {
    id: '1',
    timestamp: '2024-12-11T14:30:00Z',
    category: 'PAYROLL',
    action: 'processed',
    entityType: 'payroll_run',
    entityId: 'PR-2024-24',
    userId: 'admin@company.com',
    userName: 'Sarah Admin',
    changes: [
      { field: 'status', oldValue: 'pending', newValue: 'completed' },
      { field: 'total_gross', oldValue: null, newValue: 125000 },
    ],
    ipAddress: '192.168.1.100',
  },
  {
    id: '2',
    timestamp: '2024-12-11T13:15:00Z',
    category: 'TAX',
    action: 'w4_submitted',
    entityType: 'employee',
    entityId: 'EMP-001',
    userId: 'john.doe@company.com',
    userName: 'John Doe',
    changes: [
      { field: 'filing_status', oldValue: 'single', newValue: 'married_jointly' },
      { field: 'dependents', oldValue: 0, newValue: 2 },
    ],
  },
  {
    id: '3',
    timestamp: '2024-12-11T11:45:00Z',
    category: 'COMPENSATION',
    action: 'rate_changed',
    entityType: 'employee',
    entityId: 'EMP-015',
    userId: 'hr@company.com',
    userName: 'HR Manager',
    changes: [
      { field: 'hourly_rate', oldValue: 25.00, newValue: 28.50 },
      { field: 'effective_date', oldValue: null, newValue: '2024-12-16' },
    ],
  },
  {
    id: '4',
    timestamp: '2024-12-11T10:30:00Z',
    category: 'EMPLOYEE',
    action: 'created',
    entityType: 'employee',
    entityId: 'EMP-051',
    userId: 'hr@company.com',
    userName: 'HR Manager',
    changes: [
      { field: 'name', oldValue: null, newValue: 'Jane Smith' },
      { field: 'department', oldValue: null, newValue: 'Engineering' },
      { field: 'start_date', oldValue: null, newValue: '2024-12-16' },
    ],
  },
  {
    id: '5',
    timestamp: '2024-12-11T09:15:00Z',
    category: 'SECURITY',
    action: 'login',
    entityType: 'user',
    entityId: 'admin@company.com',
    userId: 'admin@company.com',
    userName: 'Sarah Admin',
    changes: [],
    ipAddress: '192.168.1.100',
  },
  {
    id: '6',
    timestamp: '2024-12-10T16:00:00Z',
    category: 'PAYROLL',
    action: 'approved',
    entityType: 'payroll_run',
    entityId: 'PR-2024-24',
    userId: 'cfo@company.com',
    userName: 'CFO',
    changes: [
      { field: 'status', oldValue: 'pending_approval', newValue: 'approved' },
    ],
  },
];

const AuditTrailScreen: React.FC = () => {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const [logs, setLogs] = useState<AuditLog[]>(MOCK_LOGS);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const filteredLogs = logs.filter(log => {
    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      log.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'EMPLOYEE': '#6366F1',
      'PAYROLL': '#10B981',
      'TAX': '#F59E0B',
      'COMPENSATION': '#8B5CF6',
      'SECURITY': '#EF4444',
      'DIRECT_DEPOSIT': '#3B82F6',
      'GARNISHMENT': '#EC4899',
      'BENEFITS': '#14B8A6',
    };
    return colors[category] || '#6B7280';
  };
  
  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      'created': 'add-circle',
      'updated': 'create',
      'terminated': 'close-circle',
      'processed': 'checkmark-done',
      'approved': 'checkmark-circle',
      'rate_changed': 'trending-up',
      'w4_submitted': 'document-text',
      'login': 'log-in',
      'logout': 'log-out',
    };
    return icons[action] || 'ellipse';
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };
  
  const formatFullDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };
  
  const openLogDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };
  
  const styles = createStyles(isDarkMode);
  
  const renderLogItem = ({ item }: { item: AuditLog }) => (
    <TouchableOpacity style={styles.logItem} onPress={() => openLogDetail(item)}>
      <View style={[styles.categoryIndicator, { backgroundColor: getCategoryColor(item.category) }]} />
      <View style={styles.logContent}>
        <View style={styles.logHeader}>
          <View style={styles.logAction}>
            <Ionicons 
              name={getActionIcon(item.action) as any} 
              size={16} 
              color={getCategoryColor(item.category)} 
            />
            <Text style={styles.actionText}>
              {item.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </View>
          <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
        </View>
        
        <Text style={styles.entityInfo}>
          <Text style={styles.entityType}>{item.entityType.replace('_', ' ')}</Text>
          {' • '}
          <Text style={styles.entityId}>{item.entityId}</Text>
        </Text>
        
        <View style={styles.logFooter}>
          <View style={styles.userInfo}>
            <Ionicons name="person-circle" size={14} color="#6B7280" />
            <Text style={styles.userName}>{item.userName || item.userId}</Text>
          </View>
          {item.changes.length > 0 && (
            <View style={styles.changesBadge}>
              <Text style={styles.changesCount}>{item.changes.length} changes</Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6B7280" />
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1F2937', '#374151']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Audit Trail</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>Complete change history</Text>
      </LinearGradient>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by ID, user, or action..."
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Category Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.filterChip,
              selectedCategory === cat.id && styles.filterChipActive
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Ionicons 
              name={cat.icon as any} 
              size={16} 
              color={selectedCategory === cat.id ? '#FFFFFF' : '#6B7280'} 
            />
            <Text style={[
              styles.filterChipText,
              selectedCategory === cat.id && styles.filterChipTextActive
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Stats Summary */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{filteredLogs.length}</Text>
          <Text style={styles.statLabel}>Changes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {new Set(filteredLogs.map(l => l.userId)).size}
          </Text>
          <Text style={styles.statLabel}>Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {new Set(filteredLogs.map(l => l.category)).size}
          </Text>
          <Text style={styles.statLabel}>Categories</Text>
        </View>
      </View>
      
      {/* Logs List */}
      <FlatList
        data={filteredLogs}
        renderItem={renderLogItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#6B7280" />
            <Text style={styles.emptyTitle}>No logs found</Text>
            <Text style={styles.emptyText}>Try adjusting your filters</Text>
          </View>
        }
      />
      
      {/* Detail Modal */}
      <Modal visible={showDetailModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Audit Log Details</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#1F2937'} />
              </TouchableOpacity>
            </View>
            
            {selectedLog && (
              <ScrollView style={styles.modalBody}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(selectedLog.category) + '20' }]}>
                  <Text style={[styles.categoryBadgeText, { color: getCategoryColor(selectedLog.category) }]}>
                    {selectedLog.category}
                  </Text>
                </View>
                
                <Text style={styles.detailAction}>
                  {selectedLog.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Timestamp</Text>
                  <Text style={styles.detailValue}>{formatFullDate(selectedLog.timestamp)}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Entity</Text>
                  <Text style={styles.detailValue}>
                    {selectedLog.entityType} • {selectedLog.entityId}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>User</Text>
                  <Text style={styles.detailValue}>{selectedLog.userName || selectedLog.userId}</Text>
                </View>
                
                {selectedLog.ipAddress && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>IP Address</Text>
                    <Text style={styles.detailValue}>{selectedLog.ipAddress}</Text>
                  </View>
                )}
                
                {selectedLog.changes.length > 0 && (
                  <View style={styles.changesSection}>
                    <Text style={styles.changesTitle}>Changes Made</Text>
                    {selectedLog.changes.map((change, index) => (
                      <View key={index} style={styles.changeItem}>
                        <Text style={styles.changeField}>{change.field.replace('_', ' ')}</Text>
                        <View style={styles.changeValues}>
                          {change.oldValue !== null && (
                            <View style={styles.oldValue}>
                              <Text style={styles.oldValueLabel}>From:</Text>
                              <Text style={styles.oldValueText}>{String(change.oldValue)}</Text>
                            </View>
                          )}
                          <View style={styles.newValue}>
                            <Text style={styles.newValueLabel}>To:</Text>
                            <Text style={styles.newValueText}>{String(change.newValue)}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDarkMode ? '#111827' : '#F3F4F6' },
  header: { padding: 20, paddingTop: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', margin: 16, marginBottom: 8, padding: 12, borderRadius: 12, gap: 12, borderWidth: 1, borderColor: isDarkMode ? '#374151' : '#E5E7EB' },
  searchInput: { flex: 1, fontSize: 15, color: isDarkMode ? '#FFFFFF' : '#1F2937' },
  filterContainer: { maxHeight: 50, marginBottom: 8 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderWidth: 1, borderColor: isDarkMode ? '#374151' : '#E5E7EB' },
  filterChipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  filterChipText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  filterChipTextActive: { color: colors.text },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', padding: 12, borderRadius: 8, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#6366F1' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  listContent: { padding: 16, paddingTop: 0 },
  logItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: isDarkMode ? '#374151' : '#E5E7EB' },
  categoryIndicator: { width: 4, height: '100%', borderRadius: 2, marginRight: 12 },
  logContent: { flex: 1 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  logAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 14, fontWeight: '600', color: isDarkMode ? '#FFFFFF' : '#1F2937' },
  timestamp: { fontSize: 12, color: '#6B7280' },
  entityInfo: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  entityType: { textTransform: 'capitalize' },
  entityId: { fontWeight: '600', color: isDarkMode ? '#D1D5DB' : '#374151' },
  logFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userName: { fontSize: 12, color: '#6B7280' },
  changesBadge: { backgroundColor: isDarkMode ? '#374151' : '#E5E7EB', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  changesCount: { fontSize: 11, color: '#6B7280' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: isDarkMode ? '#FFFFFF' : '#1F2937', marginTop: 16 },
  emptyText: { color: '#6B7280', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#1F2937' },
  modalBody: { padding: 20 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 12 },
  categoryBadgeText: { fontSize: 12, fontWeight: '600' },
  detailAction: { fontSize: 24, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#1F2937', marginBottom: 20 },
  detailRow: { marginBottom: 16 },
  detailLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  detailValue: { fontSize: 15, color: isDarkMode ? '#FFFFFF' : '#1F2937' },
  changesSection: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: isDarkMode ? '#374151' : '#E5E7EB' },
  changesTitle: { fontSize: 16, fontWeight: '600', color: isDarkMode ? '#FFFFFF' : '#1F2937', marginBottom: 16 },
  changeItem: { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', padding: 12, borderRadius: 8, marginBottom: 8 },
  changeField: { fontSize: 13, fontWeight: '600', color: isDarkMode ? '#D1D5DB' : '#6B7280', textTransform: 'capitalize', marginBottom: 8 },
  changeValues: { gap: 6 },
  oldValue: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  oldValueLabel: { fontSize: 12, color: '#EF4444' },
  oldValueText: { fontSize: 14, color: isDarkMode ? '#FCA5A5' : '#DC2626', textDecorationLine: 'line-through' },
  newValue: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  newValueLabel: { fontSize: 12, color: '#10B981' },
  newValueText: { fontSize: 14, color: isDarkMode ? '#6EE7B7' : '#059669', fontWeight: '600' },
});

export default AuditTrailScreen;
