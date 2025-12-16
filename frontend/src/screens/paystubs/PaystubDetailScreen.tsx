/**
 * PAYSTUB DETAIL SCREEN
 * View individual paystub with full breakdown
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface PaystubData {
  id: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  employee: {
    name: string;
    employee_id: string;
    department: string;
  };
  earnings: {
    regular_hours: number;
    regular_rate: number;
    regular_pay: number;
    overtime_hours: number;
    overtime_rate: number;
    overtime_pay: number;
    bonus: number;
    commission: number;
    gross_pay: number;
  };
  deductions: {
    federal_tax: number;
    state_tax: number;
    social_security: number;
    medicare: number;
    health_insurance: number;
    dental_insurance: number;
    vision_insurance: number;
    retirement_401k: number;
    other: number;
    total_deductions: number;
  };
  net_pay: number;
  ytd: {
    gross: number;
    federal_tax: number;
    state_tax: number;
    social_security: number;
    medicare: number;
    net: number;
  };
}

export default function PaystubDetailScreen({ route, navigation }: any) {
  const { paystubId } = route?.params || { paystubId: '1' };
  const [paystub, setPaystub] = useState<PaystubData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaystub();
  }, [paystubId]);

  const fetchPaystub = async () => {
    // Mock data - replace with API call
    setTimeout(() => {
      setPaystub({
        id: paystubId,
        pay_period_start: '2024-01-01',
        pay_period_end: '2024-01-15',
        pay_date: '2024-01-20',
        employee: {
          name: 'Sarah Johnson',
          employee_id: 'EMP-001',
          department: 'Engineering',
        },
        earnings: {
          regular_hours: 80,
          regular_rate: 45.67,
          regular_pay: 3653.60,
          overtime_hours: 5,
          overtime_rate: 68.51,
          overtime_pay: 342.55,
          bonus: 0,
          commission: 0,
          gross_pay: 3996.15,
        },
        deductions: {
          federal_tax: 599.42,
          state_tax: 239.77,
          social_security: 247.76,
          medicare: 57.94,
          health_insurance: 150.00,
          dental_insurance: 25.00,
          vision_insurance: 10.00,
          retirement_401k: 239.77,
          other: 0,
          total_deductions: 1569.66,
        },
        net_pay: 2426.49,
        ytd: {
          gross: 7992.30,
          federal_tax: 1198.85,
          state_tax: 479.54,
          social_security: 495.52,
          medicare: 115.89,
          net: 4852.98,
        },
      });
      setLoading(false);
    }, 500);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Paystub for ${paystub?.employee.name}\nPay Date: ${formatDate(paystub?.pay_date || '')}\nNet Pay: ${formatCurrency(paystub?.net_pay || 0)}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share paystub');
    }
  };

  const handleDownload = () => {
    Alert.alert('Download', 'Paystub PDF will be downloaded');
  };

  const handleEmail = () => {
    Alert.alert('Email', 'Paystub will be sent to your email');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1473FF" />
      </View>
    );
  }

  if (!paystub) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Paystub not found</Text>
      </View>
    );
  }

  const renderRow = (label: string, value: string | number, isAmount = true, bold = false) => (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.rowLabelBold]}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowValueBold]}>
        {isAmount ? formatCurrency(value as number) : value}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1473FF', '#BE01FF']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paystub Details</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Employee Info */}
        <View style={styles.card}>
          <Text style={styles.employeeName}>{paystub.employee.name}</Text>
          <Text style={styles.employeeId}>{paystub.employee.employee_id} | {paystub.employee.department}</Text>
          <View style={styles.periodRow}>
            <View>
              <Text style={styles.periodLabel}>Pay Period</Text>
              <Text style={styles.periodValue}>
                {formatDate(paystub.pay_period_start)} - {formatDate(paystub.pay_period_end)}
              </Text>
            </View>
            <View>
              <Text style={styles.periodLabel}>Pay Date</Text>
              <Text style={styles.periodValue}>{formatDate(paystub.pay_date)}</Text>
            </View>
          </View>
        </View>

        {/* Net Pay */}
        <View style={styles.netPayCard}>
          <Text style={styles.netPayLabel}>Net Pay</Text>
          <Text style={styles.netPayValue}>{formatCurrency(paystub.net_pay)}</Text>
        </View>

        {/* Earnings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings</Text>
          <View style={styles.sectionContent}>
            {renderRow(`Regular (${paystub.earnings.regular_hours} hrs @ ${formatCurrency(paystub.earnings.regular_rate)})`, paystub.earnings.regular_pay)}
            {paystub.earnings.overtime_hours > 0 && 
              renderRow(`Overtime (${paystub.earnings.overtime_hours} hrs @ ${formatCurrency(paystub.earnings.overtime_rate)})`, paystub.earnings.overtime_pay)}
            {paystub.earnings.bonus > 0 && renderRow('Bonus', paystub.earnings.bonus)}
            {paystub.earnings.commission > 0 && renderRow('Commission', paystub.earnings.commission)}
            <View style={styles.divider} />
            {renderRow('Gross Pay', paystub.earnings.gross_pay, true, true)}
          </View>
        </View>

        {/* Deductions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deductions</Text>
          <View style={styles.sectionContent}>
            {renderRow('Federal Income Tax', paystub.deductions.federal_tax)}
            {renderRow('State Income Tax', paystub.deductions.state_tax)}
            {renderRow('Social Security', paystub.deductions.social_security)}
            {renderRow('Medicare', paystub.deductions.medicare)}
            {paystub.deductions.health_insurance > 0 && renderRow('Health Insurance', paystub.deductions.health_insurance)}
            {paystub.deductions.dental_insurance > 0 && renderRow('Dental Insurance', paystub.deductions.dental_insurance)}
            {paystub.deductions.vision_insurance > 0 && renderRow('Vision Insurance', paystub.deductions.vision_insurance)}
            {paystub.deductions.retirement_401k > 0 && renderRow('401(k)', paystub.deductions.retirement_401k)}
            <View style={styles.divider} />
            {renderRow('Total Deductions', paystub.deductions.total_deductions, true, true)}
          </View>
        </View>

        {/* YTD Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Year-to-Date</Text>
          <View style={styles.sectionContent}>
            {renderRow('Gross Earnings', paystub.ytd.gross)}
            {renderRow('Federal Tax', paystub.ytd.federal_tax)}
            {renderRow('State Tax', paystub.ytd.state_tax)}
            {renderRow('Social Security', paystub.ytd.social_security)}
            {renderRow('Medicare', paystub.ytd.medicare)}
            <View style={styles.divider} />
            {renderRow('Net Earnings', paystub.ytd.net, true, true)}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
            <Ionicons name="download-outline" size={20} color="#1473FF" />
            <Text style={styles.actionText}>Download PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
            <Ionicons name="mail-outline" size={20} color="#1473FF" />
            <Text style={styles.actionText}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('StandalonePaystub', { paystubId })}>
            <Ionicons name="expand-outline" size={20} color="#1473FF" />
            <Text style={styles.actionText}>Full View</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.card,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#a0a0a0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  shareButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.card,
    margin: 16,
    marginBottom: 0,
    padding: 20,
    borderRadius: 16,
  },
  employeeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  employeeId: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 4,
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  periodLabel: {
    fontSize: 12,
    color: '#999',
  },
  periodValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginTop: 2,
  },
  netPayCard: {
    backgroundColor: colors.card,
    margin: 16,
    marginBottom: 0,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  netPayLabel: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  netPayValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 4,
  },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: colors.card,
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    padding: 16,
    paddingBottom: 0,
    textTransform: 'uppercase',
  },
  sectionContent: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowLabel: {
    fontSize: 14,
    color: '#a0a0a0',
    flex: 1,
  },
  rowLabelBold: {
    fontWeight: '600',
    color: colors.text,
  },
  rowValue: {
    fontSize: 14,
    color: colors.text,
  },
  rowValueBold: {
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.card,
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#1473FF',
    marginTop: 4,
  },
  bottomPadding: {
    height: 40,
  },
});
