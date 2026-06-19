import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { fonts } from "@/constants/theme";

const C = colors.light;

const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: "Product",
    links: [
      ["All Tools", ROUTES.tools],
      ["Pricing", ROUTES.pricing],
      ["Features", ROUTES.features],
      ["How It Works", ROUTES.learnMore],
    ],
  },
  {
    title: "Company",
    links: [
      ["About", ROUTES.about],
      ["Contact", ROUTES.contact],
      ["Support", ROUTES.support],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Privacy Policy", ROUTES.privacy],
      ["Terms of Service", ROUTES.terms],
    ],
  },
];

/** Marketing footer used on the Home and marketing screens. */
export function AppFooter() {
  const router = useRouter();
  const go = (r: string) => router.push(r as never);

  return (
    <View style={styles.footer}>
      <View style={styles.brandRow}>
        <View style={styles.logoMark}>
          <Feather name="file-text" size={16} color="#fff" />
        </View>
        <Text style={styles.brandName}>PDF Convert Master</Text>
      </View>
      <Text style={styles.tagline}>
        The all-in-one toolkit to convert, organize and transform your documents and images — fast,
        secure and free to start.
      </Text>

      <View style={styles.columns}>
        {COLUMNS.map((col) => (
          <View key={col.title} style={styles.column}>
            <Text style={styles.columnTitle}>{col.title}</Text>
            {col.links.map(([label, route]) => (
              <Pressable key={label} onPress={() => go(route)} hitSlop={6}>
                <Text style={styles.link}>{label}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.divider} />
      <Text style={styles.copyright}>© 2026 PDF Convert Master. All rights reserved.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    marginTop: 28,
    paddingTop: 28,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { fontSize: 16, color: C.foreground, fontFamily: fonts.headingBold },
  tagline: { fontSize: 13, lineHeight: 20, color: C.mutedForeground, fontFamily: fonts.body },
  columns: { flexDirection: "row", flexWrap: "wrap", gap: 28, marginTop: 22 },
  column: { gap: 10, minWidth: 110 },
  columnTitle: { fontSize: 13, color: C.foreground, fontFamily: fonts.bodyBold, marginBottom: 2 },
  link: { fontSize: 13, color: C.mutedForeground, fontFamily: fonts.body },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 20 },
  copyright: { fontSize: 12, color: C.mutedForeground, fontFamily: fonts.body },
});

export default AppFooter;
