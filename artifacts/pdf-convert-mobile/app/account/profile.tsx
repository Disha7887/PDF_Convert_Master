import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Button, Card, Field, ScreenScroll } from "@/components/ui";
import colors from "@/constants/colors";
import { fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import {
  avatarSrc,
  changePassword,
  updateProfile,
  uploadAvatar,
} from "@/services/profile";

const C = colors.light;

function initialsOf(name?: string, email?: string): string {
  const base = name?.trim() || email?.split("@")[0] || "";
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase() || "?";
}

export default function ProfileSettingsScreen() {
  const { user, token, updateUser } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileOk, setProfileOk] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordOk, setPasswordOk] = useState<string | null>(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const imageSrc = useMemo(() => avatarSrc(user?.profilePictureUrl), [user?.profilePictureUrl]);
  const initials = initialsOf(user?.name, user?.email);

  const profileDirty =
    name.trim() !== (user?.name ?? "").trim() || email.trim() !== (user?.email ?? "").trim();

  const pickAvatar = async () => {
    setProfileError(null);
    setProfileOk(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo library access to choose a profile picture.",
      );
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (res.canceled || !res.assets?.[0]?.uri) return;

    setUploadingAvatar(true);
    try {
      const result = await uploadAvatar(token, res.assets[0].uri);
      if (result.success && result.profilePictureUrl) {
        await updateUser({ profilePictureUrl: result.profilePictureUrl });
        setProfileOk("Profile picture updated.");
      } else {
        setProfileError(result.error ?? "Could not upload your photo.");
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveProfile = async () => {
    setProfileError(null);
    setProfileOk(null);
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      setProfileError("Please enter your name.");
      return;
    }
    if (!trimmedEmail.includes("@")) {
      setProfileError("Please enter a valid email address.");
      return;
    }
    setSavingProfile(true);
    try {
      const result = await updateProfile(token, { name: trimmedName, email: trimmedEmail });
      if (result.success) {
        await updateUser({ name: trimmedName, email: trimmedEmail }, result.token);
        setProfileOk("Profile saved.");
      } else {
        setProfileError(result.error ?? "Could not update your profile.");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    setPasswordError(null);
    setPasswordOk(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      const result = await changePassword(token, currentPassword, newPassword);
      if (result.success) {
        setPasswordOk("Password changed.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(result.error ?? "Could not change your password.");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) {
    return (
      <ScreenScroll>
        <Text style={styles.empty}>Sign in to manage your profile.</Text>
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll contentStyle={{ gap: 20 }}>
      {/* Avatar */}
      <View style={styles.avatarBlock}>
        <Pressable onPress={pickAvatar} disabled={uploadingAvatar} style={styles.avatarPress}>
          {imageSrc ? (
            <Image source={{ uri: imageSrc }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <View style={[styles.avatarImg, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.avatarBadge}>
            <Feather name={uploadingAvatar ? "loader" : "camera"} size={15} color="#fff" />
          </View>
        </Pressable>
        <Pressable onPress={pickAvatar} disabled={uploadingAvatar} hitSlop={8}>
          <Text style={styles.changePhoto}>
            {uploadingAvatar ? "Uploading…" : "Change photo"}
          </Text>
        </Pressable>
      </View>

      {/* Account details */}
      <Card>
        <Text style={styles.cardTitle}>Account details</Text>
        <View style={{ gap: 14, marginTop: 14 }}>
          <Field
            label="Name"
            icon="user"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoCapitalize="words"
            testID="input-profile-name"
          />
          <Field
            label="Email"
            icon="mail"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            testID="input-profile-email"
          />
          {profileError ? <Text style={styles.error}>{profileError}</Text> : null}
          {profileOk ? <Text style={styles.ok}>{profileOk}</Text> : null}
          <Button
            label={savingProfile ? "Saving…" : "Save changes"}
            onPress={saveProfile}
            loading={savingProfile}
            disabled={!profileDirty || savingProfile}
            fullWidth
            testID="button-save-profile"
          />
        </View>
      </Card>

      {/* Change password */}
      <Card>
        <Text style={styles.cardTitle}>Change password</Text>
        <View style={{ gap: 14, marginTop: 14 }}>
          <Field
            label="Current password"
            icon="lock"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current password"
            secureTextEntry
            autoCapitalize="none"
            testID="input-current-password"
          />
          <Field
            label="New password"
            icon="lock"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="At least 6 characters"
            secureTextEntry
            autoCapitalize="none"
            testID="input-new-password"
          />
          <Field
            label="Confirm new password"
            icon="lock"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
            secureTextEntry
            autoCapitalize="none"
            testID="input-confirm-new-password"
          />
          {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
          {passwordOk ? <Text style={styles.ok}>{passwordOk}</Text> : null}
          <Button
            label={savingPassword ? "Updating…" : "Update password"}
            onPress={savePassword}
            loading={savingPassword}
            disabled={savingPassword}
            fullWidth
            testID="button-save-password"
          />
        </View>
      </Card>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 15, color: C.mutedForeground, fontFamily: fonts.body, textAlign: "center", marginTop: 40 },
  avatarBlock: { alignItems: "center", gap: 10, marginTop: 4 },
  avatarPress: { width: 104, height: 104 },
  avatarImg: { width: 104, height: 104, borderRadius: 52, backgroundColor: C.muted },
  avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: C.primary },
  avatarInitials: { fontSize: 36, color: "#fff", fontFamily: fonts.headingBold },
  avatarBadge: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: C.background,
  },
  changePhoto: { fontSize: 14, color: C.primary, fontFamily: fonts.bodySemibold },
  cardTitle: { fontSize: 17, color: C.foreground, fontFamily: fonts.headingSemibold },
  error: { fontSize: 13, color: C.destructive, fontFamily: fonts.body },
  ok: { fontSize: 13, color: "#16a34a", fontFamily: fonts.body },
});
