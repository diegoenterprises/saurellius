import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { rulesetsService } from '../../services/rulesets';

export default function EmployerPayrollRulesScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('2026-01-15');
  const [ruleset, setRuleset] = useState<any>(null);
  const [payload, setPayload] = useState<any>(null);

  const prettyPayload = useMemo(() => {
    try {
      return payload ? JSON.stringify(payload, null, 2) : '';
    } catch {
      return '';
    }
  }, [payload]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rulesetsService.getActiveRuleset({ key: 'irs_federal_withholding', date });
      setRuleset(res.ruleset || null);
      setPayload(res.payload || null);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to load ruleset');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Payroll Rules (Employer)</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Live ruleset lookup (DB-backed). Used by payroll preview/run.</Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.label, { color: colors.textSecondary }]}>Date (YYYY-MM-DD)</Text>
          <View style={styles.row}>
            <TextInput
              value={date}
              onChangeText={setDate}
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
              placeholder="2026-01-15"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />
            <TouchableOpacity style={[styles.refreshButton, { backgroundColor: colors.inputBackground }]} onPress={load}>
              <Ionicons name="refresh" size={18} color={colors.text} />
              <Text style={[styles.refreshText, { color: colors.text }]}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading ruleset...</Text>
            </View>
          ) : (
            <Text style={[styles.meta, { color: colors.textSecondary }]}>Found: {ruleset ? 'YES' : 'NO'}</Text>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.cardTitle, { color: colors.text }]}>IRS Federal Withholding (2026)</Text>
          {ruleset ? (
            <Text style={[styles.code, { color: colors.text }]}>{prettyPayload}</Text>
          ) : (
            <Text style={[styles.meta, { color: colors.textSecondary }]}>No active ruleset found for this date.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, maxWidth: 1100, marginHorizontal: 'auto', width: '100%' },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { marginTop: 4, fontSize: 13 },
  card: { marginTop: 14, borderWidth: 1, borderRadius: 14, padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  label: { fontSize: 12, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  refreshButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  refreshText: { fontWeight: '700' },
  loadingBox: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 13 },
  meta: { fontSize: 13, marginTop: 6 },
  code: { marginTop: 10, fontFamily: 'Courier', fontSize: 12, lineHeight: 16 },
});
