import { useEffect, useMemo, useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ThemedText } from "@/components/themed-text";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { supabase } from "@/supabase";
import { updateAvatar } from "@/supabase/storage/updateAvatar";
import { Image } from "expo-image";
import { router } from "expo-router";
import Header from "@/components/header";

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  updated_at: string | null;
};

export default function EditAccount() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const initials = useMemo(() => {
    const src = fullName || username || "";
    const parts = src.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
  }, [fullName, username]);

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

    const { data, error } = await supabase
      .from("profiles")
      .select("id,username,full_name,avatar_url,bio,updated_at")
      .eq("id", user.id)
      .single();

    if (error) {
      Alert.alert("Profiel laden mislukt", error.message);
      setLoading(false);
      return;
    }

    const p = data as Profile;

    setUsername(p?.username ?? "");
    setFullName(p?.full_name ?? "");
    setBio(p?.bio ?? "");

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

  const onChangeAvatar = useCallback(async () => {
    if (!userId) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Toestemming vereist", "Geef toegang tot je foto's.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
    } as any);

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) {
      Alert.alert("Fout", "Kon geen lokale afbeelding vinden.");
      return;
    }
    if (asset.type && asset.type !== "image") {
      Alert.alert("Geen afbeelding", "Kies een fotobestand.");
      return;
    }

    try {
      const url = await updateAvatar({
        userId,
        fileUri: asset.uri,
        quality: 0.8,
        maxWidth: 512,
        maxHeight: 512,
      });
      if (url) setAvatarUrl(url);
    } catch (err: any) {
      Alert.alert("Upload mislukt", err.message ?? "Onbekende fout");
    }
  }, [userId]);

  const onSave = useCallback(async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        username: username || null,
        full_name: fullName || null,
        bio: bio || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    setSaving(false);
    if (error) Alert.alert("Opslaan mislukt", error.message);
    else Alert.alert("Opgeslagen", "Je profiel is bijgewerkt.");
    router.push("../Account");
  }, [userId, username, fullName, bio]);

  const onSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    Alert.alert("Afgemeld");
    router.replace("/Auth");
  }, []);

  if (loading) {
    return (
      <SafeAreaView>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: BASE_COLORS.LIGHT_BG,
        paddingHorizontal: 16,
        paddingTop: 8,
      }}
    >
      <Header
        title="Profiel bewerken"
        iconName="ArrowLeft"
        onIconPress={() => router.push("/Account")}
        actionTestID="edit-account-back-button"
      />

      <View style={styles.section}>
        <View style={styles.avatarRow}>
          <TouchableOpacity
            onPress={onChangeAvatar}
            activeOpacity={0.3}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.avatarTouch}
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatar}
                onError={() => setAvatarUrl(null)}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.initials}>{initials || "?"}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={onChangeAvatar}>
            <Text style={styles.buttonText}>Wijzig foto</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.label}>Gebruikersnaam</ThemedText>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="jouw_naam"
          placeholderTextColor={BASE_COLORS.TEXT_DARK || "#999"}
          style={styles.input}
          autoCapitalize="none"
        />

        <ThemedText style={styles.label}>Volledige naam</ThemedText>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Volledige naam"
          placeholderTextColor={BASE_COLORS.TEXT_DARK || "#999"}
          style={styles.input}
        />

        <ThemedText style={styles.label}>Biografie</ThemedText>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="Vertel iets over jezelf"
          placeholderTextColor={BASE_COLORS.TEXT_DARK || "#999"}
          style={[styles.input, styles.textarea]}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={onSignOut}
        >
          <Text style={styles.buttonSecondaryText}>Afmelden</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={onSave}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? "Opslaan…" : "Opslaan"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  title: {
    paddingTop: 25,
    fontSize: 36,
    fontWeight: "bold",
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.TEXT_DARK,
    marginBottom: 10,
  },
  section: { marginTop: 12 },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: BASE_COLORS.LIGHT_BG || "#eee",
  },
  avatarTouch: { borderRadius: 48 },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontSize: 32,
    fontWeight: "bold",
    color: BASE_COLORS.TEXT_DARK,
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 16,
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.TEXT_DARK,
  },
  input: {
    backgroundColor: BASE_COLORS.LIGHT_BG || "#f6f6f6",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: BASE_COLORS.TEXT_DARK,
    borderWidth: 1,
    borderColor: BASE_COLORS.TEXT_DARK || "#ddd",
  },
  textarea: { minHeight: 90, textAlignVertical: "top" },
  actionsRow: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimary: { backgroundColor: BASE_COLORS.ACCENT_PRIMARY },
  buttonSecondary: {
    backgroundColor: BASE_COLORS.WHITE,
    borderWidth: 1,
    borderColor: BASE_COLORS.TEXT_DARK || "#ddd",
  },
  buttonText: { color: BASE_COLORS.WHITE, fontWeight: "bold" },
  buttonSecondaryText: { color: BASE_COLORS.TEXT_DARK, fontWeight: "bold" },
});
