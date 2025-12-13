/**
 * EMPLOYER REPORTS DASHBOARD SCREEN
 * Generate and view payroll, tax, and workforce reports
 * Export capabilities and scheduled report delivery
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
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface ReportCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  reports: Report[];
}

interface Report {
  id: string;
  name: string;
  description: string;
  last_generated?: string;
  frequency?: 'on_demand' | 'weekly' | 'monthly' | 'quarterly';
  format: 'pdf' | 'csv' | 'excel';
}

interface RecentReport {
  id: string;
  name: string;
  generated_at: string;
  format: string;
  size: number;
  download_url: string;
}

const REPORT_CATEGORIES: ReportCategory[] = [
  {
    id: 'payroll',
    name: 'Payroll Reports',
    icon: 'cash',
    color: '#10B981',
    reports: [
      { id: 'payroll_summary', name: 'Payroll Summary', description: 'Overview of payroll by period', format: 'pdf' },
      { id: 'payroll_register', name: 'Payroll Register', description: 'Detailed employee pay breakdown', format: 'excel' },
      { id: 'payroll_journal', name: 'Payroll Journal', description: 'Accounting journal entries', format: 'csv' },
      { id: 'labor_distribution', name: 'Labor Distribution', description: 'Hours and wages by department', format: 'pdf' },
    ],
  },
  {
    id: 'tax',
    name: 'Tax Reports',
    icon: 'calculator',
    color: '#3B82F6',
    reports: [
      { id: 'tax_liability', name: 'Tax Liability', description: 'Federal and state tax obligations', format: 'pdf' },
      { id: '941_preview', name: '941 Preview', description: 'Quarterly federal tax return preview', format: 'pdf' },
      { id: 'state_tax', name: 'State Tax Report', description: 'State withholding summary', format: 'pdf' },
      { id: 'w2_preview', name: 'W-2 Preview', description: 'Year-end W-2 data preview', format: 'pdf' },
    ],
  },
  {
    id: 'employee',
    name: 'Employee Reports',
    icon: 'people',
    color: '#8B5CF6',
    reports: [
      { id: 'employee_roster', name: 'Employee Roster', description: 'Complete employee listing', format: 'excel' },
      { id: 'new_hires', name: 'New Hire Report', description: 'Recently hired employees', format: 'csv' },
      { id: 'terminations', name: 'Termination Report', description: 'Employee separations', format: 'csv' },
      { id: 'anniversary', name: 'Anniversary Report', description: 'Work anniversaries', format: 'pdf' },
    ],
  },
  {
    id: 'time',
    name: 'Time & Attendance',
    icon: 'time',
    color: '#F59E0B',
    reports: [
      { id: 'timesheet_summary', name: 'Timesheet Summary', description: 'Hours worked summary', format: 'pdf' },
      { id: 'overtime_report', name: 'Overtime Report', description: 'Overtime hours and costs', format: 'excel' },
      { id: 'pto_balances', name: 'PTO Balances', description: 'Time off balances by employee', format: 'csv' },
      { id: 'attendance', name: 'Attendance Report', description: 'Attendance patterns', format: 'pdf' },
    ],
  },
  {
    id: 'benefits',
    name: 'Benefits Reports',
    icon: 'heart',
    color: '#EC4899',
    reports: [
      { id: 'benefits_enrollment', name: 'Benefits Enrollment', description: 'Current enrollments by plan', format: 'excel' },
      { id: 'benefits_costs', name: 'Benefits Cost Analysis', description: 'Employer benefit costs', format: 'pdf' },
      { id: 'deductions', name: 'Deductions Report', description: 'All payroll deductions', format: 'csv' },
    ],
  },
];

export default function ReportsDashboardScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchRecentReports = useCallback(async () => {
    try {
      const response = await api.get('/api/employer/reports/recent');
      setRecentReports(response.data.reports || []);
    } catch (error) {
      console.error('Failed to fetch recent reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentReports();
  }, [fetchRecentReports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecentReports();
  };

  const handleGenerateReport = async (report: Report) => {
    setGenerating(report.id);
    try {
      const response = await api.post('/api/employer/reports/generate', {
        report_id: report.id,
        format: report.format,
      });

      if (response.data.download_url) {
        Alert.alert(
          'Report Generated',
          `${report.name} is ready for download`,
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Download',
              onPress: async () => {
                await Share.share({
                  url: response.data.download_url,
                  title: report.name,
                });
              },
            },
          ]
        );
        fetchRecentReports();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setGenerating(null);
    }
  };

  const handleDownloadReport = async (report: RecentReport) => {
    try {
      await Share.share({
        url: report.download_url,
        title: report.name,
      });
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return 'document';
      case 'csv': return 'grid';
      case 'excel': return 'document-text';
      default: return 'document-attach';
    }
  };

  const renderCategoryCard = (category: ReportCategory) => {
    const isSelected = selectedCategory === category.id;
    
    return (
      <View key={category.id}>
        <TouchableOpacity
          style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
          onPress={() => setSelectedCategory(isSelected ? null : category.id)}
        >
          <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
            <Ionicons name={category.icon as any} size={24} color={category.color} />
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.categoryCount}>{category.reports.length} reports</Text>
          </View>
          <Ionicons 
            name={isSelected ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>

        {isSelected && (
          <View style={styles.reportsList}>
            {category.reports.map((report) => (
              <TouchableOpacity
                key={report.id}
                style={styles.reportItem}
                onPress={() => handleGenerateReport(report)}
                disabled={generating === report.id}
              >
                <View style={styles.reportInfo}>
                  <Text style={styles.reportName}>{report.name}</Text>
                  <Text style={styles.reportDesc}>{report.description}</Text>
                </View>
                <View style={styles.reportAction}>
                  {generating === report.id ? (
                    <ActivityIndicator size="small" color="#1473FF" />
                  ) : (
                    <>
                      <View style={styles.formatBadge}>
                        <Text style={styles.formatText}>{report.format.toUpperCase()}</Text>
                      </View>
                      <Ionicons name="download-outline" size={20} color="#1473FF" />
                    </>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

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
          <Text style={styles.headerTitle}>Reports</Text>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <Ionicons name="document-text" size={20} color="#10B981" />
            <Text style={styles.quickStatValue}>{REPORT_CATEGORIES.reduce((acc, cat) => acc + cat.reports.length, 0)}</Text>
            <Text style={styles.quickStatLabel}>Available</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <Ionicons name="time" size={20} color="#F59E0B" />
            <Text style={styles.quickStatValue}>{recentReports.length}</Text>
            <Text style={styles.quickStatLabel}>Recent</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1473FF" />
        }
      >
        {recentReports.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Reports</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recentReports.slice(0, 5).map((report) => (
                <TouchableOpacity
                  key={report.id}
                  style={styles.recentCard}
                  onPress={() => handleDownloadReport(report)}
                >
                  <View style={styles.recentIcon}>
                    <Ionicons name={getFormatIcon(report.format) as any} size={24} color="#1473FF" />
                  </View>
                  <Text style={styles.recentName} numberOfLines={2}>{report.name}</Text>
                  <Text style={styles.recentMeta}>
                    {formatDate(report.generated_at)} • {formatFileSize(report.size)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Categories</Text>
          {REPORT_CATEGORIES.map(renderCategoryCard)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Reports</Text>
          <TouchableOpacity style={styles.customReportCard}>
            <View style={styles.customReportIcon}>
              <Ionicons name="create" size={28} color="#8B5CF6" />
            </View>
            <View style={styles.customReportInfo}>
              <Text style={styles.customReportTitle}>Build Custom Report</Text>
              <Text style={styles.customReportDesc}>
                Create a report with your specific data requirements
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.customReportCard}>
            <View style={[styles.customReportIcon, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="calendar" size={28} color="#F59E0B" />
            </View>
            <View style={styles.customReportInfo}>
              <Text style={styles.customReportTitle}>Schedule Reports</Text>
              <Text style={styles.customReportDesc}>
                Set up automatic report delivery via email
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
  },
  quickStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  quickStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  recentCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    width: 140,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  recentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1473FF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  recentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
    marginBottom: 6,
  },
  recentMeta: {
    fontSize: 11,
    color: '#666',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  categoryCardSelected: {
    borderColor: '#1473FF',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  categoryCount: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 2,
  },
  reportsList: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#1473FF',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFF',
  },
  reportDesc: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
  },
  reportAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  formatBadge: {
    backgroundColor: '#2a2a4e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  formatText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#a0a0a0',
  },
  customReportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  customReportIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#8B5CF620',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  customReportInfo: {
    flex: 1,
  },
  customReportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  customReportDesc: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 2,
  },
});
