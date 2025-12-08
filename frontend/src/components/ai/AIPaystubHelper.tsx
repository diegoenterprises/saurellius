/**
 * SAURELLIUS AI PAYSTUB HELPER
 * AI-powered paystub validation and explanation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../../styles/theme';
import { aiService, PaystubValidation } from '../../services/ai';

interface AIPaystubHelperProps {
  paystubData: {
    employee_name?: string;
    pay_period_start?: string;
    pay_period_end?: string;
    gross_pay?: number;
    federal_tax?: number;
    state_tax?: number;
    state?: string;
    social_security?: number;
    medicare?: number;
    net_pay?: number;
    hours_worked?: number;
    hourly_rate?: number;
  };
  onCorrection?: (corrections: any[]) => void;
}

export default function AIPaystubHelper({
  paystubData,
  onCorrection,
}: AIPaystubHelperProps) {
  const [validation, setValidation] = useState<PaystubValidation | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'validate' | 'explain'>('validate');
  const [modalVisible, setModalVisible] = useState(false);

  const handleValidate = async () => {
    setLoading(true);
    setActiveTab('validate');
    try {
      const result = await aiService.validatePaystub(paystubData);
      setValidation(result);
      setModalVisible(true);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async () => {
    setLoading(true);
    setActiveTab('explain');
    try {
      const result = await aiService.explainPaystub(paystubData);
      setExplanation(result);
      setModalVisible(true);
    } catch (error) {
      console.error('Explanation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetCorrections = async () => {
    if (!validation?.issues?.length) return;
    
    setLoading(true);
    try {
      const corrections = await aiService.suggestCorrections(
        paystubData,
        validation.issues
      );
      if (onCorrection) {
        onCorrection(corrections);
      }
    } catch (error) {
      console.error('Corrections error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* AI Helper Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.aiButton}
          onPress={handleValidate}
          disabled={loading}
        >
          <LinearGradient
            colors={['#1473FF', '#BE01FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            {loading && activeTab === 'validate' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.buttonText}>AI Validate</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.aiButton}
          onPress={handleExplain}
          disabled={loading}
        >
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            {loading && activeTab === 'explain' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="bulb" size={18} color="#fff" />
                <Text style={styles.buttonText}>AI Explain</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Results Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Ionicons
                  name={activeTab === 'validate' ? 'checkmark-circle' : 'bulb'}
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.modalTitle}>
                  {activeTab === 'validate' ? 'Validation Results' : 'Paystub Explanation'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Validation Results */}
              {activeTab === 'validate' && validation && (
                <View>
                  {/* Status */}
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: validation.valid
                          ? 'rgba(16, 185, 129, 0.1)'
                          : 'rgba(239, 68, 68, 0.1)',
                      },
                    ]}
                  >
                    <Ionicons
                      name={validation.valid ? 'checkmark-circle' : 'alert-circle'}
                      size={20}
                      color={validation.valid ? colors.success : colors.error}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: validation.valid ? colors.success : colors.error },
                      ]}
                    >
                      {validation.valid
                        ? 'Paystub looks good!'
                        : 'Issues found - review needed'}
                    </Text>
                  </View>

                  {/* Issues */}
                  {validation.issues.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Issues</Text>
                      {validation.issues.map((issue, index) => (
                        <View key={index} style={styles.issueItem}>
                          <Ionicons
                            name="close-circle"
                            size={16}
                            color={colors.error}
                          />
                          <Text style={styles.issueText}>{issue}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Warnings */}
                  {validation.warnings.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Warnings</Text>
                      {validation.warnings.map((warning, index) => (
                        <View key={index} style={styles.warningItem}>
                          <Ionicons
                            name="warning"
                            size={16}
                            color={colors.warning}
                          />
                          <Text style={styles.warningText}>{warning}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Suggestions */}
                  {validation.suggestions.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Suggestions</Text>
                      {validation.suggestions.map((suggestion, index) => (
                        <View key={index} style={styles.suggestionItem}>
                          <Ionicons
                            name="bulb-outline"
                            size={16}
                            color={colors.info}
                          />
                          <Text style={styles.suggestionText}>{suggestion}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Fix Button */}
                  {validation.issues.length > 0 && (
                    <TouchableOpacity
                      style={styles.fixButton}
                      onPress={handleGetCorrections}
                      disabled={loading}
                    >
                      <LinearGradient
                        colors={['#1473FF', '#BE01FF']}
                        style={styles.fixButtonGradient}
                      >
                        <Ionicons name="sparkles" size={18} color="#fff" />
                        <Text style={styles.fixButtonText}>
                          Get AI Corrections
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Explanation */}
              {activeTab === 'explain' && explanation && (
                <View style={styles.explanationContainer}>
                  <Text style={styles.explanationText}>{explanation}</Text>
                </View>
              )}
            </ScrollView>

            {/* AI Badge */}
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={12} color={colors.primary} />
              <Text style={styles.aiBadgeText}>Powered by Saurellius AI</Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  aiButton: {
    flex: 1,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  modalBody: {
    padding: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  statusText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  issueText: {
    flex: 1,
    color: colors.error,
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  warningText: {
    flex: 1,
    color: colors.warning,
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  suggestionText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
  },
  fixButton: {
    marginTop: spacing.md,
  },
  fixButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  fixButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  explanationContainer: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  explanationText: {
    color: colors.text,
    fontSize: fontSize.md,
    lineHeight: 24,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  aiBadgeText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginLeft: 4,
  },
});
