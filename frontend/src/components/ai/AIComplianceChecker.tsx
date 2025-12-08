/**
 * SAURELLIUS AI COMPLIANCE CHECKER
 * AI-powered state compliance verification
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../../styles/theme';
import { aiService, ComplianceCheck } from '../../services/ai';

interface AIComplianceCheckerProps {
  state: string;
  businessInfo?: {
    employee_count?: number;
    industry?: string;
    has_remote_workers?: boolean;
    offers_benefits?: boolean;
  };
}

export default function AIComplianceChecker({
  state,
  businessInfo = {},
}: AIComplianceCheckerProps) {
  const [compliance, setCompliance] = useState<ComplianceCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const runComplianceCheck = async () => {
    setLoading(true);
    try {
      const result = await aiService.checkCompliance(state, businessInfo);
      setCompliance(result);
      setChecked(true);
    } catch (error) {
      console.error('Compliance check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'compliant':
        return colors.success;
      case 'action_needed':
        return colors.error;
      case 'warning':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'compliant':
        return 'checkmark-circle';
      case 'action_needed':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      default:
        return 'help-circle';
    }
  };

  if (!checked) {
    return (
      <TouchableOpacity onPress={runComplianceCheck} disabled={loading}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e']}
          style={styles.promptContainer}
        >
          <View style={styles.promptContent}>
            <LinearGradient
              colors={['#1473FF', '#BE01FF']}
              style={styles.aiIcon}
            >
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
            </LinearGradient>
            <View style={styles.promptText}>
              <Text style={styles.promptTitle}>Saurellius AI Compliance</Text>
              <Text style={styles.promptSubtitle}>
                Verify your {state} compliance status
              </Text>
            </View>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="arrow-forward" size={20} color={colors.primary} />
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e']}
        style={styles.resultContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons
              name={compliance?.compliant ? 'shield-checkmark' : 'shield'}
              size={24}
              color={compliance?.compliant ? colors.success : colors.warning}
            />
            <View>
              <Text style={styles.title}>{state} Compliance</Text>
              <Text
                style={[
                  styles.status,
                  {
                    color: compliance?.compliant
                      ? colors.success
                      : colors.warning,
                  },
                ]}
              >
                {compliance?.compliant ? 'All Clear' : 'Action Needed'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={runComplianceCheck} disabled={loading}>
            <Ionicons
              name="refresh-outline"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Requirements */}
        {compliance?.requirements && compliance.requirements.length > 0 && (
          <ScrollView style={styles.requirementsList}>
            {compliance.requirements.map((req, index) => (
              <View key={index} style={styles.requirementItem}>
                <Ionicons
                  name={getStatusIcon(req.status)}
                  size={18}
                  color={getStatusColor(req.status)}
                />
                <View style={styles.requirementContent}>
                  <Text style={styles.requirementTitle}>{req.item}</Text>
                  <Text style={styles.requirementDetails}>{req.details}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Action Items */}
        {compliance?.action_items && compliance.action_items.length > 0 && (
          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle}>Action Items</Text>
            {compliance.action_items.map((item, index) => (
              <View key={index} style={styles.actionItem}>
                <View style={styles.actionBullet} />
                <Text style={styles.actionText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* AI Badge */}
        <View style={styles.aiBadge}>
          <Ionicons name="sparkles" size={12} color={colors.primary} />
          <Text style={styles.aiBadgeText}>Powered by Saurellius AI</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  promptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promptContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  promptText: {},
  promptTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  promptSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  resultContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  status: {
    fontSize: fontSize.sm,
    marginLeft: spacing.sm,
  },
  requirementsList: {
    maxHeight: 200,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  requirementContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  requirementTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  requirementDetails: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  actionSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    color: colors.warning,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  actionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning,
    marginTop: 6,
  },
  actionText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginLeft: spacing.xs,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: 4,
  },
  aiBadgeText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginLeft: 4,
  },
});
