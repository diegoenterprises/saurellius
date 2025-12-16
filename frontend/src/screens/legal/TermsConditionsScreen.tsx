/**
 * TERMS AND CONDITIONS SCREEN
 * Saurellius Cloud Payroll & HR Management
 * A product of Dr. Paystub Corp, a subsidiary of Diego Enterprises, Inc.
 * 
 * COMPREHENSIVE LEGAL TERMS TO PROTECT THE COMPANY
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

export default function TermsConditionsScreen() {
  const navigation = useNavigation();

  const sections = [
    {
      title: '1. ACCEPTANCE OF TERMS',
      content: `BY ACCESSING OR USING SAURELLIUS CLOUD PAYROLL & HR MANAGEMENT ("PLATFORM," "SERVICE"), YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS AND CONDITIONS ("TERMS," "AGREEMENT").

This Agreement is entered into between you ("User," "Customer," "you," "your") and Dr. Paystub Corp, a subsidiary of Diego Enterprises, Inc. ("Company," "we," "us," "our").

IF YOU DO NOT AGREE TO THESE TERMS, YOU MUST NOT ACCESS OR USE THE PLATFORM. Your continued use of the Platform constitutes ongoing acceptance of these Terms and any amendments thereto.

By using this Platform, you represent and warrant that:
• You are at least 18 years of age
• You have the legal authority to enter into this Agreement
• You are authorized to act on behalf of any business entity you represent
• All information you provide is accurate and complete`,
    },
    {
      title: '2. DESCRIPTION OF SERVICE',
      content: `Saurellius Cloud Payroll & HR Management provides cloud-based payroll processing, human resources management, tax calculation, and related business services including but not limited to:

• Payroll processing and paystub generation
• Federal, state, and local tax calculations
• Employee time and attendance tracking
• Benefits administration
• Tax form preparation (W-2, 1099, 940, 941, etc.)
• Compliance management
• HR document management
• Workforce scheduling
• AI-powered payroll assistance

The Platform is provided "as is" and "as available." We reserve the right to modify, suspend, or discontinue any feature at any time without prior notice.`,
    },
    {
      title: '3. USER RESPONSIBILITIES AND OBLIGATIONS',
      content: `As a User of this Platform, you agree to:

**Data Accuracy:**
• Provide accurate, current, and complete information
• Maintain and promptly update your account information
• Ensure all employee data entered is accurate and lawfully obtained
• Verify all payroll calculations before processing

**Compliance:**
• Comply with all applicable federal, state, and local laws
• Obtain all necessary consents from employees for data processing
• Maintain proper employment records as required by law
• File all required tax returns and make timely tax deposits

**Security:**
• Maintain the confidentiality of your account credentials
• Immediately notify us of any unauthorized access
• Not share your account with unauthorized persons
• Use strong passwords and enable multi-factor authentication

**Prohibited Uses:**
• Use the Platform for any unlawful purpose
• Attempt to gain unauthorized access to our systems
• Transmit viruses, malware, or harmful code
• Interfere with the Platform's operation
• Reverse engineer or decompile our software
• Use the Platform to process payments for illegal activities`,
    },
    {
      title: '4. DISCLAIMER OF WARRANTIES',
      content: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:

THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.

WE DO NOT WARRANT THAT:
• The Platform will meet your specific requirements
• The Platform will be uninterrupted, timely, secure, or error-free
• The results obtained will be accurate or reliable
• Any errors will be corrected
• Tax calculations will be free from errors

**Tax Calculation Disclaimer:**
While we strive to provide accurate tax calculations based on current tax laws and regulations, we DO NOT guarantee the accuracy of any tax calculation. Tax laws change frequently, and interpretation may vary. YOU ARE SOLELY RESPONSIBLE for verifying all tax calculations and ensuring compliance with applicable tax laws.

**No Tax, Legal, or Financial Advice:**
The Platform does not provide tax, legal, or financial advice. All information is for informational purposes only. You should consult with qualified professionals for specific advice regarding your situation.`,
    },
    {
      title: '5. LIMITATION OF LIABILITY',
      content: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:

**Exclusion of Damages:**
IN NO EVENT SHALL DR. PAYSTUB CORP, DIEGO ENTERPRISES, INC., THEIR AFFILIATES, DIRECTORS, OFFICERS, EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR ANY:

• Indirect, incidental, special, consequential, or punitive damages
• Loss of profits, revenue, data, or business opportunities
• Costs of procurement of substitute services
• Damages arising from unauthorized access to your data
• Damages arising from errors in tax calculations
• Damages arising from your failure to comply with applicable laws
• Damages arising from your failure to maintain accurate records

**Liability Cap:**
OUR TOTAL CUMULATIVE LIABILITY FOR ALL CLAIMS ARISING FROM OR RELATED TO THIS AGREEMENT SHALL NOT EXCEED THE GREATER OF:
(A) THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR
(B) ONE HUNDRED DOLLARS ($100.00)

**Essential Purpose:**
THESE LIMITATIONS SHALL APPLY EVEN IF ANY REMEDY FAILS OF ITS ESSENTIAL PURPOSE AND REGARDLESS OF WHETHER WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

**Jurisdiction Variations:**
Some jurisdictions do not allow the exclusion of certain warranties or limitations of liability. In such jurisdictions, our liability shall be limited to the maximum extent permitted by law.`,
    },
    {
      title: '6. INDEMNIFICATION',
      content: `You agree to indemnify, defend, and hold harmless Dr. Paystub Corp, Diego Enterprises, Inc., and their respective officers, directors, employees, agents, affiliates, successors, and assigns from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from or related to:

• Your use or misuse of the Platform
• Your violation of these Terms
• Your violation of any applicable law or regulation
• Your violation of any third-party rights
• Any data or content you submit to the Platform
• Your failure to properly verify payroll calculations
• Your failure to make timely tax deposits or filings
• Any claim by your employees related to payroll processing
• Any governmental fines or penalties resulting from your use of the Platform
• Any unauthorized access to your account due to your negligence

This indemnification obligation shall survive the termination of this Agreement.`,
    },
    {
      title: '7. INTELLECTUAL PROPERTY',
      content: `**Our Property:**
The Platform, including all content, features, functionality, software, code, designs, text, graphics, logos, and trademarks are owned by Dr. Paystub Corp, Diego Enterprises, Inc., or their licensors and are protected by copyright, trademark, and other intellectual property laws.

"Saurellius," "Dr. Paystub," and related logos are registered trademarks of Dr. Paystub Corp and Diego Enterprises, Inc.

**Limited License:**
We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Platform for your internal business purposes in accordance with these Terms.

**Restrictions:**
You may not:
• Copy, modify, or distribute the Platform
• Create derivative works based on the Platform
• Reverse engineer or decompile the software
• Remove any proprietary notices or labels
• Use our trademarks without written permission
• Sublicense, sell, or transfer your rights

**Your Content:**
You retain ownership of data you submit. By submitting data, you grant us a license to use, process, and store such data as necessary to provide the Service.`,
    },
    {
      title: '8. DATA PROCESSING AND PRIVACY',
      content: `**Data Processing Agreement:**
When processing personal data on your behalf, we act as a data processor and you act as the data controller. You are responsible for ensuring you have the legal basis to collect and process personal data.

**Compliance:**
You represent that your use of the Platform complies with all applicable data protection laws including, but not limited to:
• General Data Protection Regulation (GDPR)
• California Consumer Privacy Act (CCPA)
• Health Insurance Portability and Accountability Act (HIPAA)
• Fair Labor Standards Act (FLSA)

**Employee Consent:**
You are solely responsible for obtaining all necessary consents from your employees for the collection, processing, and storage of their personal data.

**Security Incident:**
In the event of a data breach, we will notify you within 72 hours of discovery and cooperate in any required notifications. However, you remain responsible for notifying affected individuals and regulatory authorities as required by law.

Please refer to our Privacy Policy for complete details on data handling practices.`,
    },
    {
      title: '9. SUBSCRIPTION AND PAYMENT',
      content: `**Fees:**
Use of certain features requires a paid subscription. All fees are quoted in U.S. dollars unless otherwise specified.

**Billing:**
• Subscriptions are billed in advance on a monthly or annual basis
• All fees are non-refundable except as required by law
• We may change fees upon 30 days' notice
• Failure to pay may result in suspension or termination

**Automatic Renewal:**
Subscriptions automatically renew unless cancelled before the renewal date. You may cancel at any time through your account settings.

**Taxes:**
You are responsible for all applicable taxes. We will add taxes where required by law.

**Chargebacks:**
Disputing charges through your bank rather than contacting us directly may result in immediate account termination.`,
    },
    {
      title: '10. TERMINATION',
      content: `**By You:**
You may terminate your account at any time through your account settings. Upon termination:
• Your access to the Platform will cease
• You remain liable for any outstanding fees
• Your data will be retained for the period required by law

**By Us:**
We may suspend or terminate your account immediately if:
• You breach these Terms
• You fail to pay fees when due
• We are required to do so by law
• We believe your account poses a security risk
• You engage in fraudulent or illegal activity

**Effect of Termination:**
Upon termination:
• All licenses granted to you terminate
• You must cease all use of the Platform
• Sections 4-7, 10-14 survive termination
• We may delete your data after the statutory retention period`,
    },
    {
      title: '11. DISPUTE RESOLUTION',
      content: `**Governing Law:**
This Agreement shall be governed by the laws of the State of Delaware, United States, without regard to conflict of law principles.

**Mandatory Arbitration:**
ANY DISPUTE, CLAIM, OR CONTROVERSY ARISING FROM OR RELATING TO THIS AGREEMENT OR THE PLATFORM SHALL BE RESOLVED BY BINDING ARBITRATION administered by the American Arbitration Association in accordance with its Commercial Arbitration Rules.

**Class Action Waiver:**
YOU AGREE THAT ANY ARBITRATION SHALL BE CONDUCTED ON AN INDIVIDUAL BASIS AND NOT AS A CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION. You waive any right to participate in a class action lawsuit or class-wide arbitration.

**Exceptions:**
Either party may seek injunctive relief in any court of competent jurisdiction to prevent irreparable harm.

**Time Limitation:**
Any claim must be brought within one (1) year after the cause of action arises or be forever barred.

**Venue:**
Any litigation not subject to arbitration shall be brought exclusively in the federal or state courts located in Delaware.`,
    },
    {
      title: '12. FORCE MAJEURE',
      content: `We shall not be liable for any failure or delay in performing our obligations where such failure or delay results from circumstances beyond our reasonable control, including but not limited to:

• Natural disasters, acts of God
• War, terrorism, civil unrest
• Government actions or regulations
• Pandemic or epidemic
• Internet or telecommunications failures
• Power outages
• Third-party service provider failures

During such events, our obligations shall be suspended for the duration of the event.`,
    },
    {
      title: '13. GENERAL PROVISIONS',
      content: `**Entire Agreement:**
This Agreement, together with the Privacy Policy and any other policies referenced herein, constitutes the entire agreement between you and us.

**Severability:**
If any provision is found unenforceable, the remaining provisions shall continue in full force and effect.

**Waiver:**
Our failure to enforce any right or provision shall not constitute a waiver of such right or provision.

**Assignment:**
You may not assign this Agreement without our written consent. We may assign this Agreement freely.

**Notices:**
We may provide notices via email, in-app notification, or by posting on the Platform. You may contact us at legal@saurellius.com.

**No Agency:**
Nothing in this Agreement creates any agency, partnership, or employment relationship.

**Third-Party Beneficiaries:**
Diego Enterprises, Inc. and its affiliates are intended third-party beneficiaries of this Agreement.

**Export Compliance:**
You agree to comply with all applicable export control laws and not export the Platform to prohibited countries or persons.`,
    },
    {
      title: '14. MODIFICATIONS TO TERMS',
      content: `We reserve the right to modify these Terms at any time. We will provide notice of material changes by:

• Email notification to your registered address
• Prominent notice within the Platform
• Updating the "Last Updated" date

Your continued use of the Platform after such modifications constitutes acceptance of the revised Terms.

If you do not agree to the modified Terms, you must stop using the Platform and terminate your account.

For significant changes affecting your legal rights, we will provide at least 30 days' notice before the changes take effect.`,
    },
    {
      title: '15. CONTACT INFORMATION',
      content: `For questions about these Terms:

**Dr. Paystub Corp**
(A subsidiary of Diego Enterprises, Inc.)

Email: legal@saurellius.com
Website: https://saurellius.drpaystub.com
Support: support@saurellius.com

**Legal Department:**
legal@diegoenterprises.com

**Registered Agent:**
Diego Enterprises, Inc.
[Registered Agent Address]
Delaware, United States`,
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
            <Text style={styles.headerTitle}>Terms & Conditions</Text>
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

        {/* Important Notice */}
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={28} color="#F59E0B" />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>IMPORTANT LEGAL AGREEMENT</Text>
            <Text style={styles.warningText}>
              Please read these Terms carefully. By using Saurellius, you agree to be legally bound by these Terms.
            </Text>
          </View>
        </View>

        {/* Company Info */}
        <View style={styles.companyCard}>
          <Ionicons name="business" size={32} color="#1473FF" />
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
    backgroundColor: colors.background,
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
    color: colors.text,
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
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 4,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F59E0B20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#F59E0B',
    lineHeight: 18,
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
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
    color: colors.text,
  },
  companySubtext: {
    fontSize: 13,
    color: '#a0a0a0',
    marginTop: 2,
  },
  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1473FF',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 13,
    color: '#a0a0a0',
    lineHeight: 21,
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
