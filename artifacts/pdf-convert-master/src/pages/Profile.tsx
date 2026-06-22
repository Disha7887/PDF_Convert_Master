import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile, changePassword, uploadAvatar } from "@/lib/profile";
import { Camera, User as UserIcon, Lock, Check } from "lucide-react";

export const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const initials = (user?.name || user?.email || "U").charAt(0).toUpperCase();

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    const updates: { name?: string; email?: string } = {};
    if (name.trim() && name.trim() !== (user?.name || "")) updates.name = name.trim();
    if (email.trim() && email.trim() !== (user?.email || "")) updates.email = email.trim();

    if (Object.keys(updates).length === 0) {
      setProfileMsg({ type: "err", text: "Nothing to update" });
      return;
    }
    if (updates.email && !updates.email.includes("@")) {
      setProfileMsg({ type: "err", text: "Please enter a valid email address" });
      return;
    }

    setSavingProfile(true);
    try {
      const { user: updated, token } = await updateProfile(updates);
      updateUser(updated, token);
      setProfileMsg({ type: "ok", text: "Profile updated" });
    } catch (err) {
      setProfileMsg({ type: "err", text: err instanceof Error ? err.message : "Update failed" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: "err", text: "New password must be at least 6 characters" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "err", text: "Passwords do not match" });
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordMsg({ type: "ok", text: "Password changed" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMsg({ type: "err", text: err instanceof Error ? err.message : "Could not change password" });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setProfileMsg(null);
    try {
      const { user: updated } = await uploadAvatar(file);
      updateUser(updated);
    } catch (err) {
      setProfileMsg({ type: "err", text: err instanceof Error ? err.message : "Avatar upload failed" });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
          Profile Settings
        </h1>
        <p className="text-sm text-gray-600 mt-1">Manage your account details and password.</p>
      </div>

      {/* Avatar + profile details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserIcon className="w-5 h-5 text-blue-600" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
                {user?.profilePictureUrl ? (
                  <img src={user.profilePictureUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-semibold text-white">{initials}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md disabled:opacity-50"
                aria-label="Change profile picture"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <p className="font-medium text-gray-900">{user?.name || user?.email}</p>
              <p className="text-sm text-gray-500">
                {uploadingAvatar ? "Uploading..." : "Tap the camera to change your picture"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {profileMsg && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  profileMsg.type === "ok"
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-600"
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  {profileMsg.type === "ok" && <Check className="w-4 h-4" />}
                  {profileMsg.text}
                </span>
              </div>
            )}

            <Button
              type="submit"
              disabled={savingProfile}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {savingProfile ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="w-5 h-5 text-blue-600" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-sm font-medium text-gray-700">
                Current Password
              </Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium text-gray-700">
                New Password
              </Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                Confirm New Password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {passwordMsg && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  passwordMsg.type === "ok"
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-600"
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  {passwordMsg.type === "ok" && <Check className="w-4 h-4" />}
                  {passwordMsg.text}
                </span>
              </div>
            )}

            <Button
              type="submit"
              disabled={savingPassword}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {savingPassword ? "Updating..." : "Change password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
