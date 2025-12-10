import React, { useState, useEffect } from "react";
import { View, ScrollView, Dimensions, StyleSheet, Text, FlatList } from "react-native";
import { Searchbar, ActivityIndicator, Chip, Button, Modal, Portal } from "react-native-paper";
import { Search, X, Check } from "lucide-react-native";
import BeerCard from "../../components/ui/RecipeCard";
import { useFavorites } from "@/context/FavoritesContext";
import { BASE_COLORS } from "@/constants/Colors";
import { useRouter } from "expo-router";
import Header from "../../components/header";
import { useFonts } from "@/hooks/use-fonts";
import { ThemedText } from "../../components/themed-text";
import { supabase } from "@/supabase";
import { useAppRefresh } from "@/context/AppRefreshContext";
import { getBeerImageSource } from "@/hooks/beer-image";
import { FontFamilies } from "@/constants/Fonts";
import TextInput from "@/components/textInput";
import { SafeAreaView } from "react-native-safe-area-context";
import Spinner from "@/components/spinner";
import SelectionChip from "@/components/selectionChip";
import { useFocusEffect } from "@react-navigation/native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BASE_SCREEN_WIDTH = 375;
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

interface Beer {
  recipe_slug: string;
  name: string;
  rating: number;
  reviews: number;
  image: any;
  description: string | null;
  style: string | null;
  batch_size_l?: number | null;
  abv_target?: number | null;
  ibu_target?: number | null;
  srm_target?: number | null;
  difficulty?: number | null;
  haze_level?: number | null;
}

export default function Recipes() {
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  useFonts();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [recipes, setRecipes] = useState<Beer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recommended
  const [recommendedSlugs, setRecommendedSlugs] = useState<string[]>([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);

  {
    /* Filtering */
  }
  // UI
  const [openMenu, setOpenMenu] = useState<
    null | "style" | "abv" | "ibu" | "srm" | "rating" | "difficulty" | "haze"
  >(null);

  // Filter state
  const { favoriteSlugs, toggleFavorite } = useFavorites();
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [abvMin, setAbvMin] = useState<string>("");
  const [abvMax, setAbvMax] = useState<string>("");
  const [ibuMin, setIbuMin] = useState<string>("");
  const [ibuMax, setIbuMax] = useState<string>("");
  const [srmMin, setSrmMin] = useState<string>("");
  const [srmMax, setSrmMax] = useState<string>("");
  const [ratingMin, setRatingMin] = useState<string>("");
  const [ratingMax, setRatingMax] = useState<string>("");
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(
    []
  );
  const [selectedHazeLevels, setSelectedHazeLevels] = useState<number[]>([]);

  // Options from data
  const [availableStyles, setAvailableStyles] = useState<string[]>([]);
  const [availableHazeLevels, setAvailableHazeLevels] = useState<number[]>([]);

  // helper to check whether an item matches the query
  const filterMatches = (item: Beer, q: string) => {
    if (!q) return true;
    const lower = q.toLowerCase();
    return item.name.toLowerCase().includes(lower);
  };

  const { refreshKey } = useAppRefresh();

  useFocusEffect(
    React.useCallback(() => {
      const fetchAll = async () => {
        try {
          setLoading(true);
          setError(null);

          const { data: recipesData, error: recipesError } = await supabase
          .from("recipes")
          .select(
            "recipe_slug, name, description, rating, style, abv_target, ibu_target, srm_target, haze_level, difficulty"
          );
        if (recipesError) throw recipesError;

        const slugs = (recipesData || []).map((r: any) => r.recipe_slug);

        const { data: reviewsData, error: reviewsError } = await supabase
          .from("recipe_reviews")
          .select("recipe_slug, rating")
          .in("recipe_slug", slugs.length ? slugs : [""]);
        if (reviewsError) throw reviewsError;

        const agg: Record<string, { count: number; avg: number }> = {};
        (reviewsData || []).forEach((r: any) => {
          const slug = r.recipe_slug;
          if (!agg[slug]) agg[slug] = { count: 0, avg: 0 };
          agg[slug].count += 1;
          agg[slug].avg += r.rating ?? 0;
        });
        Object.keys(agg).forEach((k) => {
          agg[k].avg = agg[k].count ? agg[k].avg / agg[k].count : 0;
        });

        const mapped: Beer[] = (recipesData || []).map((r: any) => {
          const a = agg[r.recipe_slug];
          const avgRating = a ? a.avg : (r.rating ?? 0);
          const rating = parseFloat(avgRating.toFixed(2));
          return {
            recipe_slug: r.recipe_slug,
            name: r.name,
            rating,
            reviews: a ? a.count : 0,
            image: getBeerImageSource(r.haze_level, r.srm_target),
            description: r.description ?? null,
            style: r.style ?? null,
            abv_target: r.abv_target ?? null,
            ibu_target: r.ibu_target ?? null,
            srm_target: r.srm_target ?? null,
            difficulty: r.difficulty ?? null,
            haze_level: r.haze_level ?? null,
          };
        });

        // Set available options
        const stylesSet = new Set<string>();
        const hazeSet = new Set<number>();
        mapped.forEach((m) => {
          if (m.style) stylesSet.add(m.style);
          if (typeof m.haze_level === "number") hazeSet.add(m.haze_level);
        });

        setAvailableStyles(Array.from(stylesSet).sort());
        setAvailableHazeLevels(Array.from(hazeSet).sort((a, b) => a - b));

        // Shuffle for baseline “Other recipes”
        const shuffled = [...mapped];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setRecipes(shuffled);

        // 2. Recommended slugs via RPC (als user ingelogd is)
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!userError && user) {
          setRecommendedLoading(true);
          const { data: recData, error: recError } = await supabase.rpc(
            "recommend_recipes",
            {
              p_account_id: user.id,
              p_limit: 10,
            }
          );

          if (!recError && Array.isArray(recData)) {
            const recSlugs = recData
              .map((r: any) => r.recipe_slug)
              .filter((s: any): s is string => typeof s === "string");
            setRecommendedSlugs(recSlugs);
          } else {
            console.warn("recommend_recipes RPC error", recError);
          }
          setRecommendedLoading(false);
        } else {
          // geen user → geen personal recommendations
          setRecommendedSlugs([]);
        }
      } catch (e: any) {
        console.error("Error loading recipes", e);
        setError(e.message ?? "Unable to load recipes.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
    }, [])
  );

  {
    /* Filter functions */
  }
  const toggleArrayValue = <T,>(arr: T[], val: T, setFn: (v: T[]) => void) => {
    if (arr.includes(val)) setFn(arr.filter((x) => x !== val));
    else setFn([...arr, val]);
  };

  // Basisfilter op alle recipes
  let filteredRecipes = recipes.filter((b) => filterMatches(b, searchQuery));

  // Favorites
  if (showOnlyFavorites) {
    filteredRecipes = filteredRecipes.filter((b) =>
      favoriteSlugs.includes(b.recipe_slug)
    );
  }

  // Style
  if (selectedStyles.length > 0) {
    filteredRecipes = filteredRecipes.filter(
      (b) => b.style && selectedStyles.includes(b.style)
    );
  }

  // numeric ranges helper
  const inRange = (
    value: number | undefined | null,
    minStr: string,
    maxStr: string
  ) => {
    if (typeof value !== "number") return false;
    const min = minStr === "" ? Number.NEGATIVE_INFINITY : Number(minStr);
    const max = maxStr === "" ? Number.POSITIVE_INFINITY : Number(maxStr);
    if (Number.isNaN(min) || Number.isNaN(max)) return false;
    return value >= min && value <= max;
  };

  // ABV
  if (abvMin !== "" || abvMax !== "") {
    filteredRecipes = filteredRecipes.filter((b) =>
      inRange(b.abv_target ?? undefined, abvMin, abvMax)
    );
  }

  // IBU
  if (ibuMin !== "" || ibuMax !== "") {
    filteredRecipes = filteredRecipes.filter((b) =>
      inRange(b.ibu_target ?? undefined, ibuMin, ibuMax)
    );
  }

  // SRM
  if (srmMin !== "" || srmMax !== "") {
    filteredRecipes = filteredRecipes.filter((b) =>
      inRange(b.srm_target ?? undefined, srmMin, srmMax)
    );
  }

  // Rating
  if (ratingMin !== "" || ratingMax !== "") {
    filteredRecipes = filteredRecipes.filter((b) =>
      inRange(b.rating ?? undefined, ratingMin, ratingMax)
    );
  }

  // Difficulty (multi-select)
  const difficultyMap: Record<number, string> = {
    1: "beginner",
    2: "intermediate",
    3: "master",
  };

  if (selectedDifficulties.length > 0) {
    filteredRecipes = filteredRecipes.filter((b) => {
      if (typeof b.difficulty !== "number") return false;
      const mapped = difficultyMap[b.difficulty];
      return selectedDifficulties.includes(mapped);
    });
  }

  // Haze (multi-select)
  if (selectedHazeLevels.length > 0) {
    filteredRecipes = filteredRecipes.filter(
      (b) =>
        typeof b.haze_level === "number" &&
        selectedHazeLevels.includes(b.haze_level)
    );
  }

  // Splitsen: when any filter is active we want recommended recipes
  // to be shown together with the rest. When no filters are active,
  // keep the "Recommended for you" section separate.
  const filtersActive = Boolean(
    searchQuery !== "" ||
      showOnlyFavorites ||
      selectedStyles.length > 0 ||
      abvMin !== "" ||
      abvMax !== "" ||
      ibuMin !== "" ||
      ibuMax !== "" ||
      srmMin !== "" ||
      srmMax !== "" ||
      ratingMin !== "" ||
      ratingMax !== "" ||
      selectedDifficulties.length > 0 ||
      selectedHazeLevels.length > 0
  );

  let recommendedRecipes: Beer[] = [];
  let otherRecipes: Beer[] = [];

  if (filtersActive) {
    // If any filter is active, put all filtered results into the main list
    // and hide the recommended section so users see a single combined list.
    recommendedRecipes = [];
    otherRecipes = filteredRecipes;
  } else {
    // Default behaviour: show recommended separately and the rest under "All recipes"
    recommendedRecipes = filteredRecipes
      .filter((b) => recommendedSlugs.includes(b.recipe_slug))
      .sort(
        (a, b) =>
          recommendedSlugs.indexOf(a.recipe_slug) -
          recommendedSlugs.indexOf(b.recipe_slug)
      );

    otherRecipes = filteredRecipes.filter(
      (b) => !recommendedSlugs.includes(b.recipe_slug)
    );
  }

  /* chips config */
  const filterCategories = [
    { id: "favorites", name: "Favorites" },
    { id: "style", name: "Style" },
    { id: "abv", name: "ABV" },
    { id: "ibu", name: "IBU" },
    { id: "srm", name: "SRM" },
    { id: "difficulty", name: "Difficulty" },
    { id: "haze", name: "Haze" },
    { id: "rating", name: "Rating" },
  ];

  const handleApply = () => setOpenMenu(null);

  const handleClear = () => {
    switch (openMenu) {
      case "style":
        setSelectedStyles([]);
        setOpenMenu(null);
        break;
      case "abv":
        setAbvMin("");
        setAbvMax("");
        setOpenMenu(null);
        break;
      case "ibu":
        setIbuMin("");
        setIbuMax("");
        setOpenMenu(null);
        break;
      case "srm":
        setSrmMin("");
        setSrmMax("");
        setOpenMenu(null);
        break;
      case "rating":
        setRatingMin("");
        setRatingMax("");
        setOpenMenu(null);
        break;
      case "difficulty":
        setSelectedDifficulties([]);
        setOpenMenu(null);
        break;
      case "haze":
        setSelectedHazeLevels([]);
        setOpenMenu(null);
        break;
    }
  };

  const getFilterTitle = () => {
    switch (openMenu) {
      case "style":
        return "Select style(s)";
      case "abv":
        return "ABV range";
      case "ibu":
        return "IBU range";
      case "srm":
        return "SRM range";
      case "rating":
        return "Rating range";
      case "difficulty":
        return "Select difficulty";
      case "haze":
        return "Select haze(s)";
      default:
        return "";
    }
  };

  const renderMenuContent = () => {
    switch (openMenu) {
      case "style":
        return (
          <View className="flex-row flex-wrap gap-x-2 gap-y-2 mb-4">
            {availableStyles.map((s) => (
              <Button
                key={s}
                onPress={() =>
                  toggleArrayValue(selectedStyles, s, setSelectedStyles)
                }
                style={[
                  styles.optionButton,
                  selectedStyles.includes(s) && styles.optionButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    selectedStyles.includes(s) &&
                      styles.optionButtonTextSelected,
                  ]}
                >
                  {s}
                </Text>
              </Button>
            ))}
          </View>
        );

      case "abv":
      case "ibu":
      case "srm":
      case "rating": {
        const values = recipes
          .map((r) => {
            switch (openMenu) {
              case "abv":
                return r.abv_target;
              case "ibu":
                return r.ibu_target;
              case "srm":
                return r.srm_target;
              case "rating":
                return r.rating;
            }
          })
          .filter((v): v is number => typeof v === "number");

        const dbMin = values.length ? Math.min(...values) : 0;
        const dbMax = values.length ? Math.max(...values) : 0;

        const [min, setMin] = (() => {
          switch (openMenu) {
            case "abv":
              return [abvMin, setAbvMin];
            case "ibu":
              return [ibuMin, setIbuMin];
            case "srm":
              return [srmMin, setSrmMin];
            case "rating":
              return [ratingMin, setRatingMin];
          }
        })();

        const [max, setMax] = (() => {
          switch (openMenu) {
            case "abv":
              return [abvMax, setAbvMax];
            case "ibu":
              return [ibuMax, setIbuMax];
            case "srm":
              return [srmMax, setSrmMax];
            case "rating":
              return [ratingMax, setRatingMax];
          }
        })();

        const unit = openMenu === "abv" ? "%" : "";

        return (
          <View>
            <View className="flex-row items-center gap-2">
              <ThemedText type="inputSug" className="mb-3">
                min
              </ThemedText>
              <View style={{ width: "20%" }}>
                <TextInput
                  placeholder={dbMin.toString()}
                  value={min}
                  keyboardType="numeric"
                  onChangeText={setMin}
                />
              </View>
              <ThemedText type="inputSug" className="mb-1">
                {unit}
              </ThemedText>
            </View>
            <View className="flex-row items-center gap-2">
              <ThemedText type="inputSug" className="mb-3">
                max
              </ThemedText>
              <View style={{ width: "20%" }}>
                <TextInput
                  placeholder={dbMax.toString()}
                  value={max}
                  keyboardType="numeric"
                  onChangeText={setMax}
                />
              </View>
              <ThemedText type="inputSug" className="mb-1">
                {unit}
              </ThemedText>
            </View>
          </View>
        );
      }

      case "difficulty": {
        const difficultyMap: Record<number, string> = {
          1: "beginner",
          2: "intermediate",
          3: "master",
        };
        return (
          <View className="flex-row flex-wrap gap-x-2 gap-y-2 mb-4">
            {Object.values(difficultyMap).map((level) => (
              <Button
                key={level}
                onPress={() =>
                  toggleArrayValue(
                    selectedDifficulties,
                    level,
                    setSelectedDifficulties
                  )
                }
                style={[
                  styles.optionButton,
                  selectedDifficulties.includes(level) &&
                    styles.optionButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    selectedDifficulties.includes(level) &&
                      styles.optionButtonTextSelected,
                  ]}
                >
                  {level}
                </Text>
              </Button>
            ))}
          </View>
        );
      }

      case "haze": {
        const hazeMap: Record<number, string> = {
          1: "clear",
          2: "light haze",
          3: "hazy",
        };
        return (
          <View className="flex-row flex-wrap gap-x-2 gap-y-2 mb-4">
            {availableHazeLevels.map((level) => (
              <Button
                key={level}
                onPress={() =>
                  toggleArrayValue(
                    selectedHazeLevels,
                    level,
                    setSelectedHazeLevels
                  )
                }
                style={[
                  styles.optionButton,
                  selectedHazeLevels.includes(level) &&
                    styles.optionButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    selectedHazeLevels.includes(level) &&
                      styles.optionButtonTextSelected,
                  ]}
                >
                  {hazeMap[level] ?? level}
                </Text>
              </Button>
            ))}
          </View>
        );
      }

      default:
        return null;
    }
  };

  const renderListHeader = () => (
    <View>
      {recommendedLoading && (
        <Spinner 
          title="Loading recipes..."
        />
      )}

      {recommendedRecipes.length > 0 && (
        <View className="mb-2">
          <ThemedText type="title">Recommended for you</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recommendedRecipes.map((item) => (
              <View key={item.recipe_slug} className="mr-2">
                <BeerCard
                  {...item}
                  isFavorite={favoriteSlugs.includes(item.recipe_slug)}
                  onToggleFavorite={() => toggleFavorite(item.recipe_slug)}
                  onPress={() =>
                    router.push({
                      pathname: "/SpecificRecipe",
                      params: {
                        recipe_slug: item.recipe_slug,
                        isFavorite: favoriteSlugs.includes(item.recipe_slug)
                          ? "true"
                          : "false",
                      },
                    })
                  }
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {otherRecipes.length > 0 && (
        <ThemedText type="title" className="mb-1">All recipes</ThemedText>
      )}
    </View>
  );

  return (
    <SafeAreaView
      className="flex-1"
      style={{
        backgroundColor: BASE_COLORS.LIGHT_BG,
      }}
    >
      <Header title="Recipes" />

      {/* Horizontal scrollable category chips */}
      <View className="mx-3 pb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[...filterCategories]
            .sort((a, b) => {
              const isSelected = (cat: (typeof filterCategories)[0]) => {
                switch (cat.id) {
                  case "favorites":
                    return showOnlyFavorites;
                  case "style":
                    return selectedStyles.length > 0;
                  case "abv":
                    return abvMin !== "" || abvMax !== "";
                  case "ibu":
                    return ibuMin !== "" || ibuMax !== "";
                  case "srm":
                    return srmMin !== "" || srmMax !== "";
                  case "rating":
                    return ratingMin !== "" || ratingMax !== "";
                  case "difficulty":
                    return selectedDifficulties.length > 0;
                  case "haze":
                    return selectedHazeLevels.length > 0;
                  default:
                    return false;
                }
              };

              return isSelected(b) && !isSelected(a)
                ? 1
                : isSelected(a) && !isSelected(b)
                  ? -1
                  : 0;
            })
            .map((cat) => {
              const isActive = (() => {
                switch (cat.id) {
                  case "favorites":
                    return showOnlyFavorites;
                  case "style":
                    return openMenu === "style" || selectedStyles.length > 0;
                  case "abv":
                    return openMenu === "abv" || abvMin !== "" || abvMax !== "";
                  case "ibu":
                    return openMenu === "ibu" || ibuMin !== "" || ibuMax !== "";
                  case "srm":
                    return openMenu === "srm" || srmMin !== "" || srmMax !== "";
                  case "rating":
                    return (
                      openMenu === "rating" ||
                      ratingMin !== "" ||
                      ratingMax !== ""
                    );
                  case "difficulty":
                    return (
                      openMenu === "difficulty" ||
                      selectedDifficulties.length > 0
                    );
                  case "haze":
                    return openMenu === "haze" || selectedHazeLevels.length > 0;
                  default:
                    return false;
                }
              })();

              return (
                <View key={cat.id} style={{ marginRight: 8 }}>
                  <SelectionChip
                    testID="filter-chip"
                    text={cat.name}
                    isActive={isActive}
                    onPress={() => {
                      if (cat.id === "favorites") {
                        setShowOnlyFavorites((prev) => !prev);
                        setOpenMenu(null);
                        return;
                      }
                      setOpenMenu((prev) =>
                        prev === cat.id ? null : (cat.id as any)
                      );
                    }}
                  />
                </View>
              );
            })}
        </ScrollView>
      </View>

      <Portal>
        <Modal
          dismissable={false}
          visible={!!openMenu}
          onDismiss={() => setOpenMenu(null)}
          contentContainerStyle={{
            backgroundColor: BASE_COLORS.LIGHT_BG,
            position: "absolute",
            top: 125,
            left: 20,
            right: 20,
            padding: 16,
            borderRadius: 12,
            maxHeight: 400,
          }}
        >
          <ThemedText type="subTitle" className="mb-2">
            {getFilterTitle()}
          </ThemedText>
          {renderMenuContent()}
          <View className="flex-row justify-between">
            <Button
              mode="text"
              onPress={handleClear}
              labelStyle={{
                fontSize: Math.min(14 * scale, 20),
                fontFamily: FontFamilies.BODY_LIGHT,
                color: BASE_COLORS.TEXT_DARK,
              }}
            >
              Clear
            </Button>
            <Button
              mode="contained"
              onPress={handleApply}
              labelStyle={{
                fontSize: Math.min(14 * scale, 24),
                color: BASE_COLORS.WHITE,
                fontFamily: FontFamilies.BODY,
              }}
              style={{
                borderRadius: 20,
                backgroundColor: BASE_COLORS.TEXT_DARK,
              }}
            >
              Apply
            </Button>
          </View>
        </Modal>
      </Portal>

      {loading ? (
        <Spinner 
          title="Loading recipes..."
        />
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <ThemedText type="title" className="mb-2 text-center">
            Oeps
          </ThemedText>
          <ThemedText type="defaultText" className="text-center">
            {error}
          </ThemedText>
        </View>
      ) : (
        <View className="flex-1">
          <View className="mx-3">
            <Searchbar
              placeholder="Search"
              value={searchQuery}
              onChangeText={setSearchQuery}
              inputStyle={{
                color: BASE_COLORS.STONE700,
                fontFamily: FontFamilies.BODY,
              }}
              icon={() => <Search size={20} color={BASE_COLORS.STONE300} />}
              clearIcon={
                searchQuery ? () => <X size={18} color={BASE_COLORS.STONE500} /> : undefined
              }
              onClearIconPress={() => setSearchQuery("")}
              style={{
                backgroundColor: BASE_COLORS.WHITE,
                borderColor: BASE_COLORS.STONE300,
                borderWidth: 1,
                marginBottom: 15,
              }}
            />
          </View>
          <FlatList
            showsVerticalScrollIndicator={false}
            contentContainerClassName="mx-3"
            data={otherRecipes}
            keyExtractor={(item) => item.recipe_slug}
            renderItem={({ item }) => (
              <BeerCard
                {...item}
                isFavorite={favoriteSlugs.includes(item.recipe_slug)}
                onToggleFavorite={() => toggleFavorite(item.recipe_slug)}
                onPress={() =>
                  router.push({
                    pathname: "/SpecificRecipe",
                    params: {
                      recipe_slug: item.recipe_slug,
                      isFavorite: favoriteSlugs.includes(item.recipe_slug)
                        ? "true"
                        : "false"
                    },
                  })
                }
              />
            )}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={
              <View className="items-center mt-6 px-6">
                <ThemedText type="defaultText" className="text-center mb-2">
                  No recipes match this filter.
                </ThemedText>
                <Button
                  mode="contained"
                  onPress={() => {
                    // Clear all filters
                    setSelectedStyles([]);
                    setAbvMin("");
                    setAbvMax("");
                    setIbuMin("");
                    setIbuMax("");
                    setSrmMin("");
                    setSrmMax("");
                    setRatingMin("");
                    setRatingMax("");
                    setSelectedDifficulties([]);
                    setSelectedHazeLevels([]);
                    setShowOnlyFavorites(false);
                    setSearchQuery("");
                  }}
                  labelStyle={{
                    fontSize: Math.min(14 * scale, 24),
                    color: BASE_COLORS.WHITE,
                    fontFamily: FontFamilies.BODY,
                  }}
                  style={{
                    borderRadius: 20,
                    backgroundColor: BASE_COLORS.TEXT_DARK,
                  }}
                >
                  Clear Filters
                </Button>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  optionButton: {
    borderWidth: 1,
    borderColor: BASE_COLORS.STONE200,
    borderRadius: 30,
    backgroundColor: BASE_COLORS.WHITE,
  },
  optionButtonSelected: {
    backgroundColor: BASE_COLORS.ACCENT_PRIMARY,
    borderColor: BASE_COLORS.ACCENT_PRIMARY,
  },
  optionButtonText: {
    color: BASE_COLORS.STONE600,
    fontSize: Math.min(12 * scale, 18),
    fontFamily: FontFamilies.BODY,
  },
  optionButtonTextSelected: {
    color: BASE_COLORS.WHITE,
    fontSize: Math.min(12 * scale, 18),
    fontFamily: FontFamilies.BODY,
  },
});
