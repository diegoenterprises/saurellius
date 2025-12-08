/**
 * 🧭 DASHBOARD HEADER
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors, spacing, typography, shadows } from '../../styles/theme';

export default function Header() {
  const { user } = useSelector((state: RootState) => state.auth);
  const initials = `${user?.first_name?.[0] || 'U'}${user?.last_name?.[0] || ''}`;

  return (
    <View style={styles.nav}>
      <View style={styles.navContainer}>
        {/* Logo */}
        <View style={styles.logo}>
          <Ionicons name="hexagon" size={32} color={colors.primary.purple} />
          <Text style={styles.logoText}>Saurellius</Text>
        </View>

        {/* Nav Links - Desktop only */}
        <View style={styles.navLinks}>
          <TouchableOpacity style={styles.navLinkActive}>
            <Text style={styles.navLinkTextActive}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navLink}>
            <Text style={styles.navLinkText}>Employees</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navLink}>
            <Text style={styles.navLinkText}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navLink}>
            <Text style={styles.navLinkText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* User Menu */}
        <View style={styles.userMenu}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    padding: spacing.md,
    ...shadows.sm,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1400,
    marginHorizontal: 'auto',
    width: '100%',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoText: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.primary.purple,
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
    color: colors.text.secondary,
  },
  navLinkTextActive: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.primary.purple,
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
    backgroundColor: colors.surface.elevated,
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
});
