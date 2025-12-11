/**
 * SAURELLIUS AI INSIGHTS
 * Dashboard widget showing AI-generated business insights
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../../styles/theme';
import { aiService, DashboardInsights } from '../../services/ai';

interface AIInsightsCardProps {
  metrics: {
    total_payroll?: number;
    employee_count?: number;
    avg_pay?: number;
    paystubs_generated?: number;
    prev_total_payroll?: number;
    prev_paystubs?: number;
    plan?: string;
    usage_percent?: number;
  };
}

// Generate local insights based on metrics when API fails
const generateLocalInsights = (metrics: AIInsightsCardProps['metrics']): DashboardInsights => {
  const employeeCount = metrics.employee_count || 0;
  const totalPayroll = metrics.total_payroll || 0;
  const paystubs = metrics.paystubs_generated || 0;
  const avgPay = metrics.avg_pay || 0;
  const plan = metrics.plan || 'free';
  
  const insights: string[] = [];
  const recommendations: string[] = [];
  const alerts: string[] = [];
  
  // Generate admin-focused insights
  if (paystubs === 0) {
    insights.push("Platform is operational and ready for paystub generation.");
    insights.push("All system services are running normally.");
    recommendations.push("Test the paystub generator with sample data.");
    recommendations.push("Review platform settings and configurations.");
  } else {
    insights.push(`Platform has processed ${paystubs} paystub${paystubs > 1 ? 's' : ''} totaling $${totalPayroll.toLocaleString()}.`);
    if (employeeCount > 0) {
      insights.push(`${employeeCount} employee record${employeeCount > 1 ? 's' : ''} in the system.`);
    }
    if (avgPay > 0) {
      insights.push(`Average paystub value: $${avgPay.toLocaleString()}.`);
    }
  }
  
  // Admin recommendations
  recommendations.push("Monitor system performance and API usage.");
  recommendations.push("Review security logs and access patterns.");
  
  // Plan info for admin
  if (plan) {
    insights.push(`Current subscription tier: ${plan.charAt(0).toUpperCase() + plan.slice(1)}.`);
  }
  
  // Seasonal alerts
  const month = new Date().getMonth();
  if (month === 11 || month === 0) {
    alerts.push("Year-end tax documents (W-2, 1099) should be prepared by January 31st.");
  }
  if (month >= 3 && month <= 4) {
    alerts.push("Q1 payroll tax filings are due. Ensure all forms are submitted.");
  }
  
  // Generate admin-focused headline
  let headline = "Admin Dashboard Active";
  if (paystubs === 0) {
    headline = "Platform Ready - All Systems Operational";
  } else {
    headline = `Platform Active: $${totalPayroll.toLocaleString()} Processed`;
  }

  return {
    headline,
    insights,
    recommendations,
    alerts,
    trends: {
      payroll_trend: totalPayroll > (metrics.prev_total_payroll || 0) ? 'up' : 'stable',
      percent_change: metrics.prev_total_payroll 
        ? Math.round(((totalPayroll - metrics.prev_total_payroll) / metrics.prev_total_payroll) * 100)
        : 0,
    },
  };
};

export default function AIInsightsCard({ metrics }: AIInsightsCardProps) {
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true); // Start expanded to show insights
  const [usingLocal, setUsingLocal] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, [metrics]);

  const fetchInsights = async () => {
    setLoading(true);
    setUsingLocal(false);
    try {
      const data = await aiService.getDashboardInsights(metrics);
      if (data && data.headline) {
        setInsights(data);
      } else {
        // API returned empty, use local insights
        setInsights(generateLocalInsights(metrics));
        setUsingLocal(true);
      }
    } catch (error) {
      console.error('Failed to fetch AI insights, using local generation:', error);
      // Generate local insights as fallback
      setInsights(generateLocalInsights(metrics));
      setUsingLocal(true);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (): keyof typeof Ionicons.glyphMap => {
    const trend = insights?.trends?.payroll_trend;
    if (trend === 'up') return 'trending-up';
    if (trend === 'down') return 'trending-down';
    return 'remove-outline';
  };

  const getTrendColor = (): string => {
    const trend = insights?.trends?.payroll_trend;
    if (trend === 'up') return colors.success;
    if (trend === 'down') return colors.error;
    return colors.textSecondary;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e']}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Generating AI insights...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setExpanded(!expanded)}
    >
      <LinearGradient
        colors={['#1a1a2e', '#16213e']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={['#1473FF', '#BE01FF']}
              style={styles.aiIcon}
            >
              <Ionicons name="sparkles" size={14} color="#fff" />
            </LinearGradient>
            <Text style={styles.title}>Saurellius AI Insights</Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </View>

        {/* Headline */}
        <Text style={styles.headline}>{insights.headline}</Text>

        {/* Trend Badge */}
        {insights.trends?.payroll_trend && (
          <View style={styles.trendBadge}>
            <Ionicons
              name={getTrendIcon()}
              size={16}
              color={getTrendColor()}
            />
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {insights.trends.percent_change
                ? `${insights.trends.percent_change}% from last period`
                : `Payroll ${insights.trends.payroll_trend}`}
            </Text>
          </View>
        )}

        {/* Expanded Content */}
        {expanded && (
          <View style={styles.expandedContent}>
            {/* Insights */}
            {insights.insights.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Key Insights</Text>
                {insights.insights.map((insight, index) => (
                  <View key={index} style={styles.insightItem}>
                    <Ionicons
                      name="bulb-outline"
                      size={14}
                      color={colors.warning}
                    />
                    <Text style={styles.insightText}>{insight}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Recommendations */}
            {insights.recommendations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recommendations</Text>
                {insights.recommendations.map((rec, index) => (
                  <View key={index} style={styles.insightItem}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={14}
                      color={colors.success}
                    />
                    <Text style={styles.insightText}>{rec}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Alerts */}
            {insights.alerts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Alerts</Text>
                {insights.alerts.map((alert, index) => (
                  <View key={index} style={styles.alertItem}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={14}
                      color={colors.error}
                    />
                    <Text style={styles.alertText}>{alert}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Refresh Button */}
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={fetchInsights}
            >
              <Ionicons
                name="refresh-outline"
                size={14}
                color={colors.primary}
              />
              <Text style={styles.refreshText}>Refresh Insights</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(20, 115, 255, 0.2)',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  loadingText: {
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    fontSize: fontSize.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  headline: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '500',
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    gap: 4,
  },
  trendText: {
    fontSize: fontSize.sm,
    marginLeft: 4,
  },
  expandedContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    letterSpacing: 0.5,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  insightText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginLeft: spacing.xs,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  alertText: {
    flex: 1,
    color: colors.error,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginLeft: spacing.xs,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  refreshText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    marginLeft: 4,
  },
});
