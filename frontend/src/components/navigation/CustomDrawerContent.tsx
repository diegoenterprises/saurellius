/**
 * CUSTOM DRAWER CONTENT
 * Beautiful side navigation with sections
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const COLORS = {
  background: '#0F172A',
  backgroundLight: '#1E293B',
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  accent: '#8B5CF6',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  border: '#334155',
};

interface MenuItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: string;
  badge?: number;
  color?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

// ADMIN MENU - Platform owner sees everything
const ADMIN_MENU_SECTIONS: MenuSection[] = [
  {
    title: 'PLATFORM OVERVIEW',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline', screen: 'Dashboard' },
      { id: 'analytics', label: 'Analytics & KPIs', icon: 'stats-chart-outline', screen: 'AdminPortal' },
      { id: 'revenue', label: 'Revenue', icon: 'cash-outline', screen: 'AdminRevenue', color: COLORS.success },
    ],
  },
  {
    title: 'CUSTOMER MANAGEMENT',
    items: [
      { id: 'customers', label: 'Customers', icon: 'people-outline', screen: 'AdminUsers' },
      { id: 'subscriptions', label: 'Subscriptions', icon: 'card-outline', screen: 'AdminSubscriptions' },
      { id: 'apisubscribers', label: 'API Subscribers', icon: 'code-slash-outline', screen: 'AdminAPI' },
    ],
  },
  {
    title: 'SUPPORT',
    items: [
      { id: 'tickets', label: 'Support Tickets', icon: 'ticket-outline', screen: 'AdminSupport' },
      { id: 'messages', label: 'Messages', icon: 'chatbubbles-outline', screen: 'Messages', badge: 3 },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { id: 'apikeys', label: 'API Management', icon: 'key-outline', screen: 'AdminAPI' },
      { id: 'system', label: 'System Health', icon: 'server-outline', screen: 'AdminSystem' },
      { id: 'settings', label: 'Platform Settings', icon: 'settings-outline', screen: 'Settings' },
    ],
  },
];

// EMPLOYER MENU - Business owners managing their company (32 screens)
const EMPLOYER_MENU_SECTIONS: MenuSection[] = [
  {
    title: 'MAIN',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline', screen: 'Dashboard' },
      { id: 'employees', label: 'Employees', icon: 'people-outline', screen: 'EmployeeManagement' },
      { id: 'paystubs', label: 'Paystubs', icon: 'document-text-outline', screen: 'Paystubs' },
      { id: 'orgchart', label: 'Org Chart', icon: 'git-network-outline', screen: 'OrgChart' },
    ],
  },
  {
    title: 'PAYROLL',
    items: [
      { id: 'payrollrun', label: 'Run Payroll', icon: 'play-circle-outline', screen: 'PayrollRun', color: COLORS.success },
      { id: 'wallet', label: 'Wallet', icon: 'wallet-outline', screen: 'Wallet', color: COLORS.success },
      { id: 'timesheet', label: 'Time Clock', icon: 'time-outline', screen: 'Timesheet' },
      { id: 'workforce', label: 'Scheduling', icon: 'calendar-outline', screen: 'Workforce' },
      { id: 'paygrades', label: 'Pay Grades', icon: 'trending-up-outline', screen: 'PayGrades' },
      { id: 'compensation', label: 'Compensation', icon: 'cash-outline', screen: 'CompensationPlanning' },
    ],
  },
  {
    title: 'HR & BENEFITS',
    items: [
      { id: 'onboarding', label: 'Onboarding', icon: 'person-add-outline', screen: 'Onboarding' },
      { id: 'benefits', label: 'Benefits Admin', icon: 'heart-outline', screen: 'BenefitsAdmin' },
      { id: 'pto', label: 'PTO Management', icon: 'airplane-outline', screen: 'PTOManagement' },
      { id: 'garnishment', label: 'Garnishments', icon: 'remove-circle-outline', screen: 'Garnishment' },
      { id: 'training', label: 'Training Admin', icon: 'school-outline', screen: 'TrainingAdmin' },
      { id: 'exitinterviews', label: 'Exit Interviews', icon: 'exit-outline', screen: 'ExitInterviews' },
    ],
  },
  {
    title: 'RECRUITING',
    items: [
      { id: 'jobpostings', label: 'Job Postings', icon: 'megaphone-outline', screen: 'JobPostings' },
      { id: 'applicants', label: 'Applicant Tracking', icon: 'people-circle-outline', screen: 'ApplicantTracking' },
    ],
  },
  {
    title: 'TAX & COMPLIANCE',
    items: [
      { id: 'taxcenter', label: 'Tax Center', icon: 'calculator-outline', screen: 'TaxCenter' },
      { id: 'compliance', label: 'Compliance', icon: 'shield-checkmark-outline', screen: 'ComplianceDashboard' },
      { id: 'reports', label: 'Reports', icon: 'bar-chart-outline', screen: 'ReportsDashboard' },
      { id: 'analytics', label: 'Workforce Analytics', icon: 'analytics-outline', screen: 'WorkforceAnalytics' },
    ],
  },
  {
    title: 'DOCUGINUITY & POLICIES',
    items: [
      { id: 'documents', label: 'DocuGinuity Templates', icon: 'documents-outline', screen: 'DocumentTemplates' },
      { id: 'policies', label: 'Policy Library', icon: 'library-outline', screen: 'PolicyLibrary' },
    ],
  },
  {
    title: 'WORKPLACE',
    items: [
      { id: 'emergency', label: 'Emergency Contacts', icon: 'call-outline', screen: 'EmergencyContacts' },
      { id: 'equipment', label: 'Equipment Checkout', icon: 'laptop-outline', screen: 'EquipmentCheckout' },
      { id: 'visitors', label: 'Visitor Log', icon: 'people-outline', screen: 'VisitorLog' },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      { id: 'messages', label: 'Messages', icon: 'chatbubbles-outline', screen: 'Messages', badge: 3 },
      { id: 'swipe', label: 'Shift Swap', icon: 'swap-horizontal-outline', screen: 'Swipe' },
      { id: 'rewards', label: 'Rewards', icon: 'trophy-outline', screen: 'Rewards', color: COLORS.warning },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      { id: 'accounting', label: 'Accounting', icon: 'pie-chart-outline', screen: 'Accounting' },
      { id: 'contractors', label: 'Contractors', icon: 'briefcase-outline', screen: 'Contractors' },
    ],
  },
];

// EMPLOYEE MENU - Workers viewing their info (37 screens)
const EMPLOYEE_MENU_SECTIONS: MenuSection[] = [
  {
    title: 'MY DASHBOARD',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline', screen: 'EmployeePortal' },
      { id: 'paystubs', label: 'My Paystubs', icon: 'document-text-outline', screen: 'Paystubs' },
      { id: 'wallet', label: 'Wallet', icon: 'wallet-outline', screen: 'Wallet', color: COLORS.success },
      { id: 'profile', label: 'My Profile', icon: 'person-outline', screen: 'Profile' },
    ],
  },
  {
    title: 'TIME & SCHEDULE',
    items: [
      { id: 'timesheet', label: 'Time Clock', icon: 'time-outline', screen: 'Timesheet' },
      { id: 'schedule', label: 'My Schedule', icon: 'calendar-outline', screen: 'Workforce' },
      { id: 'pto', label: 'Time Off', icon: 'airplane-outline', screen: 'PTO' },
      { id: 'shiftswap', label: 'Shift Swap', icon: 'swap-horizontal-outline', screen: 'ShiftSwap' },
    ],
  },
  {
    title: 'BENEFITS & WELLNESS',
    items: [
      { id: 'benefits', label: 'My Benefits', icon: 'heart-outline', screen: 'Benefits' },
      { id: 'wellness', label: 'Wellness', icon: 'fitness-outline', screen: 'Wellness' },
      { id: 'rewards', label: 'Rewards', icon: 'trophy-outline', screen: 'Rewards', color: COLORS.warning },
    ],
  },
  {
    title: 'CAREER & LEARNING',
    items: [
      { id: 'careerpath', label: 'Career Path', icon: 'trending-up-outline', screen: 'CareerPath' },
      { id: 'learning', label: 'Learning Center', icon: 'school-outline', screen: 'LearningCenter' },
      { id: 'certificates', label: 'Certificates', icon: 'ribbon-outline', screen: 'Certificates' },
      { id: 'mentorship', label: 'Mentorship', icon: 'people-outline', screen: 'Mentorship' },
      { id: 'internaljobs', label: 'Internal Jobs', icon: 'briefcase-outline', screen: 'InternalJobs' },
    ],
  },
  {
    title: 'RECOGNITION',
    items: [
      { id: 'recognition', label: 'Recognition', icon: 'medal-outline', screen: 'Recognition' },
      { id: 'kudos', label: 'Kudos Wall', icon: 'heart-circle-outline', screen: 'KudosWall' },
    ],
  },
  {
    title: 'WORKPLACE',
    items: [
      { id: 'officemap', label: 'Office Map', icon: 'map-outline', screen: 'OfficeMap' },
      { id: 'parking', label: 'Parking', icon: 'car-outline', screen: 'Parking' },
      { id: 'itsupport', label: 'IT Support', icon: 'hardware-chip-outline', screen: 'ITSupport' },
    ],
  },
  {
    title: 'RESOURCES',
    items: [
      { id: 'events', label: 'Company Events', icon: 'calendar-outline', screen: 'CompanyEvents' },
      { id: 'resources', label: 'Resource Library', icon: 'library-outline', screen: 'ResourceLibrary' },
      { id: 'askhr', label: 'Ask HR', icon: 'help-circle-outline', screen: 'AskHR' },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      { id: 'messages', label: 'Messages', icon: 'chatbubbles-outline', screen: 'Messages', badge: 3 },
      { id: 'feedback', label: 'Feedback', icon: 'chatbox-outline', screen: 'Feedback' },
      { id: 'surveys', label: 'Pulse Surveys', icon: 'clipboard-outline', screen: 'PulseSurveys' },
    ],
  },
  {
    title: 'EXPENSES',
    items: [
      { id: 'expenses', label: 'Expense Claims', icon: 'receipt-outline', screen: 'ExpenseClaims' },
    ],
  },
];

// CONTRACTOR MENU - Independent contractors (35 screens)
const CONTRACTOR_MENU_SECTIONS: MenuSection[] = [
  {
    title: 'MY DASHBOARD',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline', screen: 'ContractorPortal' },
      { id: 'invoices', label: 'Invoices', icon: 'document-text-outline', screen: 'ContractorInvoices' },
      { id: 'wallet', label: 'Wallet', icon: 'wallet-outline', screen: 'Wallet', color: COLORS.success },
      { id: 'payments', label: 'Payment History', icon: 'card-outline', screen: 'ContractorPaymentHistory' },
    ],
  },
  {
    title: 'WORK & PROJECTS',
    items: [
      { id: 'timesheet', label: 'Time Tracking', icon: 'time-outline', screen: 'Timesheet' },
      { id: 'projects', label: 'Projects', icon: 'folder-outline', screen: 'ContractorProjects' },
      { id: 'clients', label: 'Clients', icon: 'people-outline', screen: 'ContractorClients' },
      { id: 'milestones', label: 'Milestones', icon: 'flag-outline', screen: 'ContractorMilestones' },
      { id: 'availability', label: 'Availability', icon: 'calendar-outline', screen: 'ContractorAvailabilityCalendar' },
    ],
  },
  {
    title: 'BILLING & INVOICING',
    items: [
      { id: 'templates', label: 'Invoice Templates', icon: 'document-outline', screen: 'ContractorInvoiceTemplates' },
      { id: 'schedules', label: 'Payment Schedules', icon: 'timer-outline', screen: 'ContractorPaymentSchedules' },
      { id: 'ratecalc', label: 'Rate Calculator', icon: 'calculator-outline', screen: 'ContractorRateCalculator' },
    ],
  },
  {
    title: 'TAX & FINANCE',
    items: [
      { id: 'taxplanner', label: 'Tax Planner', icon: 'calculator-outline', screen: 'ContractorTaxPlanner' },
      { id: 'taxdocs', label: 'DocuGinuity Tax', icon: 'documents-outline', screen: 'ContractorTaxDocuments' },
      { id: 'expenses', label: 'Business Expenses', icon: 'receipt-outline', screen: 'ContractorBusinessExpenses' },
      { id: 'mileage', label: 'Mileage Tracker', icon: 'car-outline', screen: 'ContractorMileageTracker' },
      { id: '1099', label: '1099 Forms', icon: 'document-text-outline', screen: 'Contractor1099' },
      { id: 'w9', label: 'W-9 Form', icon: 'clipboard-outline', screen: 'ContractorW9' },
    ],
  },
  {
    title: 'AGREEMENTS & LEGAL',
    items: [
      { id: 'contracts', label: 'Contracts', icon: 'document-attach-outline', screen: 'ContractorContracts' },
      { id: 'ndas', label: 'NDAs & Agreements', icon: 'shield-outline', screen: 'ContractorNDAs' },
    ],
  },
  {
    title: 'PROFESSIONAL',
    items: [
      { id: 'certifications', label: 'Certifications', icon: 'ribbon-outline', screen: 'ContractorSkillCertifications' },
      { id: 'portfolio', label: 'Portfolio', icon: 'images-outline', screen: 'ContractorPortfolio' },
      { id: 'reviews', label: 'Reviews', icon: 'star-outline', screen: 'ContractorReviews' },
    ],
  },
  {
    title: 'BUSINESS',
    items: [
      { id: 'subcontractors', label: 'Subcontractors', icon: 'people-outline', screen: 'ContractorSubcontractors' },
      { id: 'equipment', label: 'Equipment', icon: 'laptop-outline', screen: 'ContractorEquipment' },
      { id: 'insurance', label: 'Insurance', icon: 'shield-checkmark-outline', screen: 'ContractorInsurance' },
      { id: 'clientportal', label: 'Client Portal', icon: 'globe-outline', screen: 'ContractorClientPortal' },
    ],
  },
  {
    title: 'REFERRALS',
    items: [
      { id: 'referrals', label: 'Referral Program', icon: 'gift-outline', screen: 'ContractorReferralProgram', color: COLORS.warning },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      { id: 'messages', label: 'Messages', icon: 'chatbubbles-outline', screen: 'Messages' },
    ],
  },
];

// Get menu sections based on user role
const getMenuSections = (isAdmin: boolean, role: string): MenuSection[] => {
  if (isAdmin) return ADMIN_MENU_SECTIONS;
  
  switch (role) {
    case 'employee':
      return EMPLOYEE_MENU_SECTIONS;
    case 'contractor':
      return CONTRACTOR_MENU_SECTIONS;
    case 'employer':
    case 'admin':
    case 'manager':
    default:
      return EMPLOYER_MENU_SECTIONS;
  }
};

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const [activeScreen, setActiveScreen] = useState('Dashboard');
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Get user display info
  const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User' : 'User';
  const userEmail = user?.email || '';
  const userInitials = `${user?.first_name?.[0] || 'U'}${user?.last_name?.[0] || ''}`.toUpperCase();
  
  // Get role-based menu
  const isAdmin = user?.is_admin === true;
  const userRole = (user as any)?.role || 'employer';
  const menuSections = getMenuSections(isAdmin, userRole);

  const handleNavigation = (screen: string) => {
    setActiveScreen(screen);
    navigation.dispatch(
      CommonActions.navigate({
        name: screen,
      })
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Logo Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/logo-icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View style={styles.logoTextContainer}>
            <Text style={styles.brandName}>SAURELLIUS</Text>
            <Text style={styles.brandTagline}>Cloud Payroll</Text>
          </View>
        </View>
      </View>

      {/* Menu Sections */}
      <ScrollView
        style={styles.menuContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.menuContent}
      >
        {menuSections.map((section: MenuSection) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item: MenuItem) => {
              const isActive = activeScreen === item.screen;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, isActive && styles.menuItemActive]}
                  onPress={() => handleNavigation(item.screen)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
                    <Ionicons
                      name={isActive ? item.icon.replace('-outline', '') as any : item.icon}
                      size={20}
                      color={isActive ? COLORS.primary : item.color || COLORS.textMuted}
                    />
                  </View>
                  <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                    {item.label}
                  </Text>
                  {item.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                  {isActive && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Bottom Section */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 16 }]}>
        {/* Settings - All users */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleNavigation('Settings')}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="settings-outline" size={20} color={COLORS.textMuted} />
          </View>
          <Text style={styles.menuLabel}>Settings</Text>
        </TouchableOpacity>

        {/* User Profile Card */}
        <TouchableOpacity
          style={styles.userCard}
          onPress={() => handleNavigation('Profile')}
        >
          <View style={styles.userAvatar}>
            {user?.profile_picture ? (
              <Image 
                source={{ uri: user.profile_picture }} 
                style={styles.userAvatarImage} 
              />
            ) : (
              <Text style={styles.userAvatarText}>{userInitials}</Text>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userEmail}>{userEmail}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
  },
  logoTextContainer: {
    marginLeft: 12,
  },
  brandName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  brandTagline: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  menuContainer: {
    flex: 1,
  },
  menuContent: {
    paddingVertical: 8,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    borderRadius: 12,
    position: 'relative',
  },
  menuItemActive: {
    backgroundColor: COLORS.backgroundLight,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapperActive: {
    backgroundColor: `${COLORS.primary}15`,
  },
  menuLabel: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
  },
  menuLabelActive: {
    color: COLORS.text,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '50%',
    marginTop: -10,
    width: 3,
    height: 20,
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  userAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  userEmail: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});
