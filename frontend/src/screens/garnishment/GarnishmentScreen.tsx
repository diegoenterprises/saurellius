/**
 * GARNISHMENT SCREEN
 * Wage garnishment management - child support, tax levies, etc.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import garnishmentService, { Garnishment, GarnishmentType } from '../../services/garnishment';

type TabType = 'active' | 'completed' | 'all';

export default function GarnishmentScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [garnishments, setGarnishments] = useState<Garnishment[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGarnishment, setSelectedGarnishment] = useState<Garnishment | null>(null);

  useEffect(() => {
    loadGarnishments();
  }, []);

  const loadGarnishments = async () => {
    setLoading(true);
    try {
      const data = await garnishmentService.getGarnishments();
      setGarnishments(data);
    } catch (error) {
      console.error('Error loading garnishments:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGarnishments();
    setRefreshing(false);
  };

  const getTypeLabel = (type: GarnishmentType): string => {
    const labels: Record<GarnishmentType, string> = {
      child_support: 'Child Support',
      alimony: 'Alimony',
      tax_levy_federal: 'Federal Tax Levy',
      tax_levy_state: 'State Tax Levy',
      student_loan: 'Student Loan',
      creditor: 'Creditor',
      bankruptcy: 'Bankruptcy',
      other: 'Other',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: GarnishmentType): string => {
    const colors: Record<GarnishmentType, string> = {
      child_support: '#8B5CF6',
      alimony: '#EC4899',
      tax_levy_federal: '#EF4444',
      tax_levy_state: '#F97316',
      student_loan: '#3B82F6',
      creditor: '#6B7280',
      bankruptcy: '#10B981',
      other: '#6B7280',
    };
    return colors[type] || '#6B7280';
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      active: '#10B981',
      completed: '#3B82F6',
      suspended: '#F59E0B',
      terminated: '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const filteredGarnishments = garnishments.filter((g) => {
    if (activeTab === 'active') return g.status === 'active';
    if (activeTab === 'completed') return g.status === 'completed';
    return true;
  });

  const totalActive = garnishments.filter((g) => g.status === 'active').length;
  const totalOwed = garnishments.reduce((sum, g) => sum + g.remaining_balance, 0);
  const totalPaid = garnishments.reduce((sum, g) => sum + g.total_paid, 0);

  const priorityOrder = garnishmentService.getPriorityOrder();

  const tabs: { id: TabType; label: string }[] = [
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
    { id: 'all', label: 'All' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Garnishments</Text>
        <TouchableOpacity 
          style={styles.headerAction}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1473FF"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={['#1473FF', '#BE01FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.summaryGradient}
          >
            <View style={styles.summaryHeader}>
              <Ionicons name="wallet" size={28} color="#fff" />
              <Text style={styles.summaryTitle}>Garnishment Summary</Text>
            </View>
            
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{totalActive}</Text>
                <Text style={styles.summaryStatLabel}>Active</Text>
              </View>
              <View style={styles.summaryStatDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{formatCurrency(totalOwed)}</Text>
                <Text style={styles.summaryStatLabel}>Remaining</Text>
              </View>
              <View style={styles.summaryStatDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{formatCurrency(totalPaid)}</Text>
                <Text style={styles.summaryStatLabel}>Total Paid</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Priority Order Info */}
        <View style={styles.priorityCard}>
          <View style={styles.priorityHeader}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text style={styles.priorityTitle}>Deduction Priority Order</Text>
          </View>
          <View style={styles.priorityList}>
            {priorityOrder.map((item, index) => (
              <Text key={index} style={styles.priorityItem}>{item}</Text>
            ))}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Garnishment List */}
        <View style={styles.list}>
          {filteredGarnishments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#6B7280" />
              <Text style={styles.emptyTitle}>No Garnishments</Text>
              <Text style={styles.emptyDesc}>
                {activeTab === 'active' 
                  ? 'No active garnishments found' 
                  : 'No garnishments in this category'}
              </Text>
            </View>
          ) : (
            filteredGarnishments.map((garnishment) => (
              <TouchableOpacity 
                key={garnishment.id} 
                style={styles.garnishmentCard}
                onPress={() => setSelectedGarnishment(garnishment)}
              >
                <View style={styles.garnishmentHeader}>
                  <View style={styles.garnishmentType}>
                    <View style={[styles.typeBadge, { backgroundColor: `${getTypeColor(garnishment.type)}20` }]}>
                      <Text style={[styles.typeBadgeText, { color: getTypeColor(garnishment.type) }]}>
                        {getTypeLabel(garnishment.type)}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(garnishment.status)}20` }]}>
                      <Text style={[styles.statusBadgeText, { color: getStatusColor(garnishment.status) }]}>
                        {garnishment.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.priorityLabel}>Priority {garnishment.priority}</Text>
                </View>

                <Text style={styles.employeeName}>{garnishment.employee_name}</Text>
                <Text style={styles.caseNumber}>Case: {garnishment.case_number}</Text>
                <Text style={styles.agency}>{garnishment.issuing_agency}</Text>

                <View style={styles.garnishmentProgress}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressLabel}>Paid: {formatCurrency(garnishment.total_paid)}</Text>
                    <Text style={styles.progressLabel}>Total: {formatCurrency(garnishment.total_owed)}</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${(garnishment.total_paid / garnishment.total_owed) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.remainingBalance}>
                    Remaining: {formatCurrency(garnishment.remaining_balance)}
                  </Text>
                </View>

                <View style={styles.garnishmentFooter}>
                  <Text style={styles.deductionAmount}>
                    {garnishment.amount_type === 'fixed' 
                      ? formatCurrency(garnishment.amount) 
                      : `${garnishment.amount}%`} per pay period
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Garnishment FAB */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <LinearGradient
          colors={['#1473FF', '#BE01FF']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Detail Modal */}
      <Modal
        visible={!!selectedGarnishment}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedGarnishment(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Garnishment Details</Text>
              <TouchableOpacity onPress={() => setSelectedGarnishment(null)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {selectedGarnishment && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Employee</Text>
                  <Text style={styles.detailValue}>{selectedGarnishment.employee_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>{getTypeLabel(selectedGarnishment.type)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Case Number</Text>
                  <Text style={styles.detailValue}>{selectedGarnishment.case_number}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Issuing Agency</Text>
                  <Text style={styles.detailValue}>{selectedGarnishment.issuing_agency}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Deduction</Text>
                  <Text style={styles.detailValue}>
                    {selectedGarnishment.amount_type === 'fixed' 
                      ? formatCurrency(selectedGarnishment.amount) 
                      : `${selectedGarnishment.amount}%`}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Owed</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedGarnishment.total_owed)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Paid</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedGarnishment.total_paid)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Remaining</Text>
                  <Text style={[styles.detailValue, { color: '#EF4444' }]}>
                    {formatCurrency(selectedGarnishment.remaining_balance)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Start Date</Text>
                  <Text style={styles.detailValue}>{selectedGarnishment.start_date}</Text>
                </View>
                {selectedGarnishment.end_date && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>End Date</Text>
                    <Text style={styles.detailValue}>{selectedGarnishment.end_date}</Text>
                  </View>
                )}
                {selectedGarnishment.notes && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Notes</Text>
                    <Text style={styles.detailValue}>{selectedGarnishment.notes}</Text>
                  </View>
                )}

                <View style={styles.modalActions}>
                  {selectedGarnishment.status === 'active' && (
                    <>
                      <TouchableOpacity 
                        style={[styles.modalButton, { backgroundColor: '#F59E0B' }]}
                        onPress={() => {
                          Alert.alert('Suspend', 'Suspend this garnishment?');
                        }}
                      >
                        <Ionicons name="pause" size={18} color="#fff" />
                        <Text style={styles.modalButtonText}>Suspend</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.modalButton, { backgroundColor: '#EF4444' }]}
                        onPress={() => {
                          Alert.alert('Terminate', 'Terminate this garnishment?');
                        }}
                      >
                        <Ionicons name="close-circle" size={18} color="#fff" />
                        <Text style={styles.modalButtonText}>Terminate</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {selectedGarnishment.status === 'suspended' && (
                    <TouchableOpacity 
                      style={[styles.modalButton, { backgroundColor: '#10B981' }]}
                      onPress={() => {
                        Alert.alert('Resume', 'Resume this garnishment?');
                      }}
                    >
                      <Ionicons name="play" size={18} color="#fff" />
                      <Text style={styles.modalButtonText}>Resume</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  summaryGradient: {
    padding: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  summaryStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  priorityCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  priorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  priorityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  priorityList: {
    gap: 4,
  },
  priorityItem: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#1473FF',
  },
  tabLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.text,
    fontWeight: '600',
  },
  list: {
    gap: 12,
    paddingBottom: 100,
  },
  garnishmentCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  garnishmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  garnishmentType: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  priorityLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  caseNumber: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  agency: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  garnishmentProgress: {
    marginBottom: 12,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  remainingBalance: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
    fontWeight: '500',
  },
  garnishmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  deductionAmount: {
    fontSize: 14,
    color: '#1473FF',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 28,
    overflow: 'hidden',
  },
  fabGradient: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
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
    fontWeight: '700',
    color: colors.text,
  },
  modalBody: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  detailLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingBottom: 20,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
