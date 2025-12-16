/**
 * SAURELLIUS CHANGE PASSWORD
 * Secure password change form
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, gradients } = useTheme();
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('One number');
    if (!/[!@#$%^&*]/.test(password)) errors.push('One special character (!@#$%^&*)');
    return errors;
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }

    const errors = validatePassword(newPassword);
    if (errors.length > 0) {
      Alert.alert('Password Requirements', errors.join('\n'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setSaving(true);
    try {
      await api.put('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      Alert.alert('Success', 'Password changed successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const renderPasswordField = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    show: boolean,
    setShow: (v: boolean) => void,
    placeholder: string
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={!show}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShow(!show)} style={styles.eyeButton}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const passwordErrors = validatePassword(newPassword);
  const passwordStrength = 5 - passwordErrors.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {renderPasswordField('Current Password', currentPassword, setCurrentPassword, showCurrent, setShowCurrent, 'Enter current password')}
        {renderPasswordField('New Password', newPassword, setNewPassword, showNew, setShowNew, 'Enter new password')}
        {renderPasswordField('Confirm New Password', confirmPassword, setConfirmPassword, showConfirm, setShowConfirm, 'Confirm new password')}

        {newPassword.length > 0 && (
          <View style={styles.strengthContainer}>
            <Text style={[styles.strengthLabel, { color: colors.textSecondary }]}>Password Strength</Text>
            <View style={styles.strengthBar}>
              {[1, 2, 3, 4, 5].map((level) => (
                <View
                  key={level}
                  style={[
                    styles.strengthSegment,
                    {
                      backgroundColor: level <= passwordStrength
                        ? passwordStrength >= 4 ? '#22C55E' : passwordStrength >= 2 ? '#F59E0B' : '#EF4444'
                        : colors.border,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.strengthText, { color: colors.textSecondary }]}>
              {passwordStrength >= 4 ? 'Strong' : passwordStrength >= 2 ? 'Medium' : 'Weak'}
            </Text>
          </View>
        )}

        <View style={[styles.requirementsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.requirementsTitle, { color: colors.text }]}>Password Requirements</Text>
          {[
            { text: 'At least 8 characters', met: newPassword.length >= 8 },
            { text: 'One uppercase letter', met: /[A-Z]/.test(newPassword) },
            { text: 'One lowercase letter', met: /[a-z]/.test(newPassword) },
            { text: 'One number', met: /[0-9]/.test(newPassword) },
            { text: 'One special character (!@#$%^&*)', met: /[!@#$%^&*]/.test(newPassword) },
          ].map((req, index) => (
            <View key={index} style={styles.requirementRow}>
              <Ionicons
                name={req.met ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={req.met ? '#22C55E' : colors.textSecondary}
              />
              <Text style={[styles.requirementText, { color: req.met ? '#22C55E' : colors.textSecondary }]}>
                {req.text}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleChangePassword}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="lock-closed-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Change Password</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
  content: { flex: 1, padding: 16 },
  fieldContainer: { marginBottom: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 16 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16 },
  eyeButton: { padding: 8 },
  strengthContainer: { marginBottom: 20 },
  strengthLabel: { fontSize: 14, marginBottom: 8 },
  strengthBar: { flexDirection: 'row', gap: 4 },
  strengthSegment: { flex: 1, height: 4, borderRadius: 2 },
  strengthText: { fontSize: 12, marginTop: 4 },
  requirementsContainer: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  requirementsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  requirementRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  requirementText: { marginLeft: 8, fontSize: 14 },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12 },
  saveButtonText: { color: colors.text, fontSize: 16, fontWeight: '600', marginLeft: 8 },
});

export default ChangePasswordScreen;
