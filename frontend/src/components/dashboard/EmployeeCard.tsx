/**
 * EMPLOYEE CARD COMPONENT
 * With animations and haptic feedback
 */
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInRight,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { extendedColors as colors, spacing, borderRadius, typography, gradients } from '../../styles/theme';
import { haptics } from '../../utils/haptics';

interface EmployeeCardProps {
  initials: string;
  name: string;
  role: string;
  onGeneratePaystub?: () => void;
  onEdit?: () => void;
  index?: number;
}

export default function EmployeeCard({ initials, name, role, onGeneratePaystub, onEdit, index = 0 }: EmployeeCardProps) {
  const scale = useSharedValue(1);
  
  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  }, []);
  
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }, []);
  
  const handleGeneratePaystub = useCallback(() => {
    haptics.medium();
    onGeneratePaystub?.();
  }, [onGeneratePaystub]);
  
  const handleEdit = useCallback(() => {
    haptics.light();
    onEdit?.();
  }, [onEdit]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  return (
    <Animated.View
      entering={FadeInRight.delay(index * 80).springify()}
      style={animatedStyle}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handleEdit}
      >
        <View style={styles.container}>
          <LinearGradient colors={gradients.primary} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          
          <View style={styles.info}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.role}>{role}</Text>
          </View>
          
          <View style={styles.actions}>
            <TouchableOpacity style={styles.iconButton} onPress={handleGeneratePaystub}>
              <Ionicons name="document-text-outline" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleEdit}>
              <Ionicons name="create-outline" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
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
