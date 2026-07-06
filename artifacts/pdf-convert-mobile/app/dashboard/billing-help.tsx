import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { LayoutAnimation, Linking, Platform, Pressable, StyleSheet, Text, UIManager, View } from "react-native";

import { SignInRequiredIcon } from "@/components/SignInRequiredIcon";
import { Button, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { cardShadow, fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

// ── Real values pulled from the repo ────────────────────────────────────────
// Support email: marketing/contact + AppFooter + api-server email service.
// Refund window/wording: web pages/RefundPolicy.tsx (14-day right to cancel).
const SUPPORT_EMAIL = "info@pdfgenius.app";
const SUPPORT_PHONE = "+447429919748";
const SUPPORT_LOCATION = "London, United Kingdom";

// Paddle buyer-facing URLs (factual, from the brief).
const PADDLE_LOOKUP_URL = "https://paddle.net";
const PADDLE_WHY_CHARGED_URL = "https://www.paddle.com/about/why-has-paddle-charged-me";
const DODO_CONTACT_URL = "https://dodopayments.com/contact";

const C = colors.light;
type FeatherName = keyof typeof Feather.glyphMap;
type MerchantKey = "dodo" | "paddle";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MERCHANTS: Record<MerchantKey, { name: string; statement: string; subtitle: string }> = {
  dodo: {
    name: "Dodo Payments",
    statement: "Dodo Payments",
    subtitle: "If your charge shows as Dodo Payments",
  },
  paddle: {
    name: "Paddle",
    statement: "Paddle / Paddle.net",
    subtitle: "If your charge shows as Paddle",
  },
};

const openUrl = (url: string) => Linking.openURL(url).catch(() => {});
const openEmail = () => Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {});

interface Block {
  id: string;
  icon: FeatherName;
  title: string;
  body: React.ReactNode;
}

function sections(m: MerchantKey): Block[] {
  const name = MERCHANTS[m].name;
  const statement = MERCHANTS[m].statement;
  const isDodo = m === "dodo";

  return [
    {
      id: "overview",
      icon: "briefcase",
      title: "Overview & Merchant of Record",
      body: (
        <>
          <Text style={styles.p}>
            When you buy a PDF Genius subscription or credit pack on the web, {name} acts as our
            authorised reseller and Merchant of Record. That means {name} is the legal seller for
            your transaction and handles payment processing, billing, invoicing and tax on PDF
            Genius's behalf.
          </Text>
          <Text style={styles.p}>
            Because {name} is the seller of record, their name — not "PDF Genius" — may appear on
            your receipt and bank or card statement. This is normal, and the charge is still for
            your PDF Genius purchase.
          </Text>
        </>
      ),
    },
    {
      id: "statement",
      icon: "credit-card",
      title: "What appears on your statement",
      body: (
        <>
          <Text style={styles.p}>
            Your charge appears under the "{statement}" name rather than "PDF Genius". This is a
            legitimate PDF Genius charge — {name} is our Merchant of Record and bills you on our
            behalf.
          </Text>
          {isDodo ? (
            <Text style={styles.p}>
              If you don't recognise a charge, check the receipt emailed to you at the time of
              purchase, or <Link onPress={openEmail}>contact us</Link> and we'll help you identify
              it.
            </Text>
          ) : (
            <Text style={styles.p}>
              You can look up and manage any Paddle charge at{" "}
              <Link onPress={() => openUrl(PADDLE_LOOKUP_URL)}>paddle.net</Link>, and read more
              about why Paddle appears on your statement here:{" "}
              <Link onPress={() => openUrl(PADDLE_WHY_CHARGED_URL)}>Why has Paddle charged me?</Link>
            </Text>
          )}
        </>
      ),
    },
    {
      id: "payment-methods",
      icon: "smartphone",
      title: "Accepted payment methods",
      body: (
        <Text style={styles.p}>
          {name} supports major credit and debit cards and common digital wallets such as Apple Pay
          and Google Pay, along with regional and local payment methods depending on your location.
          The options shown at checkout are tailored to the country you're paying from.
        </Text>
      ),
    },
    {
      id: "receipts",
      icon: "file-text",
      title: "Receipts & invoices",
      body: (
        <>
          <Text style={styles.p}>
            A receipt is emailed to you automatically after every payment. Check the inbox (and spam
            folder) of the email address used for your purchase.
          </Text>
          {isDodo ? (
            <Text style={styles.p}>
              To view or download an invoice, or request another copy, open the customer billing
              portal linked in your Dodo Payments receipt email. You can also{" "}
              <Link onPress={openEmail}>contact us</Link> and we'll resend it.
            </Text>
          ) : (
            <Text style={styles.p}>
              You can retrieve receipts and invoices at any time at{" "}
              <Link onPress={() => openUrl(PADDLE_LOOKUP_URL)}>paddle.net</Link> using the email
              address you paid with.
            </Text>
          )}
        </>
      ),
    },
    {
      id: "manage-cancel",
      icon: "repeat",
      title: "Manage or cancel subscription",
      body: (
        <>
          <Text style={styles.p}>
            Subscriptions renew automatically until you cancel. When you cancel, your plan stays
            active until the end of the current paid period and you won't be charged again.
          </Text>
          {isDodo ? (
            <Text style={styles.p}>
              To manage or cancel, open the customer portal linked in your Dodo Payments receipt
              email, or <Link onPress={openEmail}>contact PDF Genius support</Link> and we'll take
              care of it.
            </Text>
          ) : (
            <Text style={styles.p}>
              You can manage or cancel your subscription yourself anytime at{" "}
              <Link onPress={() => openUrl(PADDLE_LOOKUP_URL)}>paddle.net</Link> using your purchase
              email, or <Link onPress={openEmail}>contact PDF Genius support</Link>.
            </Text>
          )}
        </>
      ),
    },
    {
      id: "refunds",
      icon: "rotate-ccw",
      title: "Refunds",
      body: (
        <>
          <Text style={styles.p}>
            If you are a consumer in the UK, EU, EEA or Switzerland, you have a statutory right to
            cancel your purchase within 14 days and receive a full refund. This applies to one-time
            purchases and to the first payment of a new subscription. Renewal payments are generally
            non-refundable, and credits that have already been used are non-refundable, except where
            required by law or granted at our discretion.
          </Text>
          {isDodo ? (
            <Text style={styles.p}>
              To request a refund, <Link onPress={openEmail}>contact PDF Genius support</Link> with
              the email used for your purchase and your order or receipt number. You can also request
              a refund through Dodo Payments' support.
            </Text>
          ) : (
            <Text style={styles.p}>
              You can request a refund directly via Paddle at{" "}
              <Link onPress={() => openUrl(PADDLE_LOOKUP_URL)}>paddle.net</Link>, or{" "}
              <Link onPress={openEmail}>contact PDF Genius support</Link> with the email used for
              your purchase and your order or receipt number.
            </Text>
          )}
          <Text style={styles.p}>
            We aim to acknowledge every refund request within 2 business days. Once approved, refunds
            are processed by {name} back to your original payment method and typically appear within
            5–10 business days, depending on your bank or card issuer.
          </Text>
        </>
      ),
    },
    {
      id: "update-payment",
      icon: "edit-3",
      title: "Update payment method",
      body: (
        <>
          <Text style={styles.p}>
            If your card has expired or a renewal failed, updating your payment method keeps your
            subscription active.
          </Text>
          {isDodo ? (
            <Text style={styles.p}>
              Open the customer portal linked in your Dodo Payments receipt email to update your card
              details. If you need a hand, <Link onPress={openEmail}>contact us</Link>.
            </Text>
          ) : (
            <Text style={styles.p}>
              Update your card details at{" "}
              <Link onPress={() => openUrl(PADDLE_LOOKUP_URL)}>paddle.net</Link> using your purchase
              email. If you need a hand, <Link onPress={openEmail}>contact us</Link>.
            </Text>
          )}
        </>
      ),
    },
    {
      id: "taxes",
      icon: "percent",
      title: "Taxes (VAT / GST / sales tax)",
      body: (
        <Text style={styles.p}>
          As Merchant of Record, {name} automatically calculates and adds any applicable tax (such
          as VAT, GST or sales tax) based on your location. Any tax is shown as a separate line on
          your receipt, so the total you pay already includes what's required for your country or
          region.
        </Text>
      ),
    },
    {
      id: "failed-payments",
      icon: "alert-triangle",
      title: "Failed & declined payments",
      body: (
        <>
          <Text style={styles.p}>
            If a renewal payment is declined, {name} automatically retries the charge over several
            days and emails you so you can fix the issue. Common causes are an expired card,
            insufficient funds or a bank security block.
          </Text>
          {isDodo ? (
            <Text style={styles.p}>
              To resolve a failed renewal, update your card in the customer portal linked in your
              Dodo Payments receipt email. If it still fails, <Link onPress={openEmail}>contact
              us</Link>.
            </Text>
          ) : (
            <Text style={styles.p}>
              To resolve a failed renewal, update your card at{" "}
              <Link onPress={() => openUrl(PADDLE_LOOKUP_URL)}>paddle.net</Link>. If it still fails,{" "}
              <Link onPress={openEmail}>contact us</Link>.
            </Text>
          )}
        </>
      ),
    },
    {
      id: "security-contact",
      icon: "shield",
      title: "Security & contact",
      body: (
        <>
          <Text style={styles.p}>
            {name} is PCI-DSS compliant, and PDF Genius never stores your card details — payment
            information is handled securely by the Merchant of Record.
          </Text>
          <View style={styles.contactBox}>
            <ContactRow icon="mail" label="PDF Genius support" value={SUPPORT_EMAIL} onPress={openEmail} />
            <ContactRow icon="phone" label="Phone" value={SUPPORT_PHONE} />
            <ContactRow icon="map-pin" label="Location" value={SUPPORT_LOCATION} />
            {isDodo ? (
              <ContactRow
                icon="external-link"
                label="Dodo Payments"
                value="dodopayments.com/contact"
                onPress={() => openUrl(DODO_CONTACT_URL)}
              />
            ) : (
              <ContactRow
                icon="external-link"
                label="Paddle"
                value="paddle.net"
                onPress={() => openUrl(PADDLE_LOOKUP_URL)}
              />
            )}
          </View>
        </>
      ),
    },
  ];
}

function faqItems(m: MerchantKey): { q: string; a: React.ReactNode }[] {
  const name = MERCHANTS[m].name;
  const statement = MERCHANTS[m].statement;
  const isDodo = m === "dodo";
  return [
    {
      q: "Why does this name appear on my statement?",
      a: (
        <Text style={styles.p}>
          {name} is our Merchant of Record and processes the payment on PDF Genius's behalf, so
          their name may appear on your statement instead of ours. It's still a genuine PDF Genius
          charge.
        </Text>
      ),
    },
    {
      q: "How do I cancel?",
      a: isDodo ? (
        <Text style={styles.p}>
          Use the customer portal linked in your Dodo Payments receipt email, or{" "}
          <Link onPress={openEmail}>contact us</Link> and we'll cancel it for you.
        </Text>
      ) : (
        <Text style={styles.p}>
          Cancel anytime at <Link onPress={() => openUrl(PADDLE_LOOKUP_URL)}>paddle.net</Link> using
          your purchase email, or <Link onPress={openEmail}>contact us</Link>.
        </Text>
      ),
    },
    {
      q: "How do I get a refund?",
      a: isDodo ? (
        <Text style={styles.p}>
          <Link onPress={openEmail}>Contact PDF Genius support</Link> (or Dodo Payments' support)
          within the 14-day cancellation period.
        </Text>
      ) : (
        <Text style={styles.p}>
          Request one at <Link onPress={() => openUrl(PADDLE_LOOKUP_URL)}>paddle.net</Link> or via{" "}
          <Link onPress={openEmail}>support</Link> within the 14-day cancellation period.
        </Text>
      ),
    },
    {
      q: "Was I charged tax?",
      a: (
        <Text style={styles.p}>
          If tax (VAT, GST or sales tax) applied to your location, {name} added it automatically and
          it appears as a separate line on your receipt.
        </Text>
      ),
    },
    {
      q: "I don't recognise this charge.",
      a: isDodo ? (
        <Text style={styles.p}>
          Look for a charge from "{statement}" — that's PDF Genius billed through our Merchant of
          Record. Still unsure? <Link onPress={openEmail}>Email us</Link> and we'll help.
        </Text>
      ) : (
        <Text style={styles.p}>
          Look up the charge at <Link onPress={() => openUrl(PADDLE_LOOKUP_URL)}>paddle.net</Link> or
          read <Link onPress={() => openUrl(PADDLE_WHY_CHARGED_URL)}>Why has Paddle charged me?</Link>{" "}
          Still unsure? <Link onPress={openEmail}>Email us</Link>.
        </Text>
      ),
    },
  ];
}

function AuthGate() {
  const router = useRouter();
  return (
    <View style={styles.gate}>
      <View style={styles.gateIcon}>
        <SignInRequiredIcon />
      </View>
      <Text style={styles.gateTitle}>Sign in required</Text>
      <Text style={styles.gateText}>Sign in to view payments and billing help.</Text>
      <Button
        label="Sign In"
        icon="log-in"
        onPress={() => router.push(ROUTES.signIn as never)}
        style={{ alignSelf: "center" }}
      />
    </View>
  );
}

export default function BillingHelpScreen() {
  const { isAuthenticated } = useAuth();
  const [merchant, setMerchant] = useState<MerchantKey>("dodo");
  const blocks = useMemo(() => sections(merchant), [merchant]);
  const faqs = useMemo(() => faqItems(merchant), [merchant]);

  if (!isAuthenticated) {
    return (
      <ScreenScroll insetTop>
        <AuthGate />
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll insetTop>
      <Text style={styles.title}>Payments &amp; Billing Help</Text>
      <Text style={styles.subtitle}>
        Everything about PDF Genius payments in one place. We use two Merchant-of-Record providers
        at checkout — pick the one shown on your receipt or statement.
      </Text>

      {/* Merchant toggle */}
      <View style={styles.toggleRow}>
        {(Object.keys(MERCHANTS) as MerchantKey[]).map((key) => {
          const active = merchant === key;
          return (
            <Pressable
              key={key}
              onPress={() => setMerchant(key)}
              style={({ pressed }) => [
                styles.toggleCard,
                active && styles.toggleCardActive,
                { opacity: pressed ? 0.92 : 1 },
              ]}
            >
              <View style={[styles.toggleIcon, active && styles.toggleIconActive]}>
                <Feather name="credit-card" size={18} color={active ? "#fff" : C.mutedForeground} />
              </View>
              <Text style={[styles.toggleName, active && styles.toggleNameActive]}>
                {MERCHANTS[key].name}
              </Text>
              <Text style={styles.toggleSub}>{MERCHANTS[key].subtitle}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.pill}>
        <Text style={styles.pillText}>Showing help for {MERCHANTS[merchant].name}</Text>
      </View>

      {blocks.map((b) => (
        <Collapsible key={b.id} icon={b.icon} title={b.title} defaultOpen={b.id === "statement"}>
          {b.body}
        </Collapsible>
      ))}

      <Text style={styles.faqHeading}>Frequently asked questions</Text>
      {faqs.map((f, i) => (
        <Collapsible key={i} title={f.q}>
          {f.a}
        </Collapsible>
      ))}
    </ScreenScroll>
  );
}

function Collapsible({
  icon,
  title,
  children,
  defaultOpen = false,
}: {
  icon?: FeatherName;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };
  return (
    <View style={[styles.collapsible, cardShadow]}>
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [styles.collapsibleHead, { backgroundColor: pressed ? C.muted : "transparent" }]}
      >
        {icon ? (
          <View style={styles.headIcon}>
            <Feather name={icon} size={16} color={C.primary} />
          </View>
        ) : null}
        <Text style={styles.collapsibleTitle}>{title}</Text>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={18} color={C.mutedForeground} />
      </Pressable>
      {open ? <View style={styles.collapsibleBody}>{children}</View> : null}
    </View>
  );
}

function Link({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  return (
    <Text style={styles.link} onPress={onPress}>
      {children}
    </Text>
  );
}

function ContactRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: FeatherName;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.contactRow}>
      <Feather name={icon} size={16} color={C.primary} />
      <Text style={styles.contactLabel}>{label}:</Text>
      <Text style={[styles.contactValue, onPress && styles.link]} numberOfLines={1}>
        {value}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, color: C.foreground, fontFamily: fonts.headingBold, marginBottom: 8 },
  subtitle: {
    fontSize: 14.5,
    lineHeight: 21,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    marginBottom: 20,
  },
  toggleRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  toggleCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: C.border,
    padding: 14,
  },
  toggleCardActive: { borderColor: C.primary, backgroundColor: C.blue50 },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.muted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  toggleIconActive: { backgroundColor: C.primary },
  toggleName: { fontSize: 15, color: C.foreground, fontFamily: fonts.headingSemibold },
  toggleNameActive: { color: C.blue700 },
  toggleSub: { fontSize: 12, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 2 },
  pill: {
    alignSelf: "flex-start",
    backgroundColor: C.blue50,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
  },
  pillText: { fontSize: 13, color: C.blue700, fontFamily: fonts.bodySemibold },
  collapsible: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
    marginBottom: 12,
  },
  collapsibleHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  headIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  collapsibleTitle: { flex: 1, fontSize: 15, color: C.foreground, fontFamily: fonts.bodySemibold },
  collapsibleBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  p: { fontSize: 14, lineHeight: 21, color: C.foreground, fontFamily: fonts.body, marginTop: 12 },
  link: { color: C.primary, fontFamily: fonts.bodySemibold },
  contactBox: {
    marginTop: 14,
    backgroundColor: C.muted,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactLabel: { fontSize: 13.5, color: C.mutedForeground, fontFamily: fonts.bodyMedium },
  contactValue: { flex: 1, fontSize: 13.5, color: C.foreground, fontFamily: fonts.bodyMedium },
  faqHeading: {
    fontSize: 18,
    color: C.foreground,
    fontFamily: fonts.headingSemibold,
    marginTop: 12,
    marginBottom: 12,
  },
  gate: { alignItems: "center", paddingVertical: 60, gap: 12 },
  gateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  gateTitle: { fontSize: 18, color: C.foreground, fontFamily: fonts.headingBold },
  gateText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: C.mutedForeground,
    fontFamily: fonts.body,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
});
