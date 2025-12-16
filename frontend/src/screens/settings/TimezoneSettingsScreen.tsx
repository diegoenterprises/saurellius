/**
 * SAURELLIUS TIMEZONE SETTINGS
 * Select timezone for payroll calculations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Timezone {
  id: string;
  name: string;
  offset: string;
  abbr: string;
}

const TIMEZONES: Timezone[] = [
  { id: 'America/New_York', name: 'Eastern Time', offset: 'UTC-05:00', abbr: 'EST' },
  { id: 'America/Chicago', name: 'Central Time', offset: 'UTC-06:00', abbr: 'CST' },
  { id: 'America/Denver', name: 'Mountain Time', offset: 'UTC-07:00', abbr: 'MST' },
  { id: 'America/Los_Angeles', name: 'Pacific Time', offset: 'UTC-08:00', abbr: 'PST' },
  { id: 'America/Anchorage', name: 'Alaska Time', offset: 'UTC-09:00', abbr: 'AKST' },
  { id: 'Pacific/Honolulu', name: 'Hawaii Time', offset: 'UTC-10:00', abbr: 'HST' },
  { id: 'America/Phoenix', name: 'Arizona Time', offset: 'UTC-07:00', abbr: 'MST' },
  { id: 'America/Puerto_Rico', name: 'Atlantic Time', offset: 'UTC-04:00', abbr: 'AST' },
  { id: 'Europe/London', name: 'London', offset: 'UTC+00:00', abbr: 'GMT' },
  { id: 'Europe/Paris', name: 'Paris', offset: 'UTC+01:00', abbr: 'CET' },
  { id: 'Europe/Berlin', name: 'Berlin', offset: 'UTC+01:00', abbr: 'CET' },
  { id: 'Europe/Moscow', name: 'Moscow', offset: 'UTC+03:00', abbr: 'MSK' },
  { id: 'Asia/Dubai', name: 'Dubai', offset: 'UTC+04:00', abbr: 'GST' },
  { id: 'Asia/Kolkata', name: 'India', offset: 'UTC+05:30', abbr: 'IST' },
  { id: 'Asia/Singapore', name: 'Singapore', offset: 'UTC+08:00', abbr: 'SGT' },
  { id: 'Asia/Hong_Kong', name: 'Hong Kong', offset: 'UTC+08:00', abbr: 'HKT' },
  { id: 'Asia/Tokyo', name: 'Tokyo', offset: 'UTC+09:00', abbr: 'JST' },
  { id: 'Asia/Seoul', name: 'Seoul', offset: 'UTC+09:00', abbr: 'KST' },
  { id: 'Australia/Sydney', name: 'Sydney', offset: 'UTC+11:00', abbr: 'AEDT' },
  { id: 'Australia/Perth', name: 'Perth', offset: 'UTC+08:00', abbr: 'AWST' },
  { id: 'Pacific/Auckland', name: 'Auckland', offset: 'UTC+13:00', abbr: 'NZDT' },
  { id: 'America/Sao_Paulo', name: 'Sao Paulo', offset: 'UTC-03:00', abbr: 'BRT' },
  { id: 'America/Mexico_City', name: 'Mexico City', offset: 'UTC-06:00', abbr: 'CST' },
  { id: 'America/Toronto', name: 'Toronto', offset: 'UTC-05:00', abbr: 'EST' },
  { id: 'America/Vancouver', name: 'Vancouver', offset: 'UTC-08:00', abbr: 'PST' },
  { id: 'Africa/Johannesburg', name: 'Johannesburg', offset: 'UTC+02:00', abbr: 'SAST' },
  { id: 'Africa/Cairo', name: 'Cairo', offset: 'UTC+02:00', abbr: 'EET' },
];

const TimezoneSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, gradients } = useTheme();
  const [selectedTimezone, setSelectedTimezone] = useState('America/Chicago');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimezone();
  }, []);

  const loadTimezone = async () => {
    try {
      const stored = await AsyncStorage.getItem('app_timezone');
      if (stored) setSelectedTimezone(stored);
    } catch (error) {
      console.error('Error loading timezone:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectTimezone = async (id: string) => {
    setSelectedTimezone(id);
    await AsyncStorage.setItem('app_timezone', id);
  };

  const filteredTimezones = TIMEZONES.filter(
    (tz) =>
      tz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tz.abbr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tz.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Timezone</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search timezones..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {filteredTimezones.map((tz, index) => (
            <TouchableOpacity
              key={tz.id}
              style={[
                styles.timezoneItem,
                { borderBottomColor: colors.border },
                index === filteredTimezones.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={() => selectTimezone(tz.id)}
            >
              <View style={[styles.abbrBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.abbrText, { color: colors.primary }]}>{tz.abbr}</Text>
              </View>
              <View style={styles.timezoneInfo}>
                <Text style={[styles.timezoneName, { color: colors.text }]}>{tz.name}</Text>
                <Text style={[styles.timezoneOffset, { color: colors.textSecondary }]}>{tz.offset}</Text>
              </View>
              {selectedTimezone === tz.id && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingVertical: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
  searchContainer: { flexDirection: 'row', alignItems: 'center', margin: 16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  content: { flex: 1 },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center', borderRadius: 12, marginHorizontal: 16, overflow: 'hidden', borderWidth: 1 },
  timezoneItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  abbrBadge: { width: 50, paddingVertical: 6, borderRadius: 6, alignItems: 'center', marginRight: 12 },
  abbrText: { fontSize: 12, fontWeight: '700' },
  timezoneInfo: { flex: 1 },
  timezoneName: { fontSize: 16, fontWeight: '500' },
  timezoneOffset: { fontSize: 13, marginTop: 2 },
});

export default TimezoneSettingsScreen;
