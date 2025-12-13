/**
 * APP NAVIGATOR V2
 * Side menu navigation with drawer
 */

import React from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import ContractorPortalDashboard from '../screens/contractor/ContractorPortalDashboard';
import ContractorInvoiceScreen from '../screens/contractor/ContractorInvoiceScreen';
import ContractorExpenseScreen from '../screens/contractor/ContractorExpenseScreen';
import Contractor1099Screen from '../screens/contractor/Contractor1099Screen';
import ContractorPaymentHistoryScreen from '../screens/contractor/ContractorPaymentHistoryScreen';
import ContractorW9Screen from '../screens/contractor/ContractorW9Screen';
import ContractorContractsScreen from '../screens/contractor/ContractorContractsScreen';
import YearEndDashboardScreen from '../screens/employer/YearEndDashboardScreen';
import PayrollSummaryDashboard from '../screens/employer/PayrollSummaryDashboard';
import CompanySettingsScreen from '../screens/employer/CompanySettingsScreen';
import ReportsDashboardScreen from '../screens/employer/ReportsDashboardScreen';

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
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

const { width } = Dimensions.get('window');
const isLargeScreen = width >= 768;

// Auth Stack
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
      <Stack.Screen name="ContractorPortal" component={ContractorPortalDashboard} />
      <Stack.Screen name="ContractorInvoices" component={ContractorInvoiceScreen} />
      <Stack.Screen name="ContractorExpenses" component={ContractorExpenseScreen} />
      <Stack.Screen name="Contractor1099" component={Contractor1099Screen} />
      <Stack.Screen name="ContractorPaymentHistory" component={ContractorPaymentHistoryScreen} />
      <Stack.Screen name="ContractorW9" component={ContractorW9Screen} />
      <Stack.Screen name="ContractorContracts" component={ContractorContractsScreen} />
      <Stack.Screen name="YearEndDashboard" component={YearEndDashboardScreen} />
      <Stack.Screen name="PayrollSummaryDashboard" component={PayrollSummaryDashboard} />
      <Stack.Screen name="CompanySettings" component={CompanySettingsScreen} />
      <Stack.Screen name="ReportsDashboard" component={ReportsDashboardScreen} />
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
