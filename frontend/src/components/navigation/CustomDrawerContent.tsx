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
      { id: 'revenue', label: 'Revenue', icon: 'cash-outline', screen: 'AdminPortal', color: COLORS.success },
    ],
  },
  {
    title: 'CUSTOMER MANAGEMENT',
    items: [
      { id: 'customers', label: 'Customers', icon: 'people-outline', screen: 'AdminSupport' },
      { id: 'subscriptions', label: 'Subscriptions', icon: 'card-outline', screen: 'AdminPortal' },
      { id: 'apisubscribers', label: 'API Subscribers', icon: 'code-slash-outline', screen: 'AdminPortal' },
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
      { id: 'apikeys', label: 'API Keys', icon: 'key-outline', screen: 'AdminPortal' },
      { id: 'compliance', label: 'Compliance', icon: 'shield-checkmark-outline', screen: 'Compliance' },
      { id: 'reports', label: 'Reports', icon: 'bar-chart-outline', screen: 'Reports' },
    ],
  },
];

// EMPLOYER MENU - Business owners managing their company
const EMPLOYER_MENU_SECTIONS: MenuSection[] = [
  {
    title: 'MAIN',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline', screen: 'Dashboard' },
      { id: 'employees', label: 'Employees', icon: 'people-outline', screen: 'Employees' },
      { id: 'paystubs', label: 'Paystubs', icon: 'document-text-outline', screen: 'Paystubs' },
    ],
  },
  {
    title: 'PAYROLL',
    items: [
      { id: 'payrollrun', label: 'Run Payroll', icon: 'play-circle-outline', screen: 'PayrollRun', color: COLORS.success },
      { id: 'wallet', label: 'Wallet', icon: 'wallet-outline', screen: 'Wallet', color: COLORS.success },
      { id: 'timesheet', label: 'Time Clock', icon: 'time-outline', screen: 'Timesheet' },
      { id: 'workforce', label: 'Scheduling', icon: 'calendar-outline', screen: 'Workforce' },
    ],
  },
  {
    title: 'HR & BENEFITS',
    items: [
      { id: 'onboarding', label: 'Onboarding', icon: 'person-add-outline', screen: 'Onboarding' },
      { id: 'benefits', label: 'Benefits', icon: 'heart-outline', screen: 'Benefits' },
      { id: 'pto', label: 'Time Off', icon: 'airplane-outline', screen: 'PTO' },
      { id: 'garnishment', label: 'Garnishments', icon: 'remove-circle-outline', screen: 'Garnishment' },
    ],
  },
  {
    title: 'TAX & COMPLIANCE',
    items: [
      { id: 'taxcenter', label: 'Tax Center', icon: 'calculator-outline', screen: 'TaxCenter' },
      { id: 'compliance', label: 'Compliance', icon: 'shield-checkmark-outline', screen: 'Compliance' },
      { id: 'reports', label: 'Reports', icon: 'bar-chart-outline', screen: 'Reports' },
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

// EMPLOYEE MENU - Workers viewing their info
const EMPLOYEE_MENU_SECTIONS: MenuSection[] = [
  {
    title: 'MY DASHBOARD',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline', screen: 'EmployeePortal' },
      { id: 'paystubs', label: 'My Paystubs', icon: 'document-text-outline', screen: 'Paystubs' },
      { id: 'wallet', label: 'Wallet', icon: 'wallet-outline', screen: 'Wallet', color: COLORS.success },
    ],
  },
  {
    title: 'TIME & SCHEDULE',
    items: [
      { id: 'timesheet', label: 'Time Clock', icon: 'time-outline', screen: 'Timesheet' },
      { id: 'schedule', label: 'My Schedule', icon: 'calendar-outline', screen: 'Workforce' },
      { id: 'pto', label: 'Time Off', icon: 'airplane-outline', screen: 'PTO' },
    ],
  },
  {
    title: 'BENEFITS',
    items: [
      { id: 'benefits', label: 'My Benefits', icon: 'heart-outline', screen: 'Benefits' },
      { id: 'rewards', label: 'Rewards', icon: 'trophy-outline', screen: 'Rewards', color: COLORS.warning },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      { id: 'messages', label: 'Messages', icon: 'chatbubbles-outline', screen: 'Messages', badge: 3 },
      { id: 'swipe', label: 'Shift Swap', icon: 'swap-horizontal-outline', screen: 'Swipe' },
    ],
  },
];

// CONTRACTOR MENU - Independent contractors
const CONTRACTOR_MENU_SECTIONS: MenuSection[] = [
  {
    title: 'MY DASHBOARD',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline', screen: 'ContractorPortal' },
      { id: 'invoices', label: 'Invoices', icon: 'document-text-outline', screen: 'Paystubs' },
      { id: 'wallet', label: 'Wallet', icon: 'wallet-outline', screen: 'Wallet', color: COLORS.success },
    ],
  },
  {
    title: 'WORK',
    items: [
      { id: 'timesheet', label: 'Time Tracking', icon: 'time-outline', screen: 'Timesheet' },
      { id: 'projects', label: 'Projects', icon: 'folder-outline', screen: 'Workforce' },
    ],
  },
  {
    title: 'TAX',
    items: [
      { id: 'taxforms', label: 'Tax Forms', icon: 'calculator-outline', screen: 'TaxCenter' },
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
