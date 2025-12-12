/**
 * DASHBOARD HEADER
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { extendedColors as colors, spacing, typography, shadows } from '../../styles/theme';

const { width } = Dimensions.get('window');
const isLargeScreen = width >= 768;

export default function Header() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const initials = `${user?.first_name?.[0] || 'U'}${user?.last_name?.[0] || ''}`;
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    dispatch(logout());
  };

  const navigateTo = (screen: string) => {
    setShowUserMenu(false);
    navigation.navigate(screen);
  };

  return (
    <View style={styles.nav}>
      <View style={styles.navContainer}>
        {/* Menu Button - always visible to toggle sidebar */}
        <View style={styles.leftSection}>
          <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* User Menu */}
        <View style={styles.userMenu}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
          >
            <Ionicons name="notifications-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.avatar}
            onPress={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
          >
            {user?.profile_picture ? (
              <Image 
                source={{ uri: user.profile_picture }} 
                style={styles.avatarImage} 
              />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* User Dropdown Menu */}
        {showUserMenu && (
          <View style={styles.dropdownMenu}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownName}>{user?.first_name} {user?.last_name}</Text>
              <Text style={styles.dropdownEmail}>{user?.email}</Text>
              <Text style={styles.dropdownTier}>{user?.subscription_tier?.toUpperCase()} Plan</Text>
            </View>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity style={styles.dropdownItem} onPress={() => navigateTo('Profile')}>
              <Ionicons name="person-outline" size={18} color="#a0a0a0" />
              <Text style={styles.dropdownItemText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dropdownItem} onPress={() => navigateTo('Settings')}>
              <Ionicons name="settings-outline" size={18} color="#a0a0a0" />
              <Text style={styles.dropdownItemText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dropdownItem} onPress={() => navigateTo('Subscription')}>
              <Ionicons name="card-outline" size={18} color="#a0a0a0" />
              <Text style={styles.dropdownItemText}>Subscription</Text>
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity style={styles.dropdownItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#ef4444" />
              <Text style={[styles.dropdownItemText, { color: '#ef4444' }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notifications Dropdown */}
        {showNotifications && (
          <View style={[styles.dropdownMenu, styles.notificationsDropdown]}>
            <Text style={styles.dropdownTitle}>Notifications</Text>
            <View style={styles.dropdownDivider} />
            <View style={styles.emptyNotifications}>
              <Ionicons name="notifications-off-outline" size={32} color="#666" />
              <Text style={styles.emptyText}>No new notifications</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
    padding: spacing.md,
    zIndex: 9999,
    position: 'relative',
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1400,
    marginHorizontal: 'auto',
    width: '100%',
    zIndex: 9999,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  logoText: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: '#fff',
  },
  navLinks: {
    flexDirection: 'row',
    gap: spacing.xl,
    display: 'none', // Hidden on mobile
  },
  navLink: {
    paddingVertical: spacing.sm,
  },
  navLinkActive: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 3,
    borderBottomColor: colors.primary.purple,
  },
  navLinkText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: '#a0a0a0',
  },
  navLinkTextActive: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: '#fff',
  },
  userMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    right: 0,
    backgroundColor: '#252545',
    borderRadius: 12,
    minWidth: 220,
    borderWidth: 1,
    borderColor: '#3a3a5e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 9999,
    zIndex: 99999,
  },
  notificationsDropdown: {
    right: 52,
    minWidth: 280,
  },
  dropdownHeader: {
    padding: 16,
  },
  dropdownName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  dropdownEmail: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 2,
  },
  dropdownTier: {
    fontSize: 11,
    color: '#BE01FF',
    fontWeight: '600',
    marginTop: 4,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#3a3a5e',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#fff',
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    padding: 16,
    paddingBottom: 8,
  },
  emptyNotifications: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#a0a0a0',
  },
});
