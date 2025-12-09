/**
 * SAURELLIUS PAYSTUBS
 * View and manage paystub history
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface Paystub {
  id: string;
  pay_date: string;
  pay_period_start: string;
  pay_period_end: string;
  gross_pay: number;
  net_pay: number;
  status: 'paid' | 'pending' | 'processing';
  hours_worked: number;
  overtime_hours: number;
}

const SAMPLE_PAYSTUBS: Paystub[] = [
  { id: '1', pay_date: '2025-12-06', pay_period_start: '2025-11-16', pay_period_end: '2025-11-30', gross_pay: 3461.54, net_pay: 2615.38, status: 'paid', hours_worked: 80, overtime_hours: 4 },
  { id: '2', pay_date: '2025-11-22', pay_period_start: '2025-11-01', pay_period_end: '2025-11-15', gross_pay: 3269.23, net_pay: 2470.77, status: 'paid', hours_worked: 80, overtime_hours: 0 },
  { id: '3', pay_date: '2025-11-08', pay_period_start: '2025-10-16', pay_period_end: '2025-10-31', gross_pay: 3461.54, net_pay: 2615.38, status: 'paid', hours_worked: 80, overtime_hours: 4 },
  { id: '4', pay_date: '2025-10-25', pay_period_start: '2025-10-01', pay_period_end: '2025-10-15', gross_pay: 3269.23, net_pay: 2470.77, status: 'paid', hours_worked: 80, overtime_hours: 0 },
  { id: '5', pay_date: '2025-10-11', pay_period_start: '2025-09-16', pay_period_end: '2025-09-30', gross_pay: 3269.23, net_pay: 2470.77, status: 'paid', hours_worked: 80, overtime_hours: 0 },
];

const PaystubsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [paystubs, setPaystubs] = useState<Paystub[]>(SAMPLE_PAYSTUBS);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2025);

  const formatCurrency = (amount: number) => `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const ytdGross = paystubs.reduce((sum, p) => sum + p.gross_pay, 0);
  const ytdNet = paystubs.reduce((sum, p) => sum + p.net_pay, 0);

  const renderPaystub = ({ item }: { item: Paystub }) => (
    <TouchableOpacity
      style={styles.paystubCard}
      onPress={() => navigation.navigate('PaystubDetail', { paystubId: item.id })}
    >
      <View style={styles.paystubHeader}>
        <View>
          <Text style={styles.payDate}>{new Date(item.pay_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
          <Text style={styles.payPeriod}>
            {formatDate(item.pay_period_start)} - {formatDate(item.pay_period_end)}
          </Text>
        </View>
        <View style={[styles.statusBadge, item.status === 'paid' && styles.statusPaid]}>
          <Text style={[styles.statusText, item.status === 'paid' && styles.statusTextPaid]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.paystubAmounts}>
        <View style={styles.amountCol}>
          <Text style={styles.amountLabel}>Gross Pay</Text>
          <Text style={styles.amountValue}>{formatCurrency(item.gross_pay)}</Text>
        </View>
        <View style={styles.amountDivider} />
        <View style={styles.amountCol}>
          <Text style={styles.amountLabel}>Net Pay</Text>
          <Text style={[styles.amountValue, styles.netPayValue]}>{formatCurrency(item.net_pay)}</Text>
        </View>
      </View>

      <View style={styles.paystubFooter}>
        <View style={styles.hoursInfo}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.hoursText}>{item.hours_worked}h regular</Text>
          {item.overtime_hours > 0 && (
            <Text style={styles.overtimeText}>+ {item.overtime_hours}h OT</Text>
          )}
        </View>
        <View style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View</Text>
          <Ionicons name="chevron-forward" size={16} color="#1473FF" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1473FF', '#BE01FF']} style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Paystubs</Text>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={() => navigation.navigate('GeneratePaystub')}
          >
            <Ionicons name="add" size={20} color="#1473FF" />
            <Text style={styles.generateButtonText}>Generate</Text>
          </TouchableOpacity>
        </View>
        
        {/* YTD Summary */}
        <View style={styles.ytdCard}>
          <Text style={styles.ytdTitle}>{selectedYear} Year-to-Date</Text>
          <View style={styles.ytdRow}>
            <View style={styles.ytdItem}>
              <Text style={styles.ytdLabel}>Gross Earnings</Text>
              <Text style={styles.ytdValue}>{formatCurrency(ytdGross)}</Text>
            </View>
            <View style={styles.ytdDivider} />
            <View style={styles.ytdItem}>
              <Text style={styles.ytdLabel}>Net Earnings</Text>
              <Text style={styles.ytdValue}>{formatCurrency(ytdNet)}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={paystubs}
        keyExtractor={(item) => item.id}
        renderItem={renderPaystub}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>Recent Paystubs</Text>
            <TouchableOpacity>
              <Text style={styles.filterText}>Filter</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No paystubs yet</Text>
            <Text style={styles.emptySubtext}>Generate your first paystub to get started</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff' },
  generateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  generateButtonText: { fontSize: 14, fontWeight: '600', color: '#1473FF', marginLeft: 4 },
  ytdCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 16 },
  ytdTitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  ytdRow: { flexDirection: 'row' },
  ytdItem: { flex: 1 },
  ytdLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  ytdValue: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 4 },
  ytdDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 16 },
  listContent: { padding: 16 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  listHeaderText: { fontSize: 16, fontWeight: '600', color: '#333' },
  filterText: { fontSize: 14, color: '#1473FF' },
  paystubCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  paystubHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  payDate: { fontSize: 16, fontWeight: '600', color: '#333' },
  payPeriod: { fontSize: 13, color: '#666', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#f0f0f0' },
  statusPaid: { backgroundColor: '#D1FAE5' },
  statusText: { fontSize: 12, fontWeight: '600', color: '#666' },
  statusTextPaid: { color: '#065F46' },
  paystubAmounts: { flexDirection: 'row', backgroundColor: '#f9f9f9', borderRadius: 8, padding: 12, marginBottom: 12 },
  amountCol: { flex: 1, alignItems: 'center' },
  amountDivider: { width: 1, backgroundColor: '#eee' },
  amountLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  amountValue: { fontSize: 18, fontWeight: '600', color: '#333' },
  netPayValue: { color: '#10B981' },
  paystubFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hoursInfo: { flexDirection: 'row', alignItems: 'center' },
  hoursText: { fontSize: 13, color: '#666', marginLeft: 4 },
  overtimeText: { fontSize: 13, color: '#F59E0B', marginLeft: 8 },
  viewButton: { flexDirection: 'row', alignItems: 'center' },
  viewButtonText: { fontSize: 14, color: '#1473FF', fontWeight: '500' },
  emptyContainer: { alignItems: 'center', padding: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#666', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 8 },
});

export default PaystubsScreen;
