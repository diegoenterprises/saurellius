/**
 * 👤 EMPLOYEE CARD COMPONENT
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { extendedColors as colors, spacing, borderRadius, typography, gradients } from '../../styles/theme';

interface EmployeeCardProps {
  initials: string;
  name: string;
  role: string;
  onGeneratePaystub?: () => void;
  onEdit?: () => void;
}

export default function EmployeeCard({ initials, name, role, onGeneratePaystub, onEdit }: EmployeeCardProps) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </LinearGradient>
      
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.role}>{role}</Text>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconButton} onPress={onGeneratePaystub}>
          <Ionicons name="document-text-outline" size={16} color={colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={onEdit}>
          <Ionicons name="create-outline" size={16} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface.elevated,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: 'white',
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
  role: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surface.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
