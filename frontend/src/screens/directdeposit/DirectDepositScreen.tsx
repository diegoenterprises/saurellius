import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface BankAccount {
  id: string;
  bank_name: string;
  account_type: 'checking' | 'savings';
  routing_number_last4: string;
  account_number_last4: string;
  is_primary: boolean;
  status: 'pending' | 'verified' | 'failed';
  split_type?: 'percentage' | 'fixed' | 'remainder';
  split_amount?: number;
}

const DirectDepositScreen: React.FC = () => {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  
  // Form state
  const [bankName, setBankName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<'checking' | 'savings'>('checking');
  const [splitType, setSplitType] = useState<'percentage' | 'fixed' | 'remainder'>('remainder');
  const [splitAmount, setSplitAmount] = useState('');
  
  // Verification state
  const [amount1, setAmount1] = useState('');
  const [amount2, setAmount2] = useState('');

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    // Simulated data - replace with API call
    setTimeout(() => {
      setAccounts([
        {
          id: '1',
          bank_name: 'Chase Bank',
          account_type: 'checking',
          routing_number_last4: '0248',
          account_number_last4: '4567',
          is_primary: true,
          status: 'verified',
          split_type: 'remainder',
        },
        {
          id: '2',
          bank_name: 'Bank of America',
          account_type: 'savings',
          routing_number_last4: '1234',
          account_number_last4: '8901',
          is_primary: false,
          status: 'verified',
          split_type: 'fixed',
          split_amount: 500,
        },
      ]);
      setLoading(false);
    }, 500);
  };

  const handleAddAccount = async () => {
    if (!routingNumber || !accountNumber || !confirmAccountNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    if (accountNumber !== confirmAccountNumber) {
      Alert.alert('Error', 'Account numbers do not match');
      return;
    }
    
    if (routingNumber.length !== 9) {
      Alert.alert('Error', 'Routing number must be 9 digits');
      return;
    }
    
    // Add account via API
    const newAccount: BankAccount = {
      id: Date.now().toString(),
      bank_name: bankName || 'New Bank',
      account_type: accountType,
      routing_number_last4: routingNumber.slice(-4),
      account_number_last4: accountNumber.slice(-4),
      is_primary: accounts.length === 0,
      status: 'pending',
      split_type: splitType,
      split_amount: splitType !== 'remainder' ? parseFloat(splitAmount) : undefined,
    };
    
    setAccounts([...accounts, newAccount]);
    resetForm();
    setShowAddModal(false);
    Alert.alert('Success', 'Bank account added. Verification required.');
  };

  const resetForm = () => {
    setBankName('');
    setRoutingNumber('');
    setAccountNumber('');
    setConfirmAccountNumber('');
    setAccountType('checking');
    setSplitType('remainder');
    setSplitAmount('');
  };

  const handleVerify = async () => {
    if (!amount1 || !amount2) {
      Alert.alert('Error', 'Please enter both deposit amounts');
      return;
    }
    
    // Verify via API
    if (selectedAccount) {
      setAccounts(accounts.map(a => 
        a.id === selectedAccount.id ? { ...a, status: 'verified' } : a
      ));
    }
    
    setShowVerifyModal(false);
    setAmount1('');
    setAmount2('');
    Alert.alert('Success', 'Bank account verified!');
  };

  const handleDelete = (accountId: string) => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to remove this bank account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setAccounts(accounts.filter(a => a.id !== accountId)),
        },
      ]
    );
  };

  const handleSetPrimary = (accountId: string) => {
    setAccounts(accounts.map(a => ({
      ...a,
      is_primary: a.id === accountId,
      split_type: a.id === accountId ? 'remainder' : a.split_type,
    })));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const styles = createStyles(isDarkMode);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Direct Deposit</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Account</Text>
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color="#6366F1" />
        <Text style={styles.infoText}>
          Split your paycheck across multiple accounts. The primary account receives the remainder after all fixed amounts and percentages are distributed.
        </Text>
      </View>

      {/* Accounts List */}
      <ScrollView style={styles.accountsList}>
        {accounts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={64} color="#6B7280" />
            <Text style={styles.emptyTitle}>No Bank Accounts</Text>
            <Text style={styles.emptyText}>Add a bank account to receive your pay via direct deposit.</Text>
          </View>
        ) : (
          accounts.map((account) => (
            <View key={account.id} style={styles.accountCard}>
              <View style={styles.accountHeader}>
                <View style={styles.bankInfo}>
                  <Ionicons 
                    name={account.account_type === 'checking' ? 'card' : 'wallet'} 
                    size={24} 
                    color="#6366F1" 
                  />
                  <View style={styles.bankDetails}>
                    <Text style={styles.bankName}>{account.bank_name}</Text>
                    <Text style={styles.accountInfo}>
                      {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} ••••{account.account_number_last4}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(account.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(account.status) }]}>
                    {account.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Split Info */}
              <View style={styles.splitInfo}>
                <Text style={styles.splitLabel}>Deposit Amount:</Text>
                <Text style={styles.splitValue}>
                  {account.split_type === 'remainder' 
                    ? 'Remainder' 
                    : account.split_type === 'percentage' 
                      ? `${account.split_amount}%`
                      : `$${account.split_amount?.toFixed(2)}`
                  }
                </Text>
              </View>

              {/* Primary Badge */}
              {account.is_primary && (
                <View style={styles.primaryBadge}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.primaryText}>Primary Account</Text>
                </View>
              )}

              {/* Actions */}
              <View style={styles.accountActions}>
                {account.status === 'pending' && (
                  <TouchableOpacity 
                    style={styles.verifyButton}
                    onPress={() => {
                      setSelectedAccount(account);
                      setShowVerifyModal(true);
                    }}
                  >
                    <Text style={styles.verifyButtonText}>Verify</Text>
                  </TouchableOpacity>
                )}
                {!account.is_primary && account.status === 'verified' && (
                  <TouchableOpacity 
                    style={styles.setPrimaryButton}
                    onPress={() => handleSetPrimary(account.id)}
                  >
                    <Text style={styles.setPrimaryText}>Set as Primary</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDelete(account.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Account Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Bank Account</Text>
              <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#1F2937'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Bank Name (Optional)</Text>
              <TextInput
                style={styles.input}
                value={bankName}
                onChangeText={setBankName}
                placeholder="e.g., Chase, Bank of America"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Routing Number *</Text>
              <TextInput
                style={styles.input}
                value={routingNumber}
                onChangeText={setRoutingNumber}
                placeholder="9-digit routing number"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={9}
              />

              <Text style={styles.inputLabel}>Account Number *</Text>
              <TextInput
                style={styles.input}
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="Account number"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                secureTextEntry
              />

              <Text style={styles.inputLabel}>Confirm Account Number *</Text>
              <TextInput
                style={styles.input}
                value={confirmAccountNumber}
                onChangeText={setConfirmAccountNumber}
                placeholder="Re-enter account number"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Account Type *</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleButton, accountType === 'checking' && styles.toggleActive]}
                  onPress={() => setAccountType('checking')}
                >
                  <Text style={[styles.toggleText, accountType === 'checking' && styles.toggleTextActive]}>
                    Checking
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, accountType === 'savings' && styles.toggleActive]}
                  onPress={() => setAccountType('savings')}
                >
                  <Text style={[styles.toggleText, accountType === 'savings' && styles.toggleTextActive]}>
                    Savings
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Deposit Amount</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleButton, splitType === 'remainder' && styles.toggleActive]}
                  onPress={() => setSplitType('remainder')}
                >
                  <Text style={[styles.toggleText, splitType === 'remainder' && styles.toggleTextActive]}>
                    Remainder
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, splitType === 'fixed' && styles.toggleActive]}
                  onPress={() => setSplitType('fixed')}
                >
                  <Text style={[styles.toggleText, splitType === 'fixed' && styles.toggleTextActive]}>
                    Fixed $
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, splitType === 'percentage' && styles.toggleActive]}
                  onPress={() => setSplitType('percentage')}
                >
                  <Text style={[styles.toggleText, splitType === 'percentage' && styles.toggleTextActive]}>
                    Percentage
                  </Text>
                </TouchableOpacity>
              </View>

              {splitType !== 'remainder' && (
                <TextInput
                  style={styles.input}
                  value={splitAmount}
                  onChangeText={setSplitAmount}
                  placeholder={splitType === 'fixed' ? 'Amount in dollars' : 'Percentage (e.g., 20)'}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => { setShowAddModal(false); resetForm(); }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleAddAccount}>
                <Text style={styles.submitButtonText}>Add Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Verify Modal */}
      <Modal visible={showVerifyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verify Bank Account</Text>
              <TouchableOpacity onPress={() => setShowVerifyModal(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#1F2937'} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.verifyInfo}>
                We sent two small deposits to your account. Enter the amounts below to verify your account.
              </Text>

              <Text style={styles.inputLabel}>First Deposit Amount ($)</Text>
              <TextInput
                style={styles.input}
                value={amount1}
                onChangeText={setAmount1}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
              />

              <Text style={styles.inputLabel}>Second Deposit Amount ($)</Text>
              <TextInput
                style={styles.input}
                value={amount2}
                onChangeText={setAmount2}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowVerifyModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleVerify}>
                <Text style={styles.submitButtonText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#111827' : '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#111827' : '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99,102,241,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDarkMode ? '#FFFFFF' : '#1F2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: isDarkMode ? '#1E3A5F' : '#EEF2FF',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: isDarkMode ? '#93C5FD' : '#4338CA',
    fontSize: 14,
    lineHeight: 20,
  },
  accountsList: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: isDarkMode ? '#FFFFFF' : '#1F2937',
    marginTop: 16,
  },
  emptyText: {
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  accountCard: {
    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#374151' : '#E5E7EB',
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bankDetails: {
    gap: 4,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    color: isDarkMode ? '#FFFFFF' : '#1F2937',
  },
  accountInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  splitInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? '#374151' : '#E5E7EB',
  },
  splitLabel: {
    color: '#6B7280',
  },
  splitValue: {
    fontWeight: '600',
    color: isDarkMode ? '#FFFFFF' : '#1F2937',
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  primaryText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  accountActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  verifyButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  verifyButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
  setPrimaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  setPrimaryText: {
    color: '#6366F1',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: isDarkMode ? '#FFFFFF' : '#1F2937',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: isDarkMode ? '#D1D5DB' : '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: isDarkMode ? '#FFFFFF' : '#1F2937',
    borderWidth: 1,
    borderColor: isDarkMode ? '#4B5563' : '#D1D5DB',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#4B5563' : '#D1D5DB',
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  toggleText: {
    color: isDarkMode ? '#D1D5DB' : '#6B7280',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: colors.text,
  },
  verifyInfo: {
    color: isDarkMode ? '#D1D5DB' : '#6B7280',
    marginBottom: 16,
    lineHeight: 22,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? '#374151' : '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#4B5563' : '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: isDarkMode ? '#D1D5DB' : '#6B7280',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
});

export default DirectDepositScreen;
