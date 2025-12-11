/**
 * SAURELLIUS DIGITAL WALLET SCREEN
 * Employer and Employee wallet management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import walletService, {
  WalletBalance,
  Transaction,
  formatCurrency,
  getTransactionIcon,
  getTransactionColor,
} from '../../services/wallet';

const COLORS = {
  primary: '#1473FF',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1E293B',
  textLight: '#64748B',
  border: '#E2E8F0',
};

type WalletType = 'employer' | 'employee';

export default function WalletScreen() {
  const [walletType, setWalletType] = useState<WalletType>('employee');
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modals
  const [showFundModal, setShowFundModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showEWAModal, setShowEWAModal] = useState(false);
  
  // Form state
  const [amount, setAmount] = useState('');
  const [transferSpeed, setTransferSpeed] = useState<'instant' | 'standard'>('standard');
  const [processing, setProcessing] = useState(false);

  const loadWallet = useCallback(async () => {
    try {
      const walletData = walletType === 'employer'
        ? await walletService.getEmployerWallet()
        : await walletService.getEmployeeWallet();
      setWallet(walletData);
      
      const txnData = await walletService.getTransactions(walletType);
      setTransactions(txnData.transactions);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [walletType]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const onRefresh = () => {
    setRefreshing(true);
    loadWallet();
  };

  const handleFundWallet = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    setProcessing(true);
    try {
      const result = await walletService.fundEmployerWallet(parseFloat(amount), 'bank');
      Alert.alert('Success', `Wallet funded with ${formatCurrency(result.net)}`);
      setShowFundModal(false);
      setAmount('');
      loadWallet();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to fund wallet');
    } finally {
      setProcessing(false);
    }
  };

  const handleTransfer = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    setProcessing(true);
    try {
      const result = await walletService.transferToBank(parseFloat(amount), transferSpeed);
      Alert.alert(
        'Transfer Initiated',
        `${formatCurrency(result.net)} will arrive ${result.eta}`
      );
      setShowTransferModal(false);
      setAmount('');
      loadWallet();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Transfer failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleEWA = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    setProcessing(true);
    try {
      const result = await walletService.requestEWA(parseFloat(amount));
      Alert.alert(
        'EWA Approved',
        `${formatCurrency(result.received)} added to your wallet.\nFee: ${formatCurrency(result.fee)}\nRemaining EWA: ${formatCurrency(result.ewa_remaining)}`
      );
      setShowEWAModal(false);
      setAmount('');
      loadWallet();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'EWA request failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Wallet Type Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, walletType === 'employee' && styles.tabActive]}
            onPress={() => setWalletType('employee')}
          >
            <View style={styles.tabContent}>
              <Ionicons name="cash-outline" size={18} color={walletType === 'employee' ? '#FFF' : COLORS.text} />
              <Text style={[styles.tabText, walletType === 'employee' && styles.tabTextActive]}>Employee Wallet</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, walletType === 'employer' && styles.tabActive]}
            onPress={() => setWalletType('employer')}
          >
            <View style={styles.tabContent}>
              <Ionicons name="business-outline" size={18} color={walletType === 'employer' ? '#FFF' : COLORS.text} />
              <Text style={[styles.tabText, walletType === 'employer' && styles.tabTextActive]}>Employer Wallet</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(wallet?.available || 0)}
          </Text>
          
          <View style={styles.balanceDetails}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Total Balance</Text>
              <Text style={styles.balanceItemValue}>{formatCurrency(wallet?.balance || 0)}</Text>
            </View>
            
            {walletType === 'employer' ? (
              <View style={styles.balanceItem}>
                <Text style={styles.balanceItemLabel}>Payroll Reserve</Text>
                <Text style={styles.balanceItemValue}>{formatCurrency(wallet?.payroll_reserve || 0)}</Text>
              </View>
            ) : (
              <View style={styles.balanceItem}>
                <Text style={styles.balanceItemLabel}>EWA Available</Text>
                <Text style={[styles.balanceItemValue, { color: COLORS.success }]}>
                  {formatCurrency(wallet?.ewa_available || 0)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          {walletType === 'employer' ? (
            <>
              <TouchableOpacity style={styles.actionButton} onPress={() => setShowFundModal(true)}>
                <Ionicons name="card-outline" size={24} color={COLORS.primary} />
                <Text style={styles.actionText}>Fund Wallet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="send-outline" size={24} color={COLORS.primary} />
                <Text style={styles.actionText}>Pay Employees</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="lock-closed-outline" size={24} color={COLORS.primary} />
                <Text style={styles.actionText}>Set Reserve</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.actionButton} onPress={() => setShowTransferModal(true)}>
                <Ionicons name="arrow-up-circle-outline" size={24} color={COLORS.primary} />
                <Text style={styles.actionText}>Transfer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#DCFCE7' }]}
                onPress={() => setShowEWAModal(true)}
              >
                <Ionicons name="flash-outline" size={24} color={COLORS.success} />
                <Text style={[styles.actionText, { color: COLORS.success }]}>Get Paid Early</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="list-outline" size={24} color={COLORS.primary} />
                <Text style={styles.actionText}>History</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* EWA Info for Employee */}
        {walletType === 'employee' && (
          <View style={styles.ewaCard}>
            <View style={styles.ewaHeader}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                <Ionicons name="flash" size={18} color="#166534" />
                <Text style={styles.ewaTitle}>Earned Wage Access</Text>
              </View>
              <Text style={styles.ewaSubtitle}>Get paid before payday</Text>
            </View>
            <View style={styles.ewaProgress}>
              <View style={styles.ewaProgressBar}>
                <View
                  style={[
                    styles.ewaProgressFill,
                    {
                      width: `${((wallet?.ewa_limit || 0) - (wallet?.ewa_available || 0)) / (wallet?.ewa_limit || 1) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.ewaText}>
                {formatCurrency(wallet?.ewa_available || 0)} of {formatCurrency(wallet?.ewa_limit || 0)} available
              </Text>
            </View>
          </View>
        )}

        {/* Transactions */}
        <View style={styles.transactionsContainer}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            transactions.map((txn) => (
              <View key={txn.id} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <Ionicons name={getTransactionIcon(txn.type) as any} size={24} color={getTransactionColor(txn.amount)} />
                  <View>
                    <Text style={styles.transactionDesc}>{txn.description}</Text>
                    <Text style={styles.transactionDate}>
                      {new Date(txn.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.transactionAmount, { color: getTransactionColor(txn.amount) }]}>
                  {txn.amount >= 0 ? '+' : ''}{formatCurrency(txn.amount)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Fund Wallet Modal */}
      <Modal visible={showFundModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8}}>
              <Ionicons name="card-outline" size={24} color={COLORS.primary} />
              <Text style={styles.modalTitle}>Fund Wallet</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Amount"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowFundModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleFundWallet} disabled={processing}>
                {processing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Fund Wallet</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Transfer Modal */}
      <Modal visible={showTransferModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8}}>
              <Ionicons name="arrow-up-circle-outline" size={24} color={COLORS.primary} />
              <Text style={styles.modalTitle}>Transfer to Bank</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Amount"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
            <View style={styles.speedSelector}>
              <TouchableOpacity
                style={[styles.speedOption, transferSpeed === 'standard' && styles.speedOptionActive]}
                onPress={() => setTransferSpeed('standard')}
              >
                <Text style={styles.speedTitle}>Standard</Text>
                <Text style={styles.speedSubtitle}>1-3 days • Free</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.speedOption, transferSpeed === 'instant' && styles.speedOptionActive]}
                onPress={() => setTransferSpeed('instant')}
              >
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                  <Text style={styles.speedTitle}>Instant</Text>
                  <Ionicons name="flash" size={14} color={COLORS.warning} />
                </View>
                <Text style={styles.speedSubtitle}>Minutes • $1.50</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowTransferModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleTransfer} disabled={processing}>
                {processing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmButtonText}>Transfer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* EWA Modal */}
      <Modal visible={showEWAModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8}}>
              <Ionicons name="flash" size={24} color={COLORS.success} />
              <Text style={styles.modalTitle}>Get Paid Early</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              Available: {formatCurrency(wallet?.ewa_available || 0)}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Amount"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
            <Text style={styles.feeNote}>1% service fee applies</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowEWAModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmButton, { backgroundColor: COLORS.success }]} onPress={handleEWA} disabled={processing}>
                {processing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmButtonText}>Get Cash</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  tabContainer: { flexDirection: 'row', padding: 16, gap: 8 },
  tab: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: COLORS.card, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.primary },
  tabContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tabText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  tabTextActive: { color: '#FFF' },
  
  balanceCard: { backgroundColor: COLORS.primary, margin: 16, borderRadius: 20, padding: 24 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  balanceAmount: { color: '#FFF', fontSize: 42, fontWeight: '700', marginVertical: 8 },
  balanceDetails: { flexDirection: 'row', marginTop: 16 },
  balanceItem: { flex: 1 },
  balanceItemLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  balanceItemValue: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  
  actionsContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  actionButton: { flex: 1, backgroundColor: COLORS.card, padding: 16, borderRadius: 16, alignItems: 'center' },
  actionIcon: { fontSize: 24, marginBottom: 4 },
  actionText: { fontSize: 12, color: COLORS.text, fontWeight: '500' },
  
  ewaCard: { margin: 16, backgroundColor: '#DCFCE7', borderRadius: 16, padding: 16 },
  ewaHeader: { marginBottom: 12 },
  ewaTitle: { fontSize: 16, fontWeight: '700', color: '#166534' },
  ewaSubtitle: { fontSize: 12, color: '#15803D' },
  ewaProgress: {},
  ewaProgressBar: { height: 8, backgroundColor: '#BBF7D0', borderRadius: 4, overflow: 'hidden' },
  ewaProgressFill: { height: '100%', backgroundColor: COLORS.success, borderRadius: 4 },
  ewaText: { fontSize: 12, color: '#166534', marginTop: 8 },
  
  transactionsContainer: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  emptyState: { padding: 32, alignItems: 'center' },
  emptyText: { color: COLORS.textLight },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.card, padding: 16, borderRadius: 12, marginBottom: 8 },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  transactionIcon: { fontSize: 24 },
  transactionDesc: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  transactionDate: { fontSize: 12, color: COLORS.textLight },
  transactionAmount: { fontSize: 16, fontWeight: '700' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: COLORS.textLight, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 16, fontSize: 18, marginBottom: 16 },
  speedSelector: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  speedOption: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border },
  speedOptionActive: { borderColor: COLORS.primary, backgroundColor: '#EFF6FF' },
  speedTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  speedSubtitle: { fontSize: 12, color: COLORS.textLight },
  feeNote: { fontSize: 12, color: COLORS.textLight, marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: COLORS.background, alignItems: 'center' },
  cancelButtonText: { color: COLORS.text, fontWeight: '600' },
  confirmButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center' },
  confirmButtonText: { color: '#FFF', fontWeight: '600' },
});
