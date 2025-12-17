/**
 * APP NAVIGATOR V2
 * Side menu navigation with drawer
 */

import React from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// Custom Side Menu
import CustomDrawerContent from '../components/navigation/CustomDrawerContent';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import EmployerRegisterScreen from '../screens/auth/EmployerRegisterScreen';
import EmployeeRegisterScreen from '../screens/auth/EmployeeRegisterScreen';
import ContractorRegisterScreen from '../screens/auth/ContractorRegisterScreen';

// Main Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import EmployeesScreen from '../screens/employees/EmployeesScreen';
import AddEmployeeScreen from '../screens/employees/AddEmployeeScreen';
import EmployeeDetailScreen from '../screens/employees/EmployeeDetailScreen';
import PaystubsScreen from '../screens/paystubs/PaystubsScreen';
import GeneratePaystubScreen from '../screens/paystubs/GeneratePaystubScreen';
import PaystubDetailScreen from '../screens/paystubs/PaystubDetailScreen';
import StandalonePaystubScreen from '../screens/paystubs/StandalonePaystubScreen';
import RewardsScreen from '../screens/rewards/RewardsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ProfileScreen from '../screens/settings/ProfileScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import LanguageSettingsScreen from '../screens/settings/LanguageSettingsScreen';
import TimezoneSettingsScreen from '../screens/settings/TimezoneSettingsScreen';
import PaymentMethodsScreen from '../screens/settings/PaymentMethodsScreen';
import CompanyInfoScreen from '../screens/settings/CompanyInfoScreen';
import ChangePasswordScreen from '../screens/settings/ChangePasswordScreen';
import SecuritySettingsScreen from '../screens/settings/SecuritySettingsScreen';
import HelpCenterScreen from '../screens/settings/HelpCenterScreen';
import SubscriptionScreen from '../screens/subscription/SubscriptionScreen';
import TimesheetScreen from '../screens/timesheet/TimesheetScreen';

// Enterprise Feature Screens
import { AccountingScreen } from '../screens/accounting';
import { ContractorsScreen } from '../screens/contractors';
import { TaxCenterScreen } from '../screens/taxcenter';
import { PTOScreen } from '../screens/pto';
import { PayrollRunScreen } from '../screens/payroll';
import { OnboardingScreen } from '../screens/onboarding';
import { ReportsScreen } from '../screens/reports';

// Admin Portal
import { AdminPortalScreen, AdminSupportScreen } from '../screens/admin';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminRevenueScreen from '../screens/admin/AdminRevenueScreen';
import AdminAPIScreen from '../screens/admin/AdminAPIScreen';
import AdminSystemScreen from '../screens/admin/AdminSystemScreen';
import AdminSubscriptionsScreen from '../screens/admin/AdminSubscriptionsScreen';
import UsersAnalyticsScreen from '../screens/admin/UsersAnalyticsScreen';

// Additional Enterprise Screens
import { SwipeScreen } from '../screens/swipe';
import { WorkforceScreen } from '../screens/workforce';
import { MessagesScreen } from '../screens/messaging';
import { ComplianceScreen } from '../screens/compliance';
import { GarnishmentScreen } from '../screens/garnishment';
import BenefitsScreen from '../screens/benefits/BenefitsScreen';

// Wallet Screen
import { WalletScreen } from '../screens/wallet';

// Self-Service Screens
import EmployeePortalDashboard from '../screens/employee/EmployeePortalDashboard';
import OnboardingWizard from '../screens/employee/OnboardingWizard';
import BenefitsEnrollmentScreen from '../screens/employee/BenefitsEnrollmentScreen';
import TimeOffRequestScreen from '../screens/employee/TimeOffRequestScreen';
import PayHistoryScreen from '../screens/employee/PayHistoryScreen';
import DirectDepositSetupScreen from '../screens/employee/DirectDepositSetupScreen';
import W4WizardScreen from '../screens/employee/W4WizardScreen';
import EmployeeProfileScreen from '../screens/employee/EmployeeProfileScreen';
import DocumentCenterScreen from '../screens/employee/DocumentCenterScreen';
import TimesheetEntryScreen from '../screens/employee/TimesheetEntryScreen';
import EmergencyInfoScreen from '../screens/employee/EmergencyInfoScreen';
import TaxDocumentsScreen from '../screens/employee/TaxDocumentsScreen';
import TrainingProgressScreen from '../screens/employee/TrainingProgressScreen';
import PerformanceReviewsScreen from '../screens/employee/PerformanceReviewsScreen';
import GoalsTrackingScreen from '../screens/employee/GoalsTrackingScreen';
import NotificationsCenterScreen from '../screens/employee/NotificationsCenterScreen';
import TeamDirectoryScreen from '../screens/employee/TeamDirectoryScreen';
import CompanyNewsScreen from '../screens/employee/CompanyNewsScreen';
import ExpenseClaimsScreen from '../screens/employee/ExpenseClaimsScreen';
import ShiftSwapScreen from '../screens/employee/ShiftSwapScreen';
import FeedbackScreen from '../screens/employee/FeedbackScreen';
import LearningCenterScreen from '../screens/employee/LearningCenterScreen';
import WellnessScreen from '../screens/employee/WellnessScreen';
import CertificatesScreen from '../screens/employee/CertificatesScreen';
import CareerPathScreen from '../screens/employee/CareerPathScreen';
import MentorshipScreen from '../screens/employee/MentorshipScreen';
import RecognitionScreen from '../screens/employee/RecognitionScreen';
import InternalJobsScreen from '../screens/employee/InternalJobsScreen';
import PulseSurveysScreen from '../screens/employee/PulseSurveysScreen';
import KudosWallScreen from '../screens/employee/KudosWallScreen';
import CompanyEventsScreen from '../screens/employee/CompanyEventsScreen';
import ResourceLibraryScreen from '../screens/employee/ResourceLibraryScreen';
import AskHRScreen from '../screens/employee/AskHRScreen';
import OfficeMapScreen from '../screens/employee/OfficeMapScreen';
import ParkingScreen from '../screens/employee/ParkingScreen';
import ITSupportScreen from '../screens/employee/ITSupportScreen';
import ContractorPortalDashboard from '../screens/contractor/ContractorPortalDashboard';
import ContractorInvoiceScreen from '../screens/contractor/ContractorInvoiceScreen';
import ContractorExpenseScreen from '../screens/contractor/ContractorExpenseScreen';
import Contractor1099Screen from '../screens/contractor/Contractor1099Screen';
import ContractorPaymentHistoryScreen from '../screens/contractor/ContractorPaymentHistoryScreen';
import ContractorW9Screen from '../screens/contractor/ContractorW9Screen';
import ContractorContractsScreen from '../screens/contractor/ContractorContractsScreen';
import ContractorAvailabilityScreen from '../screens/contractor/ContractorAvailabilityScreen';
import ContractorProjectsScreen from '../screens/contractor/ContractorProjectsScreen';
import ContractorClientsScreen from '../screens/contractor/ContractorClientsScreen';
import ContractorRetainersScreen from '../screens/contractor/ContractorRetainersScreen';
import ContractorProposalsScreen from '../screens/contractor/ContractorProposalsScreen';
import ContractorTimeTrackerScreen from '../screens/contractor/ContractorTimeTrackerScreen';
import ContractorEarningsScreen from '../screens/contractor/ContractorEarningsScreen';
import ContractorMessagesScreen from '../screens/contractor/ContractorMessagesScreen';
import ContractorPortfolioScreen from '../screens/contractor/ContractorPortfolioScreen';
import ContractorReviewsScreen from '../screens/contractor/ContractorReviewsScreen';
import ContractorMilestonesScreen from '../screens/contractor/ContractorMilestonesScreen';
import ContractorSubcontractorsScreen from '../screens/contractor/ContractorSubcontractorsScreen';
import ContractorEquipmentScreen from '../screens/contractor/ContractorEquipmentScreen';
import ContractorInsuranceScreen from '../screens/contractor/ContractorInsuranceScreen';
import ContractorTaxPlannerScreen from '../screens/contractor/ContractorTaxPlannerScreen';
import ContractorBusinessExpensesScreen from '../screens/contractor/ContractorBusinessExpensesScreen';
import ContractorMileageTrackerScreen from '../screens/contractor/ContractorMileageTrackerScreen';
import ContractorClientPortalScreen from '../screens/contractor/ContractorClientPortalScreen';
import ContractorRateCalculatorScreen from '../screens/contractor/ContractorRateCalculatorScreen';
import ContractorAvailabilityCalendarScreen from '../screens/contractor/ContractorAvailabilityCalendarScreen';
import ContractorInvoiceTemplatesScreen from '../screens/contractor/ContractorInvoiceTemplatesScreen';
import ContractorPaymentSchedulesScreen from '../screens/contractor/ContractorPaymentSchedulesScreen';
import ContractorTaxDocumentsScreen from '../screens/contractor/ContractorTaxDocumentsScreen';
import ContractorNDAsScreen from '../screens/contractor/ContractorNDAsScreen';
import ContractorSkillCertificationsScreen from '../screens/contractor/ContractorSkillCertificationsScreen';
import ContractorReferralProgramScreen from '../screens/contractor/ContractorReferralProgramScreen';
import YearEndDashboardScreen from '../screens/employer/YearEndDashboardScreen';
import PayrollSummaryDashboard from '../screens/employer/PayrollSummaryDashboard';
import CompanySettingsScreen from '../screens/employer/CompanySettingsScreen';
import ReportsDashboardScreen from '../screens/employer/ReportsDashboardScreen';
import EmployeeManagementScreen from '../screens/employer/EmployeeManagementScreen';
import PayrollHistoryScreen from '../screens/employer/PayrollHistoryScreen';
import OnboardingChecklistScreen from '../screens/employer/OnboardingChecklistScreen';
import TaxDepositsScreen from '../screens/employer/TaxDepositsScreen';
import ComplianceDashboardScreen from '../screens/employer/ComplianceDashboardScreen';
import DepartmentManagementScreen from '../screens/employer/DepartmentManagementScreen';
import AnalyticsDashboardScreen from '../screens/employer/AnalyticsDashboardScreen';
import AnnouncementBoardScreen from '../screens/employer/AnnouncementBoardScreen';
import SchedulingScreen from '../screens/employer/SchedulingScreen';
import AuditLogsScreen from '../screens/employer/AuditLogsScreen';
import BulkActionsScreen from '../screens/employer/BulkActionsScreen';
import PTOManagementScreen from '../screens/employer/PTOManagementScreen';
import PayGradesScreen from '../screens/employer/PayGradesScreen';
import JobPostingsScreen from '../screens/employer/JobPostingsScreen';
import ApplicantTrackingScreen from '../screens/employer/ApplicantTrackingScreen';
import BenefitsAdminScreen from '../screens/employer/BenefitsAdminScreen';
import CompensationPlanningScreen from '../screens/employer/CompensationPlanningScreen';
import OrgChartScreen from '../screens/employer/OrgChartScreen';
import ExitInterviewsScreen from '../screens/employer/ExitInterviewsScreen';
import TrainingAdminScreen from '../screens/employer/TrainingAdminScreen';
import DocumentTemplatesScreen from '../screens/employer/DocumentTemplatesScreen';
import PolicyLibraryScreen from '../screens/employer/PolicyLibraryScreen';
import WorkforceAnalyticsScreen from '../screens/employer/WorkforceAnalyticsScreen';
import EmergencyContactsScreen from '../screens/employer/EmergencyContactsScreen';
import EquipmentCheckoutScreen from '../screens/employer/EquipmentCheckoutScreen';
import VisitorLogScreen from '../screens/employer/VisitorLogScreen';

// Rulesets (DB-backed rules visibility)
import AdminRulesetsScreen from '../screens/admin/AdminRulesetsScreen';
import EmployerPayrollRulesScreen from '../screens/employer/EmployerPayrollRulesScreen';
import EmployeePayrollRulesScreen from '../screens/employee/EmployeePayrollRulesScreen';
import ContractorPayrollRulesScreen from '../screens/contractor/ContractorPayrollRulesScreen';

// Legal Screens
import { PrivacyPolicyScreen, TermsConditionsScreen } from '../screens/legal';

// Missing Screens - Added in Audit
import { AuditTrailScreen } from '../screens/audit';
import { DirectDepositScreen } from '../screens/directdeposit';
import { W4FormScreen, I9VerificationScreen } from '../screens/taxforms';
import { PayrollCorrectionsScreen } from '../screens/corrections';
import { TalentScreen } from '../screens/talent';
import { TerminationScreen } from '../screens/termination';
import { TimeClockScreen } from '../screens/timeclock';
import { YearEndScreen } from '../screens/yearend';

// Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Dashboard: undefined;
  Employees: undefined;
  AddEmployee: undefined;
  EmployeeDetail: { employeeId: number };
  Paystubs: undefined;
  GeneratePaystub: { employeeId?: number };
  PaystubDetail: { paystubId: number };
  StandalonePaystub: undefined;
  Rewards: undefined;
  Settings: undefined;
  Profile: undefined;
  Subscription: undefined;
  Timesheet: undefined;
  Wallet: undefined;
  Accounting: undefined;
  Contractors: undefined;
  TaxCenter: undefined;
  PTO: undefined;
  PayrollRun: undefined;
  Onboarding: undefined;
  Reports: undefined;
  Swipe: undefined;
  Workforce: undefined;
  Messages: undefined;
  Compliance: undefined;
  Garnishment: undefined;
  Benefits: undefined;
  AdminPortal: undefined;
  AdminSupport: undefined;
  AdminUsers: undefined;
  AdminRevenue: undefined;
  AdminAPI: undefined;
  AdminSystem: undefined;
  AdminSubscriptions: undefined;
  PrivacyPolicy: undefined;
  TermsConditions: undefined;
  // Self-Service Portals
  EmployeePortal: undefined;
  EmployeeOnboarding: undefined;
  ContractorPortal: undefined;
  NotificationSettings: undefined;
  LanguageSettings: undefined;
  TimezoneSettings: undefined;
  PaymentMethods: undefined;
  CompanyInfo: undefined;
  ChangePassword: undefined;
  SecuritySettings: undefined;
  HelpCenter: undefined;
  // Added in Audit
  AuditTrail: undefined;
  DirectDeposit: undefined;
  W4Form: undefined;
  I9Verification: undefined;
  PayrollCorrections: undefined;
  Talent: undefined;
  Termination: undefined;
  TimeClock: undefined;
  YearEnd: undefined;
  // New Registration Screens
  EmployerRegister: undefined;
  EmployeeRegister: { token?: string };
  ContractorRegister: { token?: string };
  // Contractor Portal Screens
  ContractorInvoices: undefined;
  ContractorExpenses: undefined;
  // Employee Self-Service Screens
  BenefitsEnrollment: undefined;
  TimeOffRequest: undefined;
  PayHistory: undefined;
  // Additional Contractor Screens
  Contractor1099: undefined;
  // Employer Screens
  YearEndDashboard: undefined;
  DirectDepositSetup: undefined;
  W4Wizard: undefined;
  EmployeeProfile: undefined;
  PayrollSummaryDashboard: undefined;
  ContractorPaymentHistory: undefined;
  DocumentCenter: undefined;
  CompanySettings: undefined;
  ContractorW9: undefined;
  TimesheetEntry: undefined;
  ReportsDashboard: undefined;
  ContractorContracts: undefined;
  EmergencyInfo: undefined;
  EmployeeManagement: undefined;
  ContractorAvailability: undefined;
  TaxDocuments: undefined;
  PayrollHistory: undefined;
  ContractorProjects: undefined;
  TrainingProgress: undefined;
  OnboardingChecklist: undefined;
  ContractorClients: undefined;
  PerformanceReviews: undefined;
  GoalsTracking: undefined;
  NotificationsCenter: undefined;
  TaxDeposits: undefined;
  ComplianceDashboard: undefined;
  DepartmentManagement: undefined;
  ContractorRetainers: undefined;
  ContractorProposals: undefined;
  ContractorTimeTracker: undefined;
  TeamDirectory: undefined;
  CompanyNews: undefined;
  AnalyticsDashboard: undefined;
  AnnouncementBoard: undefined;
  ContractorEarnings: undefined;
  ContractorMessages: undefined;
  ExpenseClaims: undefined;
  ShiftSwap: undefined;
  Feedback: undefined;
  Scheduling: undefined;
  AuditLogs: undefined;
  BulkActions: undefined;
  ContractorPortfolio: undefined;
  ContractorReviews: undefined;
  ContractorMilestones: undefined;
  LearningCenter: undefined;
  Wellness: undefined;
  Certificates: undefined;
  PTOManagement: undefined;
  PayGrades: undefined;
  JobPostings: undefined;
  ContractorSubcontractors: undefined;
  ContractorEquipment: undefined;
  ContractorInsurance: undefined;
  CareerPath: undefined;
  Mentorship: undefined;
  Recognition: undefined;
  ApplicantTracking: undefined;
  BenefitsAdmin: undefined;
  CompensationPlanning: undefined;
  ContractorTaxPlanner: undefined;
  ContractorBusinessExpenses: undefined;
  ContractorMileageTracker: undefined;
  InternalJobs: undefined;
  PulseSurveys: undefined;
  KudosWall: undefined;
  OrgChart: undefined;
  ExitInterviews: undefined;
  TrainingAdmin: undefined;
  ContractorClientPortal: undefined;
  ContractorRateCalculator: undefined;
  ContractorAvailabilityCalendar: undefined;
  CompanyEvents: undefined;
  ResourceLibrary: undefined;
  AskHR: undefined;
  DocumentTemplates: undefined;
  PolicyLibrary: undefined;
  WorkforceAnalytics: undefined;
  ContractorInvoiceTemplates: undefined;
  ContractorPaymentSchedules: undefined;
  ContractorTaxDocuments: undefined;
  OfficeMap: undefined;
  Parking: undefined;
  ITSupport: undefined;
  EmergencyContacts: undefined;
  EquipmentCheckout: undefined;
  VisitorLog: undefined;
  ContractorNDAs: undefined;
  ContractorSkillCertifications: undefined;
  ContractorReferralProgram: undefined;
  UsersAnalytics: undefined;
  AnalyticsUsers: undefined;

  // Rulesets
  AdminRulesets: undefined;
  EmployerPayrollRules: undefined;
  EmployeePayrollRules: undefined;
  ContractorPayrollRules: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

const { width } = Dimensions.get('window');
const isLargeScreen = width >= 768;

// Auth Stack
function AuthStack() {
  return (
    <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 300,
        }}
      >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="EmployerRegister" component={EmployerRegisterScreen} />
      <Stack.Screen name="EmployeeRegister" component={EmployeeRegisterScreen} />
      <Stack.Screen name="ContractorRegister" component={ContractorRegisterScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
    </Stack.Navigator>
  );
}

// Main Stack with all screens
function MainStack() {
  return (
    <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 250,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Employees" component={EmployeesScreen} />
      <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} />
      <Stack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} />
      <Stack.Screen name="Paystubs" component={PaystubsScreen} />
      <Stack.Screen name="GeneratePaystub" component={GeneratePaystubScreen} />
      <Stack.Screen name="PaystubDetail" component={PaystubDetailScreen} />
      <Stack.Screen name="StandalonePaystub" component={StandalonePaystubScreen} />
      <Stack.Screen name="Rewards" component={RewardsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="Timesheet" component={TimesheetScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Accounting" component={AccountingScreen} />
      <Stack.Screen name="Contractors" component={ContractorsScreen} />
      <Stack.Screen name="TaxCenter" component={TaxCenterScreen} />
      <Stack.Screen name="PTO" component={PTOScreen} />
      <Stack.Screen name="PayrollRun" component={PayrollRunScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="Swipe" component={SwipeScreen} />
      <Stack.Screen name="Workforce" component={WorkforceScreen} />
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="Compliance" component={ComplianceScreen} />
      <Stack.Screen name="Garnishment" component={GarnishmentScreen} />
      <Stack.Screen name="Benefits" component={BenefitsScreen} />
      <Stack.Screen name="AdminPortal" component={AdminPortalScreen} />
      <Stack.Screen name="AdminSupport" component={AdminSupportScreen} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <Stack.Screen name="AdminRevenue" component={AdminRevenueScreen} />
      <Stack.Screen name="AdminAPI" component={AdminAPIScreen} />
      <Stack.Screen name="AdminSystem" component={AdminSystemScreen} />
      <Stack.Screen name="AdminSubscriptions" component={AdminSubscriptionsScreen} />
      <Stack.Screen name="UsersAnalytics" component={UsersAnalyticsScreen} />
      <Stack.Screen name="AnalyticsUsers" component={UsersAnalyticsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
      <Stack.Screen name="EmployeePortal" component={EmployeePortalDashboard} />
      <Stack.Screen name="EmployeeOnboarding" component={OnboardingWizard} />
      <Stack.Screen name="BenefitsEnrollment" component={BenefitsEnrollmentScreen} />
      <Stack.Screen name="TimeOffRequest" component={TimeOffRequestScreen} />
      <Stack.Screen name="PayHistory" component={PayHistoryScreen} />
      <Stack.Screen name="DirectDepositSetup" component={DirectDepositSetupScreen} />
      <Stack.Screen name="W4Wizard" component={W4WizardScreen} />
      <Stack.Screen name="EmployeeProfile" component={EmployeeProfileScreen} />
      <Stack.Screen name="DocumentCenter" component={DocumentCenterScreen} />
      <Stack.Screen name="TimesheetEntry" component={TimesheetEntryScreen} />
      <Stack.Screen name="EmergencyInfo" component={EmergencyInfoScreen} />
      <Stack.Screen name="TaxDocuments" component={TaxDocumentsScreen} />
      <Stack.Screen name="TrainingProgress" component={TrainingProgressScreen} />
      <Stack.Screen name="PerformanceReviews" component={PerformanceReviewsScreen} />
      <Stack.Screen name="GoalsTracking" component={GoalsTrackingScreen} />
      <Stack.Screen name="NotificationsCenter" component={NotificationsCenterScreen} />
      <Stack.Screen name="TeamDirectory" component={TeamDirectoryScreen} />
      <Stack.Screen name="CompanyNews" component={CompanyNewsScreen} />
      <Stack.Screen name="ExpenseClaims" component={ExpenseClaimsScreen} />
      <Stack.Screen name="ShiftSwap" component={ShiftSwapScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="LearningCenter" component={LearningCenterScreen} />
      <Stack.Screen name="Wellness" component={WellnessScreen} />
      <Stack.Screen name="Certificates" component={CertificatesScreen} />
      <Stack.Screen name="CareerPath" component={CareerPathScreen} />
      <Stack.Screen name="Mentorship" component={MentorshipScreen} />
      <Stack.Screen name="Recognition" component={RecognitionScreen} />
      <Stack.Screen name="InternalJobs" component={InternalJobsScreen} />
      <Stack.Screen name="PulseSurveys" component={PulseSurveysScreen} />
      <Stack.Screen name="KudosWall" component={KudosWallScreen} />
      <Stack.Screen name="CompanyEvents" component={CompanyEventsScreen} />
      <Stack.Screen name="ResourceLibrary" component={ResourceLibraryScreen} />
      <Stack.Screen name="AskHR" component={AskHRScreen} />
      <Stack.Screen name="OfficeMap" component={OfficeMapScreen} />
      <Stack.Screen name="Parking" component={ParkingScreen} />
      <Stack.Screen name="ITSupport" component={ITSupportScreen} />
      <Stack.Screen name="ContractorPortal" component={ContractorPortalDashboard} />
      <Stack.Screen name="ContractorInvoices" component={ContractorInvoiceScreen} />
      <Stack.Screen name="ContractorExpenses" component={ContractorExpenseScreen} />
      <Stack.Screen name="Contractor1099" component={Contractor1099Screen} />
      <Stack.Screen name="ContractorPaymentHistory" component={ContractorPaymentHistoryScreen} />
      <Stack.Screen name="ContractorW9" component={ContractorW9Screen} />
      <Stack.Screen name="ContractorContracts" component={ContractorContractsScreen} />
      <Stack.Screen name="ContractorAvailability" component={ContractorAvailabilityScreen} />
      <Stack.Screen name="ContractorProjects" component={ContractorProjectsScreen} />
      <Stack.Screen name="ContractorClients" component={ContractorClientsScreen} />
      <Stack.Screen name="ContractorRetainers" component={ContractorRetainersScreen} />
      <Stack.Screen name="ContractorProposals" component={ContractorProposalsScreen} />
      <Stack.Screen name="ContractorTimeTracker" component={ContractorTimeTrackerScreen} />
      <Stack.Screen name="ContractorEarnings" component={ContractorEarningsScreen} />
      <Stack.Screen name="ContractorMessages" component={ContractorMessagesScreen} />
      <Stack.Screen name="ContractorPortfolio" component={ContractorPortfolioScreen} />
      <Stack.Screen name="ContractorReviews" component={ContractorReviewsScreen} />
      <Stack.Screen name="ContractorMilestones" component={ContractorMilestonesScreen} />
      <Stack.Screen name="ContractorSubcontractors" component={ContractorSubcontractorsScreen} />
      <Stack.Screen name="ContractorEquipment" component={ContractorEquipmentScreen} />
      <Stack.Screen name="ContractorInsurance" component={ContractorInsuranceScreen} />
      <Stack.Screen name="ContractorTaxPlanner" component={ContractorTaxPlannerScreen} />
      <Stack.Screen name="ContractorBusinessExpenses" component={ContractorBusinessExpensesScreen} />
      <Stack.Screen name="ContractorMileageTracker" component={ContractorMileageTrackerScreen} />
      <Stack.Screen name="ContractorClientPortal" component={ContractorClientPortalScreen} />
      <Stack.Screen name="ContractorRateCalculator" component={ContractorRateCalculatorScreen} />
      <Stack.Screen name="ContractorAvailabilityCalendar" component={ContractorAvailabilityCalendarScreen} />
      <Stack.Screen name="ContractorInvoiceTemplates" component={ContractorInvoiceTemplatesScreen} />
      <Stack.Screen name="ContractorPaymentSchedules" component={ContractorPaymentSchedulesScreen} />
      <Stack.Screen name="ContractorTaxDocuments" component={ContractorTaxDocumentsScreen} />
      <Stack.Screen name="ContractorNDAs" component={ContractorNDAsScreen} />
      <Stack.Screen name="ContractorSkillCertifications" component={ContractorSkillCertificationsScreen} />
      <Stack.Screen name="ContractorReferralProgram" component={ContractorReferralProgramScreen} />
      <Stack.Screen name="YearEndDashboard" component={YearEndDashboardScreen} />
      <Stack.Screen name="PayrollSummaryDashboard" component={PayrollSummaryDashboard} />
      <Stack.Screen name="CompanySettings" component={CompanySettingsScreen} />
      <Stack.Screen name="ReportsDashboard" component={ReportsDashboardScreen} />
      <Stack.Screen name="EmployeeManagement" component={EmployeeManagementScreen} />
      <Stack.Screen name="PayrollHistory" component={PayrollHistoryScreen} />
      <Stack.Screen name="OnboardingChecklist" component={OnboardingChecklistScreen} />
      <Stack.Screen name="TaxDeposits" component={TaxDepositsScreen} />
      <Stack.Screen name="ComplianceDashboard" component={ComplianceDashboardScreen} />
      <Stack.Screen name="DepartmentManagement" component={DepartmentManagementScreen} />
      <Stack.Screen name="AnalyticsDashboard" component={AnalyticsDashboardScreen} />
      <Stack.Screen name="AnnouncementBoard" component={AnnouncementBoardScreen} />
      <Stack.Screen name="Scheduling" component={SchedulingScreen} />
      <Stack.Screen name="AuditLogs" component={AuditLogsScreen} />
      <Stack.Screen name="BulkActions" component={BulkActionsScreen} />
      <Stack.Screen name="PTOManagement" component={PTOManagementScreen} />
      <Stack.Screen name="PayGrades" component={PayGradesScreen} />
      <Stack.Screen name="JobPostings" component={JobPostingsScreen} />
      <Stack.Screen name="ApplicantTracking" component={ApplicantTrackingScreen} />
      <Stack.Screen name="BenefitsAdmin" component={BenefitsAdminScreen} />
      <Stack.Screen name="CompensationPlanning" component={CompensationPlanningScreen} />
      <Stack.Screen name="OrgChart" component={OrgChartScreen} />
      <Stack.Screen name="ExitInterviews" component={ExitInterviewsScreen} />
      <Stack.Screen name="TrainingAdmin" component={TrainingAdminScreen} />
      <Stack.Screen name="DocumentTemplates" component={DocumentTemplatesScreen} />
      <Stack.Screen name="PolicyLibrary" component={PolicyLibraryScreen} />
      <Stack.Screen name="WorkforceAnalytics" component={WorkforceAnalyticsScreen} />
      <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
      <Stack.Screen name="EquipmentCheckout" component={EquipmentCheckoutScreen} />
      <Stack.Screen name="VisitorLog" component={VisitorLogScreen} />
      <Stack.Screen name="AdminRulesets" component={AdminRulesetsScreen} />
      <Stack.Screen name="EmployerPayrollRules" component={EmployerPayrollRulesScreen} />
      <Stack.Screen name="EmployeePayrollRules" component={EmployeePayrollRulesScreen} />
      <Stack.Screen name="ContractorPayrollRules" component={ContractorPayrollRulesScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
      <Stack.Screen name="TimezoneSettings" component={TimezoneSettingsScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="CompanyInfo" component={CompanyInfoScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
      <Stack.Screen name="AuditTrail" component={AuditTrailScreen} />
      <Stack.Screen name="DirectDeposit" component={DirectDepositScreen} />
      <Stack.Screen name="W4Form" component={W4FormScreen} />
      <Stack.Screen name="I9Verification" component={I9VerificationScreen} />
      <Stack.Screen name="PayrollCorrections" component={PayrollCorrectionsScreen} />
      <Stack.Screen name="Talent" component={TalentScreen} />
      <Stack.Screen name="Termination" component={TerminationScreen} />
      <Stack.Screen name="TimeClock" component={TimeClockScreen} />
      <Stack.Screen name="YearEnd" component={YearEndScreen} />
    </Stack.Navigator>
  );
}

// Main Drawer Navigator
function MainDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 280,
          backgroundColor: '#0F172A',
        },
        overlayColor: 'rgba(0,0,0,0.5)',
        swipeEnabled: true,
        swipeEdgeWidth: 80,
      }}
    >
      <Drawer.Screen name="MainStack" component={MainStack} />
    </Drawer.Navigator>
  );
}

// Root Navigator
export default function AppNavigator() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainDrawer} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
