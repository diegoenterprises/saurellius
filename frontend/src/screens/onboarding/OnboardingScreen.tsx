/**
 * ONBOARDING SCREEN
 * Employee onboarding workflows and task management
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'active' | 'completed' | 'templates';

interface OnboardingTask {
  id: string;
  name: string;
  category: string;
  status: string;
  required: boolean;
}

interface OnboardingWorkflow {
  id: string;
  employeeName: string;
  position: string;
  startDate: string;
  progress: number;
  status: string;
  tasksCompleted: number;
  totalTasks: number;
}

const MOCK_WORKFLOWS: OnboardingWorkflow[] = [
  { id: '1', employeeName: 'Alex Thompson', position: 'Software Engineer', startDate: '2024-12-18', progress: 45, status: 'in_progress', tasksCompleted: 5, totalTasks: 11 },
  { id: '2', employeeName: 'Jessica Martinez', position: 'Marketing Manager', startDate: '2024-12-20', progress: 20, status: 'in_progress', tasksCompleted: 2, totalTasks: 10 },
  { id: '3', employeeName: 'Ryan Cooper', position: 'Sales Rep', startDate: '2025-01-02', progress: 0, status: 'not_started', tasksCompleted: 0, totalTasks: 9 },
];

const MOCK_COMPLETED: OnboardingWorkflow[] = [
  { id: '4', employeeName: 'Sarah Johnson', position: 'Product Designer', startDate: '2024-11-15', progress: 100, status: 'completed', tasksCompleted: 11, totalTasks: 11 },
  { id: '5', employeeName: 'Mike Davis', position: 'Data Analyst', startDate: '2024-11-01', progress: 100, status: 'completed', tasksCompleted: 10, totalTasks: 10 },
];

const ONBOARDING_TASKS: OnboardingTask[] = [
  { id: '1', name: 'Personal Information', category: 'personal', status: 'completed', required: true },
  { id: '2', name: 'Emergency Contact', category: 'personal', status: 'completed', required: true },
  { id: '3', name: 'Federal W-4', category: 'tax', status: 'completed', required: true },
  { id: '4', name: 'State Tax Form', category: 'tax', status: 'in_progress', required: true },
  { id: '5', name: 'I-9 Section 1', category: 'employment', status: 'pending', required: true },
  { id: '6', name: 'I-9 Section 2', category: 'employment', status: 'blocked', required: true },
  { id: '7', name: 'Direct Deposit', category: 'payment', status: 'pending', required: false },
  { id: '8', name: 'Benefits Enrollment', category: 'benefits', status: 'pending', required: false },
  { id: '9', name: 'Employee Handbook', category: 'policies', status: 'pending', required: true },
  { id: '10', name: 'Company Policies', category: 'policies', status: 'pending', required: true },
  { id: '11', name: 'Orientation', category: 'training', status: 'pending', required: true },
];

export default function OnboardingScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<OnboardingWorkflow | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: '#10B981',
      in_progress: '#3B82F6',
      pending: '#F59E0B',
      not_started: '#6B7280',
      blocked: '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      personal: 'person',
      tax: 'document-text',
      employment: 'briefcase',
      payment: 'card',
      benefits: 'heart',
      policies: 'book',
      training: 'school',
    };
    return icons[category] || 'checkbox';
  };

  const renderActive = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity style={styles.newButton} onPress={() => setShowNewModal(true)}>
        <LinearGradient
          colors={['#1473FF', '#BE01FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.newButtonGradient}
        >
          <Ionicons name="person-add" size={20} color="#FFF" />
          <Text style={styles.newButtonText}>Start New Onboarding</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{MOCK_WORKFLOWS.length}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{MOCK_WORKFLOWS.filter(w => w.progress > 0).length}</Text>
          <Text style={styles.statLabel}>Started</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{Math.round(MOCK_WORKFLOWS.reduce((sum, w) => sum + w.progress, 0) / MOCK_WORKFLOWS.length)}%</Text>
          <Text style={styles.statLabel}>Avg Progress</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Active Onboardings</Text>
      <View style={styles.workflowList}>
        {MOCK_WORKFLOWS.map((workflow) => (
          <TouchableOpacity 
            key={workflow.id} 
            style={styles.workflowCard}
            onPress={() => {
              setSelectedWorkflow(workflow);
              setShowDetailModal(true);
            }}
          >
            <View style={styles.workflowHeader}>
              <View style={styles.employeeAvatar}>
                <Text style={styles.avatarText}>{workflow.employeeName.charAt(0)}</Text>
              </View>
              <View style={styles.employeeInfo}>
                <Text style={styles.employeeName}>{workflow.employeeName}</Text>
                <Text style={styles.employeePosition}>{workflow.position}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(workflow.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(workflow.status) }]}>
                  {workflow.status.replace('_', ' ')}
                </Text>
              </View>
            </View>

            <View style={styles.workflowMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text style={styles.metaText}>Start: {workflow.startDate}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="checkmark-circle-outline" size={14} color="#666" />
                <Text style={styles.metaText}>{workflow.tasksCompleted}/{workflow.totalTasks} tasks</Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressValue}>{workflow.progress}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${workflow.progress}%` }]} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCompleted = () => (
    <View style={styles.tabContent}>
      <View style={styles.completedHeader}>
        <Text style={styles.completedCount}>{MOCK_COMPLETED.length} completed</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={18} color="#666" />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.workflowList}>
        {MOCK_COMPLETED.map((workflow) => (
          <View key={workflow.id} style={styles.completedCard}>
            <View style={styles.completedIcon}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            </View>
            <View style={styles.completedInfo}>
              <Text style={styles.completedName}>{workflow.employeeName}</Text>
              <Text style={styles.completedPosition}>{workflow.position}</Text>
              <Text style={styles.completedDate}>Started: {workflow.startDate}</Text>
            </View>
            <TouchableOpacity style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderTemplates = () => (
    <View style={styles.tabContent}>
      <View style={styles.templateCard}>
        <View style={styles.templateHeader}>
          <View style={styles.templateIcon}>
            <Ionicons name="document-text" size={24} color="#1473FF" />
          </View>
          <View style={styles.templateInfo}>
            <Text style={styles.templateName}>Standard Onboarding</Text>
            <Text style={styles.templateDesc}>Full-time employee template</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={styles.templateTasks}>
          <Text style={styles.templateTaskCount}>11 tasks</Text>
          <View style={styles.taskCategories}>
            {['Personal', 'Tax', 'Employment', 'Benefits', 'Training'].map((cat) => (
              <View key={cat} style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{cat}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.templateCard}>
        <View style={styles.templateHeader}>
          <View style={styles.templateIcon}>
            <Ionicons name="document-text" size={24} color="#8B5CF6" />
          </View>
          <View style={styles.templateInfo}>
            <Text style={styles.templateName}>Contractor Onboarding</Text>
            <Text style={styles.templateDesc}>1099 contractor template</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={styles.templateTasks}>
          <Text style={styles.templateTaskCount}>6 tasks</Text>
          <View style={styles.taskCategories}>
            {['Personal', 'Tax (W-9)', 'Payment'].map((cat) => (
              <View key={cat} style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{cat}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.createTemplateBtn}>
        <Ionicons name="add-circle-outline" size={20} color="#1473FF" />
        <Text style={styles.createTemplateText}>Create Custom Template</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1473FF', '#BE01FF']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Onboarding</Text>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          {[
            { key: 'active', label: 'Active', icon: 'time' },
            { key: 'completed', label: 'Completed', icon: 'checkmark-done' },
            { key: 'templates', label: 'Templates', icon: 'copy' },
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
        {activeTab === 'active' && renderActive()}
        {activeTab === 'completed' && renderCompleted()}
        {activeTab === 'templates' && renderTemplates()}
      </ScrollView>

      {/* New Onboarding Modal */}
      <Modal visible={showNewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Onboarding</Text>
              <TouchableOpacity onPress={() => setShowNewModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Employee Name</Text>
              <TextInput style={styles.formInput} placeholder="Full name" placeholderTextColor="#999" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput style={styles.formInput} placeholder="email@company.com" placeholderTextColor="#999" keyboardType="email-address" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Position</Text>
              <TextInput style={styles.formInput} placeholder="Job title" placeholderTextColor="#999" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Start Date</Text>
              <TextInput style={styles.formInput} placeholder="YYYY-MM-DD" placeholderTextColor="#999" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Template</Text>
              <TouchableOpacity style={styles.selectInput}>
                <Text style={styles.selectText}>Standard Onboarding</Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={() => {
              setShowNewModal(false);
              Alert.alert('Success', 'Onboarding started! An email has been sent to the new employee.');
            }}>
              <LinearGradient
                colors={['#1473FF', '#BE01FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalButtonText}>Start Onboarding</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.detailModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedWorkflow?.employeeName}</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <Text style={styles.detailPosition}>{selectedWorkflow?.position}</Text>

            <View style={styles.detailProgress}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Overall Progress</Text>
                <Text style={styles.progressValue}>{selectedWorkflow?.progress}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${selectedWorkflow?.progress || 0}%` }]} />
              </View>
            </View>

            <Text style={styles.tasksTitle}>Tasks</Text>
            <ScrollView style={styles.tasksList}>
              {ONBOARDING_TASKS.map((task) => (
                <View key={task.id} style={styles.taskItem}>
                  <View style={[styles.taskStatus, { backgroundColor: getStatusColor(task.status) + '20' }]}>
                    <Ionicons 
                      name={task.status === 'completed' ? 'checkmark' : task.status === 'blocked' ? 'lock-closed' : 'time'} 
                      size={14} 
                      color={getStatusColor(task.status)} 
                    />
                  </View>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskName}>{task.name}</Text>
                    <Text style={styles.taskCategory}>{task.category}</Text>
                  </View>
                  {task.required && (
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredText}>Required</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.sendReminderBtn}>
              <Ionicons name="mail-outline" size={20} color="#1473FF" />
              <Text style={styles.sendReminderText}>Send Reminder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  newButton: {
    marginBottom: 16,
  },
  newButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  newButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  workflowList: {
    gap: 12,
  },
  workflowCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  workflowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  employeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1473FF',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  employeePosition: {
    fontSize: 13,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  workflowMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  progressContainer: {},
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    color: '#666',
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1473FF',
    borderRadius: 4,
  },
  completedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  completedCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  completedCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedIcon: {
    marginRight: 12,
  },
  completedInfo: {
    flex: 1,
  },
  completedName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  completedPosition: {
    fontSize: 13,
    color: '#666',
  },
  completedDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  viewButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EBF5FF',
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1473FF',
  },
  templateCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  templateDesc: {
    fontSize: 13,
    color: '#666',
  },
  templateTasks: {},
  templateTaskCount: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  taskCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  categoryTagText: {
    fontSize: 12,
    color: '#666',
  },
  createTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#1473FF',
    borderStyle: 'dashed',
    gap: 8,
  },
  createTemplateText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1473FF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  detailModal: {
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  detailPosition: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  detailProgress: {
    marginBottom: 20,
  },
  tasksTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tasksList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  taskStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  taskCategory: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  requiredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#FEF3C7',
  },
  requiredText: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '500',
  },
  sendReminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EBF5FF',
    gap: 8,
  },
  sendReminderText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1473FF',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  selectInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    fontSize: 16,
    color: '#333',
  },
  modalButton: {
    marginTop: 8,
  },
  modalButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
