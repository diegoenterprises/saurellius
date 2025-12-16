/**
 * CONTRACTOR EQUIPMENT SCREEN
 * Track tools and equipment for projects
 * Manage inventory, depreciation, and maintenance
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
import BackButton from '../../components/common/BackButton';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface Equipment {
  id: string;
  name: string;
  category: string;
  serial_number?: string;
  purchase_date: string;
  purchase_price: number;
  current_value: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  assigned_project?: string;
  last_maintenance?: string;
  next_maintenance?: string;
  notes?: string;
}

interface EquipmentStats {
  total_items: number;
  total_value: number;
  in_use: number;
  needs_maintenance: number;
}

const CATEGORIES = ['Tools', 'Vehicles', 'Electronics', 'Safety', 'Other'];

export default function ContractorEquipmentScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [stats, setStats] = useState<EquipmentStats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [formData, setFormData] = useState({ name: '', category: 'Tools', serial_number: '', purchase_price: '', notes: '' });

  const fetchData = useCallback(async () => {
    try {
      const [equipRes, statsRes] = await Promise.all([
        api.get('/api/contractor/equipment', { params: { category: filterCategory !== 'all' ? filterCategory : undefined } }),
        api.get('/api/contractor/equipment/stats'),
      ]);
      setEquipment(equipRes.data.equipment || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return '#10B981';
      case 'good': return '#3B82F6';
      case 'fair': return '#F59E0B';
      case 'poor': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#10B981';
      case 'in_use': return '#3B82F6';
      case 'maintenance': return '#F59E0B';
      case 'retired': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const handleAddEquipment = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    try {
      await api.post('/api/contractor/equipment', {
        ...formData,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : 0,
        purchase_date: new Date().toISOString(),
      });
      setShowAddModal(false);
      setFormData({ name: '', category: 'Tools', serial_number: '', purchase_price: '', notes: '' });
      fetchData();
      Alert.alert('Success', 'Equipment added');
    } catch (error) {
      Alert.alert('Error', 'Failed to add equipment');
    }
  };

  const handleScheduleMaintenance = async (item: Equipment) => {
    try {
      await api.post(`/api/contractor/equipment/${item.id}/maintenance`);
      fetchData();
      Alert.alert('Success', 'Maintenance scheduled');
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule maintenance');
    }
  };

  const renderEquipmentCard = (item: Equipment) => {
    const needsMaintenance = item.next_maintenance && new Date(item.next_maintenance) <= new Date();
    return (
      <View key={item.id} style={[styles.equipCard, needsMaintenance && styles.maintenanceCard]}>
        <View style={styles.equipHeader}>
          <View style={styles.equipIcon}>
            <Ionicons name={item.category === 'Vehicles' ? 'car' : item.category === 'Electronics' ? 'hardware-chip' : item.category === 'Safety' ? 'shield' : 'construct'} size={24} color="#1473FF" />
          </View>
          <View style={styles.equipInfo}>
            <Text style={styles.equipName}>{item.name}</Text>
            <Text style={styles.equipCategory}>{item.category}</Text>
            {item.serial_number && <Text style={styles.equipSerial}>S/N: {item.serial_number}</Text>}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.replace('_', ' ')}</Text>
          </View>
        </View>

        <View style={styles.valueRow}>
          <View style={styles.valueItem}>
            <Text style={styles.valueLabel}>Purchase</Text>
            <Text style={styles.valueAmount}>{formatCurrency(item.purchase_price)}</Text>
          </View>
          <View style={styles.valueItem}>
            <Text style={styles.valueLabel}>Current</Text>
            <Text style={[styles.valueAmount, { color: '#10B981' }]}>{formatCurrency(item.current_value)}</Text>
          </View>
          <View style={styles.conditionBox}>
            <View style={[styles.conditionDot, { backgroundColor: getConditionColor(item.condition) }]} />
            <Text style={[styles.conditionText, { color: getConditionColor(item.condition) }]}>{item.condition}</Text>
          </View>
        </View>

        {item.assigned_project && (
          <View style={styles.projectRow}>
            <Ionicons name="briefcase" size={14} color="#666" />
            <Text style={styles.projectText}>Assigned: {item.assigned_project}</Text>
          </View>
        )}

        <View style={styles.maintenanceRow}>
          {item.last_maintenance && (
            <Text style={styles.maintenanceText}>Last: {formatDate(item.last_maintenance)}</Text>
          )}
          {item.next_maintenance && (
            <Text style={[styles.maintenanceText, needsMaintenance && { color: '#EF4444' }]}>
              Next: {formatDate(item.next_maintenance)} {needsMaintenance && '⚠️'}
            </Text>
          )}
        </View>

        <View style={styles.equipActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleScheduleMaintenance(item)}>
            <Ionicons name="build-outline" size={18} color="#F59E0B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="create-outline" size={18} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <BackButton variant="gradient" />
          <Text style={styles.headerTitle}>Equipment</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total_items}</Text><Text style={styles.statLabel}>Items</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{formatCurrency(stats.total_value)}</Text><Text style={styles.statLabel}>Value</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.needs_maintenance}</Text><Text style={styles.statLabel}>Maintenance</Text></View>
          </View>
        )}
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {['all', ...CATEGORIES].map(cat => (
          <TouchableOpacity key={cat} style={[styles.filterChip, filterCategory === cat && styles.filterChipActive]} onPress={() => { setFilterCategory(cat); setLoading(true); }}>
            <Text style={[styles.filterChipText, filterCategory === cat && styles.filterChipTextActive]}>{cat === 'all' ? 'All' : cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        <View style={styles.section}>
          {equipment.length > 0 ? equipment.map(renderEquipmentCard) : (
            <View style={styles.emptyState}><Ionicons name="construct-outline" size={48} color="#666" /><Text style={styles.emptyText}>No equipment</Text></View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Add Equipment</Text>
            <TouchableOpacity onPress={handleAddEquipment}><Text style={styles.modalSave}>Add</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Name *</Text><TextInput style={styles.input} value={formData.name} onChangeText={t => setFormData(p => ({...p, name: t}))} placeholder="Equipment name" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat} style={[styles.catOption, formData.category === cat && styles.catOptionActive]} onPress={() => setFormData(p => ({...p, category: cat}))}>
                    <Text style={[styles.catOptionText, formData.category === cat && styles.catOptionTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Serial Number</Text><TextInput style={styles.input} value={formData.serial_number} onChangeText={t => setFormData(p => ({...p, serial_number: t}))} placeholder="Optional" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Purchase Price</Text><TextInput style={styles.input} value={formData.purchase_price} onChangeText={t => setFormData(p => ({...p, purchase_price: t}))} placeholder="0.00" placeholderTextColor="#666" keyboardType="decimal-pad" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Notes</Text><TextInput style={[styles.input, styles.textArea]} value={formData.notes} onChangeText={t => setFormData(p => ({...p, notes: t}))} placeholder="Additional notes..." placeholderTextColor="#666" multiline numberOfLines={3} /></View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  statValue: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.card, marginRight: 8, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 13, color: '#a0a0a0', fontWeight: '500' },
  filterChipTextActive: { color: colors.text },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', padding: 16 },
  equipCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  maintenanceCard: { borderColor: '#F59E0B' },
  equipHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  equipIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#1473FF20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  equipInfo: { flex: 1 },
  equipName: { fontSize: 16, fontWeight: '600', color: colors.text },
  equipCategory: { fontSize: 13, color: '#a0a0a0', marginTop: 2 },
  equipSerial: { fontSize: 11, color: '#666', marginTop: 2, fontFamily: 'monospace' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  valueRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  valueItem: { flex: 1 },
  valueLabel: { fontSize: 11, color: '#666' },
  valueAmount: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 2 },
  conditionBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  conditionDot: { width: 10, height: 10, borderRadius: 5 },
  conditionText: { fontSize: 12, fontWeight: '500', textTransform: 'capitalize' },
  projectRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  projectText: { fontSize: 12, color: '#a0a0a0' },
  maintenanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  maintenanceText: { fontSize: 11, color: '#666' },
  equipActions: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e', gap: 8 },
  actionButton: { padding: 10, backgroundColor: colors.background, borderRadius: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  modalCancel: { fontSize: 16, color: '#a0a0a0' },
  modalSave: { fontSize: 16, fontWeight: '600', color: '#1473FF' },
  modalContent: { padding: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, color: '#a0a0a0', marginBottom: 6 },
  input: { backgroundColor: colors.card, borderRadius: 10, padding: 14, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: '#2a2a4e' },
  textArea: { height: 80, textAlignVertical: 'top' },
  catOption: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#2a2a4e', borderRadius: 10, marginRight: 8 },
  catOptionActive: { backgroundColor: '#1473FF' },
  catOptionText: { fontSize: 13, color: '#a0a0a0' },
  catOptionTextActive: { color: colors.text },
});
