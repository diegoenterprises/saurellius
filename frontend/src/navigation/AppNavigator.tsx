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
import ContractorPortalDashboard from '../screens/contractor/ContractorPortalDashboard';

// Legal Screens
import { PrivacyPolicyScreen, TermsConditionsScreen } from '../screens/legal';

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
      <Stack.Screen name="ContractorPortal" component={ContractorPortalDashboard} />
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
