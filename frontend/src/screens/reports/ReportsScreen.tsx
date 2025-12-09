/**
 * REPORTS SCREEN
 * Payroll Reports, Analytics Dashboard, Data Exports
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'dashboard' | 'reports' | 'exports';

interface ReportItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

const REPORTS: ReportItem[] = [
  { id: '1', name: 'Payroll Summary', description: 'Overview of payroll totals', icon: 'document-text', category: 'payroll' },
  { id: '2', name: 'Payroll Register', description: 'Detailed employee earnings', icon: 'list', category: 'payroll' },
  { id: '3', name: 'Tax Liability', description: 'Quarterly tax summary', icon: 'calculator', category: 'tax' },
  { id: '4', name: 'W-2 Summary', description: 'Annual W-2 report', icon: 'document', category: 'tax' },
  { id: '5', name: 'Labor Cost', description: 'Department labor analysis', icon: 'pie-chart', category: 'labor' },
  { id: '6', name: 'PTO Balance', description: 'Leave balances by employee', icon: 'calendar', category: 'hr' },
  { id: '7', name: 'Deductions', description: 'Benefit deduction summary', icon: 'remove-circle', category: 'benefits' },
  { id: '8', name: 'Contractor Payments', description: '1099 payment summary', icon: 'people', category: 'contractors' },
];

const { width } = Dimensions.get('window');

export default function ReportsScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const categories = ['all', 'payroll', 'tax', 'labor', 'hr', 'benefits'];
  
  const filteredReports = selectedCategory === 'all' 
    ? REPORTS 
    : REPORTS.filter(r => r.category === selectedCategory);

  const renderDashboard = () => (
    <View style={styles.tabContent}>
      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: '#EBF5FF' }]}>
          <Ionicons name="cash" size={24} color="#1473FF" />
          <Text style={styles.kpiValue}>{formatCurrency(485000)}</Text>
          <Text style={styles.kpiLabel}>YTD Payroll</Text>
          <View style={styles.kpiTrend}>
            <Ionicons name="arrow-up" size={12} color="#10B981" />
            <Text style={[styles.kpiTrendText, { color: '#10B981' }]}>8.2%</Text>
          </View>
        </View>
        <View style={[styles.kpiCard, { backgroundColor: '#F0FDF4' }]}>
          <Ionicons name="people" size={24} color="#10B981" />
          <Text style={styles.kpiValue}>24</Text>
          <Text style={styles.kpiLabel}>Employees</Text>
          <View style={styles.kpiTrend}>
            <Ionicons name="arrow-up" size={12} color="#10B981" />
            <Text style={[styles.kpiTrendText, { color: '#10B981' }]}>+2</Text>
          </View>
        </View>
      </View>

      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="receipt" size={24} color="#F59E0B" />
          <Text style={styles.kpiValue}>{formatCurrency(52000)}</Text>
          <Text style={styles.kpiLabel}>Tax Liability</Text>
          <Text style={styles.kpiSubtext}>Q4 2024</Text>
        </View>
        <View style={[styles.kpiCard, { backgroundColor: '#FEE2E2' }]}>
          <Ionicons name="time" size={24} color="#EF4444" />
          <Text style={styles.kpiValue}>3.2%</Text>
          <Text style={styles.kpiLabel}>Turnover Rate</Text>
          <View style={styles.kpiTrend}>
            <Ionicons name="arrow-down" size={12} color="#10B981" />
            <Text style={[styles.kpiTrendText, { color: '#10B981' }]}>-1.1%</Text>
          </View>
        </View>
      </View>

      {/* Monthly Payroll Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Monthly Payroll</Text>
        <View style={styles.chartContainer}>
          {[38, 42, 39, 44, 41, 45, 43, 48, 46, 52, 49, 55].map((value, index) => (
            <View key={index} style={styles.barWrapper}>
              <View style={[styles.bar, { height: value * 2 }]}>
                <LinearGradient
                  colors={['#1473FF', '#BE01FF']}
                  style={styles.barGradient}
                />
              </View>
              <Text style={styles.barLabel}>{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][index]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Department Breakdown */}
      <View style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Payroll by Department</Text>
        {[
          { name: 'Engineering', amount: 180000, percent: 37, color: '#1473FF' },
          { name: 'Sales', amount: 125000, percent: 26, color: '#10B981' },
          { name: 'Marketing', amount: 95000, percent: 20, color: '#8B5CF6' },
          { name: 'Operations', amount: 85000, percent: 17, color: '#F59E0B' },
        ].map((dept, index) => (
          <View key={index} style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <View style={[styles.breakdownDot, { backgroundColor: dept.color }]} />
              <Text style={styles.breakdownName}>{dept.name}</Text>
              <Text style={styles.breakdownAmount}>{formatCurrency(dept.amount)}</Text>
            </View>
            <View style={styles.breakdownBarBg}>
              <View style={[styles.breakdownBar, { width: `${dept.percent}%`, backgroundColor: dept.color }]} />
            </View>
          </View>
        ))}
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStatsRow}>
        <View style={styles.quickStat}>
          <Text style={styles.quickStatValue}>$62k</Text>
          <Text style={styles.quickStatLabel}>Avg Salary</Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStat}>
          <Text style={styles.quickStatValue}>4.2%</Text>
          <Text style={styles.quickStatLabel}>OT Rate</Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStat}>
          <Text style={styles.quickStatValue}>89%</Text>
          <Text style={styles.quickStatLabel}>Benefits</Text>
        </View>
      </View>
    </View>
  );

  const renderReports = () => (
    <View style={styles.tabContent}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.reportsList}>
        {filteredReports.map((report) => (
          <TouchableOpacity key={report.id} style={styles.reportCard}>
            <View style={styles.reportIcon}>
              <Ionicons name={report.icon as any} size={24} color="#1473FF" />
            </View>
            <View style={styles.reportInfo}>
              <Text style={styles.reportName}>{report.name}</Text>
              <Text style={styles.reportDesc}>{report.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.scheduledSection}>
        <Text style={styles.scheduledTitle}>Scheduled Reports</Text>
        <View style={styles.scheduledCard}>
          <View style={styles.scheduledIcon}>
            <Ionicons name="calendar" size={20} color="#8B5CF6" />
          </View>
          <View style={styles.scheduledInfo}>
            <Text style={styles.scheduledName}>Payroll Summary</Text>
            <Text style={styles.scheduledFreq}>Weekly • Every Monday</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={styles.scheduledCard}>
          <View style={styles.scheduledIcon}>
            <Ionicons name="calendar" size={20} color="#8B5CF6" />
          </View>
          <View style={styles.scheduledInfo}>
            <Text style={styles.scheduledName}>Tax Liability</Text>
            <Text style={styles.scheduledFreq}>Monthly • 1st of month</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.scheduleNewBtn}>
          <Ionicons name="add" size={20} color="#1473FF" />
          <Text style={styles.scheduleNewText}>Schedule New Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderExports = () => (
    <View style={styles.tabContent}>
      <View style={styles.exportInfo}>
        <Ionicons name="cloud-download" size={48} color="#1473FF" />
        <Text style={styles.exportTitle}>Export Data</Text>
        <Text style={styles.exportDesc}>
          Download your payroll data in various formats for accounting software or record keeping.
        </Text>
      </View>

      <Text style={styles.exportSectionTitle}>Quick Exports</Text>
      <View style={styles.exportOptions}>
        {[
          { format: 'CSV', icon: 'document-text', desc: 'Spreadsheet format' },
          { format: 'Excel', icon: 'grid', desc: 'Microsoft Excel' },
          { format: 'PDF', icon: 'document', desc: 'Print-ready format' },
          { format: 'JSON', icon: 'code', desc: 'API format' },
        ].map((option, index) => (
          <TouchableOpacity key={index} style={styles.exportOption}>
            <View style={styles.exportOptionIcon}>
              <Ionicons name={option.icon as any} size={24} color="#1473FF" />
            </View>
            <Text style={styles.exportFormat}>{option.format}</Text>
            <Text style={styles.exportFormatDesc}>{option.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.exportSectionTitle}>Integrations</Text>
      <View style={styles.integrationsList}>
        {[
          { name: 'QuickBooks', status: 'Connected', icon: 'sync' },
          { name: 'Xero', status: 'Not connected', icon: 'link' },
          { name: 'Sage', status: 'Not connected', icon: 'link' },
        ].map((integration, index) => (
          <TouchableOpacity key={index} style={styles.integrationCard}>
            <View style={styles.integrationIcon}>
              <Ionicons name={integration.icon as any} size={20} color={integration.status === 'Connected' ? '#10B981' : '#666'} />
            </View>
            <View style={styles.integrationInfo}>
              <Text style={styles.integrationName}>{integration.name}</Text>
              <Text style={[styles.integrationStatus, { color: integration.status === 'Connected' ? '#10B981' : '#666' }]}>
                {integration.status}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.exportSectionTitle}>Recent Exports</Text>
      <View style={styles.recentExports}>
        {[
          { name: 'Payroll Summary Dec 2024', date: 'Dec 15, 2024', format: 'PDF' },
          { name: 'Q4 Tax Report', date: 'Dec 10, 2024', format: 'CSV' },
          { name: 'Employee Directory', date: 'Dec 5, 2024', format: 'Excel' },
        ].map((export_, index) => (
          <View key={index} style={styles.recentExportItem}>
            <View style={styles.recentExportIcon}>
              <Ionicons name="document" size={18} color="#666" />
            </View>
            <View style={styles.recentExportInfo}>
              <Text style={styles.recentExportName}>{export_.name}</Text>
              <Text style={styles.recentExportDate}>{export_.date}</Text>
            </View>
            <View style={styles.formatBadge}>
              <Text style={styles.formatBadgeText}>{export_.format}</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="download-outline" size={20} color="#1473FF" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1473FF', '#BE01FF']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reports</Text>
          <TouchableOpacity>
            <Ionicons name="share-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          {[
            { key: 'dashboard', label: 'Dashboard', icon: 'analytics' },
            { key: 'reports', label: 'Reports', icon: 'document-text' },
            { key: 'exports', label: 'Export', icon: 'download' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key as TabType)}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={activeTab === tab.key ? '#FFF' : 'rgba(255,255,255,0.6)'}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'exports' && renderExports()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  kpiLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  kpiSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  kpiTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  kpiTrendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  barWrapper: {
    alignItems: 'center',
    width: (width - 64) / 12,
  },
  bar: {
    width: 14,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barGradient: {
    flex: 1,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  breakdownCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  breakdownItem: {
    marginBottom: 12,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  breakdownName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  breakdownBarBg: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  breakdownBar: {
    height: '100%',
    borderRadius: 3,
  },
  quickStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#1473FF',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
  },
  categoryChipTextActive: {
    color: '#FFF',
    fontWeight: '500',
  },
  reportsList: {
    gap: 10,
    marginBottom: 24,
  },
  reportCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  reportDesc: {
    fontSize: 13,
    color: '#666',
  },
  scheduledSection: {
    marginTop: 8,
  },
  scheduledTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  scheduledCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduledIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scheduledInfo: {
    flex: 1,
  },
  scheduledName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  scheduledFreq: {
    fontSize: 12,
    color: '#666',
  },
  scheduleNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#1473FF',
    borderStyle: 'dashed',
    marginTop: 8,
    gap: 6,
  },
  scheduleNewText: {
    fontSize: 14,
    color: '#1473FF',
    fontWeight: '500',
  },
  exportInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 20,
  },
  exportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  exportDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  exportSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  exportOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  exportOption: {
    width: '47%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  exportOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  exportFormat: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  exportFormatDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  integrationsList: {
    gap: 8,
    marginBottom: 24,
  },
  integrationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  integrationIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  integrationInfo: {
    flex: 1,
  },
  integrationName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  integrationStatus: {
    fontSize: 12,
  },
  recentExports: {
    gap: 8,
  },
  recentExportItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentExportIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentExportInfo: {
    flex: 1,
  },
  recentExportName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  recentExportDate: {
    fontSize: 12,
    color: '#666',
  },
  formatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  formatBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
});
