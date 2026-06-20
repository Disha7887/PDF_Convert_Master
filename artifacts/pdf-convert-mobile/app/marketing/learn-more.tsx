import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import AppFooter from "@/components/AppFooter";
import { Badge, Card, Chip, Field, ScreenScroll, SectionHeading } from "@/components/ui";
import colors from "@/constants/colors";
import { fonts, heroShadow } from "@/constants/theme";

const C = colors.light;

const HERO_GRADIENT = ["#8f1a16", "#b9211c"] as const;

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  author: string;
  date: string;
  featured: boolean;
}

const STATS: { icon: keyof typeof Feather.glyphMap; value: string; label: string }[] = [
  { icon: "trending-up", value: "10M+", label: "Users Served" },
  { icon: "file-text", value: "20+", label: "PDF Tools" },
  { icon: "award", value: "99.9%", label: "Uptime" },
  { icon: "shield", value: "100%", label: "Secure" },
];

const ARTICLES: Article[] = [
  {
    id: "1",
    title: "Complete Guide to PDF Conversion: From Beginner to Expert",
    excerpt:
      "Master the art of PDF conversion with our comprehensive guide covering all major file formats, best practices, and professional tips.",
    category: "Conversion",
    readTime: "8 min",
    author: "PDF Convert Master Team",
    date: "December 15, 2024",
    featured: true,
  },
  {
    id: "2",
    title: "PDF Security: Protecting Your Documents in the Digital Age",
    excerpt:
      "Learn essential PDF security features including password protection, encryption, and digital signatures to keep your documents safe.",
    category: "Security",
    readTime: "6 min",
    author: "Security Team",
    date: "December 12, 2024",
    featured: true,
  },
  {
    id: "3",
    title: "Optimizing PDF File Sizes: Compression Techniques That Work",
    excerpt:
      "Discover proven methods to reduce PDF file sizes without compromising quality, perfect for email sharing and web publishing.",
    category: "Optimization",
    readTime: "7 min",
    author: "Technical Team",
    date: "December 10, 2024",
    featured: false,
  },
  {
    id: "4",
    title: "Digital Document Workflows: Streamlining Business Processes",
    excerpt:
      "Transform your business efficiency with modern digital document workflows using PDF tools and automation strategies.",
    category: "Business",
    readTime: "9 min",
    author: "Business Solutions Team",
    date: "December 8, 2024",
    featured: false,
  },
  {
    id: "5",
    title: "Accessibility in PDF Documents: Creating Inclusive Content",
    excerpt:
      "Learn how to create accessible PDF documents that serve all users, including those with disabilities, while meeting compliance requirements.",
    category: "Accessibility",
    readTime: "8 min",
    author: "Accessibility Team",
    date: "December 5, 2024",
    featured: false,
  },
  {
    id: "6",
    title: "Excel to PDF Conversion: Preserving Formulas and Formatting",
    excerpt:
      "Master Excel to PDF conversion while maintaining calculations, charts, and professional formatting for business documents.",
    category: "Conversion",
    readTime: "6 min",
    author: "Excel Specialists Team",
    date: "December 14, 2024",
    featured: false,
  },
  {
    id: "7",
    title: "OCR Technology: Making Scanned Documents Searchable and Editable",
    excerpt:
      "Unlock the power of Optical Character Recognition to transform scanned images and PDFs into fully searchable, editable documents.",
    category: "Technology",
    readTime: "9 min",
    author: "OCR Technology Team",
    date: "December 13, 2024",
    featured: true,
  },
  {
    id: "8",
    title: "Mobile PDF Management: Working with Documents on the Go",
    excerpt:
      "Master mobile PDF workflows for remote work, field operations, and on-the-go document management with smartphones and tablets.",
    category: "Mobile",
    readTime: "8 min",
    author: "Mobile Solutions Team",
    date: "December 11, 2024",
    featured: false,
  },
  {
    id: "9",
    title: "PDF Troubleshooting Guide: Common Issues and Quick Fixes",
    excerpt:
      "Resolve the most common PDF problems with our comprehensive troubleshooting guide covering corruption, compatibility, and performance issues.",
    category: "Support",
    readTime: "10 min",
    author: "Technical Support Team",
    date: "December 9, 2024",
    featured: false,
  },
  {
    id: "10",
    title: "Legal Document Management: PDFs in Law and Compliance",
    excerpt:
      "Navigate the complex requirements of legal document management including compliance, e-discovery, and digital signatures for law firms.",
    category: "Legal",
    readTime: "12 min",
    author: "Legal Technology Team",
    date: "December 7, 2024",
    featured: false,
  },
];

const CATEGORIES = [
  "All",
  "Conversion",
  "Security",
  "Optimization",
  "Business",
  "Accessibility",
  "Technology",
  "Mobile",
  "Support",
  "Legal",
];

const COMPANY_FEATURES: { icon: keyof typeof Feather.glyphMap; title: string; description: string }[] = [
  { icon: "shield", title: "Enterprise Security", description: "Bank-level encryption and compliance standards" },
  { icon: "zap", title: "Lightning Fast", description: "Optimized processing for quick results" },
  { icon: "settings", title: "20+ Tools", description: "Complete PDF solution suite" },
];

function ArticleCard({ article }: { article: Article }) {
  return (
    <Card style={styles.articleCard}>
      <View style={styles.articleMeta}>
        <Badge label={article.category} tone="neutral" />
        <View style={styles.metaRow}>
          <Feather name="clock" size={13} color={C.mutedForeground} />
          <Text style={styles.metaText}>{article.readTime}</Text>
        </View>
      </View>
      <Text style={styles.articleTitle}>{article.title}</Text>
      <Text style={styles.articleExcerpt}>{article.excerpt}</Text>
      <View style={styles.articleFooter}>
        <View style={styles.metaRow}>
          <Feather name="user" size={13} color={C.mutedForeground} />
          <Text style={styles.metaText}>{article.author}</Text>
        </View>
        <Text style={styles.metaText}>{article.date}</Text>
      </View>
    </Card>
  );
}

export default function Screen() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredArticles = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return ARTICLES.filter((article) => {
      const matchesSearch =
        article.title.toLowerCase().includes(q) || article.excerpt.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === "All" || article.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const featuredArticles = ARTICLES.filter((article) => article.featured);

  return (
    <ScreenScroll>
      <LinearGradient
        colors={HERO_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, heroShadow]}
      >
        <View style={styles.heroBadge}>
          <Feather name="book-open" size={14} color="#ffe1de" />
          <Text style={styles.heroBadgeText}>Educational Hub</Text>
        </View>
        <Text style={styles.heroTitle}>Learn More About PDF Tools</Text>
        <Text style={styles.heroSubtitle}>
          Master PDF conversion, security, and optimization with our comprehensive guides. Expert
          insights and practical tips to help you work smarter with documents.
        </Text>

        <View style={styles.statsGrid}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statTile}>
              <Feather name={stat.icon} size={22} color="#fecdc8" />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={{ marginTop: 24, gap: 14 }}>
        <Field
          icon="search"
          placeholder="Search articles..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          autoCapitalize="none"
        />
        <View style={styles.chipRow}>
          {CATEGORIES.map((category) => (
            <Chip
              key={category}
              label={category}
              active={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
            />
          ))}
        </View>
      </View>

      {selectedCategory === "All" && searchTerm.trim() === "" && (
        <View style={{ marginTop: 28 }}>
          <Text style={styles.sectionTitle}>Featured Articles</Text>
          <View style={{ gap: 16 }}>
            {featuredArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </View>
        </View>
      )}

      <View style={{ marginTop: 28 }}>
        <Text style={styles.sectionTitle}>
          {selectedCategory === "All" ? "All Articles" : `${selectedCategory} Articles`}
        </Text>
        {filteredArticles.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="file-text" size={40} color={C.mutedForeground} />
            <Text style={styles.emptyTitle}>No articles found</Text>
            <Text style={styles.emptyText}>Try adjusting your search terms or category filter.</Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {filteredArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </View>
        )}
      </View>

      <View style={{ marginTop: 32 }}>
        <SectionHeading
          align="center"
          title="About PDF Convert Master"
          subtitle="Developed by Mizan Store Ltd in London, UK, PDF Convert Master provides professional-grade PDF tools trusted by millions worldwide. Our mission is to make document management simple, secure, and accessible for everyone."
          style={{ marginBottom: 18 }}
        />
        <View style={{ gap: 16 }}>
          {COMPANY_FEATURES.map((feature) => (
            <Card key={feature.title} style={styles.companyCard}>
              <View style={styles.companyIcon}>
                <Feather name={feature.icon} size={22} color={C.primary} />
              </View>
              <Text style={styles.companyTitle}>{feature.title}</Text>
              <Text style={styles.companyDesc}>{feature.description}</Text>
            </Card>
          ))}
        </View>
      </View>

      <AppFooter />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 20, padding: 24, gap: 12 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroBadgeText: { fontSize: 12, color: "#ffe1de", fontFamily: fonts.bodySemibold },
  heroTitle: { fontSize: 26, lineHeight: 32, color: "#ffffff", fontFamily: fonts.headingBold },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: "rgba(255,255,255,0.82)",
    fontFamily: fonts.body,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  statTile: {
    flexGrow: 1,
    flexBasis: "45%",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    paddingVertical: 16,
  },
  statValue: { fontSize: 24, color: "#ffffff", fontFamily: fonts.headingBold },
  statLabel: { fontSize: 12, color: "#fecdc8", fontFamily: fonts.body },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sectionTitle: {
    fontSize: 22,
    color: C.foreground,
    fontFamily: fonts.headingBold,
    marginBottom: 16,
  },
  articleCard: { gap: 10 },
  articleMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, color: C.mutedForeground, fontFamily: fonts.body },
  articleTitle: { fontSize: 17, lineHeight: 23, color: C.foreground, fontFamily: fonts.headingSemibold },
  articleExcerpt: { fontSize: 14, lineHeight: 21, color: C.mutedForeground, fontFamily: fonts.body },
  articleFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 2,
  },
  emptyState: { alignItems: "center", gap: 8, paddingVertical: 32 },
  emptyTitle: { fontSize: 17, color: C.foreground, fontFamily: fonts.headingSemibold },
  emptyText: { fontSize: 14, color: C.mutedForeground, fontFamily: fonts.body, textAlign: "center" },
  companyCard: { alignItems: "center", gap: 8 },
  companyIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: C.blue50,
    alignItems: "center",
    justifyContent: "center",
  },
  companyTitle: { fontSize: 16, color: C.foreground, fontFamily: fonts.headingSemibold },
  companyDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    textAlign: "center",
  },
});
