/**
 * CONTRACTOR BUSINESS EXPENSES SCREEN
 * Track and categorize business expenses
 * Manage receipts, reports, and tax deductions
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
import api from '../../services/api';

interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  vendor: string;
  payment_method: string;
  receipt_url?: string;
  is_billable: boolean;
  client_name?: string;
  tax_deductible: boolean;
  notes?: string;
}

interface ExpenseStats {
  total_ytd: number;
  this_month: number;
  billable_amount: number;
  deductible_amount: number;
  pending_receipts: number;
}

const CATEGORIES = [
  { id: 'office', name: 'Office', icon: 'business', color: '#3B82F6' },
  { id: 'travel', name: 'Travel', icon: 'airplane', color: '#8B5CF6' },
  { id: 'meals', name: 'Meals', icon: 'restaurant', color: '#F59E0B' },
  { id: 'software', name: 'Software', icon: 'apps', color: '#10B981' },
  { id: 'equipment', name: 'Equipment', icon: 'hardware-chip', color: '#EC4899' },
  { id: 'marketing', name: 'Marketing', icon: 'megaphone', color: '#6366F1' },
  { id: 'professional', name: 'Professional', icon: 'briefcase', color: '#14B8A6' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280' },
];

export default function ContractorBusinessExpensesScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ description: '', category: 'office', amount: '', vendor: '', is_billable: false, tax_deductible: true });

  const fetchData = useCallback(async () => {
    try {
      const [expensesRes, statsRes] = await Promise.all([
        api.get('/api/contractor/business-expenses', { params: { category: filterCategory !== 'all' ? filterCategory : undefined } }),
        api.get('/api/contractor/business-expenses/stats'),
      ]);
      setExpenses(expensesRes.data.expenses || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getCategoryInfo = (categoryId: string) => CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[7];

  const handleAddExpense = async () => {
    if (!formData.description.trim() || !formData.amount) {
      Alert.alert('Error', 'Description and amount are required');
      return;
    }
    try {
      await api.post('/api/contractor/business-expenses', { ...formData, amount: parseFloat(formData.amount), date: new Date().toISOString() });
      setShowAddModal(false);
      setFormData({ description: '', category: 'office', amount: '', vendor: '', is_billable: false, tax_deductible: true });
      fetchData();
      Alert.alert('Success', 'Expense added');
    } catch (error) {
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert('Delete Expense', `Delete "${expense.description}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/api/contractor/business-expenses/${expense.id}`);
          fetchData();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete');
        }
      }},
    ]);
  };

  const renderExpenseCard = (expense: Expense) => {
    const catInfo = getCategoryInfo(expense.category);
    return (
      <TouchableOpacity key={expense.id} style={styles.expenseCard} onLongPress={() => handleDeleteExpense(expense)}>
        <View style={styles.expenseHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: catInfo.color + '20' }]}>
            <Ionicons name={catInfo.icon as any} size={20} color={catInfo.color} />
          </View>
          <View style={styles.expenseInfo}>
            <Text style={styles.expenseDesc}>{expense.description}</Text>
            <Text style={styles.expenseVendor}>{expense.vendor}</Text>
            <View style={styles.expenseTags}>
              {expense.is_billable && <View style={styles.billableTag}><Text style={styles.tagText}>Billable</Text></View>}
              {expense.tax_deductible && <View style={styles.deductibleTag}><Text style={styles.tagText}>Tax Deductible</Text></View>}
            </View>
          </View>
          <View style={styles.expenseRight}>
            <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
            <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
          </View>
        </View>

        {expense.client_name && (
          <View style={styles.clientRow}>
            <Ionicons name="business" size={14} color="#666" />
            <Text style={styles.clientText}>Client: {expense.client_name}</Text>
          </View>
        )}

        <View style={styles.expenseFooter}>
          <View style={styles.paymentMethod}>
            <Ionicons name="card" size={14} color="#666" />
            <Text style={styles.paymentText}>{expense.payment_method}</Text>
          </View>
          {expense.receipt_url ? (
            <View style={styles.receiptAttached}><Ionicons name="document-attach" size={14} color="#10B981" /><Text style={styles.receiptText}>Receipt</Text></View>
          ) : (
            <TouchableOpacity style={styles.addReceipt}><Ionicons name="camera" size={14} color="#F59E0B" /><Text style={styles.addReceiptText}>Add Receipt</Text></TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Business Expenses</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}><Ionicons name="add-circle-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}><Text style={styles.statValue}>{formatCurrency(stats.this_month)}</Text><Text style={styles.statLabel}>This Month</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10B981' }]}>{formatCurrency(stats.deductible_amount)}</Text><Text style={styles.statLabel}>Deductible</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3B82F6' }]}>{formatCurrency(stats.billable_amount)}</Text><Text style={styles.statLabel}>Billable</Text></View>
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
          {expenses.length > 0 ? expenses.map(renderExpenseCard) : (
            <View style={styles.emptyState}><Ionicons name="receipt-outline" size={48} color="#666" /><Text style={styles.emptyText}>No expenses recorded</Text></View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Add Expense</Text>
            <TouchableOpacity onPress={handleAddExpense}><Text style={styles.modalSave}>Save</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Description *</Text><TextInput style={styles.input} value={formData.description} onChangeText={t => setFormData(p => ({...p, description: t}))} placeholder="What was this expense for?" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Amount *</Text><TextInput style={styles.input} value={formData.amount} onChangeText={t => setFormData(p => ({...p, amount: t}))} placeholder="0.00" placeholderTextColor="#666" keyboardType="decimal-pad" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Vendor</Text><TextInput style={styles.input} value={formData.vendor} onChangeText={t => setFormData(p => ({...p, vendor: t}))} placeholder="Where did you make this purchase?" placeholderTextColor="#666" /></View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat.id} style={[styles.categoryOption, formData.category === cat.id && styles.categoryActive]} onPress={() => setFormData(p => ({...p, category: cat.id}))}>
                    <Ionicons name={cat.icon as any} size={18} color={formData.category === cat.id ? '#FFF' : cat.color} />
                    <Text style={[styles.categoryText, formData.category === cat.id && styles.categoryTextActive]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.toggleRow}>
              <TouchableOpacity style={[styles.toggleOption, formData.is_billable && styles.toggleActive]} onPress={() => setFormData(p => ({...p, is_billable: !p.is_billable}))}>
                <Ionicons name={formData.is_billable ? 'checkbox' : 'square-outline'} size={20} color={formData.is_billable ? '#1473FF' : '#666'} />
                <Text style={styles.toggleText}>Billable to Client</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleOption, formData.tax_deductible && styles.toggleActive]} onPress={() => setFormData(p => ({...p, tax_deductible: !p.tax_deductible}))}>
                <Ionicons name={formData.tax_deductible ? 'checkbox' : 'square-outline'} size={20} color={formData.tax_deductible ? '#10B981' : '#666'} />
                <Text style={styles.toggleText}>Tax Deductible</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1a1a2e', marginRight: 8, gap: 6, borderWidth: 1, borderColor: '#2a2a4e' },
  filterChipActive: { backgroundColor: '#1473FF', borderColor: '#1473FF' },
  filterChipText: { fontSize: 12, color: '#a0a0a0', fontWeight: '500' },
  filterChipTextActive: { color: '#FFF' },
  content: { flex: 1 },
  section: { padding: 16 },
  expenseCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  expenseHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  categoryIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  expenseInfo: { flex: 1 },
  expenseDesc: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  expenseVendor: { fontSize: 13, color: '#666', marginTop: 2 },
  expenseTags: { flexDirection: 'row', marginTop: 6, gap: 6 },
  billableTag: { backgroundColor: '#3B82F620', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  deductibleTag: { backgroundColor: '#10B98120', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 10, color: '#a0a0a0' },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  expenseDate: { fontSize: 12, color: '#666', marginTop: 2 },
  clientRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  clientText: { fontSize: 12, color: '#a0a0a0' },
  expenseFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  paymentMethod: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  paymentText: { fontSize: 12, color: '#666' },
  receiptAttached: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  receiptText: { fontSize: 12, color: '#10B981' },
  addReceipt: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addReceiptText: { fontSize: 12, color: '#F59E0B' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
  modalContainer: { flex: 1, backgroundColor: '#0f0f23' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  modalCancel: { fontSize: 16, color: '#a0a0a0' },
  modalSave: { fontSize: 16, fontWeight: '600', color: '#1473FF' },
  modalContent: { padding: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, color: '#a0a0a0', marginBottom: 6 },
  input: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14, fontSize: 16, color: '#FFF', borderWidth: 1, borderColor: '#2a2a4e' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#2a2a4e', borderRadius: 10, gap: 6 },
  categoryActive: { backgroundColor: '#1473FF' },
  categoryText: { fontSize: 12, color: '#a0a0a0' },
  categoryTextActive: { color: '#FFF' },
  toggleRow: { gap: 10 },
  toggleOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  toggleActive: {},
  toggleText: { fontSize: 15, color: '#FFF' },
});
