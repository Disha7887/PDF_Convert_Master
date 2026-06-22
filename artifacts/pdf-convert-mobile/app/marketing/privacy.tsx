import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { fonts } from "@/constants/theme";

const C = colors.light;
type FeatherName = keyof typeof Feather.glyphMap;

type Block =
  | { type: "p"; text: string }
  | { type: "def"; label: string; text: string }
  | { type: "contact"; rows: [string, string][] };

interface Section {
  num: number;
  icon: FeatherName;
  title: string;
  blocks: Block[];
}

const SECTIONS: Section[] = [
  {
    num: 1,
    icon: "database",
    title: "Information We Collect",
    blocks: [
      { type: "def", label: "Personal Information:", text: "We collect minimal personal information, including email addresses for account creation, user preferences, and customer support communications." },
      { type: "def", label: "File Information:", text: "When you upload files for conversion, we temporarily process file metadata and content solely for conversion purposes. We do not permanently store or analyze your file contents." },
      { type: "def", label: "Usage Data:", text: "We collect anonymous usage statistics, including conversion types, file sizes, processing times, and general usage patterns to improve our services." },
      { type: "def", label: "Technical Information:", text: "We automatically collect IP addresses, browser types, device information, and referral URLs for security, analytics, and service optimization." },
      { type: "def", label: "Account Information:", text: "For registered users, we store account credentials, preferences, subscription status, and basic profile information." },
    ],
  },
  {
    num: 2,
    icon: "eye",
    title: "How We Use Your Information",
    blocks: [
      { type: "def", label: "Service Provision:", text: "To provide PDF conversion and document processing services, including file format conversion, merging, splitting, and optimization." },
      { type: "def", label: "Account Management:", text: "To create and manage user accounts, authenticate users, and provide personalized service experiences." },
      { type: "def", label: "Communication:", text: "To send important service notifications, security alerts, and respond to customer support inquiries." },
      { type: "def", label: "Service Improvement:", text: "To analyze usage patterns, identify technical issues, and enhance our platform's performance and features." },
      { type: "def", label: "Security:", text: "To detect and prevent fraudulent activities, unauthorized access, and ensure platform security." },
      { type: "def", label: "Legal Compliance:", text: "To comply with applicable laws, regulations, and legal processes when required." },
    ],
  },
  {
    num: 3,
    icon: "file-text",
    title: "File Processing and Storage",
    blocks: [
      { type: "def", label: "Temporary Processing:", text: "All uploaded files are processed temporarily on secure servers. Files are automatically deleted after conversion completion, typically within 24 hours." },
      { type: "def", label: "No Permanent Storage:", text: "We do not permanently store your uploaded files or converted documents. Once processing is complete and files are downloaded or the session expires, all data is permanently deleted." },
      { type: "def", label: "Processing Purpose:", text: "Files are accessed only for the specific conversion or processing task requested and are not used for any other purpose." },
      { type: "def", label: "Server Security:", text: "Our processing servers are secured with encryption, access controls, and regular security monitoring." },
      { type: "def", label: "File Limitations:", text: "We may impose reasonable file size and processing time limits to ensure optimal service performance for all users." },
    ],
  },
  {
    num: 4,
    icon: "shield",
    title: "Data Security Measures",
    blocks: [
      { type: "def", label: "Encryption in Transit:", text: "All data transmission between your device and our servers is encrypted using SSL/TLS protocols (HTTPS)." },
      { type: "def", label: "Encryption at Rest:", text: "Files temporarily stored during processing are encrypted using industry-standard encryption algorithms." },
      { type: "def", label: "Access Controls:", text: "Strict access controls ensure only authorized personnel can access systems, with multi-factor authentication and regular access reviews." },
      { type: "def", label: "Server Security:", text: "Our servers are protected by firewalls, intrusion detection systems, and regular security updates." },
      { type: "def", label: "Automatic Deletion:", text: "Automated systems ensure uploaded files and processing data are permanently deleted after completion." },
      { type: "def", label: "Security Monitoring:", text: "Continuous monitoring for security threats, suspicious activities, and potential data breaches." },
    ],
  },
  {
    num: 5,
    icon: "disc",
    title: "Cookies and Tracking",
    blocks: [
      { type: "def", label: "Essential Cookies:", text: "We use necessary cookies for core site functionality, including user authentication, session management, and security features." },
      { type: "def", label: "Functional Cookies:", text: "Cookies that remember your preferences, settings, and improve your user experience on our platform." },
      { type: "def", label: "Analytics Cookies:", text: "Anonymous analytics cookies help us understand how users interact with our service to improve functionality and performance." },
      { type: "def", label: "Cookie Control:", text: "You can control cookie settings through your browser preferences, though disabling certain cookies may affect site functionality." },
      { type: "def", label: "Third-Party Cookies:", text: "We may use third-party services that set their own cookies, subject to their respective privacy policies." },
      { type: "def", label: "Cookie Retention:", text: "Most cookies expire automatically, with session cookies deleted when you close your browser." },
    ],
  },
  {
    num: 6,
    icon: "cloud",
    title: "Third-Party Services",
    blocks: [
      { type: "def", label: "Payment Processing:", text: "We use secure third-party payment processors for subscription billing. These services have their own privacy policies and security measures." },
      { type: "def", label: "Analytics Services:", text: "Anonymous usage analytics are collected through third-party services to help improve our platform performance." },
      { type: "def", label: "Customer Support:", text: "We may use third-party tools for customer support communications, subject to strict data protection agreements." },
      { type: "def", label: "Cloud Infrastructure:", text: "Our services are hosted on secure cloud infrastructure providers who comply with industry security standards." },
      { type: "def", label: "Data Sharing Limitations:", text: "We do not share your personal data or files with third parties for marketing or unrelated business purposes." },
      { type: "def", label: "Vendor Agreements:", text: "All third-party vendors are bound by data protection agreements and must comply with our privacy standards." },
    ],
  },
  {
    num: 7,
    icon: "clock",
    title: "Data Retention",
    blocks: [
      { type: "def", label: "File Retention:", text: "Uploaded and converted files are automatically deleted within 24 hours of processing completion. No files are stored permanently." },
      { type: "def", label: "Account Information:", text: "Account data is retained while your account is active and for a reasonable period after account closure to comply with legal obligations." },
      { type: "def", label: "Usage Analytics:", text: "Anonymous usage statistics may be retained for service improvement purposes, with personal identifiers removed." },
      { type: "def", label: "Legal Requirements:", text: "We may retain certain data longer when required by law, legal processes, or legitimate business purposes." },
      { type: "def", label: "Data Deletion:", text: "Upon account deletion, personal information is removed within 30 days, except where retention is legally required." },
      { type: "def", label: "Backup Systems:", text: "Data in backup systems is subject to the same deletion schedules, though technical limitations may cause brief delays." },
    ],
  },
  {
    num: 8,
    icon: "user-check",
    title: "Your Privacy Rights",
    blocks: [
      { type: "def", label: "Access Rights:", text: "You can request access to the personal information we hold about you and receive details about how it's processed." },
      { type: "def", label: "Correction Rights:", text: "You may request correction of inaccurate or incomplete personal information in your account settings or by contacting us." },
      { type: "def", label: "Deletion Rights:", text: "You can request deletion of your personal information, subject to legal retention requirements and legitimate business needs." },
      { type: "def", label: "Portability Rights:", text: "You may request your personal data in a portable format to transfer to another service provider." },
      { type: "def", label: "Objection Rights:", text: "You can object to certain types of data processing, including direct marketing communications." },
      { type: "def", label: "Withdrawal of Consent:", text: "Where processing is based on consent, you may withdraw consent at any time without affecting lawfulness of prior processing." },
    ],
  },
  {
    num: 9,
    icon: "check-square",
    title: "GDPR Compliance",
    blocks: [
      { type: "def", label: "Legal Basis:", text: "We process personal data based on legitimate interests for service provision, contractual necessity for account management, and consent for marketing communications." },
      { type: "def", label: "Data Minimization:", text: "We collect only the minimum personal data necessary to provide our services effectively." },
      { type: "def", label: "Purpose Limitation:", text: "Personal data is used only for the specific purposes for which it was collected or compatible purposes." },
      { type: "def", label: "Data Protection Officer:", text: "We have designated data protection responsibilities to ensure GDPR compliance across all operations." },
      { type: "def", label: "Impact Assessments:", text: "We conduct privacy impact assessments for high-risk processing activities to protect individual rights." },
      { type: "def", label: "Breach Notification:", text: "We have procedures to detect, report, and investigate personal data breaches within required timeframes." },
    ],
  },
  {
    num: 10,
    icon: "user-x",
    title: "Children's Privacy",
    blocks: [
      { type: "def", label: "Age Requirements:", text: "Our services are not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16." },
      { type: "def", label: "Parental Consent:", text: "If we discover we have collected information from a child under 16 without parental consent, we will delete such information immediately." },
      { type: "def", label: "Educational Use:", text: "Educational institutions may use our services for students over 16 with appropriate permissions and supervision." },
      { type: "def", label: "Reporting:", text: "Parents or guardians who believe we have collected information from a child under 16 should contact us immediately." },
      { type: "def", label: "Account Restrictions:", text: "Users must confirm they are at least 16 years old during account creation." },
    ],
  },
  {
    num: 11,
    icon: "globe",
    title: "International Transfers",
    blocks: [
      { type: "def", label: "Data Location:", text: "Your data may be processed and stored in countries outside the UK/EU where our service providers operate." },
      { type: "def", label: "Transfer Safeguards:", text: "All international transfers are protected by appropriate safeguards, including adequacy decisions, standard contractual clauses, or other approved mechanisms." },
      { type: "def", label: "Security Standards:", text: "International service providers must meet equivalent data protection and security standards as required in the UK/EU." },
      { type: "def", label: "Legal Protections:", text: "Transfer agreements include strong data protection clauses and rights for data subjects." },
      { type: "def", label: "Minimized Transfers:", text: "We minimize international transfers and ensure they occur only when necessary for service provision." },
    ],
  },
  {
    num: 12,
    icon: "alert-triangle",
    title: "Data Breach Notification",
    blocks: [
      { type: "def", label: "Detection Systems:", text: "We maintain monitoring systems to detect potential security incidents and data breaches promptly." },
      { type: "def", label: "Response Procedures:", text: "We have established incident response procedures to contain, assess, and resolve security breaches effectively." },
      { type: "def", label: "Regulatory Notification:", text: "We will notify relevant authorities within 72 hours of becoming aware of a breach that poses risks to individual rights and freedoms." },
      { type: "def", label: "User Notification:", text: "Affected users will be notified without undue delay if a breach is likely to result in high risk to their rights and freedoms." },
      { type: "def", label: "Documentation:", text: "All security incidents are documented with details of the breach, impact assessment, and remediation actions taken." },
      { type: "def", label: "Prevention Measures:", text: "We continuously improve security measures based on incident learnings and emerging threats." },
    ],
  },
  {
    num: 13,
    icon: "mail",
    title: "Contact for Privacy Concerns",
    blocks: [
      { type: "p", text: "If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:" },
      {
        type: "contact",
        rows: [
          ["Company:", "Mizan Store Ltd"],
          ["Service:", "PDF Genius"],
          ["Phone:", "+447429919748"],
          ["Location:", "London, United Kingdom"],
          ["Privacy Inquiries:", "Please contact us through our website contact form"],
        ],
      },
      { type: "def", label: "Response Time:", text: "We aim to respond to privacy inquiries within 30 days of receipt." },
      { type: "def", label: "Regulatory Contact:", text: "You also have the right to contact the Information Commissioner's Office (ICO) in the UK regarding privacy concerns." },
    ],
  },
  {
    num: 14,
    icon: "edit-2",
    title: "Changes to Privacy Policy",
    blocks: [
      { type: "def", label: "Policy Updates:", text: "We may update this Privacy Policy to reflect changes in our practices, legal requirements, or service features." },
      { type: "def", label: "Notification Methods:", text: "Significant changes will be communicated through email notifications to registered users and prominent notices on our website." },
      { type: "def", label: "Advance Notice:", text: "Material changes will be announced at least 30 days before taking effect to allow you to review and understand the changes." },
      { type: "def", label: "Continued Use:", text: "Your continued use of our services after policy changes take effect constitutes acceptance of the updated Privacy Policy." },
      { type: "def", label: "Objection Rights:", text: "If you disagree with policy changes, you may close your account before the changes take effect." },
      { type: "def", label: "Version Control:", text: "We maintain version history of policy changes with effective dates for transparency." },
    ],
  },
  {
    num: 15,
    icon: "calendar",
    title: "Effective Date",
    blocks: [
      { type: "def", label: "Current Version:", text: "This Privacy Policy is effective as of January 15, 2024, and applies to all information collected on or after this date." },
      { type: "def", label: "Previous Versions:", text: "This policy supersedes all previous versions of our privacy statements and policies." },
      { type: "def", label: "Retroactive Application:", text: "Changes to this policy apply only to information collected after the effective date, unless otherwise specified." },
      { type: "def", label: "Regular Reviews:", text: "We review and update this policy regularly to ensure it remains current with legal requirements and best practices." },
      { type: "def", label: "Contact for Clarification:", text: "If you have questions about when specific provisions became effective, please contact us for clarification." },
    ],
  },
];

function renderBlock(block: Block, key: number) {
  switch (block.type) {
    case "p":
      return (
        <Text key={key} style={styles.paragraph}>
          {block.text}
        </Text>
      );
    case "def":
      return (
        <Text key={key} style={styles.paragraph}>
          <Text style={styles.bold}>{block.label}</Text> {block.text}
        </Text>
      );
    case "contact":
      return (
        <View key={key} style={styles.contactBox}>
          {block.rows.map(([label, value], i) => (
            <Text key={i} style={styles.contactLine}>
              <Text style={styles.bold}>{label}</Text> {value}
            </Text>
          ))}
        </View>
      );
  }
}

export default function Screen() {
  return (
    <ScreenScroll>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.subtitle}>
          Your privacy is important to us. This Privacy Policy explains how PDF Genius
          (operated by Mizan Store Ltd) collects, uses, and protects your personal information.
        </Text>
        <Card style={styles.dateCard}>
          <View style={styles.dateRow}>
            <Feather name="calendar" size={16} color={C.primary} />
            <Text style={styles.dateText}>Last Updated: January 15, 2024</Text>
          </View>
          <View style={styles.dateRow}>
            <Feather name="clock" size={16} color={C.primary} />
            <Text style={styles.dateText}>Effective Date: January 15, 2024</Text>
          </View>
        </Card>
      </View>

      {/* Sections */}
      <View style={styles.stack}>
        {SECTIONS.map((section) => (
          <Card key={section.num}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionIcon}>
                <Feather name={section.icon} size={18} color={C.primary} />
              </View>
              <Text style={styles.sectionTitle}>
                {section.num}. {section.title}
              </Text>
            </View>
            <View style={styles.sectionBody}>{section.blocks.map((b, i) => renderBlock(b, i))}</View>
          </Card>
        ))}
      </View>

      {/* Document Information */}
      <View style={styles.docInfo}>
        <Text style={styles.docLine}>
          <Text style={styles.bold}>Document Version:</Text> 1.0
        </Text>
        <Text style={styles.docLine}>
          <Text style={styles.bold}>Last Updated:</Text> January 15, 2024
        </Text>
        <Text style={styles.docLine}>
          <Text style={styles.bold}>Effective Date:</Text> January 15, 2024
        </Text>
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 8 },
  title: { fontSize: 28, color: C.foreground, fontFamily: fonts.headingBold, marginBottom: 12 },
  subtitle: { fontSize: 15, lineHeight: 23, color: C.mutedForeground, fontFamily: fonts.body, marginBottom: 16 },
  dateCard: { gap: 10 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dateText: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.bodyMedium },

  stack: { gap: 16, marginTop: 16 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.blue100,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { flex: 1, fontSize: 18, color: C.foreground, fontFamily: fonts.headingBold },
  sectionBody: { gap: 10 },

  paragraph: { fontSize: 14, lineHeight: 23, color: "#374151", fontFamily: fonts.body },
  bold: { color: C.foreground, fontFamily: fonts.bodyBold },

  contactBox: { backgroundColor: C.muted, borderRadius: 12, padding: 14, gap: 6 },
  contactLine: { fontSize: 14, lineHeight: 22, color: "#374151", fontFamily: fonts.body },

  docInfo: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: C.border,
    gap: 6,
  },
  docLine: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.body },
});
