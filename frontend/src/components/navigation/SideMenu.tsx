/**
 * 🎨 SAURELLIUS SIDE MENU
 * Beautiful collapsible side navigation
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLLAPSED_WIDTH = 72;
const EXPANDED_WIDTH = 280;

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
  hover: '#1E293B',
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

const MENU_SECTIONS: MenuSection[] = [
  {
    title: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline', screen: 'Dashboard' },
      { id: 'employees', label: 'Employees', icon: 'people-outline', screen: 'Employees' },
      { id: 'paystubs', label: 'Paystubs', icon: 'document-text-outline', screen: 'Paystubs' },
    ],
  },
  {
    title: 'Payroll',
    items: [
      { id: 'payrollrun', label: 'Run Payroll', icon: 'play-circle-outline', screen: 'PayrollRun' },
      { id: 'wallet', label: 'Wallet', icon: 'wallet-outline', screen: 'Wallet', color: COLORS.success },
      { id: 'timesheet', label: 'Time Clock', icon: 'time-outline', screen: 'Timesheet' },
      { id: 'workforce', label: 'Scheduling', icon: 'calendar-outline', screen: 'Workforce' },
    ],
  },
  {
    title: 'HR & Benefits',
    items: [
      { id: 'onboarding', label: 'Onboarding', icon: 'person-add-outline', screen: 'Onboarding' },
      { id: 'benefits', label: 'Benefits', icon: 'heart-outline', screen: 'Benefits' },
      { id: 'pto', label: 'Time Off', icon: 'airplane-outline', screen: 'PTO' },
      { id: 'garnishment', label: 'Garnishments', icon: 'remove-circle-outline', screen: 'Garnishment' },
    ],
  },
  {
    title: 'Tax & Compliance',
    items: [
      { id: 'taxcenter', label: 'Tax Center', icon: 'calculator-outline', screen: 'TaxCenter' },
      { id: 'compliance', label: 'Compliance', icon: 'shield-checkmark-outline', screen: 'Compliance' },
      { id: 'reports', label: 'Reports', icon: 'bar-chart-outline', screen: 'Reports' },
    ],
  },
  {
    title: 'Communication',
    items: [
      { id: 'messages', label: 'Messages', icon: 'chatbubbles-outline', screen: 'Messages', badge: 3 },
      { id: 'swipe', label: 'Shift Swap', icon: 'swap-horizontal-outline', screen: 'Swipe' },
      { id: 'rewards', label: 'Rewards', icon: 'trophy-outline', screen: 'Rewards' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { id: 'accounting', label: 'Accounting', icon: 'pie-chart-outline', screen: 'Accounting' },
      { id: 'contractors', label: 'Contractors', icon: 'briefcase-outline', screen: 'Contractors' },
    ],
  },
];

interface SideMenuProps {
  children: React.ReactNode;
  currentScreen?: string;
}

export default function SideMenu({ children, currentScreen }: SideMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeScreen, setActiveScreen] = useState(currentScreen || 'Dashboard');
  const widthAnim = useRef(new Animated.Value(COLLAPSED_WIDTH)).current;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
      useNativeDriver: false,
      friction: 10,
      tension: 100,
    }).start();
  }, [isExpanded]);

  const handleMouseEnter = () => {
    if (isWeb) setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    if (isWeb) setIsExpanded(false);
  };

  const handlePress = (screen: string) => {
    setActiveScreen(screen);
    try {
      navigation.navigate(screen);
    } catch (e) {
      console.log('Navigation error:', e);
    }
  };

  const toggleMenu = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.container}>
      {/* Side Menu */}
      <Animated.View
        style={[
          styles.sideMenu,
          { width: widthAnim, paddingTop: insets.top },
        ]}
        // @ts-ignore - web only props
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoText}>S</Text>
          </View>
          {isExpanded && (
            <Animated.Text style={styles.logoTitle}>SAURELLIUS</Animated.Text>
          )}
        </View>

        {/* Toggle Button (Mobile) */}
        {!isWeb && (
          <TouchableOpacity style={styles.toggleButton} onPress={toggleMenu}>
            <Ionicons
              name={isExpanded ? 'chevron-back' : 'chevron-forward'}
              size={20}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        )}

        {/* Menu Items */}
        <ScrollView
          style={styles.menuScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.menuContent}
        >
          {MENU_SECTIONS.map((section) => (
            <View key={section.title} style={styles.menuSection}>
              {isExpanded && (
                <Text style={styles.sectionTitle}>{section.title}</Text>
              )}
              {section.items.map((item) => {
                const isActive = activeScreen === item.screen;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.menuItem,
                      isActive && styles.menuItemActive,
                    ]}
                    onPress={() => handlePress(item.screen)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
                      <Ionicons
                        name={item.icon}
                        size={22}
                        color={isActive ? COLORS.primary : item.color || COLORS.textMuted}
                      />
                    </View>
                    {isExpanded && (
                      <>
                        <Text
                          style={[
                            styles.menuLabel,
                            isActive && styles.menuLabelActive,
                          ]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                        {item.badge && (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{item.badge}</Text>
                          </View>
                        )}
                      </>
                    )}
                    {!isExpanded && item.badge && (
                      <View style={styles.badgeSmall} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>

        {/* Bottom Section */}
        <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handlePress('AdminPortal')}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="shield-outline" size={22} color={COLORS.accent} />
            </View>
            {isExpanded && <Text style={styles.menuLabel}>Admin Portal</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handlePress('Settings')}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="settings-outline" size={22} color={COLORS.textMuted} />
            </View>
            {isExpanded && <Text style={styles.menuLabel}>Settings</Text>}
          </TouchableOpacity>

          {/* User Profile */}
          <View style={styles.userSection}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>JD</Text>
            </View>
            {isExpanded && (
              <View style={styles.userInfo}>
                <Text style={styles.userName}>John Doe</Text>
                <Text style={styles.userRole}>Administrator</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.mainContent,
          { marginLeft: isWeb ? 0 : 0 },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.background,
  },
  sideMenu: {
    backgroundColor: COLORS.background,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    overflow: 'hidden',
    zIndex: 100,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  logoTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
    letterSpacing: 1,
  },
  toggleButton: {
    position: 'absolute',
    top: 60,
    right: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    paddingBottom: 24,
  },
  menuSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 10,
    marginBottom: 2,
  },
  menuItemActive: {
    backgroundColor: COLORS.backgroundLight,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: `${COLORS.primary}20`,
  },
  menuLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  menuLabelActive: {
    color: COLORS.text,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeSmall: {
    position: 'absolute',
    top: 8,
    right: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  userInfo: {
    marginLeft: 12,
  },
  userName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  userRole: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
