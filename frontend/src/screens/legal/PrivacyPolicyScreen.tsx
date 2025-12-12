/**
 * PRIVACY POLICY SCREEN
 * Saurellius Cloud Payroll & HR Management
 * A product of Dr. Paystub Corp, a subsidiary of Diego Enterprises, Inc.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const EFFECTIVE_DATE = 'January 1, 2025';
const LAST_UPDATED = 'December 9, 2025';

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  const sections = [
    {
      title: '1. Introduction',
      content: `Welcome to Saurellius Cloud Payroll & HR Management ("Platform," "Service," "we," "us," or "our"). This Platform is a product of Dr. Paystub Corp, a subsidiary of Diego Enterprises, Inc.

We are committed to protecting your privacy and handling your personal information with care. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Platform.

By accessing or using Saurellius Cloud Payroll & HR Management, you agree to the terms of this Privacy Policy. If you do not agree with these terms, please do not access or use the Platform.`,
    },
    {
      title: '2. Information We Collect',
      content: `We collect several types of information to provide and improve our services:

**Personal Information:**
• Full name, email address, phone number
• Social Security Number (last 4 digits or full, as required)
• Date of birth and government-issued ID information
• Employment information (job title, department, hire date)
• Compensation details (salary, hourly rate, bonuses)
• Banking information for direct deposit
• Tax filing status and withholding allowances

**Business Information:**
• Company name, address, and EIN
• Payroll schedules and payment history
• Employee records and organizational data

**Usage Information:**
• Device information (IP address, browser type, OS)
• Log data and analytics
• Feature usage patterns and preferences

**Biometric Information:**
• Facial recognition data (if enabled for clock-in/out)
• Fingerprint data (if enabled for authentication)`,
    },
    {
      title: '3. How We Use Your Information',
      content: `We use collected information for the following purposes:

**Service Delivery:**
• Process payroll and generate paystubs
• Calculate federal, state, and local taxes
• Manage employee benefits and deductions
• Generate tax forms (W-2, 1099, 941, etc.)
• Enable time tracking and scheduling features

**Platform Improvement:**
• Analyze usage patterns to enhance features
• Develop new products and services
• Provide customer support
• Send service-related communications

**Legal Compliance:**
• Comply with tax reporting requirements
• Maintain records as required by law
• Respond to legal requests and prevent fraud`,
    },
    {
      title: '4. Information Sharing',
      content: `We may share your information with:

**Service Providers:**
• Payment processors (Stripe) for billing
• Cloud infrastructure providers (AWS)
• Email service providers (Resend)
• AI services (Google Gemini) for intelligent features

**Government Agencies:**
• IRS and state tax authorities (tax filings)
• Department of Labor (as required)
• Social Security Administration (W-2/W-3 reporting)

**Third Parties (with consent):**
• Accounting software integrations
• Benefits providers
• Background check services

We do NOT sell your personal information to third parties for marketing purposes.`,
    },
    {
      title: '5. Data Security',
      content: `We implement industry-standard security measures:

• **Encryption:** All data transmitted using TLS 1.3
• **Storage:** Data encrypted at rest using AES-256
• **Access Control:** Role-based permissions and MFA
• **Monitoring:** 24/7 security monitoring and alerts
• **Compliance:** SOC 2 Type II certified infrastructure
• **Backups:** Daily encrypted backups with 30-day retention

Despite our efforts, no security system is impenetrable. We cannot guarantee absolute security but will notify you of any breach as required by law.`,
    },
    {
      title: '6. Data Retention',
      content: `We retain your information as follows:

• **Active Accounts:** Data retained while account is active
• **Payroll Records:** 7 years (IRS requirement)
• **Tax Documents:** 7 years minimum
• **Employment Records:** 4 years after termination
• **Usage Logs:** 90 days for analytics, 1 year for security

You may request deletion of your data subject to legal retention requirements.`,
    },
    {
      title: '7. Your Rights',
      content: `Depending on your jurisdiction, you may have rights including:

• **Access:** Request a copy of your personal data
• **Correction:** Update inaccurate information
• **Deletion:** Request erasure of your data
• **Portability:** Export your data in a standard format
• **Opt-Out:** Decline certain data processing
• **Non-Discrimination:** No penalty for exercising rights

**California Residents (CCPA):**
You have additional rights under the California Consumer Privacy Act, including the right to know what personal information we collect and how it's used.

To exercise these rights, contact: privacy@saurellius.com`,
    },
    {
      title: '8. Cookies and Tracking',
      content: `We use cookies and similar technologies for:

• **Essential Functions:** Authentication, security
• **Analytics:** Understanding usage patterns
• **Preferences:** Remembering your settings

You can control cookies through your browser settings. Disabling certain cookies may limit Platform functionality.`,
    },
    {
      title: '9. Children\'s Privacy',
      content: `Saurellius Cloud Payroll & HR Management is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If we learn we have collected data from a child, we will delete it promptly.`,
    },
    {
      title: '10. International Data Transfers',
      content: `Your information may be transferred to and processed in the United States where our servers are located. By using the Platform, you consent to this transfer. We implement appropriate safeguards for international data transfers.`,
    },
    {
      title: '11. Changes to This Policy',
      content: `We may update this Privacy Policy periodically. We will notify you of material changes via:

• Email notification to your registered address
• In-app notification upon login
• Updated "Last Modified" date

Continued use after changes constitutes acceptance of the revised policy.`,
    },
    {
      title: '12. Contact Information',
      content: `For privacy-related inquiries:

**Dr. Paystub Corp**
(A subsidiary of Diego Enterprises, Inc.)

Email: privacy@saurellius.com
Website: https://saurellius.drpaystub.com
Support: support@saurellius.com

**Data Protection Officer:**
dpo@diegoenterprises.com

**Mailing Address:**
Diego Enterprises, Inc.
Attn: Privacy Team
[Corporate Address]`,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1473FF', '#BE01FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Privacy Policy</Text>
            <Text style={styles.headerSubtitle}>
              Saurellius Cloud Payroll & HR Management
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Effective Date */}
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>Effective Date: {EFFECTIVE_DATE}</Text>
          <Text style={styles.dateText}>Last Updated: {LAST_UPDATED}</Text>
        </View>

        {/* Company Info */}
        <View style={styles.companyCard}>
          <Ionicons name="shield-checkmark" size={32} color="#1473FF" />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>Dr. Paystub Corp</Text>
            <Text style={styles.companySubtext}>
              A subsidiary of Diego Enterprises, Inc.
            </Text>
          </View>
        </View>

        {/* Sections */}
        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 Diego Enterprises, Inc. All rights reserved.
          </Text>
          <Text style={styles.footerText}>
            Saurellius® is a registered trademark of Dr. Paystub Corp.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  dateContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 4,
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#1473FF',
  },
  companyInfo: {
    marginLeft: 12,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  companySubtext: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1473FF',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 14,
    color: '#a0a0a0',
    lineHeight: 22,
  },
  footer: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#a0a0a0',
    textAlign: 'center',
    marginBottom: 4,
  },
});
