/**
 * EMPLOYEE DIRECT DEPOSIT SETUP SCREEN
 * Self-service direct deposit enrollment and management
 * Supports multiple accounts with split deposits
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
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface BankAccount {
  id: string;
  bank_name: string;
  account_type: 'checking' | 'savings';
  routing_number: string;
  account_number_last4: string;
  is_primary: boolean;
  deposit_type: 'full' | 'fixed' | 'percentage';
  deposit_amount?: number;
  deposit_percentage?: number;
  status: 'active' | 'pending' | 'failed';
  verified: boolean;
}

const BANK_LOGOS: { [key: string]: string } = {
  'chase': '🏦',
  'bank of america': '🏦',
  'wells fargo': '🏦',
  'citibank': '🏦',
  'default': '🏦',
};

export default function DirectDepositSetupScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [verifying, setVerifying] = useState(false);
  
  const [newAccount, setNewAccount] = useState({
    bank_name: '',
    account_type: 'checking' as 'checking' | 'savings',
    routing_number: '',
    account_number: '',
    account_number_confirm: '',
    deposit_type: 'full' as 'full' | 'fixed' | 'percentage',
    deposit_amount: '',
    deposit_percentage: '',
  });

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await api.get('/api/employee/direct-deposit');
      setAccounts(response.data.accounts || []);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAccounts();
  };

  const validateRoutingNumber = (routing: string): boolean => {
    if (routing.length !== 9) return false;
    const digits = routing.split('').map(Number);
    const checksum = (3 * (digits[0] + digits[3] + digits[6]) +
                     7 * (digits[1] + digits[4] + digits[7]) +
                     (digits[2] + digits[5] + digits[8])) % 10;
    return checksum === 0;
  };

  const handleAddAccount = async () => {
    if (!newAccount.bank_name.trim()) {
      Alert.alert('Error', 'Please enter your bank name');
      return;
    }
    if (!validateRoutingNumber(newAccount.routing_number)) {
      Alert.alert('Error', 'Please enter a valid 9-digit routing number');
      return;
    }
    if (newAccount.account_number.length < 4) {
      Alert.alert('Error', 'Please enter a valid account number');
      return;
    }
    if (newAccount.account_number !== newAccount.account_number_confirm) {
      Alert.alert('Error', 'Account numbers do not match');
      return;
    }
    if (newAccount.deposit_type === 'fixed' && !newAccount.deposit_amount) {
      Alert.alert('Error', 'Please enter a deposit amount');
      return;
    }
    if (newAccount.deposit_type === 'percentage' && !newAccount.deposit_percentage) {
      Alert.alert('Error', 'Please enter a deposit percentage');
      return;
    }

    try {
      const response = await api.post('/api/employee/direct-deposit', {
        bank_name: newAccount.bank_name,
        account_type: newAccount.account_type,
        routing_number: newAccount.routing_number,
        account_number: newAccount.account_number,
        deposit_type: newAccount.deposit_type,
        deposit_amount: newAccount.deposit_type === 'fixed' ? parseFloat(newAccount.deposit_amount) : undefined,
        deposit_percentage: newAccount.deposit_type === 'percentage' ? parseFloat(newAccount.deposit_percentage) : undefined,
        is_primary: accounts.length === 0,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Bank account added successfully. Micro-deposits will be sent for verification.');
        setShowAddModal(false);
        resetNewAccount();
        fetchAccounts();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add account');
    }
  };

  const handleVerifyAccount = async (accountId: string) => {
    Alert.prompt(
      'Verify Account',
      'Enter the two micro-deposit amounts (e.g., 0.32, 0.45)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify',
          onPress: async (amounts) => {
            if (!amounts) return;
            const [amount1, amount2] = amounts.split(',').map(a => parseFloat(a.trim()));
            
            setVerifying(true);
            try {
              const response = await api.post(`/api/employee/direct-deposit/${accountId}/verify`, {
                amount1,
                amount2,
              });

              if (response.data.success) {
                Alert.alert('Success', 'Account verified successfully!');
                fetchAccounts();
              }
            } catch (error: any) {
              Alert.alert('Verification Failed', error.response?.data?.message || 'Please try again');
            } finally {
              setVerifying(false);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleSetPrimary = async (accountId: string) => {
    try {
      await api.post(`/api/employee/direct-deposit/${accountId}/set-primary`);
      fetchAccounts();
    } catch (error) {
      Alert.alert('Error', 'Failed to update primary account');
    }
  };

  const handleDeleteAccount = (account: BankAccount) => {
    Alert.alert(
      'Remove Account',
      `Are you sure you want to remove the account ending in ${account.account_number_last4}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/employee/direct-deposit/${account.id}`);
              fetchAccounts();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove account');
            }
          },
        },
      ]
    );
  };

  const resetNewAccount = () => {
    setNewAccount({
      bank_name: '',
      account_type: 'checking',
      routing_number: '',
      account_number: '',
      account_number_confirm: '',
      deposit_type: 'full',
      deposit_amount: '',
      deposit_percentage: '',
    });
  };

  const getTotalPercentage = () => {
    return accounts.reduce((sum, acc) => {
      if (acc.deposit_type === 'percentage') return sum + (acc.deposit_percentage || 0);
      if (acc.deposit_type === 'full') return 100;
      return sum;
    }, 0);
  };

  const renderAccountCard = (account: BankAccount) => (
    <View key={account.id} style={[styles.accountCard, !account.verified && styles.accountCardUnverified]}>
      <View style={styles.accountHeader}>
        <View style={styles.bankInfo}>
          <View style={styles.bankLogo}>
            <Text style={styles.bankLogoText}>
              {BANK_LOGOS[account.bank_name.toLowerCase()] || BANK_LOGOS.default}
            </Text>
          </View>
          <View>
            <Text style={styles.bankName}>{account.bank_name}</Text>
            <Text style={styles.accountType}>
              {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} •••• {account.account_number_last4}
            </Text>
          </View>
        </View>
        {account.is_primary && (
          <View style={styles.primaryBadge}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.primaryBadgeText}>Primary</Text>
          </View>
        )}
      </View>

      {!account.verified && (
        <View style={styles.verificationBanner}>
          <Ionicons name="alert-circle" size={20} color="#F59E0B" />
          <View style={styles.verificationContent}>
            <Text style={styles.verificationTitle}>Verification Pending</Text>
            <Text style={styles.verificationText}>Check for two micro-deposits in 1-2 business days</Text>
          </View>
          <TouchableOpacity 
            style={styles.verifyButton}
            onPress={() => handleVerifyAccount(account.id)}
          >
            <Text style={styles.verifyButtonText}>Verify</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.depositInfo}>
        <Text style={styles.depositLabel}>Deposit Amount</Text>
        <Text style={styles.depositValue}>
          {account.deposit_type === 'full' && 'Remaining Balance'}
          {account.deposit_type === 'fixed' && `$${account.deposit_amount?.toFixed(2)} per paycheck`}
          {account.deposit_type === 'percentage' && `${account.deposit_percentage}% of net pay`}
        </Text>
      </View>

      <View style={styles.accountActions}>
        {!account.is_primary && account.verified && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleSetPrimary(account.id)}
          >
            <Ionicons name="star-outline" size={18} color="#1473FF" />
            <Text style={styles.actionButtonText}>Set Primary</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            setSelectedAccount(account);
            setShowEditModal(true);
          }}
        >
          <Ionicons name="create-outline" size={18} color="#1473FF" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDeleteAccount(account)}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
          <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAddModal = () => (
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
          <Text style={styles.modalTitle}>Add Bank Account</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.securityNotice}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            <Text style={styles.securityText}>
              Your banking information is encrypted and secure. We'll verify your account with two small deposits.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bank Name *</Text>
            <TextInput
              style={styles.input}
              value={newAccount.bank_name}
              onChangeText={(text) => setNewAccount(prev => ({ ...prev, bank_name: text }))}
              placeholder="e.g., Chase, Bank of America"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Account Type *</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleButton, newAccount.account_type === 'checking' && styles.toggleButtonActive]}
                onPress={() => setNewAccount(prev => ({ ...prev, account_type: 'checking' }))}
              >
                <Text style={[styles.toggleText, newAccount.account_type === 'checking' && styles.toggleTextActive]}>
                  Checking
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, newAccount.account_type === 'savings' && styles.toggleButtonActive]}
                onPress={() => setNewAccount(prev => ({ ...prev, account_type: 'savings' }))}
              >
                <Text style={[styles.toggleText, newAccount.account_type === 'savings' && styles.toggleTextActive]}>
                  Savings
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Routing Number *</Text>
            <TextInput
              style={styles.input}
              value={newAccount.routing_number}
              onChangeText={(text) => setNewAccount(prev => ({ ...prev, routing_number: text.replace(/\D/g, '') }))}
              placeholder="9-digit routing number"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              maxLength={9}
            />
            {newAccount.routing_number.length === 9 && (
              <View style={styles.validationIcon}>
                <Ionicons 
                  name={validateRoutingNumber(newAccount.routing_number) ? "checkmark-circle" : "close-circle"} 
                  size={20} 
                  color={validateRoutingNumber(newAccount.routing_number) ? "#10B981" : "#EF4444"} 
                />
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Account Number *</Text>
            <TextInput
              style={styles.input}
              value={newAccount.account_number}
              onChangeText={(text) => setNewAccount(prev => ({ ...prev, account_number: text.replace(/\D/g, '') }))}
              placeholder="Enter account number"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Account Number *</Text>
            <TextInput
              style={styles.input}
              value={newAccount.account_number_confirm}
              onChangeText={(text) => setNewAccount(prev => ({ ...prev, account_number_confirm: text.replace(/\D/g, '') }))}
              placeholder="Re-enter account number"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              secureTextEntry
            />
            {newAccount.account_number_confirm.length > 0 && (
              <View style={styles.validationIcon}>
                <Ionicons 
                  name={newAccount.account_number === newAccount.account_number_confirm ? "checkmark-circle" : "close-circle"} 
                  size={20} 
                  color={newAccount.account_number === newAccount.account_number_confirm ? "#10B981" : "#EF4444"} 
                />
              </View>
            )}
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Deposit Amount</Text>
          
          <View style={styles.depositOptions}>
            <TouchableOpacity
              style={[styles.depositOption, newAccount.deposit_type === 'full' && styles.depositOptionSelected]}
              onPress={() => setNewAccount(prev => ({ ...prev, deposit_type: 'full' }))}
            >
              <View style={styles.depositOptionRadio}>
                {newAccount.deposit_type === 'full' && <View style={styles.depositOptionRadioInner} />}
              </View>
              <View style={styles.depositOptionContent}>
                <Text style={styles.depositOptionTitle}>Remaining Balance</Text>
                <Text style={styles.depositOptionDesc}>Deposit entire paycheck (after other accounts)</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.depositOption, newAccount.deposit_type === 'fixed' && styles.depositOptionSelected]}
              onPress={() => setNewAccount(prev => ({ ...prev, deposit_type: 'fixed' }))}
            >
              <View style={styles.depositOptionRadio}>
                {newAccount.deposit_type === 'fixed' && <View style={styles.depositOptionRadioInner} />}
              </View>
              <View style={styles.depositOptionContent}>
                <Text style={styles.depositOptionTitle}>Fixed Amount</Text>
                <Text style={styles.depositOptionDesc}>Same amount each paycheck</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.depositOption, newAccount.deposit_type === 'percentage' && styles.depositOptionSelected]}
              onPress={() => setNewAccount(prev => ({ ...prev, deposit_type: 'percentage' }))}
            >
              <View style={styles.depositOptionRadio}>
                {newAccount.deposit_type === 'percentage' && <View style={styles.depositOptionRadioInner} />}
              </View>
              <View style={styles.depositOptionContent}>
                <Text style={styles.depositOptionTitle}>Percentage</Text>
                <Text style={styles.depositOptionDesc}>Percentage of net pay</Text>
              </View>
            </TouchableOpacity>
          </View>

          {newAccount.deposit_type === 'fixed' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount per Paycheck *</Text>
              <View style={styles.amountInput}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountTextInput}
                  value={newAccount.deposit_amount}
                  onChangeText={(text) => setNewAccount(prev => ({ ...prev, deposit_amount: text }))}
                  placeholder="0.00"
                  placeholderTextColor="#666"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          )}

          {newAccount.deposit_type === 'percentage' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Percentage of Net Pay *</Text>
              <View style={styles.percentInput}>
                <TextInput
                  style={styles.percentTextInput}
                  value={newAccount.deposit_percentage}
                  onChangeText={(text) => setNewAccount(prev => ({ ...prev, deposit_percentage: text }))}
                  placeholder="0"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                  maxLength={3}
                />
                <Text style={styles.percentSymbol}>%</Text>
              </View>
            </View>
          )}

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleAddAccount}
          >
            <LinearGradient
              colors={['#1473FF', '#BE01FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              <Text style={styles.saveButtonText}>Add Account</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

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
          <Text style={styles.headerTitle}>Direct Deposit</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <Ionicons name="add-circle" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerInfo}>
          <Ionicons name="card" size={24} color="#10B981" />
          <Text style={styles.headerInfoText}>
            {accounts.filter(a => a.verified).length} verified account{accounts.filter(a => a.verified).length !== 1 ? 's' : ''}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />
        }
      >
        {accounts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="wallet-outline" size={64} color="#666" />
            </View>
            <Text style={styles.emptyStateTitle}>No Direct Deposit Accounts</Text>
            <Text style={styles.emptyStateText}>
              Add a bank account to receive your paychecks via direct deposit
            </Text>
            <TouchableOpacity 
              style={styles.addFirstButton}
              onPress={() => setShowAddModal(true)}
            >
              <LinearGradient
                colors={['#1473FF', '#BE01FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addFirstButtonGradient}
              >
                <Ionicons name="add-circle" size={20} color="#FFF" />
                <Text style={styles.addFirstButtonText}>Add Bank Account</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {accounts.map(renderAccountCard)}

            {accounts.length > 0 && accounts.length < 3 && (
              <TouchableOpacity 
                style={styles.addAnotherButton}
                onPress={() => setShowAddModal(true)}
              >
                <Ionicons name="add-circle" size={20} color="#1473FF" />
                <Text style={styles.addAnotherText}>Add Another Account</Text>
              </TouchableOpacity>
            )}

            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color="#3B82F6" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Split Deposits</Text>
                <Text style={styles.infoText}>
                  You can split your paycheck between multiple accounts. Set fixed amounts or percentages for each account, and use one account for the remaining balance.
                </Text>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {renderAddModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerInfoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  accountCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  accountCardUnverified: {
    borderColor: '#F59E0B',
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  bankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#2a2a4e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bankLogoText: {
    fontSize: 24,
  },
  bankName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  accountType: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 2,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  primaryBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F59E0B',
  },
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B20',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  verificationContent: {
    flex: 1,
  },
  verificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  verificationText: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
  },
  verifyButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  verifyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  depositInfo: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  depositLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    marginBottom: 4,
  },
  depositValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  accountActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    paddingTop: 14,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#1473FF',
    fontWeight: '500',
  },
  addAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1473FF20',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
    gap: 8,
  },
  addAnotherText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1473FF',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#3B82F620',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  infoText: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 4,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  addFirstButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addFirstButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  addFirstButtonText: {
    fontSize: 16,
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
  modalContent: {
    flex: 1,
    padding: 20,
  },
  securityNotice: {
    flexDirection: 'row',
    backgroundColor: '#10B98120',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    alignItems: 'flex-start',
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    color: '#10B981',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
    position: 'relative',
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
  validationIcon: {
    position: 'absolute',
    right: 14,
    top: 40,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#1473FF',
  },
  toggleText: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  toggleTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  depositOptions: {
    gap: 10,
    marginBottom: 16,
  },
  depositOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#2a2a4e',
  },
  depositOptionSelected: {
    borderColor: '#1473FF',
    backgroundColor: '#1473FF10',
  },
  depositOptionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  depositOptionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1473FF',
  },
  depositOptionContent: {
    flex: 1,
  },
  depositOptionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  depositOptionDesc: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 2,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a4e',
    paddingHorizontal: 14,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
    marginRight: 8,
  },
  amountTextInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    paddingVertical: 12,
  },
  percentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a4e',
    paddingHorizontal: 14,
  },
  percentTextInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    paddingVertical: 12,
  },
  percentSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
    marginLeft: 8,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  saveButtonGradient: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
