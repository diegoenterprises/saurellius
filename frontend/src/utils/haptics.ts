/**
 * SAURELLIUS HAPTIC FEEDBACK SERVICE
 * Provides tactile feedback for user interactions
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

class HapticService {
  private enabled: boolean = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Light tap - for subtle interactions like toggles, selections
   */
  light() {
    if (!this.enabled || Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  /**
   * Medium tap - for button presses, card taps
   */
  medium() {
    if (!this.enabled || Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  /**
   * Heavy tap - for important actions, confirmations
   */
  heavy() {
    if (!this.enabled || Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  /**
   * Selection changed - for picker/list selections
   */
  selection() {
    if (!this.enabled || Platform.OS === 'web') return;
    Haptics.selectionAsync();
  }

  /**
   * Success notification - for completed actions
   */
  success() {
    if (!this.enabled || Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  /**
   * Warning notification - for alerts, cautions
   */
  warning() {
    if (!this.enabled || Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  /**
   * Error notification - for failures, errors
   */
  error() {
    if (!this.enabled || Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  /**
   * Button press feedback
   */
  buttonPress() {
    this.medium();
  }

  /**
   * Tab change feedback
   */
  tabChange() {
    this.light();
  }

  /**
   * Toggle switch feedback
   */
  toggle() {
    this.light();
  }

  /**
   * Swipe action feedback
   */
  swipe() {
    this.light();
  }

  /**
   * Pull to refresh feedback
   */
  refresh() {
    this.medium();
  }

  /**
   * Long press feedback
   */
  longPress() {
    this.heavy();
  }

  /**
   * Delete action feedback
   */
  delete() {
    this.warning();
  }

  /**
   * Payment/transaction feedback
   */
  transaction() {
    this.success();
  }
}

export const haptics = new HapticService();
export default haptics;
