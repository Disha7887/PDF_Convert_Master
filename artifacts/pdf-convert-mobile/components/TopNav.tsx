import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { usePathname, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, SvgXml } from "react-native-svg";

import { GlassSurface } from "@/components/Glass";
import { UserLottieIcon } from "@/components/UserLottieIcon";
import colors from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/services/notifications";

const C = colors.light;

/** Height of the bar row (below the status-bar / safe-area inset). */
export const NAV_BAR_HEIGHT = 56;

/** Safe-area top used by the nav (web has no real inset, so simulate the notch). */
export function useNavTopInset() {
  const insets = useSafeAreaInsets();
  return Platform.OS === "web" ? 24 : insets.top;
}

const PEOPLE_PATH =
  "M26.68,23.36a11,11,0,0,0-6.91-7.7,6,6,0,1,0-7.54,0,11,11,0,0,0-6.91,7.7,2.86,2.86,0,0,0,.54,2.47A3,3,0,0,0,8.25,27h15.5a3,3,0,0,0,2.39-1.17A2.86,2.86,0,0,0,26.68,23.36ZM12,11a4,4,0,1,1,4,4A4,4,0,0,1,12,11ZM24.56,24.6a1,1,0,0,1-.81.4H8.25a1,1,0,0,1-.81-.4.85.85,0,0,1-.18-.76,9,9,0,0,1,17.48,0A.85.85,0,0,1,24.56,24.6Z";

const VERIFIED_BADGE_XML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path fill="#49adf4" d="M21.187 10.007a3.457 3.457 0 0 1-.864-.712 3.378 3.378 0 0 1 .277-1.141c.291-.821.62-1.751.092-2.474s-1.525-.7-2.4-.68a3.422 3.422 0 0 1-1.155-.078 3.369 3.369 0 0 1-.425-1.063c-.248-.845-.531-1.8-1.4-2.086-.838-.27-1.614.324-2.3.846A3.285 3.285 0 0 1 12 3.25a3.285 3.285 0 0 1-1.023-.631C10.293 2.1 9.52 1.5 8.678 1.774c-.867.282-1.15 1.24-1.4 2.085a3.418 3.418 0 0 1-.421 1.061A3.482 3.482 0 0 1 5.7 5c-.878-.024-1.867-.05-2.4.68s-.2 1.653.092 2.473a3.336 3.336 0 0 1 .281 1.141 3.449 3.449 0 0 1-.863.713c-.732.5-1.563 1.069-1.563 1.993s.831 1.491 1.563 1.993a3.449 3.449 0 0 1 .863.712 3.335 3.335 0 0 1-.273 1.142c-.29.82-.618 1.75-.091 2.473s1.521.7 2.4.68a3.426 3.426 0 0 1 1.156.078 3.4 3.4 0 0 1 .424 1.063c.248.845.531 1.8 1.4 2.086a1.424 1.424 0 0 0 .431.068 3.382 3.382 0 0 0 1.868-.914A3.285 3.285 0 0 1 12 20.75a3.285 3.285 0 0 1 1.023.631c.685.523 1.461 1.12 2.3.845.867-.282 1.15-1.24 1.4-2.084a3.388 3.388 0 0 1 .424-1.062A3.425 3.425 0 0 1 18.3 19c.878.021 1.867.05 2.4-.68s.2-1.653-.092-2.474a3.38 3.38 0 0 1-.281-1.139 3.436 3.436 0 0 1 .864-.713c.732-.5 1.563-1.07 1.563-1.994s-.834-1.492-1.567-1.993Z"/><path fill="#fff" d="M11 14.75a.745.745 0 0 1-.53-.22l-2-2a.75.75 0 0 1 1.06-1.06l1.54 1.54 3.48-2.61a.75.75 0 0 1 .9 1.2l-4 3a.751.751 0 0 1-.45.15Z"/></g></svg>`;

/**
 * Shared top navigation bar for the main tab screens.
 *
 * It has NO solid background — only a translucent blur, so screen content
 * scrolls underneath and reads through as a frosted-glass effect. The bar holds
 * the site icon on the left and the people / account icon on the right. The blur
 * layer is non-interactive (pointerEvents="none") so taps on the empty middle
 * fall through to the content below; only the two icons are pressable.
 */
export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { isAuthenticated, user, signout } = useAuth();
  const topInset = useNavTopInset();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  const refreshUnread = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      setUnreadCount(await fetchUnreadCount());
    } catch {
      // Best-effort badge; ignore transient failures.
    }
  }, [isAuthenticated]);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setNotifLoading(true);
    try {
      const items = await fetchNotifications();
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read).length);
    } catch {
      // Surface an empty list rather than crashing the nav bar.
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  }, [isAuthenticated]);

  // Keep the unread badge in sync on mount, auth change, and on a light poll.
  useEffect(() => {
    refreshUnread();
    if (!isAuthenticated) return;
    const id = setInterval(refreshUnread, 60000);
    return () => clearInterval(id);
  }, [isAuthenticated, refreshUnread]);

  const openNotifications = () => {
    setNotifOpen(true);
    loadNotifications();
  };

  const onNotificationPress = (n: NotificationItem) => {
    if (!n.read) {
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      markNotificationRead(n.id).catch(() => {});
    }
    if (n.link && n.link.startsWith("/dashboard")) {
      setNotifOpen(false);
      router.push(ROUTES.dashboardHome as never);
    }
  };

  const onMarkAllRead = () => {
    setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnreadCount(0);
    markAllNotificationsRead().catch(() => {});
  };

  // The Camera/Scanner screen is a full-bleed capture surface. The home and
  // account icons (and their blur bar) don't belong there, so hide the whole
  // nav while that route is active. They reappear on every other screen.
  const isCameraScreen =
    pathname === ROUTES.scanner || pathname.startsWith(`${ROUTES.scanner}/`);
  if (isCameraScreen) return null;

  // Signed-in: the people icon opens an account menu. Signed-out: it sends the
  // user straight to the sign-in popup.
  const onAccountPress = () => {
    if (isAuthenticated) setMenuOpen(true);
    else router.push(ROUTES.signIn as never);
  };

  const go = (route: string) => {
    setMenuOpen(false);
    router.push(route as never);
  };

  const onLogout = () => {
    setMenuOpen(false);
    signout();
    router.push(ROUTES.home as never);
  };

  return (
    <View style={[styles.wrap, { height: topInset + NAV_BAR_HEIGHT }]}>
      <BlurView
        intensity={Platform.OS === "android" ? 30 : 40}
        tint={isDark ? "dark" : "light"}
        experimentalBlurMethod="dimezisBlurView"
        style={[StyleSheet.absoluteFill, styles.blur]}
      />
      <View
        style={[styles.bar, { marginTop: topInset, height: NAV_BAR_HEIGHT }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="PDF Genius home"
          hitSlop={8}
          onPress={() => router.push(ROUTES.home as never)}
          style={styles.logoMark}
        >
          <Image
            source={require("@/assets/images/logo-icon.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Pressable>

        <View style={styles.rightGroup}>
          {isAuthenticated && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              hitSlop={8}
              onPress={openNotifications}
              style={styles.bellBtn}
              testID="button-notifications"
            >
              <Feather name="bell" size={22} color={C.foreground} />
              {unreadCount > 0 && (
                <View style={styles.badge} testID="badge-notifications-count">
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isAuthenticated ? "Account menu" : "Sign in or create an account"
            }
            hitSlop={8}
            onPress={onAccountPress}
            style={styles.profileBtn}
            testID="button-account"
          >
            <UserLottieIcon size={30} />
          </Pressable>
        </View>
      </View>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => setMenuOpen(false)}
          testID="account-menu-backdrop"
        >
          <Pressable
            style={[styles.menuPos, { top: topInset + NAV_BAR_HEIGHT - 4 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <GlassSurface radius={18} style={styles.menuGlass}>
            <View style={styles.menuHeader}>
              <View style={styles.menuAvatar}>
                <Svg width={22} height={22} viewBox="0 0 32 32">
                  <Path d={PEOPLE_PATH} fill="#fff" />
                </Svg>
              </View>
              <View style={styles.menuHeaderText}>
                <View style={styles.menuNameRow}>
                  <Text style={styles.menuName} numberOfLines={1}>
                    {user?.name ?? "Account"}
                  </Text>
                  {!!user && <SvgXml xml={VERIFIED_BADGE_XML} width={16} height={16} />}
                </View>
                {!!user?.email && (
                  <Text style={styles.menuEmail} numberOfLines={1}>
                    {user.email}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.menuDivider} />

            <MenuItem
              icon="user"
              label="Profile Settings"
              onPress={() => go(ROUTES.settings)}
              testID="menu-profile-settings"
            />
            <MenuItem
              icon="grid"
              label="Dashboard"
              onPress={() => go(ROUTES.dashboardHome)}
              testID="menu-dashboard"
            />

            <View style={styles.menuDivider} />

            <MenuItem
              icon="log-out"
              label="Log out"
              destructive
              onPress={onLogout}
              testID="menu-logout"
            />
            </GlassSurface>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={notifOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setNotifOpen(false)}
      >
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => setNotifOpen(false)}
          testID="notifications-backdrop"
        >
          <Pressable
            style={[styles.notifPos, { top: topInset + NAV_BAR_HEIGHT - 4 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <GlassSurface radius={18} style={styles.menuGlass}>
              <View style={styles.notifHeader}>
                <Text style={styles.notifTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <Pressable
                    onPress={onMarkAllRead}
                    hitSlop={8}
                    testID="button-mark-all-read"
                  >
                    <Text style={styles.notifMarkAll}>Mark all read</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.menuDivider} />

              {notifLoading ? (
                <View style={styles.notifEmpty}>
                  <ActivityIndicator color={C.primary} />
                </View>
              ) : notifications.length === 0 ? (
                <View style={styles.notifEmpty}>
                  <Feather name="bell" size={26} color={C.mutedForeground} />
                  <Text style={styles.notifEmptyText}>No notifications yet</Text>
                </View>
              ) : (
                <ScrollView style={styles.notifList} bounces={false}>
                  {notifications.map((n) => (
                    <Pressable
                      key={n.id}
                      onPress={() => onNotificationPress(n)}
                      style={({ pressed }) => [
                        styles.notifItem,
                        !n.read && styles.notifItemUnread,
                        pressed && styles.menuItemPressed,
                      ]}
                      testID={`notification-item-${n.id}`}
                    >
                      <View style={styles.notifIcon}>
                        <Feather
                          name={
                            n.type === "security"
                              ? "shield"
                              : n.type === "welcome"
                                ? "star"
                                : "info"
                          }
                          size={16}
                          color={C.primary}
                        />
                      </View>
                      <View style={styles.notifBody}>
                        <View style={styles.notifRow}>
                          <Text style={styles.notifItemTitle} numberOfLines={1}>
                            {n.title}
                          </Text>
                          {!n.read && <View style={styles.notifDot} />}
                        </View>
                        {!!n.body && (
                          <Text style={styles.notifItemBody} numberOfLines={2}>
                            {n.body}
                          </Text>
                        )}
                        <Text style={styles.notifTime}>
                          {timeAgo(n.createdAt)}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </GlassSurface>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

type FeatherName = keyof typeof Feather.glyphMap;

function MenuItem({
  icon,
  label,
  onPress,
  destructive,
  testID,
}: {
  icon: FeatherName;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  testID?: string;
}) {
  const tint = destructive ? "#dc2626" : C.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
      testID={testID}
    >
      <Feather name={icon} size={18} color={tint} />
      <Text style={[styles.menuItemLabel, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  blur: {},
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  logoMark: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 36,
    height: 36,
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  bellBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: fonts.bodySemibold,
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  notifPos: {
    position: "absolute",
    right: 12,
    left: 12,
    maxWidth: 380,
    alignSelf: "flex-end",
  },
  notifHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  notifTitle: {
    fontSize: 15,
    color: C.foreground,
    fontFamily: fonts.bodySemibold,
  },
  notifMarkAll: {
    fontSize: 13,
    color: C.primary,
    fontFamily: fonts.bodyMedium,
  },
  notifList: {
    maxHeight: 360,
  },
  notifEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 8,
  },
  notifEmptyText: {
    fontSize: 13,
    color: C.mutedForeground,
    fontFamily: fonts.body,
  },
  notifItem: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notifItemUnread: {
    backgroundColor: "rgba(247,67,61,0.06)",
  },
  notifIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(247,67,61,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  notifBody: { flex: 1 },
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  notifItemTitle: {
    fontSize: 14,
    color: C.foreground,
    fontFamily: fonts.bodySemibold,
    flexShrink: 1,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.primary,
  },
  notifItemBody: {
    fontSize: 12,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    marginTop: 2,
  },
  notifTime: {
    fontSize: 11,
    color: C.mutedForeground,
    fontFamily: fonts.body,
    marginTop: 4,
  },

  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  menuPos: {
    position: "absolute",
    right: 12,
    minWidth: 240,
  },
  menuGlass: {
    paddingVertical: 6,
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  menuAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  menuHeaderText: { flex: 1 },
  menuNameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  menuName: { fontSize: 15, color: C.foreground, fontFamily: fonts.bodySemibold, flexShrink: 1 },
  menuEmail: { fontSize: 12, color: C.mutedForeground, fontFamily: fonts.body, marginTop: 1 },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginVertical: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuItemPressed: { backgroundColor: C.muted },
  menuItemLabel: { fontSize: 15, fontFamily: fonts.bodyMedium },
});

export default TopNav;
