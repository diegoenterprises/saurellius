/**
 * BACK HEADER COMPONENT
 * Reusable header with back navigation button
 * Used on all non-root screens for consistent navigation
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BackHeaderProps {
  title: string;
  subtitle?: string;
  showBorder?: boolean;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    label?: string;
  };
  onBackPress?: () => void; // Custom back action if needed
  transparent?: boolean;
}

export default function BackHeader({
  title,
  subtitle,
  showBorder = true,
  rightAction,
  onBackPress,
  transparent = false,
}: BackHeaderProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const headerContent = (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 8 },
        showBorder && styles.border,
        transparent && styles.transparent,
      ]}
    >
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBack}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View style={styles.backButtonInner}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </View>
      </TouchableOpacity>

      {/* Title Section */}
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right Action */}
      {rightAction ? (
        <TouchableOpacity
          style={styles.rightButton}
          onPress={rightAction.onPress}
          activeOpacity={0.7}
        >
          <Ionicons name={rightAction.icon} size={22} color="#FFF" />
          {rightAction.label && (
            <Text style={styles.rightLabel}>{rightAction.label}</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.rightPlaceholder} />
      )}
    </View>
  );

  if (transparent) {
    return headerContent;
  }

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {headerContent}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    minHeight: 56,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    marginRight: 12,
  },
  backButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  rightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  rightLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 6,
  },
  rightPlaceholder: {
    width: 36,
  },
});
