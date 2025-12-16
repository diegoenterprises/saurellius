/**
 * CONTRACTOR INVOICE SCREEN
 * Create, manage, and send invoices to clients
 * Tracks payment status and history
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  amount: number;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue';
  due_date: string;
  created_at: string;
  paid_at?: string;
  items: InvoiceItem[];
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
}

export default function ContractorInvoiceScreen() {
  const navigation = useNavigation<any>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  
  // New Invoice Form
  const [newInvoice, setNewInvoice] = useState({
    client_id: '',
    client_name: '',
    client_email: '',
    due_date: '',
    notes: '',
    items: [{ description: '', quantity: 1, rate: 0 }] as InvoiceItem[],
  });

  const fetchInvoices = useCallback(async () => {
    try {
      const response = await api.get('/api/contractor/invoices');
      setInvoices(response.data.invoices || []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const response = await api.get('/api/contractor/clients');
      setClients(response.data.clients || []);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchClients();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvoices();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#6B7280';
      case 'sent': return '#3B82F6';
      case 'viewed': return '#8B5CF6';
      case 'paid': return '#10B981';
      case 'overdue': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return 'document-outline';
      case 'sent': return 'send-outline';
      case 'viewed': return 'eye-outline';
      case 'paid': return 'checkmark-circle-outline';
      case 'overdue': return 'alert-circle-outline';
      default: return 'document-outline';
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    activeTab === 'all' || inv.status === activeTab
  );

  const totalOutstanding = invoices
    .filter(inv => ['sent', 'viewed', 'overdue'].includes(inv.status))
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalPaid = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const addInvoiceItem = () => {
    setNewInvoice(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0 } as InvoiceItem],
    }));
  };

  const updateInvoiceItem = (index: number, field: string, value: any) => {
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeInvoiceItem = (index: number) => {
    if (newInvoice.items.length > 1) {
      setNewInvoice(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const calculateTotal = () => {
    return newInvoice.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const handleCreateInvoice = async (asDraft: boolean = false) => {
    if (!newInvoice.client_name || !newInvoice.client_email) {
      Alert.alert('Error', 'Please enter client information');
      return;
    }
    if (newInvoice.items.every(item => !item.description || item.rate === 0)) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    try {
      const response = await api.post('/api/contractor/invoices', {
        ...newInvoice,
        status: asDraft ? 'draft' : 'sent',
        amount: calculateTotal(),
      });

      if (response.data.success) {
        Alert.alert('Success', asDraft ? 'Invoice saved as draft' : 'Invoice sent successfully');
        setShowCreateModal(false);
        resetNewInvoice();
        fetchInvoices();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create invoice');
    }
  };

  const resetNewInvoice = () => {
    setNewInvoice({
      client_id: '',
      client_name: '',
      client_email: '',
      due_date: '',
      notes: '',
      items: [{ description: '', quantity: 1, rate: 0 } as InvoiceItem],
    });
  };

  const handleSendReminder = async (invoiceId: string) => {
    try {
      await api.post(`/api/contractor/invoices/${invoiceId}/remind`);
      Alert.alert('Success', 'Payment reminder sent');
    } catch (error) {
      Alert.alert('Error', 'Failed to send reminder');
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    Alert.alert(
      'Mark as Paid',
      'Are you sure you want to mark this invoice as paid?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: async () => {
            try {
              await api.post(`/api/contractor/invoices/${invoiceId}/mark-paid`);
              fetchInvoices();
            } catch (error) {
              Alert.alert('Error', 'Failed to update invoice');
            }
          },
        },
      ]
    );
  };

  const renderInvoiceItem = ({ item }: { item: Invoice }) => (
    <TouchableOpacity style={styles.invoiceCard}>
      <View style={styles.invoiceHeader}>
        <View>
          <Text style={styles.invoiceNumber}>#{item.invoice_number}</Text>
          <Text style={styles.clientName}>{item.client_name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Ionicons name={getStatusIcon(item.status) as any} size={14} color={getStatusColor(item.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.invoiceDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount</Text>
          <Text style={styles.detailValue}>${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Due Date</Text>
          <Text style={[styles.detailValue, item.status === 'overdue' && styles.overdueText]}>
            {new Date(item.due_date).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.invoiceActions}>
        {item.status === 'draft' && (
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="send" size={16} color="#1473FF" />
            <Text style={styles.actionButtonText}>Send</Text>
          </TouchableOpacity>
        )}
        {['sent', 'viewed', 'overdue'].includes(item.status) && (
          <>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleSendReminder(item.id)}
            >
              <Ionicons name="notifications" size={16} color="#F59E0B" />
              <Text style={[styles.actionButtonText, { color: '#F59E0B' }]}>Remind</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleMarkAsPaid(item.id)}
            >
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={[styles.actionButtonText, { color: '#10B981' }]}>Mark Paid</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="download" size={16} color="#666" />
          <Text style={styles.actionButtonText}>PDF</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCreateModal(false)}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>New Invoice</Text>
          <TouchableOpacity onPress={() => handleCreateInvoice(true)}>
            <Text style={styles.saveDraftText}>Save Draft</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.sectionLabel}>Client Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Client Name *</Text>
            <TextInput
              style={styles.input}
              value={newInvoice.client_name}
              onChangeText={(text) => setNewInvoice(prev => ({ ...prev, client_name: text }))}
              placeholder="Enter client name"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Client Email *</Text>
            <TextInput
              style={styles.input}
              value={newInvoice.client_email}
              onChangeText={(text) => setNewInvoice(prev => ({ ...prev, client_email: text }))}
              placeholder="client@email.com"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Due Date</Text>
            <TextInput
              style={styles.input}
              value={newInvoice.due_date}
              onChangeText={(text) => setNewInvoice(prev => ({ ...prev, due_date: text }))}
              placeholder="MM/DD/YYYY"
              placeholderTextColor="#666"
            />
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Line Items</Text>

          {newInvoice.items.map((item, index) => (
            <View key={index} style={styles.lineItem}>
              <View style={styles.lineItemHeader}>
                <Text style={styles.lineItemTitle}>Item {index + 1}</Text>
                {newInvoice.items.length > 1 && (
                  <TouchableOpacity onPress={() => removeInvoiceItem(index)}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
              
              <TextInput
                style={styles.input}
                value={item.description}
                onChangeText={(text) => updateInvoiceItem(index, 'description', text)}
                placeholder="Description of service"
                placeholderTextColor="#666"
              />

              <View style={styles.lineItemRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    value={item.quantity.toString()}
                    onChangeText={(text) => updateInvoiceItem(index, 'quantity', parseInt(text) || 0)}
                    placeholder="1"
                    placeholderTextColor="#666"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Rate ($)</Text>
                  <TextInput
                    style={styles.input}
                    value={item.rate.toString()}
                    onChangeText={(text) => updateInvoiceItem(index, 'rate', parseFloat(text) || 0)}
                    placeholder="0.00"
                    placeholderTextColor="#666"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.lineItemTotal}>
                <Text style={styles.lineItemTotalLabel}>Subtotal</Text>
                <Text style={styles.lineItemTotalValue}>
                  ${(item.quantity * item.rate).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addItemButton} onPress={addInvoiceItem}>
            <Ionicons name="add-circle" size={20} color="#1473FF" />
            <Text style={styles.addItemText}>Add Line Item</Text>
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newInvoice.notes}
              onChangeText={(text) => setNewInvoice(prev => ({ ...prev, notes: text }))}
              placeholder="Additional notes or terms..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>
              ${calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.sendButton}
            onPress={() => handleCreateInvoice(false)}
          >
            <LinearGradient
              colors={['#1473FF', '#BE01FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sendButtonGradient}
            >
              <Ionicons name="send" size={20} color="#FFF" />
              <Text style={styles.sendButtonText}>Send Invoice</Text>
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
          <Text style={styles.headerTitle}>Invoices</Text>
          <TouchableOpacity onPress={() => setShowCreateModal(true)}>
            <Ionicons name="add-circle" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Outstanding</Text>
            <Text style={styles.summaryValue}>${totalOutstanding.toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardAccent]}>
            <Text style={styles.summaryLabel}>Paid (YTD)</Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>${totalPaid.toLocaleString()}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabs}>
        {(['all', 'draft', 'sent', 'paid', 'overdue'] as const).map((tab) => (
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

      <FlatList
        data={filteredInvoices}
        renderItem={renderInvoiceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#666" />
            <Text style={styles.emptyStateText}>No invoices yet</Text>
            <Text style={styles.emptyStateSubtext}>Create your first invoice to get started</Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.createButtonText}>Create Invoice</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {renderCreateModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.text,
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
  summaryCardAccent: {
    backgroundColor: '#10B98120',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#1473FF',
  },
  tabText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.text,
  },
  listContent: {
    padding: 16,
  },
  invoiceCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceNumber: {
    fontSize: 14,
    color: '#1473FF',
    fontWeight: '600',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  invoiceDetails: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    paddingTop: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  overdueText: {
    color: '#EF4444',
  },
  invoiceActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    paddingTop: 12,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 13,
    color: '#1473FF',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#1473FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.text,
  },
  saveDraftText: {
    fontSize: 14,
    color: '#1473FF',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
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
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  lineItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lineItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a0a0a0',
  },
  lineItemRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  lineItemTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  lineItemTotalLabel: {
    fontSize: 13,
    color: '#666',
  },
  lineItemTotalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1473FF',
    borderStyle: 'dashed',
    marginBottom: 24,
    gap: 8,
  },
  addItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1473FF',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1473FF20',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1473FF',
  },
  sendButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
