/**
 * SAURELLIUS AI ONBOARDING
 * AI-generated onboarding checklist for new employees
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
import { aiService, OnboardingTask } from '../../services/ai';

interface AIOnboardingHelperProps {
  state: string;
  employeeType?: 'full-time' | 'part-time' | 'contractor';
  onTaskComplete?: (taskIndex: number) => void;
}

export default function AIOnboardingHelper({
  state,
  employeeType = 'full-time',
  onTaskComplete,
}: AIOnboardingHelperProps) {
  const [checklist, setChecklist] = useState<OnboardingTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    fetchChecklist();
  }, [state, employeeType]);

  const fetchChecklist = async () => {
    setLoading(true);
    try {
      const tasks = await aiService.getOnboardingChecklist(state, employeeType);
      setChecklist(tasks);
    } catch (error) {
      console.error('Failed to fetch checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (index: number) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
      if (onTaskComplete) {
        onTaskComplete(index);
      }
    }
    setCompletedTasks(newCompleted);
  };

  const progress = checklist.length > 0
    ? Math.round((completedTasks.size / checklist.length) * 100)
    : 0;

  const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    switch (category?.toLowerCase()) {
      case 'tax forms':
        return 'document-text';
      case 'eligibility':
        return 'shield-checkmark';
      case 'payroll':
        return 'cash';
      case 'benefits':
        return 'heart';
      case 'policies':
        return 'book';
      default:
        return 'checkbox';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Generating AI checklist...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#1a1a2e', '#16213e']}
          style={styles.header}
        >
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={['#1473FF', '#BE01FF']}
              style={styles.aiIcon}
            >
              <Ionicons name="clipboard" size={16} color="#fff" />
            </LinearGradient>
            <View>
              <Text style={styles.title}>Saurellius AI Onboarding</Text>
              <Text style={styles.subtitle}>
                {state} • {employeeType}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>{progress}%</Text>
            </View>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textSecondary}
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Checklist */}
      {expanded && (
        <View style={styles.checklistContainer}>
          {checklist.map((task, index) => (
            <TouchableOpacity
              key={index}
              style={styles.taskItem}
              onPress={() => toggleTask(index)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  completedTasks.has(index) && styles.checkboxChecked,
                ]}
              >
                {completedTasks.has(index) && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>
              <View style={styles.taskContent}>
                <View style={styles.taskHeader}>
                  <Ionicons
                    name={getCategoryIcon(task.category)}
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.taskCategory}>{task.category}</Text>
                  {task.required && (
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredText}>Required</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.taskText,
                    completedTasks.has(index) && styles.taskTextCompleted,
                  ]}
                >
                  {task.task}
                </Text>
                <Text style={styles.taskDeadline}>Due: {task.deadline}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Refresh Button */}
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchChecklist}
          >
            <Ionicons name="refresh-outline" size={14} color={colors.primary} />
            <Text style={styles.refreshText}>Regenerate Checklist</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
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
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  progressText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    marginTop: -2,
    marginHorizontal: spacing.md,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
  },
  checklistContainer: {
    backgroundColor: colors.card,
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  taskCategory: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginLeft: 4,
  },
  requiredBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: spacing.xs,
  },
  requiredText: {
    color: colors.error,
    fontSize: 10,
    fontWeight: '600',
  },
  taskText: {
    color: colors.text,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  taskDeadline: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: 4,
  },
  refreshText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    marginLeft: 4,
  },
});
