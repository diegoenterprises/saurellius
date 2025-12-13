/**
 * CONTRACTOR RATE CALCULATOR SCREEN
 * Calculate optimal hourly/project rates
 * Factor in expenses, taxes, desired income
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface RateBreakdown {
  base_hourly: number;
  with_expenses: number;
  with_taxes: number;
  with_profit_margin: number;
  recommended_rate: number;
}

interface SavedRate {
  id: string;
  name: string;
  hourly_rate: number;
  daily_rate: number;
  created_at: string;
}

export default function ContractorRateCalculatorScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savedRates, setSavedRates] = useState<SavedRate[]>([]);
  const [activeTab, setActiveTab] = useState<'calculator' | 'saved'>('calculator');

  // Calculator inputs
  const [desiredIncome, setDesiredIncome] = useState('75000');
  const [workableHours, setWorkableHours] = useState('1800');
  const [monthlyExpenses, setMonthlyExpenses] = useState('1500');
  const [taxRate, setTaxRate] = useState('30');
  const [profitMargin, setProfitMargin] = useState('15');
  const [breakdown, setBreakdown] = useState<RateBreakdown | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/api/contractor/rate-calculator/saved');
      setSavedRates(res.data.rates || []);
    } catch (error) {
      console.error('Failed to fetch saved rates:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { calculateRate(); }, [desiredIncome, workableHours, monthlyExpenses, taxRate, profitMargin]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);

  const calculateRate = () => {
    const income = parseFloat(desiredIncome) || 0;
    const hours = parseFloat(workableHours) || 1;
    const expenses = (parseFloat(monthlyExpenses) || 0) * 12;
    const tax = (parseFloat(taxRate) || 0) / 100;
    const margin = (parseFloat(profitMargin) || 0) / 100;

    const baseHourly = income / hours;
    const withExpenses = (income + expenses) / hours;
    const withTaxes = withExpenses / (1 - tax);
    const withProfitMargin = withTaxes * (1 + margin);

    setBreakdown({
      base_hourly: baseHourly,
      with_expenses: withExpenses,
      with_taxes: withTaxes,
      with_profit_margin: withProfitMargin,
      recommended_rate: Math.ceil(withProfitMargin / 5) * 5,
    });
  };

  const renderCalculator = () => (
    <>
      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>Your Goals</Text>
        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Desired Annual Income</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputPrefix}>$</Text>
              <TextInput style={styles.input} value={desiredIncome} onChangeText={setDesiredIncome} keyboardType="number-pad" placeholder="75000" placeholderTextColor="#666" />
            </View>
          </View>
        </View>
        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Billable Hours/Year</Text>
            <TextInput style={styles.inputFull} value={workableHours} onChangeText={setWorkableHours} keyboardType="number-pad" placeholder="1800" placeholderTextColor="#666" />
          </View>
        </View>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>Expenses & Taxes</Text>
        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Monthly Business Expenses</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputPrefix}>$</Text>
              <TextInput style={styles.input} value={monthlyExpenses} onChangeText={setMonthlyExpenses} keyboardType="number-pad" placeholder="1500" placeholderTextColor="#666" />
            </View>
          </View>
        </View>
        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Estimated Tax Rate</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} value={taxRate} onChangeText={setTaxRate} keyboardType="number-pad" placeholder="30" placeholderTextColor="#666" />
              <Text style={styles.inputSuffix}>%</Text>
            </View>
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.inputLabel}>Profit Margin</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} value={profitMargin} onChangeText={setProfitMargin} keyboardType="number-pad" placeholder="15" placeholderTextColor="#666" />
              <Text style={styles.inputSuffix}>%</Text>
            </View>
          </View>
        </View>
      </View>

      {breakdown && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Rate Breakdown</Text>
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Base hourly rate</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(breakdown.base_hourly)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>+ Business expenses</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(breakdown.with_expenses)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>+ Tax coverage ({taxRate}%)</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(breakdown.with_taxes)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>+ Profit margin ({profitMargin}%)</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(breakdown.with_profit_margin)}</Text>
            </View>
            <View style={styles.recommendedRow}>
              <View style={styles.recommendedLabel}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.recommendedText}>Recommended Rate</Text>
              </View>
              <Text style={styles.recommendedValue}>{formatCurrency(breakdown.recommended_rate)}/hr</Text>
            </View>
          </View>

          <View style={styles.conversionsCard}>
            <Text style={styles.conversionsTitle}>Rate Conversions</Text>
            <View style={styles.conversionRow}>
              <Text style={styles.conversionLabel}>Daily (8 hrs)</Text>
              <Text style={styles.conversionValue}>{formatCurrency(breakdown.recommended_rate * 8)}</Text>
            </View>
            <View style={styles.conversionRow}>
              <Text style={styles.conversionLabel}>Weekly (40 hrs)</Text>
              <Text style={styles.conversionValue}>{formatCurrency(breakdown.recommended_rate * 40)}</Text>
            </View>
            <View style={styles.conversionRow}>
              <Text style={styles.conversionLabel}>Monthly (160 hrs)</Text>
              <Text style={styles.conversionValue}>{formatCurrency(breakdown.recommended_rate * 160)}</Text>
            </View>
          </View>
        </View>
      )}
    </>
  );

  const renderSavedRates = () => (
    <View style={styles.savedSection}>
      {savedRates.length > 0 ? savedRates.map(rate => (
        <View key={rate.id} style={styles.savedCard}>
          <View style={styles.savedInfo}>
            <Text style={styles.savedName}>{rate.name}</Text>
            <Text style={styles.savedDate}>{new Date(rate.created_at).toLocaleDateString()}</Text>
          </View>
          <View style={styles.savedRates}>
            <Text style={styles.savedHourly}>{formatCurrency(rate.hourly_rate)}/hr</Text>
            <Text style={styles.savedDaily}>{formatCurrency(rate.daily_rate)}/day</Text>
          </View>
        </View>
      )) : (
        <View style={styles.emptyState}><Ionicons name="calculator-outline" size={48} color="#666" /><Text style={styles.emptyText}>No saved rates</Text></View>
      )}
    </View>
  );

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1473FF" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Rate Calculator</Text>
          <TouchableOpacity><Ionicons name="bookmark-outline" size={24} color="#FFF" /></TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'calculator' && styles.tabActive]} onPress={() => setActiveTab('calculator')}>
          <Ionicons name="calculator" size={18} color={activeTab === 'calculator' ? '#FFF' : '#a0a0a0'} />
          <Text style={[styles.tabText, activeTab === 'calculator' && styles.tabTextActive]}>Calculator</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'saved' && styles.tabActive]} onPress={() => setActiveTab('saved')}>
          <Ionicons name="bookmark" size={18} color={activeTab === 'saved' ? '#FFF' : '#a0a0a0'} />
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>Saved</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />}>
        {activeTab === 'calculator' ? renderCalculator() : renderSavedRates()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingBottom: 16 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2a2a4e', gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  tabActive: { backgroundColor: '#1473FF' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#a0a0a0' },
  tabTextActive: { color: '#FFF' },
  content: { flex: 1 },
  inputSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#FFF', marginBottom: 14 },
  inputRow: { flexDirection: 'row', marginBottom: 12 },
  inputGroup: {},
  inputLabel: { fontSize: 12, color: '#a0a0a0', marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 10, borderWidth: 1, borderColor: '#2a2a4e' },
  inputPrefix: { fontSize: 16, color: '#666', paddingLeft: 14 },
  inputSuffix: { fontSize: 16, color: '#666', paddingRight: 14 },
  input: { flex: 1, padding: 14, fontSize: 16, color: '#FFF' },
  inputFull: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14, fontSize: 16, color: '#FFF', borderWidth: 1, borderColor: '#2a2a4e' },
  resultsSection: { padding: 16 },
  breakdownCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#2a2a4e' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  breakdownLabel: { fontSize: 14, color: '#a0a0a0' },
  breakdownValue: { fontSize: 14, fontWeight: '500', color: '#FFF' },
  recommendedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, marginTop: 6 },
  recommendedLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recommendedText: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  recommendedValue: { fontSize: 24, fontWeight: 'bold', color: '#10B981' },
  conversionsCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginTop: 14, borderWidth: 1, borderColor: '#2a2a4e' },
  conversionsTitle: { fontSize: 14, fontWeight: '600', color: '#a0a0a0', marginBottom: 12 },
  conversionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  conversionLabel: { fontSize: 14, color: '#a0a0a0' },
  conversionValue: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  savedSection: { padding: 16 },
  savedCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a4e' },
  savedInfo: {},
  savedName: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  savedDate: { fontSize: 12, color: '#666', marginTop: 2 },
  savedRates: { alignItems: 'flex-end' },
  savedHourly: { fontSize: 16, fontWeight: 'bold', color: '#10B981' },
  savedDaily: { fontSize: 12, color: '#a0a0a0', marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
});
