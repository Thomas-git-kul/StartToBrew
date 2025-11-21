import { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { supabase } from "@/supabase";
import { Image } from "expo-image";
import { router, useRouter } from "expo-router";
import Header from "@/components/header";

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  updated_at: string | null;
};

type BadgeWithEarned = {
  id_badge: number;
  code: string;
  name: string;
  description: string | null;
  category: string;
  icon_url: string | null;
  earned_at: string; // uit account_badges.earned_at
};

export default function Account() {
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const [badges, setBadges] = useState<BadgeWithEarned[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);

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

      // simpele cache-buster
      setAvatarUrl(`${url}?v=${Date.now()}`);
    } else {
      setAvatarUrl(null);
    }

    setLoading(false);
  }, []);

  const fetchBadges = useCallback(async (accountId: string) => {
    setBadgesLoading(true);

    // 1) haal de account_badges op voor deze user
    const { data: accountBadges, error: abErr } = await supabase
      .from("account_badges")
      .select("badge_id, earned_at")
      .eq("account_id", accountId)
      .order("earned_at", { ascending: false });

    if (abErr) {
      setBadgesLoading(false);
      console.error("Error fetching account_badges", abErr);
      return;
    }

    if (!accountBadges || accountBadges.length === 0) {
      setBadges([]);
      setBadgesLoading(false);
      return;
    }

    const badgeIds = accountBadges.map(
      (row: { badge_id: any }) => row.badge_id
    );

    // 2) haal de badge-definities op
    const { data: badgesData, error: bErr } = await supabase
      .from("badges")
      .select("id_badge, code, name, description, icon_url, category")
      .in("id_badge", badgeIds);

    if (bErr) {
      setBadgesLoading(false);
      console.error("Error fetching badges", bErr);
      return;
    }

    if (!badgesData) {
      setBadges([]);
      setBadgesLoading(false);
      return;
    }

    // 3) merge earned_at in de badges
    const earnedById = new Map<number, string>();
    for (const row of accountBadges) {
      earnedById.set(row.badge_id, row.earned_at);
    }

    const merged: BadgeWithEarned[] = badgesData.map((b: any) => ({
      id_badge: b.id_badge,
      code: b.code,
      name: b.name,
      description: b.description,
      category: b.category,
      icon_url: b.icon_url,
      earned_at: earnedById.get(b.id_badge) ?? "",
    }));

    // sorteer optioneel op earned_at desc
    merged.sort((a, b) => {
      if (!a.earned_at || !b.earned_at) return 0;
      return new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime();
    });

    setBadges(merged);
    setBadgesLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // badges ophalen zodra we een userId hebben
  useEffect(() => {
    if (userId) {
      fetchBadges(userId);
    }
  }, [userId, fetchBadges]);

  const onSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    Alert.alert("Afgemeld");
    router.replace("/Auth");
  }, []);

  const Account = () => {
    const router = useRouter();

    const onEditProfile = useCallback(() => {
      router.push("/AccountEdit");
    }, [router]);

    if (loading) {
      return (
        <SafeAreaView>
          <ActivityIndicator />
        </SafeAreaView>
      );
    }

    const badgeCount = badges.length;

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
          title="Account"
          iconName="ArrowRight"
          onIconPress={() => router.push("/HomePage")}
          actionTestID="account-button"
        />

        {/* Profiel header */}
        <View style={styles.section}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarTouch}>
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
            </View>

            <View style={styles.profileTextBlock}>
              <ThemedText style={styles.nameText}>
                {fullName || "Name not set"}
              </ThemedText>
              {!!username && (
                <ThemedText style={styles.usernameText}>@{username}</ThemedText>
              )}
              {!!bio && (
                <ThemedText style={styles.bioText} numberOfLines={3}>
                  {bio}
                </ThemedText>
              )}
            </View>
          </View>
        </View>

        {/* Statistieken */}
        <View style={[styles.section, styles.cardsRow]}>
          <View style={styles.infoCard}>
            <ThemedText style={styles.cardLabel}>Badges</ThemedText>
            <ThemedText style={styles.cardValue}>{badgeCount}</ThemedText>
            <ThemedText style={styles.cardHint}>
              {badgeCount === 1 ? "badge earned" : "badges earned"}
            </ThemedText>
          </View>

          <View style={styles.infoCard}>
            <ThemedText style={styles.cardLabel}>Brews</ThemedText>
            <ThemedText style={styles.cardValue}>0</ThemedText>
            <ThemedText style={styles.cardHint}>Coming soon!</ThemedText>
          </View>
        </View>

        {/* Badges-overzicht */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Your badges</ThemedText>

          {badgesLoading ? (
            <ActivityIndicator style={{ marginTop: 8 }} />
          ) : badgeCount === 0 ? (
            <ThemedText style={styles.emptyText}>
              You have not earned any badges yet. Brew some beers to earn
              badges!
            </ThemedText>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgeScrollContent}
            >
              {badges.map((badge) => (
                <View key={badge.id_badge} style={styles.badgeCard}>
                  {/* Placeholder icon – later vervangen door echte badge icon_url */}
                  <View style={styles.badgeIconPlaceholder}>
                    <Text style={styles.badgeIconText}>★</Text>
                  </View>

                  <ThemedText style={styles.badgeName} numberOfLines={1}>
                    {badge.name}
                  </ThemedText>
                  {!!badge.description && (
                    <ThemedText
                      style={styles.badgeDescription}
                      numberOfLines={2}
                    >
                      {badge.description}
                    </ThemedText>
                  )}
                  {!!badge.earned_at && (
                    <ThemedText style={styles.badgeEarnedText}>
                      Earned on {new Date(badge.earned_at).toLocaleDateString()}
                    </ThemedText>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Acties */}
        <View style={styles.actionsColumn}>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={onEditProfile}
          >
            <Text style={styles.buttonText}>Change profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={onSignOut}
          >
            <Text style={styles.buttonSecondaryText}>Sign off</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    section: {
      marginTop: 16,
    },
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
    avatarTouch: {
      borderRadius: 48,
      overflow: "hidden",
    },
    avatarFallback: {
      alignItems: "center",
      justifyContent: "center",
    },
    initials: {
      fontSize: 32,
      fontWeight: "bold",
      color: BASE_COLORS.TEXT_DARK,
    },
    profileTextBlock: {
      flex: 1,
    },
    nameText: {
      fontSize: 20,
      fontFamily: FontFamilies.HEADING,
      color: BASE_COLORS.TEXT_DARK,
      marginBottom: 4,
    },
    usernameText: {
      fontSize: 14,
      color: BASE_COLORS.TEXT_DARK,
      opacity: 0.8,
      marginBottom: 8,
    },
    bioText: {
      fontSize: 14,
      color: BASE_COLORS.TEXT_DARK,
    },
    cardsRow: {
      flexDirection: "row",
      gap: 12,
    },
    infoCard: {
      flex: 1,
      backgroundColor: BASE_COLORS.WHITE,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: BASE_COLORS.TEXT_DARK || "#ddd",
    },
    cardLabel: {
      fontSize: 14,
      fontFamily: FontFamilies.HEADING,
      color: BASE_COLORS.TEXT_DARK,
      marginBottom: 4,
    },
    cardValue: {
      fontSize: 22,
      fontFamily: FontFamilies.HEADING,
      color: BASE_COLORS.ACCENT_PRIMARY,
      marginBottom: 4,
    },
    cardHint: {
      fontSize: 12,
      color: BASE_COLORS.TEXT_DARK,
      opacity: 0.7,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: FontFamilies.HEADING,
      color: BASE_COLORS.TEXT_DARK,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: BASE_COLORS.TEXT_DARK,
      opacity: 0.8,
    },
    badgeScrollContent: {
      paddingVertical: 4,
      paddingRight: 4,
    },
    badgeCard: {
      width: 140,
      marginRight: 12,
      backgroundColor: BASE_COLORS.WHITE,
      borderRadius: 10,
      padding: 10,
      borderWidth: 1,
      borderColor: BASE_COLORS.TEXT_DARK || "#ddd",
    },
    badgeIconPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignSelf: "flex-start",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: BASE_COLORS.ACCENT_PRIMARY,
      marginBottom: 8,
    },
    badgeIconText: {
      fontSize: 24,
      color: BASE_COLORS.WHITE,
      fontWeight: "bold",
    },
    badgeName: {
      fontSize: 14,
      fontFamily: FontFamilies.HEADING,
      color: BASE_COLORS.TEXT_DARK,
      marginBottom: 4,
    },
    badgeDescription: {
      fontSize: 12,
      color: BASE_COLORS.TEXT_DARK,
      opacity: 0.8,
      marginBottom: 4,
    },
    badgeEarnedText: {
      fontSize: 11,
      color: BASE_COLORS.TEXT_DARK,
      opacity: 0.7,
    },
    actionsColumn: {
      marginTop: 32,
      gap: 12,
    },
    button: {
      height: 44,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonPrimary: {
      backgroundColor: BASE_COLORS.ACCENT_PRIMARY,
    },
    buttonSecondary: {
      backgroundColor: BASE_COLORS.WHITE,
      borderWidth: 1,
      borderColor: BASE_COLORS.TEXT_DARK || "#ddd",
    },
    buttonText: { color: BASE_COLORS.WHITE, fontWeight: "bold" },
    buttonSecondaryText: { color: BASE_COLORS.TEXT_DARK, fontWeight: "bold" },
  });
  return <Account />;
}
