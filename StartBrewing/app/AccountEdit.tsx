// app/AccountEdit.tsx
import { BadgeEarnedModal } from "@/components/BadgeEarnedModal";
import Dialog from "@/components/dialog";
import ErrorChip from "@/components/errorChip";
import Header from "@/components/header";
import Spinner from "@/components/spinner";
import TextInput from "@/components/textInput";
import { ThemedText } from "@/components/themed-text";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useFonts } from "@/hooks/use-fonts";
import { supabase } from "@/supabase";
import { fetchLatestBadge } from "@/supabase/queries/badges";
import { updateAvatar } from "@/supabase/storage/updateAvatar";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Avatar, Button, Snackbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BASE_SCREEN_WIDTH = 375;
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  updated_at: string | null;
  mail?: string | null;
  firstname?: string | null;
  lastname?: string | null;
};

export default function EditAccount() {
  useFonts();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [mail, setMail] = useState<string>("");
  const [authEmail, setAuthEmail] = useState<string>("");
  const [firstname, setFirstname] = useState<string>("");
  const [lastname, setLastname] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [latestBadgeId, setLatestBadgeId] = useState<number | null>(null);
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [badgeForModal, setBadgeForModal] = useState<{
    name: string | null;
    iconUrl: string | null;
  } | null>(null);

  const initials = useMemo(() => {
    const src = fullName || username || "";
    const parts = src.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
  }, [fullName, username]);

  const initLatestBadge = useCallback(async (accountId: string) => {
    const latest = await fetchLatestBadge(accountId);
    if (latest) {
      setLatestBadgeId(latest.id);
    }
  }, []);

  const checkForNewBadge = useCallback(
    async (accountId: string) => {
      const latest = await fetchLatestBadge(accountId);
      if (!latest) return false;

      if (latestBadgeId == null || latest.id !== latestBadgeId) {
        setLatestBadgeId(latest.id);
        setBadgeForModal({ name: latest.name, iconUrl: latest.imageUrl });
        setBadgeModalVisible(true);
        return true;
      }
      return false;
    },
    [latestBadgeId]
  );

  const fetchProfile = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
      error: uErr,
    } = await supabase.auth.getUser();

    if (uErr || !user) {
      setLoading(false);
      return;
    }

    setUserId(user.id);
    setAuthEmail(user.email ?? "");
    await initLatestBadge(user.id);

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id,username,full_name,avatar_url,bio,updated_at,mail,firstname,lastname"
      )
      .eq("id", user.id)
      .single();

    if (error) {
      Alert.alert("Failed to load profile", error.message);
      setLoading(false);
      return;
    }

    const p = data as Profile;

    setUsername(p?.username ?? "");
    setFullName(p?.full_name ?? "");
    setBio(p?.bio ?? "");
    setMail(p?.mail ?? "");
    setFirstname(p?.firstname ?? "");
    setLastname(p?.lastname ?? "");

    if (p?.avatar_url) {
      let url: string;

      if (p.avatar_url.startsWith("http")) {
        url = p.avatar_url;
      } else {
        const { data: pub } = supabase.storage
          .from("avatars")
          .getPublicUrl(p.avatar_url);
        url = pub.publicUrl;
      }

      setAvatarUrl(`${url}?v=${Date.now()}`);
    } else {
      setAvatarUrl(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (params.fromComplete === "true") {
      setSnackbarVisible(true);
    }
  }, [params.fromComplete]);

  const onChangeAvatar = useCallback(async () => {
    if (!userId) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Grant access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
    } as any);

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) {
      Alert.alert("Error", "Unaible to load photo");
      return;
    }
    if (asset.type && asset.type !== "image") {
      Alert.alert("Photo unavailable", "Select a photo file.");
      return;
    }

    try {
      // show the selected image immediately for instant feedback
      setAvatarUrl(asset.uri);

      const url = await updateAvatar({
        userId,
        fileUri: asset.uri,
        quality: 0.8,
        maxWidth: 512,
        maxHeight: 512,
      });
      // append a cache-busting query param so the uploaded image is fetched fresh
      if (url) setAvatarUrl(`${url}?v=${Date.now()}`);
    } catch (err: any) {
      Alert.alert("Upload failed", err.message ?? "Unknown Error");
    }
  }, [userId]);

  const onSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      setPasswordError("");
      setCurrentPasswordError("");
      // Password change logic
      if (currentPassword || newPassword || confirmNewPassword) {
        if (!currentPassword) {
          Alert.alert("Error", "Enter your current password.");
          return;
        }
        // Validate new password
        if (newPassword.length < 6) {
          Alert.alert("Error", "Password must be over 6 characters.");
          return;
        }
        if (!/[A-Z]/.test(newPassword)) {
          Alert.alert(
            "Error",
            "Password must contain at least 1 capital letter."
          );
          return;
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
          Alert.alert(
            "Error",
            "Password must contain at least 1 special character."
          );
          return;
        }
        if (newPassword !== confirmNewPassword) {
          Alert.alert("Error", "Passwords don't match.");
          return;
        }
        // Re-authenticate user with current password
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: authEmail,
            password: currentPassword,
          });
        if (signInError) {
          setCurrentPasswordError("Current password incorrect");
          return;
        } else {
          setCurrentPasswordError("");
        }
        if (!signInData.session) {
          Alert.alert(
            "Error",
            "Unaible to obtain a valid session for password change."
          );
          return;
        }
        const { error: pwError } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (pwError) {
          if (pwError.status === 422) {
            setPasswordError("New and current password cannot be the same");
          } else {
            setPasswordError(`Failed to save password: ${pwError.message}`);
          }
          return;
        } else {
          setPasswordError("");
        }
      }
      // Save other fields
      const updateObj: any = {
        username,
        full_name: fullName,
        bio,
        mail,
        firstname,
        lastname,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("profiles")
        .update(updateObj)
        .eq("id", userId);

      if (error) Alert.alert("Unaible to save profile", error.message);
      else {
        Alert.alert("Saved", "Your profile has been updated.");
        if (userId) await checkForNewBadge(userId);
      }
      router.push("../Account");
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Unknown error while saving.");
    } finally {
      setSaving(false);
    }
  }, [
    router,
    userId,
    username,
    fullName,
    bio,
    mail,
    firstname,
    lastname,
    currentPassword,
    newPassword,
    confirmNewPassword,
    authEmail,
    saving,
  ]);

  if (loading) {
    return <Spinner title="Loading account information..." />;
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}
    >
      <Header
        title="Edit profile"
        iconNameLeft="ArrowLeft"
        actionTestIDLeft="back-button"
        onIconPressLeft={() => setDialogVisible(true)}
      />
      <ScrollView
        className="flex-1, mx-3"
        style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={onChangeAvatar}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          {avatarUrl ? (
            <Avatar.Image
              source={{ uri: avatarUrl || "" }}
              size={Math.min(90 * scale, 300)}
              style={{
                backgroundColor: BASE_COLORS.LIGHT_BG,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: BASE_COLORS.STONE300,
              }}
              onError={() => setAvatarUrl(null)}
            />
          ) : (
            <Avatar.Text
              size={Math.min(90 * scale, 120)}
              label={initials || "?"}
              color={BASE_COLORS.TEXT_DARK}
              style={{ backgroundColor: BASE_COLORS.STONE200 }}
              labelStyle={{
                padding: 4,
                fontFamily: FontFamilies.BODY,
                fontSize: Math.min(30 * scale, 40),
              }}
            />
          )}
        </Pressable>
        <ThemedText
          type="tips"
          style={{ color: BASE_COLORS.STONE400 }}
          className="mb-5"
        >
          Tap to change
        </ThemedText>

        <ThemedText type="subTitle" className="mb-1">
          Update personal information
        </ThemedText>
        <View className="flex-row gap-3 flex-wrap">
          <View style={{ width: "47%" }}>
            <View className="flex-1">
              <TextInput
                placeholder="First Name"
                onChangeText={setFirstname}
                value={firstname}
                maxLength={30}
              />
            </View>
          </View>
          <View className="flex-1">
            <TextInput
              placeholder="Last Name"
              onChangeText={setLastname}
              value={lastname}
              maxLength={30}
            />
          </View>
        </View>
        <TextInput
          placeholder="Email"
          onChangeText={setMail}
          value={mail}
          keyboardType="email-address"
          maxLength={50}
        />

        <ThemedText type="subTitle" className="mt-3 mb-1">
          Update account information
        </ThemedText>
        <TextInput
          placeholder="Username"
          onChangeText={setUsername}
          value={username}
          maxLength={30}
        />
        <TextInput
          placeholder="Biography"
          onChangeText={setBio}
          value={bio}
          multiline
          numberOfLines={4}
          maxLength={200}
        />

        <ThemedText type="subTitle" className="mt-3 mb-1">
          Change password
        </ThemedText>
        <TextInput
          placeholder="Current Password"
          onChangeText={setCurrentPassword}
          value={currentPassword}
          secureTextEntry
          maxLength={30}
        />
        {currentPasswordError ? (
          <View className="mb-5">
            <ErrorChip text="Current password incorrect" />
          </View>
        ) : null}
        <TextInput
          placeholder="New Password"
          onChangeText={setNewPassword}
          value={newPassword}
          secureTextEntry
          maxLength={30}
        />
        {newPassword.length > 0 &&
          (newPassword.length < 6 ||
            !/[A-Z]/.test(newPassword) ||
            !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) && (
            <View className="mb-5">
              {newPassword.length > 0 && newPassword.length < 6 && (
                <ErrorChip text="Enter at least 6 characters" />
              )}
              {newPassword.length > 0 && !/[A-Z]/.test(newPassword) && (
                <ErrorChip text="Enter at least 1 capital letter" />
              )}
              {newPassword.length > 0 &&
                !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) && (
                  <ErrorChip text="Enter at least 1 special character" />
                )}
            </View>
          )}
        <TextInput
          placeholder="Confirm New Password"
          onChangeText={setConfirmNewPassword}
          value={confirmNewPassword}
          secureTextEntry
          maxLength={30}
        />
        <View className="mb-5">
          {confirmNewPassword.length > 0 &&
            newPassword !== confirmNewPassword && (
              <ErrorChip text="Passwords don't match" />
            )}
          {passwordError ? <ErrorChip text={passwordError} /> : null}
        </View>

        <View className="flex-row justify-between">
          <Button
            mode="text"
            onPress={() => setDialogVisible(true)}
            disabled={saving}
            labelStyle={{
              fontSize: Math.min(16 * scale, 24),
              fontFamily: FontFamilies.BODY,
              color: BASE_COLORS.TEXT_DARK,
            }}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={onSave}
            disabled={saving}
            loading={saving}
            labelStyle={{
              fontSize: Math.min(16 * scale, 24),
              color: BASE_COLORS.WHITE,
              fontFamily: FontFamilies.BODY,
            }}
            style={{
              borderRadius: 20,
              marginBottom: 15,
              backgroundColor: BASE_COLORS.TEXT_DARK,
            }}
          >
            Save
          </Button>
        </View>
      </ScrollView>

      <Dialog
        title="Unsaved Changes"
        text="Changes will not be saved. Are you sure you want to cancel editing?"
        cancelBtn="Keep Editing"
        yesBtn="Delete Changes"
        visible={isDialogVisible}
        onDismiss={() => setDialogVisible(false)}
        onPressCancel={() => setDialogVisible(false)}
        onPressYes={() => {
          setDialogVisible(false);
          router.push("/Account");
        }}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        style={{
          backgroundColor: BASE_COLORS.WHITE,
          shadowColor: BASE_COLORS.STONE700,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.07,
        }}
      >
        <Text
          style={{
            fontSize: Math.min(14 * scale, 18),
            fontFamily: FontFamilies.BODY,
            color: BASE_COLORS.STONE600,
          }}
        >
          Add profile picture and fill in the bio to complete your account
        </Text>
      </Snackbar>
      <BadgeEarnedModal
        visible={badgeModalVisible}
        badgeName={badgeForModal?.name ?? null}
        iconUrl={badgeForModal?.iconUrl ?? null}
        onClose={() => setBadgeModalVisible(false)}
      />
    </SafeAreaView>
  );
}
