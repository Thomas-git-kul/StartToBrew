import { useEffect, useMemo, useState, useCallback } from "react";
import { View, Dimensions, Text, Alert, ScrollView } from "react-native";
import { ActivityIndicator, Avatar, Button, Modal, Portal } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { supabase } from "@/supabase";
import { Image } from "expo-image";
import { router, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Header from "@/components/header";
import { getBeerImageSource } from "@/hooks/beer-image";
import { useFonts } from "@/hooks/use-fonts";
import StatisticsCard from "@/components/ui/StatisticsCard"
import Badge from "@/components/ui/Badge";
import CompletedCard from '@/components/ui/CompletedCard';
import Dialog from "@/components/dialog"

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_SCREEN_WIDTH = 375; 
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  updated_at: string | null;
  level: string | null;
};

type BadgeWithEarned = {
  id_badge: number;
  code: string;
  name: string;
  description: string | null;
  category: string;
  icon_url: string | null;
  earned_at: string;
};

type Brew = {
  id_brew: number;
  user_id: string;
  name: string;
  start_date: string | null;
  status_id: number | null;
  recipe_slug: string | null;
  last_step_id: string | null;
};

type CompletedBrewWithImage = Brew & {
  haze_level?: number | null;
  srm_target?: number | null;
  image?: any;
};

export default function Account() {
  useFonts();

  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [level, setLevel] = useState("");
  const [bio, setBio] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const [badges, setBadges] = useState<BadgeWithEarned[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);
  const [showAllBadges, setShowAllBadges] = useState(false);

  const [completedBrews, setCompletedBrews] = useState<
    CompletedBrewWithImage[]
  >([]);
  const [brewsLoading, setBrewsLoading] = useState(false);
  const [showAllBrews, setShowAllBrews] = useState(false);

  // voor badge-modal
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithEarned | null>(
    null
  );
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);

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
      .select("id,username,full_name,avatar_url,bio,updated_at,level")
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
    setLevel(p?.level ?? "");

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

  const fetchBadges = useCallback(async (accountId: string) => {
    setBadgesLoading(true);

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

    const earnedById = new Map<number, string>();
    for (const row of accountBadges) {
      earnedById.set(row.badge_id, row.earned_at);
    }

    const merged: BadgeWithEarned[] = badgesData.map((b: any) => {
      let resolvedIconUrl: string | null = null;

      if (b.icon_url && typeof b.icon_url === "string") {
        if (b.icon_url.startsWith("http")) {
          resolvedIconUrl = b.icon_url;
        } else {
          const { data: pub } = supabase.storage
            .from("badges")
            .getPublicUrl(b.icon_url);
          resolvedIconUrl = pub.publicUrl;
        }
      } else if (b.code) {
        const fileName = `${b.code}.webp`;
        const { data: pub } = supabase.storage
          .from("badges")
          .getPublicUrl(fileName);
        resolvedIconUrl = pub.publicUrl;
      }

      return {
        id_badge: b.id_badge,
        code: b.code,
        name: b.name,
        description: b.description,
        category: b.category,
        icon_url: resolvedIconUrl,
        earned_at: earnedById.get(b.id_badge) ?? "",
      };
    });

    merged.sort((a, b) => {
      if (!a.earned_at || !b.earned_at) return 0;
      return new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime();
    });

    setBadges(merged);
    setBadgesLoading(false);
  }, []);

  const fetchCompletedBrews = useCallback(async (accountId: string) => {
    setBrewsLoading(true);

    const { data, error } = await supabase.rpc("get_completed_brews", {
      uid_input: accountId,
    });

    if (error || !data) {
      console.error("Error fetching completed brews", error);
      setCompletedBrews([]);
      setBrewsLoading(false);
      return;
    }

    const brews = data as Brew[];

    if (!brews.length) {
      setCompletedBrews([]);
      setBrewsLoading(false);
      return;
    }

    const slugs = brews
      .map((b) => b.recipe_slug)
      .filter((s): s is string => !!s);

    const { data: recipesData, error: recipesError } = await supabase
      .from("recipes")
      .select("recipe_slug, haze_level, srm_target")
      .in("recipe_slug", slugs);

    if (recipesError) {
      console.error("Error fetching recipes for brews", recipesError);
      setCompletedBrews(
        brews.map((b) => ({
          ...b,
          image: getBeerImageSource(null, null),
        }))
      );
      setBrewsLoading(false);
      return;
    }

    const recipeMap = new Map<
      string,
      {
        recipe_slug: string;
        haze_level: number | null;
        srm_target: number | null;
      }
    >();

    (recipesData || []).forEach((r: any) => {
      recipeMap.set(r.recipe_slug, r);
    });

    const enriched: CompletedBrewWithImage[] = brews.map((b) => {
      const recipe = b.recipe_slug ? recipeMap.get(b.recipe_slug) : undefined;
      const haze = recipe?.haze_level ?? null;
      const srm = recipe?.srm_target ?? null;

      return {
        ...b,
        haze_level: haze,
        srm_target: srm,
        image: getBeerImageSource(haze, srm),
      };
    });

    setCompletedBrews(enriched);
    setBrewsLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (userId) {
      fetchBadges(userId);
      fetchCompletedBrews(userId);
    }
  }, [userId, fetchBadges, fetchCompletedBrews]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      if (userId) {
        fetchBadges(userId);
        fetchCompletedBrews(userId);
      }
    }, [userId, fetchProfile, fetchBadges, fetchCompletedBrews])
  );

  const onSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    Alert.alert("Afgemeld");
    router.replace("/Auth");
  }, []);

  const AccountInner = () => {
    const router = useRouter();

    const onEditProfile = useCallback(() => {
      router.push("/AccountEdit");
    }, [router]);

    if (loading) {
      return (
        <SafeAreaView className="flex-1 items-center justify-center"
        style={{
          backgroundColor: BASE_COLORS.LIGHT_BG
        }}
      >
        <ActivityIndicator 
          animating size="large"
          color={BASE_COLORS.ACCENT_PRIMARY}
        />
        <ThemedText type="defaultText" className="mt-3">
          Loading account information...
        </ThemedText>
      </SafeAreaView>
      );
    }

    const badgeCount = badges.length;
    const completedBrewsCount = completedBrews.length;

    const closeBadgeModal = () => {
      setBadgeModalVisible(false);
      setSelectedBadge(null);
    };

    return (
      <View
        className="flex-1"
        style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}
      >
        <ScrollView
          className="flex-1"
          style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Header
            title={username}
            actionTestID="log-out-icon"
            iconName="LogOut"
            onIconPress={onSignOut}
            actionTestIDLeft="settings-icon"
            iconNameLeft="Settings"
            onIconPressLeft={onEditProfile}
          />
            {/*
            <View className="flex-row items-center justify-between">
              <Button
                mode="text"
                onPress={onSignOut}
                labelStyle={{
                  fontSize: Math.min(16 * scale, 24),
                  fontFamily: FontFamilies.BODY,
                  color: BASE_COLORS.TEXT_DARK,
                }}
              >Log Out</Button>
              <Button
                mode="text"
                onPress={onEditProfile}
                labelStyle={{
                  fontSize: Math.min(16 * scale, 24),
                  fontFamily: FontFamilies.BODY,
                  color: BASE_COLORS.TEXT_DARK,
                }}
              >Edit profile</Button>
            </View>
            */}

          <View className="flex-row items-start justify-between mt-2">
            <View>
              {avatarUrl ? (
                <Avatar.Image
                  source={{ uri: avatarUrl || "" }}
                  size={Math.min(90 * scale, 300)}
                  style={{ 
                    backgroundColor: BASE_COLORS.LIGHT_BG, 
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: BASE_COLORS.STONE300 
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
                    fontSize: Math.min(30 * scale, 40) 
                  }}
                />
              )}
              <Text
                style={{
                  fontSize: Math.min(16 * scale, 24),
                  fontFamily: FontFamilies.BODY,
                  color: BASE_COLORS.STONE900,
                  marginBottom: 12,
                }}
              >{fullName || "Name not set"}</Text>
            </View>
            
            <View>
              {/*
              <Text
                style={{
                  fontSize: Math.min(18 * scale, 24),
                  fontFamily: FontFamilies.BODY,
                  color: BASE_COLORS.STONE700,
                  marginBottom: -6,
                }}
              >{fullName || "Name not set"}</Text>
              */}
              {/*
              {!!username && (
                <Text
                  style={{
                    fontSize: Math.min(16 * scale, 20),
                    fontFamily: FontFamilies.BODY_THIN,
                    color: BASE_COLORS.STONE700,
                  }}
                >@{username}</Text>
              )}
              */}
              <View className="grid grid-cols-3 gap-2"
                style={{
                  marginBottom: 24
                }}
              >
                <StatisticsCard
                  title="Badges"
                  value={badgeCount}
                />
                <StatisticsCard
                  title="Brews"
                  value={completedBrewsCount}
                />
                <StatisticsCard
                  title="Level"
                  value={level || 0}
                />
              </View>
            </View>
          </View>
          {!!bio && (
            <ThemedText type="defaultText" style={{color: BASE_COLORS.STONE500}} numberOfLines={4} className="mb-8">{bio}</ThemedText>
          )}

          {/* Statistieken 
          <View className="grid grid-cols-3 gap-2"
            style={{
              marginBottom: 24
            }}
          >
            <StatisticsCard
              title="Badges"
              value={badgeCount}
            />
            <StatisticsCard
              title="Brews"
              value={completedBrewsCount}
            />
            <StatisticsCard
              title="Level"
              value={level || 0}
            />
          </View>
          */}

          {/* Badges-overzicht (enkel foto) */}
          <View className="flex-row justify-between">
            <ThemedText type="title">Earned badges</ThemedText>
            {badges.length > 3 && (
              <Button
                mode="text"
                onPress={() => setShowAllBadges((s) => !s)}
                labelStyle={{
                  fontSize: Math.min(14 * scale, 18),
                  fontFamily: FontFamilies.BODY,
                  color: BASE_COLORS.TEXT_DARK,
                }}
              >{showAllBadges ? "See less" : "See more"}</Button>
            )}
          </View>
          {badgesLoading ? (
             <View className="py-4 items-center">
                <ActivityIndicator animating size="small" color={BASE_COLORS.ACCENT_PRIMARY} />
              </View>
          ) : badges.length === 0 ? (
            <ThemedText type="defaultText" className="mb-8">Brew beers to earn badges.</ThemedText>
          ) : (
            <View className="grid grid-cols-3 gap-2 mb-8">
              {(showAllBadges ? badges : badges.slice(0, 3)).map((badge) => (
                <Badge
                  key={badge.id_badge}
                  id_badge={badge.id_badge}
                  icon_url={badge.icon_url}
                  onPress={() => {
                    setSelectedBadge(badge);
                    setBadgeModalVisible(true);
                  }}
                />
              ))}
            </View>
          )}

          {/* Completed brews */}
          <View className="flex-row justify-between">
            <ThemedText type="title">Completed</ThemedText>
            {completedBrewsCount > 3 && (
              <Button
                mode="text"
                onPress={() => setShowAllBrews((s) => !s)}
                labelStyle={{
                  fontSize: Math.min(14 * scale, 18),
                  fontFamily: FontFamilies.BODY,
                  color: BASE_COLORS.TEXT_DARK,
                }}
              >{showAllBadges ? "See less" : "See more"}</Button>
            )}
          </View>
          <View>
            {brewsLoading ? (
              <View className="py-4 items-center">
                <ActivityIndicator animating size="small" color={BASE_COLORS.ACCENT_PRIMARY} />
              </View>
            ) : completedBrewsCount === 0 ? (
              <ThemedText type="defaultText">You have not completed any brews yet.</ThemedText>
            ) : (
              <View className="grid grid-cols-3 gap-2 mb-8">
                {(showAllBrews ? completedBrews : completedBrews.slice(0, 3)).map((brew) => (
                  <CompletedCard
                    key={brew.id_brew}
                    title={brew.name.trim()}
                    date={brew.start_date ? new Date(brew.start_date).toLocaleDateString() : undefined}
                    image={brew.image}
                    onPress={() => {
                      if (brew.recipe_slug) {
                        router.push({
                          pathname: "/SpecificRecipe",
                          params: { recipe_slug: brew.recipe_slug },
                        });
                      }
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Badge detail modal (react-native-paper) */}
        <Portal>
          <Modal
            visible={badgeModalVisible && !!selectedBadge}
            onDismiss={closeBadgeModal}
            contentContainerStyle={{
              marginInline: 48,
              paddingInline: 20,
              paddingBottom: 24,
              alignSelf: "center",
              borderRadius: 16,
              backgroundColor: BASE_COLORS.WHITE,
            }}
          >
            {selectedBadge?.icon_url && (
              <Image
                source={{ uri: selectedBadge.icon_url }}
                style={{
                  width: 180,
                  height: 180,
                  alignSelf: "center",
                }}
              />
            )}
            {!!selectedBadge?.earned_at && (
              <ThemedText type="subTitle">{new Date(selectedBadge.earned_at).toLocaleDateString()}</ThemedText>
            )}
            {!!selectedBadge?.description && (
              <ThemedText type="defaultText" className="mb-8">{selectedBadge.description}</ThemedText>
            )}
            <View className="flex-row justify-center">
              <Button
                mode="contained"
                onPress={closeBadgeModal}
                labelStyle={{
                  fontSize: Math.min(16 * scale, 24),
                  color: BASE_COLORS.WHITE,
                  fontFamily: FontFamilies.BODY,
                }}
                style={{
                  borderRadius: 30,
                  backgroundColor: BASE_COLORS.TEXT_DARK,
                }}
              >Close</Button>
            </View>
          </Modal>
        </Portal>
      </View>
    );
  };
  return <AccountInner />;
}
