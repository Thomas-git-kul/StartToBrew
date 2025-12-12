import { useEffect, useMemo, useState, useCallback } from "react";
import { View, Dimensions, Text, Alert, ScrollView } from "react-native";
import { Avatar, Button, Modal, Portal } from "react-native-paper";
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
import StatisticsCard from "@/components/ui/StatisticsCard";
import Badge from "@/components/ui/Badge";
import CompletedCard from "@/components/ui/CompletedCard";
import Dialog from "@/components/dialog";
import Spinner from "@/components/spinner";
import PrimaryButton from "@/components/primaryButton";
import SecondaryButton from "@/components/secondaryButton";

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
  const fontsLoaded = useFonts();

  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [level, setLevel] = useState("");
  const [bio, setBio] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isDialogVisible, setDialogVisible] = useState(false);

  const [badges, setBadges] = useState<BadgeWithEarned[]>([]); // earned badges
  const [allBadges, setAllBadges] = useState<BadgeWithEarned[]>([]); // alle mogelijke badges
  const [badgesLoading, setBadgesLoading] = useState(false);
  const [showAllBadges, setShowAllBadges] = useState(false);

  const [completedBrews, setCompletedBrews] = useState<
    CompletedBrewWithImage[]
  >([]);
  const [brewsLoading, setBrewsLoading] = useState(false);
  const [showAllBrews, setShowAllBrews] = useState(false);

  // badge-modal
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

    const authRes: any = await supabase.auth.getUser();
    const user = authRes?.data?.user;
    const uErr = authRes?.error ?? null;

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

    // 1) welke badges zijn earned voor deze user?
    const { data: accountBadges, error: abErr } = await supabase
      .from("account_badges")
      .select("badge_id, earned_at")
      .eq("account_id", accountId)
      .order("earned_at", { ascending: false });

    if (abErr) {
      console.error("Error fetching account_badges", abErr);
      setBadges([]);
      setAllBadges([]);
      setBadgesLoading(false);
      return;
    }

    const earnedById = new Map<number, string>();
    (accountBadges || []).forEach(
      (row: { badge_id: number; earned_at: string }) => {
        earnedById.set(row.badge_id, row.earned_at);
      }
    );

    // 2) alle badges ophalen
    const { data: badgesData, error: bErr } = await supabase
      .from("badges")
      .select("id_badge, code, name, description, icon_url, category");

    if (bErr || !badgesData) {
      console.error("Error fetching badges", bErr);
      setBadges([]);
      setAllBadges([]);
      setBadgesLoading(false);
      return;
    }

    const mergedAll: BadgeWithEarned[] = badgesData.map((b: any) => {
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

    const earnedBadges = mergedAll
      .filter((b) => !!b.earned_at)
      .sort((a, b) => {
        if (!a.earned_at || !b.earned_at) return 0;
        return (
          new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime()
        );
      });

    setBadges(earnedBadges);
    setAllBadges(mergedAll);
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
      return <Spinner title="Loading account information..." />;
    }

    const badgeCount = badges.length;
    const completedBrewsCount = completedBrews.length;

    const closeBadgeModal = () => {
      setBadgeModalVisible(false);
      setSelectedBadge(null);
    };

    const lockedBadges = allBadges.filter((b) => !b.earned_at);
    const hasMoreBadges = allBadges.length > badges.length;

    const badgesToDisplay = showAllBadges
      ? [...badges, ...lockedBadges]
      : badges.slice(0, 3);

    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}
      >
        <Header
          title={username}
          actionTestID="log-out-icon"
          iconName="LogOut"
          onIconPress={() => setDialogVisible(true)}
          actionTestIDLeft="settings-icon"
          iconNameLeft="Settings"
          onIconPressLeft={onEditProfile}
        />
        <ScrollView
          contentContainerClassName="mx-3"
          style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-start justify-between mt-2">
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
            <View className="grid grid-cols-3 gap-2">
              <StatisticsCard title="Badges" value={badgeCount} />
              <StatisticsCard title="Brews" value={completedBrewsCount} />
              <StatisticsCard title="Level" value={level || 0} />
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <Text
              style={{
                fontSize: Math.min(16 * scale, 24),
                fontFamily: FontFamilies.BODY,
                color: BASE_COLORS.STONE900,
                marginBottom: 4,
              }}
            >{fullName || "Name not set"}</Text>
            {(!avatarUrl || !bio) && (
              <PrimaryButton
                title="Complete account"
                testID="complete-button"
                onPress={() => {
                  router.push({
                    pathname: "/AccountEdit",
                    params: {
                      fromComplete: true,
                    },
                  } as any);
                }}
                size={10}
                height={28}
              />
            )}
          </View>

          {!!bio && (
            <ThemedText
              type="defaultText"
              style={{ color: BASE_COLORS.STONE500 }}
              className="mb-6"
            >
              {bio}
            </ThemedText>
          )}

          {/* Completed brews eerst */}
          <View className="flex-row items-center justify-between mt-6">
            <ThemedText type="title">Completed</ThemedText>
            {completedBrewsCount > 3 && (
              <SecondaryButton
                title={showAllBrews ? "See less" : "See more"}
                onPress={() => setShowAllBrews((s) => !s)}
                testID="seemore-brews"
                size={14}
              />
            )}
          </View>
          <View>
            {brewsLoading ? (
              <Spinner title="Loading brews..." size="small" />
            ) : completedBrewsCount === 0 ? (
              <ThemedText type="defaultText" className="mt-1">
                You have not completed any brews yet.
              </ThemedText>
            ) : (
              <View className="grid grid-cols-3 gap-2 mb-8">
                {(showAllBrews
                  ? completedBrews
                  : completedBrews.slice(0, 3)
                ).map((brew) => (
                  <CompletedCard
                    key={brew.id_brew}
                    title={brew.name.trim()}
                    date={
                      brew.start_date
                        ? new Date(brew.start_date).toLocaleDateString()
                        : undefined
                    }
                    image={brew.image}
                    onPress={() => {
                      if (brew.recipe_slug) {
                        router.push({
                          pathname: "/SpecificRecipe",
                          params: {
                            recipe_slug: brew.recipe_slug,
                            from: "account",
                          },
                        });
                      }
                    }}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Badges onder completed */}
          <View className="flex-row justify-between items-center mt-6">
            <ThemedText type="title">Earned badges</ThemedText>
            {hasMoreBadges && (
              <SecondaryButton
                title={showAllBadges ? "See less" : "See more"}
                onPress={() => setShowAllBadges((s) => !s)}
                testID="seemore-badges"
                size={14}
              />
            )}
          </View>
          {badgesLoading ? (
            <Spinner title="Loading badges..." size="small" />
          ) : badgesToDisplay.length === 0 ? (
            <ThemedText type="defaultText">
              Brew beers to earn badges.
            </ThemedText>
          ) : (
            <View className="grid grid-cols-3 gap-2 mb-8">
              {badgesToDisplay.map((badge) => {
                const isEarned = !!badge.earned_at;
                return (
                  <View
                    key={badge.id_badge}
                    style={{
                      alignItems: "center",
                      opacity: isEarned ? 1 : 0.35, // greyed out voor locked badges
                    }}
                  >
                    <Badge
                      id_badge={badge.id_badge}
                      icon_url={badge.icon_url}
                      code={badge.code}
                      onPress={() => {
                        setSelectedBadge(badge);
                        setBadgeModalVisible(true);
                      }}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Badge detail modal */}
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
                  opacity: selectedBadge?.earned_at ? 1 : 0.35, // ook in modal gedesatureerd
                }}
              />
            )}
            {!!selectedBadge?.earned_at && (
              <ThemedText type="subTitle">
                {new Date(selectedBadge.earned_at).toLocaleDateString()}
              </ThemedText>
            )}
            {!!selectedBadge?.description && (
              <ThemedText type="defaultText" className="mb-8">
                {selectedBadge.description}
              </ThemedText>
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
              >
                Close
              </Button>
            </View>
          </Modal>
        </Portal>

        <Dialog
          title="Sign Out"
          text="Are you sure you want to sign out?"
          cancelBtn="Sign Out"
          yesBtn="No, I want to stay"
          visible={isDialogVisible}
          onDismiss={() => setDialogVisible(false)}
          onPressCancel={onSignOut}
          onPressYes={() => setDialogVisible(false)}
        />
      </SafeAreaView>
    );
  };

  if (fontsLoaded === false) {
    return null;
  }

  return <AccountInner />;
}
