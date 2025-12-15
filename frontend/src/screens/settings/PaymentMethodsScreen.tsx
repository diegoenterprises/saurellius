/**
 * SAURELLIUS PAYMENT METHODS
 * Manage billing payment methods
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  isDefault: boolean;
}

const PaymentMethodsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, gradients } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      const response = await api.get('/api/billing/payment-methods');
      setPaymentMethods(response.data?.data || []);
    } catch (error) {
      // Mock data for demo
      setPaymentMethods([
        { id: 'pm_1', type: 'card', last4: '4242', brand: 'Visa', exp_month: 12, exp_year: 2026, isDefault: true },
        { id: 'pm_2', type: 'card', last4: '5555', brand: 'Mastercard', exp_month: 6, exp_year: 2025, isDefault: false },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPaymentMethods();
  };

  const setDefaultMethod = async (id: string) => {
    try {
      await api.put(`/api/billing/payment-methods/${id}/default`);
      setPaymentMethods(prev => prev.map(pm => ({ ...pm, isDefault: pm.id === id })));
      Alert.alert('Success', 'Default payment method updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update default payment method');
    }
  };

  const removeMethod = (id: string) => {
    Alert.alert('Remove Payment Method', 'Are you sure you want to remove this payment method?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/billing/payment-methods/${id}`);
            setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
            Alert.alert('Success', 'Payment method removed');
          } catch (error) {
            Alert.alert('Error', 'Failed to remove payment method');
          }
        },
      },
    ]);
  };

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa': return 'card';
      case 'mastercard': return 'card';
      case 'amex': return 'card';
      default: return 'card-outline';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Methods</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {paymentMethods.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="card-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No payment methods added</Text>
            </View>
          ) : (
            paymentMethods.map((pm, index) => (
              <View
                key={pm.id}
                style={[
                  styles.paymentItem,
                  { borderBottomColor: colors.border },
                  index === paymentMethods.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={[styles.cardIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name={getCardIcon(pm.brand) as any} size={24} color={colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardBrand, { color: colors.text }]}>{pm.brand}</Text>
                    {pm.isDefault && (
                      <View style={[styles.defaultBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.defaultText, { color: colors.primary }]}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.cardNumber, { color: colors.textSecondary }]}>•••• {pm.last4}</Text>
                  <Text style={[styles.cardExpiry, { color: colors.textSecondary }]}>
                    Expires {pm.exp_month}/{pm.exp_year}
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  {!pm.isDefault && (
                    <TouchableOpacity style={styles.actionButton} onPress={() => setDefaultMethod(pm.id)}>
                      <Ionicons name="checkmark-circle-outline" size={22} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.actionButton} onPress={() => removeMethod(pm.id)}>
                    <Ionicons name="trash-outline" size={22} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => Alert.alert('Add Payment Method', 'This would open Stripe payment form')}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Payment Method</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingVertical: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  content: { flex: 1, padding: 16 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { marginTop: 12, fontSize: 16 },
  paymentItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  cardIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardInfo: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardBrand: { fontSize: 16, fontWeight: '600' },
  defaultBadge: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  defaultText: { fontSize: 11, fontWeight: '600' },
  cardNumber: { fontSize: 14, marginTop: 4 },
  cardExpiry: { fontSize: 12, marginTop: 2 },
  cardActions: { flexDirection: 'row' },
  actionButton: { padding: 8 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginTop: 16 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
});

export default PaymentMethodsScreen;
