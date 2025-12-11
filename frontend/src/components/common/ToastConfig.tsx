/**
 * 🍞 TOAST CONFIGURATION
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { extendedColors as colors, borderRadius, shadows } from '../../styles/theme';

export const toastConfig = {
  success: ({ text1, text2 }: any) => (
    <View style={[styles.toastContainer, styles.successToast]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.status.successLight }]}>
        <Ionicons name="checkmark-circle" size={24} color={colors.status.success} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
    </View>
  ),
  
  error: ({ text1, text2 }: any) => (
    <View style={[styles.toastContainer, styles.errorToast]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.status.errorLight }]}>
        <Ionicons name="close-circle" size={24} color={colors.status.error} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
    </View>
  ),
  
  info: ({ text1, text2 }: any) => (
    <View style={[styles.toastContainer, styles.infoToast]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.status.infoLight }]}>
        <Ionicons name="information-circle" size={24} color={colors.status.info} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
    </View>
  ),
  
  reward: ({ text1, text2 }: any) => (
    <View style={[styles.toastContainer, styles.rewardToast]}>
      <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
        <Ionicons name="star" size={24} color="#F59E0B" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={[styles.message, { color: '#92400E' }]}>{text2}</Text>}
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    ...shadows.lg,
  },
  successToast: {
    borderLeftWidth: 4,
    borderLeftColor: colors.status.success,
  },
  errorToast: {
    borderLeftWidth: 4,
    borderLeftColor: colors.status.error,
  },
  infoToast: {
    borderLeftWidth: 4,
    borderLeftColor: colors.status.info,
  },
  rewardToast: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  message: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
