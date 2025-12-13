/**
 * SAURELLIUS HELP CENTER
 * FAQs, support, and documentation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQ[] = [
  { id: '1', category: 'Payroll', question: 'How do I run payroll?', answer: 'Navigate to the Payroll screen, select the pay period, review employee hours, and click "Run Payroll". The system will calculate taxes and deductions automatically.' },
  { id: '2', category: 'Payroll', question: 'When are payroll taxes deposited?', answer: 'Federal taxes are deposited according to your deposit schedule (monthly or semi-weekly). State taxes vary by state requirements.' },
  { id: '3', category: 'Employees', question: 'How do I add a new employee?', answer: 'Go to Employees > Add Employee. Fill in their personal info, tax forms (W-4, I-9), and direct deposit details.' },
  { id: '4', category: 'Employees', question: 'How do I terminate an employee?', answer: 'Navigate to the employee profile > Actions > Terminate. Enter the termination date and reason. Final pay will be calculated automatically.' },
  { id: '5', category: 'Taxes', question: 'How do I file quarterly taxes?', answer: 'Go to Tax Center > Quarterly Filings. Review Form 941 and state returns, then submit electronically or download for manual filing.' },
  { id: '6', category: 'Taxes', question: 'Where can I find W-2s?', answer: 'W-2s are available in Year End > W-2s. They are generated in January for the previous tax year and can be printed or emailed to employees.' },
  { id: '7', category: 'Account', question: 'How do I change my password?', answer: 'Go to Settings > Security > Change Password. Enter your current password and new password twice to confirm.' },
  { id: '8', category: 'Account', question: 'How do I update billing information?', answer: 'Navigate to Settings > Payment Methods. You can add, remove, or update credit cards and bank accounts.' },
  { id: '9', category: 'Reports', question: 'What reports are available?', answer: 'Access Reports for payroll summaries, tax liability, employee earnings, deductions, and custom reports. Export as PDF or Excel.' },
  { id: '10', category: 'Time', question: 'How does time tracking work?', answer: 'Employees can clock in/out via the Time Clock screen. Managers can review and approve timesheets before payroll runs.' },
];

const CATEGORIES = ['All', 'Payroll', 'Employees', 'Taxes', 'Account', 'Reports', 'Time'];

const HelpCenterScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, gradients } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openSupport = (type: 'email' | 'phone' | 'chat') => {
    switch (type) {
      case 'email':
        Linking.openURL('mailto:support@saurellius.com');
        break;
      case 'phone':
        Linking.openURL('tel:1-800-PAY-STUB');
        break;
      case 'chat':
        Linking.openURL('https://saurellius.com/chat');
        break;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help Center</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search help articles..."
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

        {/* Contact Support */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Contact Support</Text>
        <View style={styles.supportRow}>
          <TouchableOpacity style={[styles.supportCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => openSupport('email')}>
            <View style={[styles.supportIcon, { backgroundColor: '#3B82F620' }]}>
              <Ionicons name="mail-outline" size={24} color="#3B82F6" />
            </View>
            <Text style={[styles.supportLabel, { color: colors.text }]}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.supportCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => openSupport('phone')}>
            <View style={[styles.supportIcon, { backgroundColor: '#22C55E20' }]}>
              <Ionicons name="call-outline" size={24} color="#22C55E" />
            </View>
            <Text style={[styles.supportLabel, { color: colors.text }]}>Phone</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.supportCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => openSupport('chat')}>
            <View style={[styles.supportIcon, { backgroundColor: '#8B5CF620' }]}>
              <Ionicons name="chatbubbles-outline" size={24} color="#8B5CF6" />
            </View>
            <Text style={[styles.supportLabel, { color: colors.text }]}>Live Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                { backgroundColor: selectedCategory === cat ? colors.primary : colors.card, borderColor: colors.border },
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, { color: selectedCategory === cat ? '#fff' : colors.text }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FAQs */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Frequently Asked Questions</Text>
        <View style={[styles.faqContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {filteredFaqs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="help-circle-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No results found</Text>
            </View>
          ) : (
            filteredFaqs.map((faq, index) => (
              <TouchableOpacity
                key={faq.id}
                style={[
                  styles.faqItem,
                  { borderBottomColor: colors.border },
                  index === filteredFaqs.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
              >
                <View style={styles.faqHeader}>
                  <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.categoryBadgeText, { color: colors.primary }]}>{faq.category}</Text>
                  </View>
                  <Ionicons
                    name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.question}</Text>
                {expandedFaq === faq.id && (
                  <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{faq.answer}</Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

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
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  content: { flex: 1 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', margin: 16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginTop: 8, marginBottom: 12, marginHorizontal: 16 },
  supportRow: { flexDirection: 'row', marginHorizontal: 16, gap: 12 },
  supportCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  supportIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  supportLabel: { fontSize: 14, fontWeight: '500' },
  categoriesContainer: { paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  categoryText: { fontSize: 14, fontWeight: '500' },
  faqContainer: { borderRadius: 12, marginHorizontal: 16, overflow: 'hidden', borderWidth: 1 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { marginTop: 12, fontSize: 16 },
  faqItem: { padding: 16, borderBottomWidth: 1 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  categoryBadgeText: { fontSize: 11, fontWeight: '600' },
  faqQuestion: { fontSize: 16, fontWeight: '500' },
  faqAnswer: { fontSize: 14, marginTop: 12, lineHeight: 20 },
});

export default HelpCenterScreen;
