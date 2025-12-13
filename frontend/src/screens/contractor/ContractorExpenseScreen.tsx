/**
 * CONTRACTOR EXPENSE TRACKING SCREEN
 * Track business expenses, mileage, and receipts
 * Supports OCR receipt scanning and categorization
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  FlatList,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  receipt_url?: string;
  vendor?: string;
  is_mileage: boolean;
  miles?: number;
  mileage_rate?: number;
  status: 'pending' | 'approved' | 'rejected';
  tax_deductible: boolean;
}

interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'office', name: 'Office Supplies', icon: 'desktop-outline', color: '#3B82F6' },
  { id: 'travel', name: 'Travel', icon: 'airplane-outline', color: '#8B5CF6' },
  { id: 'meals', name: 'Meals & Entertainment', icon: 'restaurant-outline', color: '#F59E0B' },
  { id: 'equipment', name: 'Equipment', icon: 'hardware-chip-outline', color: '#10B981' },
  { id: 'software', name: 'Software & Subscriptions', icon: 'cloud-outline', color: '#EC4899' },
  { id: 'marketing', name: 'Marketing & Advertising', icon: 'megaphone-outline', color: '#EF4444' },
  { id: 'professional', name: 'Professional Services', icon: 'briefcase-outline', color: '#06B6D4' },
  { id: 'mileage', name: 'Mileage', icon: 'car-outline', color: '#84CC16' },
  { id: 'utilities', name: 'Utilities', icon: 'flash-outline', color: '#F97316' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal-outline', color: '#6B7280' },
];

const IRS_MILEAGE_RATE = 0.67; // 2024 IRS standard mileage rate

export default function ContractorExpenseScreen() {
  const navigation = useNavigation<any>();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'mileage' | 'receipts'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMileageModal, setShowMileageModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [newExpense, setNewExpense] = useState({
    category: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    receipt_image: null as string | null,
  });

  const [newMileage, setNewMileage] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    miles: '',
    start_location: '',
    end_location: '',
  });

  const fetchExpenses = useCallback(async () => {
    try {
      const response = await api.get('/api/contractor/expenses', {
        params: { month: selectedMonth + 1, year: selectedYear }
      });
      setExpenses(response.data.expenses || []);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalMileage = expenses
    .filter(exp => exp.is_mileage)
    .reduce((sum, exp) => sum + (exp.miles || 0), 0);
  const totalMileageDeduction = totalMileage * IRS_MILEAGE_RATE;

  const filteredExpenses = expenses.filter(exp => {
    if (activeTab === 'mileage') return exp.is_mileage;
    if (activeTab === 'receipts') return !exp.is_mileage && exp.receipt_url;
    return true;
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload receipts');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setNewExpense(prev => ({ 
        ...prev, 
        receipt_image: `data:image/jpeg;base64,${result.assets[0].base64}` 
      }));
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setNewExpense(prev => ({ 
        ...prev, 
        receipt_image: `data:image/jpeg;base64,${result.assets[0].base64}` 
      }));
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      const response = await api.post('/api/contractor/expenses', {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        is_mileage: false,
        tax_deductible: true,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Expense added successfully');
        setShowAddModal(false);
        resetNewExpense();
        fetchExpenses();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  const handleAddMileage = async () => {
    if (!newMileage.miles || parseFloat(newMileage.miles) <= 0) {
      Alert.alert('Error', 'Please enter valid miles');
      return;
    }

    try {
      const miles = parseFloat(newMileage.miles);
      const response = await api.post('/api/contractor/expenses', {
        category: 'mileage',
        description: newMileage.description || `${newMileage.start_location} to ${newMileage.end_location}`,
        date: newMileage.date,
        is_mileage: true,
        miles: miles,
        mileage_rate: IRS_MILEAGE_RATE,
        amount: miles * IRS_MILEAGE_RATE,
        tax_deductible: true,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Mileage logged successfully');
        setShowMileageModal(false);
        resetNewMileage();
        fetchExpenses();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to log mileage');
    }
  };

  const resetNewExpense = () => {
    setNewExpense({
      category: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      vendor: '',
      receipt_image: null,
    });
  };

  const resetNewMileage = () => {
    setNewMileage({
      date: new Date().toISOString().split('T')[0],
      description: '',
      miles: '',
      start_location: '',
      end_location: '',
    });
  };

  const deleteExpense = (id: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/contractor/expenses/${id}`);
              fetchExpenses();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  const getCategoryInfo = (categoryId: string) => {
    return EXPENSE_CATEGORIES.find(c => c.id === categoryId) || EXPENSE_CATEGORIES[9];
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const category = getCategoryInfo(item.category);
    
    return (
      <TouchableOpacity 
        style={styles.expenseCard}
        onLongPress={() => deleteExpense(item.id)}
      >
        <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
          <Ionicons name={category.icon as any} size={24} color={category.color} />
        </View>
        <View style={styles.expenseContent}>
          <Text style={styles.expenseDescription}>{item.description || category.name}</Text>
          <View style={styles.expenseDetails}>
            <Text style={styles.expenseVendor}>{item.vendor || 'No vendor'}</Text>
            <Text style={styles.expenseDate}>{new Date(item.date).toLocaleDateString()}</Text>
          </View>
          {item.is_mileage && (
            <Text style={styles.mileageInfo}>{item.miles} miles @ ${IRS_MILEAGE_RATE}/mi</Text>
          )}
        </View>
        <View style={styles.expenseRight}>
          <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
          {item.receipt_url && (
            <View style={styles.receiptBadge}>
              <Ionicons name="receipt" size={12} color="#10B981" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderAddExpenseModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAddModal(false)}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Expense</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {EXPENSE_CATEGORIES.filter(c => c.id !== 'mileage').map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryOption,
                  newExpense.category === category.id && styles.categoryOptionSelected,
                  { borderColor: newExpense.category === category.id ? category.color : '#2a2a4e' }
                ]}
                onPress={() => setNewExpense(prev => ({ ...prev, category: category.id }))}
              >
                <View style={[styles.categoryOptionIcon, { backgroundColor: category.color + '20' }]}>
                  <Ionicons name={category.icon as any} size={20} color={category.color} />
                </View>
                <Text style={styles.categoryOptionText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount *</Text>
            <View style={styles.amountInput}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountTextInput}
                value={newExpense.amount}
                onChangeText={(text) => setNewExpense(prev => ({ ...prev, amount: text }))}
                placeholder="0.00"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.input}
              value={newExpense.description}
              onChangeText={(text) => setNewExpense(prev => ({ ...prev, description: text }))}
              placeholder="What was this expense for?"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Vendor/Merchant</Text>
            <TextInput
              style={styles.input}
              value={newExpense.vendor}
              onChangeText={(text) => setNewExpense(prev => ({ ...prev, vendor: text }))}
              placeholder="Where did you make this purchase?"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              style={styles.input}
              value={newExpense.date}
              onChangeText={(text) => setNewExpense(prev => ({ ...prev, date: text }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
            />
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Receipt</Text>
          
          {newExpense.receipt_image ? (
            <View style={styles.receiptPreview}>
              <Image source={{ uri: newExpense.receipt_image }} style={styles.receiptImage} />
              <TouchableOpacity 
                style={styles.removeReceiptButton}
                onPress={() => setNewExpense(prev => ({ ...prev, receipt_image: null }))}
              >
                <Ionicons name="close-circle" size={28} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.receiptButtons}>
              <TouchableOpacity style={styles.receiptButton} onPress={takePhoto}>
                <Ionicons name="camera" size={24} color="#1473FF" />
                <Text style={styles.receiptButtonText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.receiptButton} onPress={pickImage}>
                <Ionicons name="image" size={24} color="#1473FF" />
                <Text style={styles.receiptButtonText}>Choose Image</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleAddExpense}
          >
            <LinearGradient
              colors={['#1473FF', '#BE01FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              <Text style={styles.saveButtonText}>Save Expense</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderMileageModal = () => (
    <Modal
      visible={showMileageModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowMileageModal(false)}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Log Mileage</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.mileageRateInfo}>
            <Ionicons name="information-circle" size={24} color="#1473FF" />
            <View style={styles.mileageRateContent}>
              <Text style={styles.mileageRateTitle}>IRS Standard Mileage Rate</Text>
              <Text style={styles.mileageRateValue}>${IRS_MILEAGE_RATE.toFixed(2)} per mile (2024)</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Miles Driven *</Text>
            <View style={styles.milesInput}>
              <TextInput
                style={styles.milesTextInput}
                value={newMileage.miles}
                onChangeText={(text) => setNewMileage(prev => ({ ...prev, miles: text }))}
                placeholder="0"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
              />
              <Text style={styles.milesLabel}>miles</Text>
            </View>
            {newMileage.miles && (
              <Text style={styles.mileageCalculation}>
                Deduction: ${(parseFloat(newMileage.miles) * IRS_MILEAGE_RATE).toFixed(2)}
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              style={styles.input}
              value={newMileage.date}
              onChangeText={(text) => setNewMileage(prev => ({ ...prev, date: text }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Starting Location</Text>
            <TextInput
              style={styles.input}
              value={newMileage.start_location}
              onChangeText={(text) => setNewMileage(prev => ({ ...prev, start_location: text }))}
              placeholder="e.g., Home office"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Destination</Text>
            <TextInput
              style={styles.input}
              value={newMileage.end_location}
              onChangeText={(text) => setNewMileage(prev => ({ ...prev, end_location: text }))}
              placeholder="e.g., Client office"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Purpose/Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newMileage.description}
              onChangeText={(text) => setNewMileage(prev => ({ ...prev, description: text }))}
              placeholder="Business purpose of the trip"
              placeholderTextColor="#666"
              multiline
              numberOfLines={2}
            />
          </View>

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleAddMileage}
          >
            <LinearGradient
              colors={['#84CC16', '#65A30D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              <Ionicons name="car" size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>Log Mileage</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Expenses</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
            <Text style={styles.summaryValue}>${totalExpenses.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardMileage]}>
            <Text style={styles.summaryLabel}>Mileage Deduction</Text>
            <Text style={[styles.summaryValue, { color: '#84CC16' }]}>${totalMileageDeduction.toFixed(2)}</Text>
            <Text style={styles.mileageSubtext}>{totalMileage.toFixed(1)} miles</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabs}>
        {(['all', 'receipts', 'mileage'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="receipt" size={20} color="#1473FF" />
          <Text style={styles.quickActionText}>Add Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.quickActionButton, styles.quickActionMileage]}
          onPress={() => setShowMileageModal(true)}
        >
          <Ionicons name="car" size={20} color="#84CC16" />
          <Text style={[styles.quickActionText, { color: '#84CC16' }]}>Log Mileage</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredExpenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#666" />
            <Text style={styles.emptyStateText}>No expenses yet</Text>
            <Text style={styles.emptyStateSubtext}>Start tracking your business expenses</Text>
          </View>
        }
      />

      {renderAddExpenseModal()}
      {renderMileageModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
  },
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
  },
  summaryCardMileage: {
    backgroundColor: '#84CC1620',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  mileageSubtext: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#1473FF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFF',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1473FF20',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  quickActionMileage: {
    backgroundColor: '#84CC1620',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1473FF',
  },
  listContent: {
    padding: 16,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseContent: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFF',
    marginBottom: 4,
  },
  expenseDetails: {
    flexDirection: 'row',
    gap: 8,
  },
  expenseVendor: {
    fontSize: 12,
    color: '#666',
  },
  expenseDate: {
    fontSize: 12,
    color: '#666',
  },
  mileageInfo: {
    fontSize: 11,
    color: '#84CC16',
    marginTop: 4,
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  receiptBadge: {
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  categoryOption: {
    width: '31%',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2a2a4e',
  },
  categoryOptionSelected: {
    backgroundColor: '#1473FF10',
  },
  categoryOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryOptionText: {
    fontSize: 11,
    color: '#a0a0a0',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#a0a0a0',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a4e',
    paddingHorizontal: 14,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    marginRight: 8,
  },
  amountTextInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    paddingVertical: 12,
  },
  receiptButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  receiptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1473FF20',
    borderRadius: 10,
    paddingVertical: 16,
    gap: 8,
  },
  receiptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1473FF',
  },
  receiptPreview: {
    position: 'relative',
    marginBottom: 24,
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeReceiptButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  mileageRateInfo: {
    flexDirection: 'row',
    backgroundColor: '#1473FF20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  mileageRateContent: {
    flex: 1,
  },
  mileageRateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  mileageRateValue: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 2,
  },
  milesInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a4e',
    paddingHorizontal: 14,
  },
  milesTextInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    paddingVertical: 12,
  },
  milesLabel: {
    fontSize: 16,
    color: '#666',
  },
  mileageCalculation: {
    fontSize: 14,
    color: '#84CC16',
    marginTop: 8,
    fontWeight: '500',
  },
});
