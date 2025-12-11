// Advanced Analytics & Reporting Screen
// Real-time dashboards, custom reports, predictive analytics

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const theme = {
  colors: {
    primary: '#6366F1',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  }
};

const { width } = Dimensions.get('window');

interface DashboardMetric {
  label: string;
  value: string;
  change: number;
  icon: string;
}

const AnalyticsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'labor' | 'turnover' | 'predictions'>('dashboard');
  const [refreshing, setRefreshing] = useState(false);

  const metrics: DashboardMetric[] = [
    { label: 'Total Employees', value: '156', change: 2.6, icon: 'people' },
    { label: 'Avg. Salary', value: '$72,500', change: 3.2, icon: 'cash' },
    { label: 'Turnover Rate', value: '12.5%', change: -1.8, icon: 'trending-down' },
    { label: 'Time to Hire', value: '32 days', change: -5.2, icon: 'time' },
  ];

  const laborCosts = [
    { department: 'Engineering', cost: 425000, percentage: 34 },
    { department: 'Sales', cost: 312000, percentage: 25 },
    { department: 'Operations', cost: 285000, percentage: 23 },
    { department: 'Admin', cost: 228000, percentage: 18 },
  ];

  const upcomingDeadlines = [
    { item: 'Form 941 Q4', due: 'Jan 31, 2025', status: 'pending' },
    { item: 'W-2 Distribution', due: 'Jan 31, 2025', status: 'in_progress' },
    { item: 'ACA Reporting', due: 'Mar 2, 2025', status: 'pending' },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
    { id: 'reports', label: 'Reports', icon: 'document-text-outline' },
    { id: 'labor', label: 'Labor Costs', icon: 'wallet-outline' },
    { id: 'turnover', label: 'Turnover', icon: 'swap-horizontal-outline' },
    { id: 'predictions', label: 'Predictions', icon: 'analytics-outline' },
  ];

  const renderMetricCard = (metric: DashboardMetric, index: number) => (
    <View key={index} style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.metricIcon, { backgroundColor: theme.colors.primary + '20' }]}>
        <Ionicons name={metric.icon as any} size={24} color={theme.colors.primary} />
      </View>
      <Text style={[styles.metricValue, { color: theme.colors.text }]}>{metric.value}</Text>
      <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>{metric.label}</Text>
      <View style={styles.changeContainer}>
        <Ionicons
          name={metric.change >= 0 ? 'arrow-up' : 'arrow-down'}
          size={14}
          color={metric.change >= 0 ? theme.colors.success : theme.colors.error}
        />
        <Text style={{ color: metric.change >= 0 ? theme.colors.success : theme.colors.error, fontSize: 12 }}>
          {Math.abs(metric.change)}%
        </Text>
      </View>
    </View>
  );

  const renderDashboard = () => (
    <View style={styles.dashboardContent}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Key Metrics</Text>
      <View style={styles.metricsGrid}>
        {metrics.map(renderMetricCard)}
      </View>

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Compliance Deadlines</Text>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        {upcomingDeadlines.map((deadline, i) => (
          <View key={i} style={[styles.deadlineRow, i < upcomingDeadlines.length - 1 && styles.borderBottom]}>
            <View>
              <Text style={[styles.deadlineItem, { color: theme.colors.text }]}>{deadline.item}</Text>
              <Text style={[styles.deadlineDue, { color: theme.colors.textSecondary }]}>Due: {deadline.due}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: deadline.status === 'in_progress' ? theme.colors.warning + '20' : theme.colors.primary + '20' }
            ]}>
              <Text style={{
                color: deadline.status === 'in_progress' ? theme.colors.warning : theme.colors.primary,
                fontSize: 12
              }}>
                {deadline.status === 'in_progress' ? 'In Progress' : 'Pending'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderLaborCosts = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Labor Costs by Department</Text>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.totalCost, { color: theme.colors.text }]}>$1,250,000</Text>
        <Text style={[styles.costLabel, { color: theme.colors.textSecondary }]}>Total Monthly Labor Cost</Text>
        
        {laborCosts.map((dept, i) => (
          <View key={i} style={styles.laborRow}>
            <View style={styles.laborInfo}>
              <Text style={[styles.deptName, { color: theme.colors.text }]}>{dept.department}</Text>
              <Text style={[styles.deptCost, { color: theme.colors.textSecondary }]}>
                ${dept.cost.toLocaleString()}
              </Text>
            </View>
            <View style={styles.barContainer}>
              <View style={[styles.bar, { width: `${dept.percentage}%`, backgroundColor: theme.colors.primary }]} />
            </View>
            <Text style={[styles.percentage, { color: theme.colors.textSecondary }]}>{dept.percentage}%</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderTurnover = () => (
    <View style={styles.tabContent}>
      <View style={styles.turnoverHeader}>
        <View style={[styles.turnoverCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.turnoverValue, { color: theme.colors.text }]}>12.5%</Text>
          <Text style={[styles.turnoverLabel, { color: theme.colors.textSecondary }]}>Current Rate</Text>
        </View>
        <View style={[styles.turnoverCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.turnoverValue, { color: theme.colors.success }]}>15.2%</Text>
          <Text style={[styles.turnoverLabel, { color: theme.colors.textSecondary }]}>Industry Avg</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Top Departure Reasons</Text>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        {[
          { reason: 'Better opportunity', pct: 35 },
          { reason: 'Compensation', pct: 25 },
          { reason: 'Work-life balance', pct: 18 },
          { reason: 'Management', pct: 12 },
          { reason: 'Career growth', pct: 10 },
        ].map((item, i) => (
          <View key={i} style={styles.reasonRow}>
            <Text style={[styles.reasonText, { color: theme.colors.text }]}>{item.reason}</Text>
            <Text style={[styles.reasonPct, { color: theme.colors.primary }]}>{item.pct}%</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderPredictions = () => (
    <View style={styles.tabContent}>
      <View style={[styles.alertCard, { backgroundColor: theme.colors.warning + '10', borderColor: theme.colors.warning }]}>
        <Ionicons name="alert-circle" size={24} color={theme.colors.warning} />
        <View style={styles.alertContent}>
          <Text style={[styles.alertTitle, { color: theme.colors.text }]}>Turnover Risk Alert</Text>
          <Text style={[styles.alertText, { color: theme.colors.textSecondary }]}>
            3 employees in Sales department show high turnover risk
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Headcount Forecast</Text>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        {[
          { quarter: 'Q1 2025', headcount: 162, change: '+6' },
          { quarter: 'Q2 2025', headcount: 170, change: '+8' },
          { quarter: 'Q3 2025', headcount: 178, change: '+8' },
          { quarter: 'Q4 2025', headcount: 185, change: '+7' },
        ].map((q, i) => (
          <View key={i} style={[styles.forecastRow, i < 3 && styles.borderBottom]}>
            <Text style={[styles.quarterText, { color: theme.colors.text }]}>{q.quarter}</Text>
            <Text style={[styles.headcountText, { color: theme.colors.text }]}>{q.headcount}</Text>
            <Text style={[styles.changeText, { color: theme.colors.success }]}>{q.change}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderReports = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Saved Reports</Text>
      {[
        { name: 'Monthly Payroll Summary', type: 'Payroll', lastRun: '2 days ago' },
        { name: 'Department Cost Analysis', type: 'Labor', lastRun: '1 week ago' },
        { name: 'Tax Liability Report', type: 'Tax', lastRun: '3 days ago' },
      ].map((report, i) => (
        <TouchableOpacity key={i} style={[styles.reportCard, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="document-text" size={24} color={theme.colors.primary} />
          <View style={styles.reportInfo}>
            <Text style={[styles.reportName, { color: theme.colors.text }]}>{report.name}</Text>
            <Text style={[styles.reportMeta, { color: theme.colors.textSecondary }]}>
              {report.type} | Last run: {report.lastRun}
            </Text>
          </View>
          <Ionicons name="play-circle" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={[styles.createReportBtn, { borderColor: theme.colors.primary }]}>
        <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
        <Text style={[styles.createReportText, { color: theme.colors.primary }]}>Create Custom Report</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Analytics</Text>
        <TouchableOpacity style={[styles.exportBtn, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="download-outline" size={20} color="#FFFFFF" />
          <Text style={styles.exportText}>Export</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && { backgroundColor: theme.colors.primary }]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.id ? '#FFFFFF' : theme.colors.textSecondary}
            />
            <Text style={[styles.tabLabel, { color: activeTab === tab.id ? '#FFFFFF' : theme.colors.textSecondary }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'labor' && renderLaborCosts()}
        {activeTab === 'turnover' && renderTurnover()}
        {activeTab === 'predictions' && renderPredictions()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  exportText: { color: '#FFFFFF', marginLeft: 6, fontWeight: '600' },
  tabsContainer: { paddingHorizontal: 16, marginBottom: 16 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8 },
  tabLabel: { marginLeft: 6, fontSize: 14, fontWeight: '500' },
  content: { flex: 1, paddingHorizontal: 16 },
  dashboardContent: { paddingBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, marginTop: 8 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  metricCard: { width: (width - 44) / 2, borderRadius: 12, padding: 16, alignItems: 'center' },
  metricIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  metricValue: { fontSize: 24, fontWeight: 'bold' },
  metricLabel: { fontSize: 12, marginTop: 4 },
  changeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  card: { borderRadius: 12, padding: 16, marginBottom: 16 },
  deadlineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  deadlineItem: { fontSize: 14, fontWeight: '500' },
  deadlineDue: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tabContent: { paddingBottom: 20 },
  totalCost: { fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
  costLabel: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  laborRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  laborInfo: { width: 120 },
  deptName: { fontSize: 14, fontWeight: '500' },
  deptCost: { fontSize: 12 },
  barContainer: { flex: 1, height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, marginHorizontal: 12 },
  bar: { height: '100%', borderRadius: 4 },
  percentage: { width: 40, textAlign: 'right', fontSize: 14 },
  turnoverHeader: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  turnoverCard: { flex: 1, borderRadius: 12, padding: 20, alignItems: 'center' },
  turnoverValue: { fontSize: 28, fontWeight: 'bold' },
  turnoverLabel: { fontSize: 14, marginTop: 4 },
  reasonRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  reasonText: { fontSize: 14 },
  reasonPct: { fontSize: 14, fontWeight: '600' },
  alertCard: { flexDirection: 'row', borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 16, alignItems: 'center' },
  alertContent: { marginLeft: 12, flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '600' },
  alertText: { fontSize: 12, marginTop: 2 },
  forecastRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  quarterText: { fontSize: 14, fontWeight: '500' },
  headcountText: { fontSize: 14 },
  changeText: { fontSize: 14, fontWeight: '600' },
  reportCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 16, marginBottom: 12 },
  reportInfo: { flex: 1, marginLeft: 12 },
  reportName: { fontSize: 14, fontWeight: '500' },
  reportMeta: { fontSize: 12, marginTop: 2 },
  createReportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed' },
  createReportText: { marginLeft: 8, fontSize: 14, fontWeight: '600' },
});

export default AnalyticsScreen;
