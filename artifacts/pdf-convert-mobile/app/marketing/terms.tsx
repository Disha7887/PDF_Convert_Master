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
  | { type: "bullets"; items: string[] }
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
    icon: "check-circle",
    title: "Acceptance of Terms",
    blocks: [
      {
        type: "p",
        text:
          'By accessing and using PDF Genius (the "Service"), a web-based PDF conversion platform operated by Mizan Store Ltd, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.',
      },
      {
        type: "p",
        text:
          "These Terms constitute a legally binding agreement between you and Mizan Store Ltd. Your continued use of the Service constitutes your acceptance of any modifications to these Terms.",
      },
    ],
  },
  {
    num: 2,
    icon: "book",
    title: "Definitions",
    blocks: [
      { type: "def", label: '"Service"', text: "refers to PDF Genius, our web-based platform and all related tools and features." },
      { type: "def", label: '"User," "you," or "your"', text: "refers to any individual or entity using our Service." },
      { type: "def", label: '"Company," "we," "us," or "our"', text: "refers to Mizan Store Ltd, a company incorporated in England and Wales." },
      { type: "def", label: '"Content"', text: "refers to any files, documents, data, or information uploaded to or processed through our Service." },
      { type: "def", label: '"Account"', text: "refers to your registered user account on our platform." },
      { type: "def", label: '"Personal Data"', text: "has the meaning set out in the UK General Data Protection Regulation (UK GDPR)." },
    ],
  },
  {
    num: 3,
    icon: "heart",
    title: "Description of Services",
    blocks: [
      {
        type: "p",
        text: "PDF Genius provides online document conversion and processing services, including but not limited to:",
      },
      {
        type: "bullets",
        items: [
          "PDF to various format conversions (Word, Excel, PowerPoint, images, etc.)",
          "Multiple format to PDF conversions",
          "PDF merging, splitting, and editing tools",
          "Document compression and optimization",
          "Password protection and security features",
          "Batch processing capabilities",
        ],
      },
      {
        type: "p",
        text: "We reserve the right to modify, suspend, or discontinue any aspect of our Service at any time with reasonable notice to users.",
      },
    ],
  },
  {
    num: 4,
    icon: "user",
    title: "User Accounts",
    blocks: [
      {
        type: "p",
        text: "While many features are available without registration, creating an account provides access to enhanced features and processing history.",
      },
      { type: "def", label: "Account Security:", text: "You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account." },
      { type: "def", label: "Accurate Information:", text: "You must provide accurate, current, and complete information when creating your account." },
      { type: "def", label: "Age Requirement:", text: "You must be at least 16 years old to create an account and use our Service." },
      { type: "def", label: "Single Account:", text: "You may maintain only one account per individual or business entity." },
    ],
  },
  {
    num: 5,
    icon: "shield",
    title: "Acceptable Use Policy",
    blocks: [
      { type: "p", text: "You agree not to use our Service to:" },
      {
        type: "bullets",
        items: [
          "Upload, process, or distribute illegal, harmful, or copyrighted content without authorization",
          "Attempt to gain unauthorized access to our systems or other users' accounts",
          "Distribute malware, viruses, or other malicious code",
          "Engage in activities that could damage, disable, or impair our Service",
          "Use automated scripts or bots to abuse our Service",
          "Violate any applicable laws or regulations",
          "Infringe upon intellectual property rights of others",
        ],
      },
      { type: "p", text: "Violation of this policy may result in immediate termination of your access to our Service." },
    ],
  },
  {
    num: 6,
    icon: "file-text",
    title: "User Content and Files",
    blocks: [
      { type: "def", label: "File Processing:", text: "Files uploaded to our Service are processed temporarily and automatically deleted after completion. We do not permanently store your documents." },
      { type: "def", label: "Content Ownership:", text: "You retain full ownership of all content you upload. We do not claim any ownership rights to your files." },
      { type: "def", label: "Processing License:", text: "By uploading files, you grant us a limited, temporary license to process your content solely for providing our conversion services." },
      { type: "def", label: "File Limitations:", text: "We may impose reasonable limits on file size, processing time, and usage volume to ensure optimal service performance." },
      { type: "def", label: "Prohibited Content:", text: "You may not upload content that violates laws, infringes copyrights, or contains malicious code." },
    ],
  },
  {
    num: 7,
    icon: "award",
    title: "Intellectual Property",
    blocks: [
      { type: "def", label: "Our Rights:", text: "The Service, including all software, designs, text, graphics, and other content, is owned by Mizan Store Ltd and protected by copyright, trademark, and other intellectual property laws." },
      { type: "def", label: "Limited License:", text: "We grant you a limited, non-exclusive, non-transferable license to use our Service for its intended purpose." },
      { type: "def", label: "Restrictions:", text: "You may not copy, modify, distribute, sell, or lease any part of our Service or attempt to reverse engineer our software." },
      { type: "def", label: "Feedback:", text: "Any feedback, suggestions, or ideas you provide about our Service may be used by us without compensation or attribution." },
    ],
  },
  {
    num: 8,
    icon: "dollar-sign",
    title: "Payment Terms",
    blocks: [
      { type: "def", label: "Free Services:", text: "Basic conversion services are provided free of charge with usage limitations." },
      { type: "def", label: "Premium Services:", text: "Enhanced features, higher processing limits, and priority support are available through paid subscriptions." },
      { type: "def", label: "Billing:", text: "Subscription fees are billed in advance on a recurring basis. All fees are non-refundable except as required by law." },
      { type: "def", label: "Price Changes:", text: "We may modify subscription prices with 30 days' written notice to existing subscribers." },
      { type: "def", label: "Taxes:", text: "You are responsible for any applicable taxes, duties, or government charges." },
    ],
  },
  {
    num: 9,
    icon: "lock",
    title: "Privacy and Security",
    blocks: [
      { type: "def", label: "Data Protection:", text: "We implement industry-standard security measures to protect your data and comply with UK GDPR requirements." },
      { type: "def", label: "File Security:", text: "All file uploads and downloads are encrypted in transit using SSL/TLS encryption." },
      { type: "def", label: "Automatic Deletion:", text: "Uploaded files are automatically deleted from our servers after processing, typically within 24 hours." },
      { type: "def", label: "Privacy Policy:", text: "Our collection and use of personal information is governed by our Privacy Policy, which forms part of these Terms." },
      { type: "def", label: "No Guarantee:", text: "While we implement robust security measures, no system is completely secure, and we cannot guarantee absolute security." },
    ],
  },
  {
    num: 10,
    icon: "x",
    title: "Termination",
    blocks: [
      { type: "def", label: "Your Right to Terminate:", text: "You may stop using our Service at any time and delete your account through your account settings." },
      { type: "def", label: "Our Right to Terminate:", text: "We may suspend or terminate your access immediately if you violate these Terms or engage in harmful activities." },
      { type: "def", label: "Effect of Termination:", text: "Upon termination, your right to use the Service ceases, and we may delete any data associated with your account." },
      { type: "def", label: "Survival:", text: "Provisions regarding intellectual property, limitation of liability, and indemnification survive termination." },
    ],
  },
  {
    num: 11,
    icon: "alert-circle",
    title: "Warranty Disclaimer",
    blocks: [
      { type: "def", label: "AS IS BASIS:", text: 'The Service is provided "as is" without warranties of any kind, either express or implied.' },
      { type: "def", label: "NO WARRANTIES:", text: "We disclaim all warranties, including but not limited to merchantability, fitness for a particular purpose, and non-infringement." },
      { type: "def", label: "NO GUARANTEE:", text: "We do not guarantee that the Service will be error-free, uninterrupted, or meet your specific requirements." },
      { type: "def", label: "RESULTS:", text: "We do not warrant the accuracy, completeness, or quality of conversion results." },
    ],
  },
  {
    num: 12,
    icon: "shield",
    title: "Limitation of Liability",
    blocks: [
      { type: "def", label: "LIMITED LIABILITY:", text: "To the maximum extent permitted by law, our total liability for any claims arising from your use of the Service shall not exceed the amount you paid us in the 12 months preceding the claim." },
      { type: "def", label: "EXCLUDED DAMAGES:", text: "We shall not be liable for indirect, incidental, special, consequential, or punitive damages, including lost profits or data." },
      { type: "def", label: "USER RESPONSIBILITY:", text: "You acknowledge that you use the Service at your own risk and are responsible for backing up important documents." },
      { type: "def", label: "STATUTORY RIGHTS:", text: "Nothing in these Terms excludes or limits liability that cannot be excluded or limited under applicable law." },
    ],
  },
  {
    num: 13,
    icon: "shield",
    title: "Indemnification",
    blocks: [
      {
        type: "p",
        text:
          "You agree to indemnify, defend, and hold harmless Mizan Store Ltd, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including reasonable attorney fees) arising from: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any third-party rights; or (d) any content you upload or process through our Service.",
      },
    ],
  },
  {
    num: 14,
    icon: "shield",
    title: "Governing Law",
    blocks: [
      {
        type: "p",
        text:
          "These Terms shall be governed by and construed in accordance with the laws of England and Wales, without regard to conflict of law principles. Any legal action or proceeding arising under these Terms will be brought exclusively in the courts of England and Wales, and you consent to personal jurisdiction and venue in such courts.",
      },
    ],
  },
  {
    num: 15,
    icon: "message-square",
    title: "Dispute Resolution",
    blocks: [
      { type: "def", label: "Informal Resolution:", text: "Before initiating formal legal proceedings, you agree to first contact us to attempt to resolve any disputes informally." },
      { type: "def", label: "Mediation:", text: "If informal resolution fails, disputes may be resolved through mediation by a mutually agreed mediator in London, UK." },
      { type: "def", label: "Court Proceedings:", text: "As a last resort, disputes may be brought before the competent courts of England and Wales." },
      { type: "def", label: "Consumer Rights:", text: "Nothing in this section affects your statutory rights as a consumer under UK law." },
    ],
  },
  {
    num: 16,
    icon: "edit-2",
    title: "Modifications",
    blocks: [
      { type: "def", label: "Right to Modify:", text: "We reserve the right to modify these Terms at any time to reflect changes in our Service, legal requirements, or business practices." },
      { type: "def", label: "Notice:", text: "Significant changes will be communicated through email notification and prominent notice on our website at least 30 days before taking effect." },
      { type: "def", label: "Acceptance:", text: "Your continued use of the Service after changes take effect constitutes acceptance of the modified Terms." },
      { type: "def", label: "Disagreement:", text: "If you disagree with modifications, you may terminate your account before the changes take effect." },
    ],
  },
  {
    num: 17,
    icon: "phone",
    title: "Contact Information",
    blocks: [
      { type: "p", text: "For questions about these Terms of Service or our Service, please contact us:" },
      {
        type: "contact",
        rows: [
          ["Company:", "Mizan Store Ltd"],
          ["Service:", "PDF Genius"],
          ["Phone:", "+447429919748"],
          ["Location:", "London, United Kingdom"],
          ["Website:", "PDF Genius"],
        ],
      },
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
    case "bullets":
      return (
        <View key={key} style={styles.bullets}>
          {block.items.map((item, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
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
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.subtitle}>
          Please read these Terms of Service carefully before using PDF Genius services
          provided by Mizan Store Ltd.
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

  bullets: { gap: 8 },
  bulletRow: { flexDirection: "row", gap: 8 },
  bulletDot: { fontSize: 14, lineHeight: 23, color: C.primary, fontFamily: fonts.body },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 23, color: "#374151", fontFamily: fonts.body },

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
