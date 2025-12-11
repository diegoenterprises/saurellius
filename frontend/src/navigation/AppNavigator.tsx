/**
 * 🧭 APP NAVIGATOR
 * Main navigation structure for the app
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

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
import { AdminPortalScreen } from '../screens/admin';

// Additional Enterprise Screens
import { SwipeScreen } from '../screens/swipe';
import { WorkforceScreen } from '../screens/workforce';
import { MessagesScreen } from '../screens/messaging';
import { ComplianceScreen } from '../screens/compliance';
import { GarnishmentScreen } from '../screens/garnishment';
import BenefitsScreen from '../screens/benefits/BenefitsScreen';

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
  // Enterprise Features
  Accounting: undefined;
  Contractors: undefined;
  TaxCenter: undefined;
  PTO: undefined;
  PayrollRun: undefined;
  Onboarding: undefined;
  Reports: undefined;
  // Additional Enterprise
  Swipe: undefined;
  Workforce: undefined;
  Messages: undefined;
  Compliance: undefined;
  Garnishment: undefined;
  Benefits: undefined;
  // Admin
  AdminPortal: undefined;
  // Legal
  PrivacyPolicy: undefined;
  TermsConditions: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Auth Stack
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      {/* Legal */}
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
    </Stack.Navigator>
  );
}

// Dashboard Stack
function DashboardStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      {/* Quick Actions from Dashboard */}
      <Stack.Screen name="GeneratePaystub" component={GeneratePaystubScreen} />
      <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} />
      <Stack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      {/* Enterprise Features */}
      <Stack.Screen name="Accounting" component={AccountingScreen} />
      <Stack.Screen name="Contractors" component={ContractorsScreen} />
      <Stack.Screen name="TaxCenter" component={TaxCenterScreen} />
      <Stack.Screen name="PTO" component={PTOScreen} />
      <Stack.Screen name="PayrollRun" component={PayrollRunScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      {/* Additional Enterprise */}
      <Stack.Screen name="Swipe" component={SwipeScreen} />
      <Stack.Screen name="Workforce" component={WorkforceScreen} />
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="Compliance" component={ComplianceScreen} />
      <Stack.Screen name="Garnishment" component={GarnishmentScreen} />
      <Stack.Screen name="Benefits" component={BenefitsScreen} />
      {/* Admin */}
      <Stack.Screen name="AdminPortal" component={AdminPortalScreen} />
      {/* Legal */}
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
    </Stack.Navigator>
  );
}

// Employees Stack
function EmployeesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Employees" component={EmployeesScreen} />
      <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} />
      <Stack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} />
    </Stack.Navigator>
  );
}

// Paystubs Stack
function PaystubsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Paystubs" component={PaystubsScreen} />
      <Stack.Screen name="GeneratePaystub" component={GeneratePaystubScreen} />
      <Stack.Screen name="PaystubDetail" component={PaystubDetailScreen} />
      <Stack.Screen name="StandalonePaystub" component={StandalonePaystubScreen} />
    </Stack.Navigator>
  );
}

// Settings Stack
function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      {/* Legal */}
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'DashboardTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'EmployeesTab':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'PaystubsTab':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'RewardsTab':
              iconName = focused ? 'gift' : 'gift-outline';
              break;
            case 'SettingsTab':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1473FF',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#2a2a4e',
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={DashboardStack}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="EmployeesTab" 
        component={EmployeesStack}
        options={{ tabBarLabel: 'Employees' }}
      />
      <Tab.Screen 
        name="PaystubsTab" 
        component={PaystubsStack}
        options={{ tabBarLabel: 'Paystubs' }}
      />
      <Tab.Screen 
        name="RewardsTab" 
        component={RewardsScreen}
        options={{ tabBarLabel: 'Rewards' }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsStack}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

// Root Navigator
export default function AppNavigator() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
