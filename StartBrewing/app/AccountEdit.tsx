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
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ThemedText } from "@/components/themed-text";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { supabase } from "@/supabase";
import { updateAvatar } from "@/supabase/storage/updateAvatar";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Header from "@/components/header";
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

export default function EditAccount() {
  const router = useRouter();
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
    setAuthEmail(user.email ?? "");

    const { data, error } = await supabase
      .from("profiles")
      .select("id,username,full_name,avatar_url,bio,updated_at,mail,firstname,lastname")
      .eq("id", user.id)
      .single();

    if (error) {
      Alert.alert("Profiel laden mislukt", error.message);
      setLoading(false);
      return;
    }

    const p = data as Profile;

    // Vul de velden direct met de opgehaalde data
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
    if (saving) return;
    setSaving(true);
    try {
      setPasswordError("");
      setCurrentPasswordError("");
      // Password change logic
      if (currentPassword || newPassword || confirmNewPassword) {
        if (!currentPassword) {
          Alert.alert("Fout", "Vul je huidige wachtwoord in.");
          return;
        }
        // Validate new password
        if (newPassword.length < 6) {
          Alert.alert("Fout", "Nieuw wachtwoord moet minimaal 6 tekens zijn.");
          return;
        }
        if (!/[A-Z]/.test(newPassword)) {
          Alert.alert("Fout", "Nieuw wachtwoord moet minimaal 1 hoofdletter bevatten.");
          return;
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
          Alert.alert("Fout", "Nieuw wachtwoord moet minimaal 1 speciaal teken bevatten.");
          return;
        }
        if (newPassword !== confirmNewPassword) {
          Alert.alert("Fout", "Wachtwoorden komen niet overeen.");
          return;
        }
        // Re-authenticate user with current password
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: currentPassword,
        });
        if (signInError) {
          Alert.alert("Fout", `Huidig wachtwoord onjuist: ${signInError.message}`);
          return;
        }
        if (!signInData.session) {
          Alert.alert("Fout", "Kon geen geldige sessie verkrijgen voor wachtwoord wijziging.");
          return;
        }
        const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
        if (pwError) {
          Alert.alert("Fout", `Wachtwoord opslaan mislukt: ${pwError.message}`);
          return;
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

      if (error) Alert.alert("Opslaan mislukt", error.message);
      else Alert.alert("Opgeslagen", "Je profiel is bijgewerkt.");

      router.push("../Account");
    } catch (err: any) {
      Alert.alert("Fout", err?.message ?? "Onbekende fout tijdens opslaan.");
    } finally {
      setSaving(false);
    }
  }, [router, userId, username, fullName, bio, mail, firstname, lastname, currentPassword, newPassword, confirmNewPassword, authEmail, saving]);

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

  
  const hasError = Boolean(
    ((passwordError && !passwordError.includes('new password should be different from the old one')) ||
    (newPassword.length > 0 && newPassword.length < 6) ||
    (newPassword.length > 0 && !/[A-Z]/.test(newPassword)) ||
    (newPassword.length > 0 && !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword))) &&
    !(passwordError && passwordError.includes('new password should be different from the old one'))
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BASE_COLORS.LIGHT_BG }}
      contentContainerStyle={{ paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
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
                source={{ uri: avatarUrl || "" }}
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

        <ThemedText style={styles.label}>Email</ThemedText>
          <TextInput
            value={mail}
            editable={false}
            placeholder="Email"
            placeholderTextColor={BASE_COLORS.TEXT_DARK || "#999"}
            style={[styles.input, { backgroundColor: '#e0e0e0' }]}
            autoCapitalize="none"
          />

        <ThemedText style={styles.label}>Huidig wachtwoord</ThemedText>
        <TextInput
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Huidig wachtwoord"
          placeholderTextColor={BASE_COLORS.TEXT_DARK || "#999"}
          style={styles.input}
          autoCapitalize="none"
          secureTextEntry
        />
        {currentPasswordError ? (
          <ThemedText style={{ color: 'red', marginBottom: 8 }}>{currentPasswordError}</ThemedText>
        ) : null}

        <ThemedText style={styles.label}>Nieuw wachtwoord</ThemedText>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Nieuw wachtwoord"
          placeholderTextColor={BASE_COLORS.TEXT_DARK || "#999"}
          style={styles.input}
          autoCapitalize="none"
          secureTextEntry
        />
        {newPassword.length > 0 && newPassword.length < 6 && (
          <ThemedText style={{ color: 'red', marginBottom: 4 }}>Minimaal 6 tekens</ThemedText>
        )}
        {newPassword.length > 0 && !/[A-Z]/.test(newPassword) && (
          <ThemedText style={{ color: 'red', marginBottom: 4 }}>Minimaal 1 hoofdletter</ThemedText>
        )}
        {newPassword.length > 0 && !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) && (
          <ThemedText style={{ color: 'red', marginBottom: 8 }}>Minimaal 1 speciaal teken</ThemedText>
        )}

        <ThemedText style={styles.label}>Bevestig nieuw wachtwoord</ThemedText>
        <TextInput
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
          placeholder="Herhaal nieuw wachtwoord"
          placeholderTextColor={BASE_COLORS.TEXT_DARK || "#999"}
          style={styles.input}
          autoCapitalize="none"
          secureTextEntry
        />
        {confirmNewPassword.length > 0 && newPassword !== confirmNewPassword && (
          <ThemedText style={{ color: 'red', marginBottom: 8 }}>Wachtwoorden komen niet overeen</ThemedText>
        )}
        {passwordError ? (
          <ThemedText style={{ color: 'red', marginBottom: 8 }}>{passwordError}</ThemedText>
        ) : null}

        <ThemedText style={styles.label}>Voornaam</ThemedText>
        <TextInput
          value={firstname}
          onChangeText={setFirstname}
          placeholder="Voornaam"
          placeholderTextColor={BASE_COLORS.TEXT_DARK || "#999"}
          style={styles.input}
        />

        <ThemedText style={styles.label}>Achternaam</ThemedText>
        <TextInput
          value={lastname}
          onChangeText={setLastname}
          placeholder="Achternaam"
          placeholderTextColor={BASE_COLORS.TEXT_DARK || "#999"}
          style={styles.input}
        />

        {/* Volledige naam veld verwijderd */}

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
          onPress={() => router.push("/Account")}
        >
          <Text style={styles.buttonSecondaryText}>Terug</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={onSave}
          disabled={saving}
        >
          <Text style={[styles.buttonText, hasError ? { color: BASE_COLORS.TEXT_DARK } : {}]}>
            {saving ? "Opslaan…" : "Opslaan"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
