import React, { useState, useEffect } from "react";
import { View, ScrollView, Dimensions, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Searchbar, ActivityIndicator, Chip, Button, Modal, Portal } from "react-native-paper";
import { Search, X, Check} from "lucide-react-native";
import BeerCard from "../../components/ui/RecipeCard";
import { useFavorites } from "@/context/FavoritesContext";
import { BASE_COLORS } from "@/constants/Colors";
import { useRouter } from "expo-router";
import Header from "../../components/header";
import { useFonts } from "@/hooks/use-fonts";
import { ThemedText } from "../../components/themed-text";
import { supabase } from "@/supabase";
import { getBeerImageSource } from "@/hooks/beer-image";
import { FontFamilies } from "@/constants/Fonts";
import TextInput from "@/components/textInput";
import { SafeAreaView } from "react-native-safe-area-context";

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

  {/* Filtering */}
  // UI
  const [openMenu, setOpenMenu] = useState<null | "style" | "abv" | "ibu" | "srm" | "rating" | "difficulty" | "haze">(null);

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
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
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

  useEffect(() => {
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

        // aggregate
        const agg: Record<string, { count: number; avg: number }> = {};
        (reviewsData || []).forEach((r: any) => {
          const slug = r.recipe_slug;
          if (!agg[slug]) agg[slug] = { count: 0, avg: 0 };
          agg[slug].count += 1;
          agg[slug].avg += (r.rating ?? 0);
        });
        Object.keys(agg).forEach((k) => {
          agg[k].avg = agg[k].count ? agg[k].avg / agg[k].count : 0;
        });

        const mapped: Beer[] = (recipesData || []).map((r: any) => {
          const a = agg[r.recipe_slug];
          const avgRating = a ? a.avg : r.rating ?? 0;
          // twee decimalen precisie
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

        const shuffled = [...mapped];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setRecipes(shuffled);
      } catch (e: any) {
        console.error("Error loading recipes", e);
        setError(
          e.message ?? "Unable to load recipes."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  {/* Filter functions */}
  const toggleArrayValue = <T,>(arr: T[], val: T, setFn: (v: T[]) => void) => {
    if (arr.includes(val)) setFn(arr.filter((x) => x !== val));
    else setFn([...arr, val]);
  };

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
  const inRange = (value: number | undefined | null, minStr: string, maxStr: string) => {
    if (typeof value !== "number") return false; // if recipe doesn't contain numeric field, exclude
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
    filteredRecipes = filteredRecipes.filter((b) =>
      typeof b.haze_level === "number" && selectedHazeLevels.includes(b.haze_level)
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

  /* Small inline "menu" components rendered below chips for simplicity */
  const MenuPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <View style={styles.menuPanel}>{children}</View>;
  };

  /* Render the open menu below the chips so it won't be clipped */
  const renderOpenMenu = () => {
    if (!openMenu) return null;

    if (openMenu === "style") {
      return (
        <MenuPanel>
          <Text style={styles.menuTitle}>Select style(s)</Text>
          <ScrollView style={{ maxHeight: 180 }}>
            <View style={styles.optionsRow}>
              {availableStyles.length === 0 ? (
                <Text>No styles available</Text>
              ) : (
                availableStyles.map((s) => {
                  const selected = selectedStyles.includes(s);
                  return (
                    <TouchableOpacity
                      key={s}
                      onPress={() => toggleArrayValue(selectedStyles, s, setSelectedStyles)}
                      style={[styles.optionChip, selected && styles.optionChipSelected]}
                    >
                      <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </ScrollView>
          <View style={styles.menuActions}>
            <Button mode="text" onPress={() => setSelectedStyles([])}>Clear</Button>
            <Button mode="contained" onPress={() => setOpenMenu(null)}>Apply</Button>
          </View>
        </MenuPanel>
      );
    }

    if (openMenu === "abv") {
      return (
        <MenuPanel>
          <Text style={styles.menuTitle}>ABV range (min - max)</Text>
          <View style={styles.rowInputs}>
            <TextInput
              placeholder="min"
              value={abvMin}
              keyboardType="numeric"
              onChangeText={setAbvMin}
              style={styles.numericInput}
            />
            <TextInput
              placeholder="max"
              value={abvMax}
              keyboardType="numeric"
              onChangeText={setAbvMax}
              style={styles.numericInput}
            />
          </View>
          <View style={styles.menuActions}>
            <Button mode="text" onPress={() => { setAbvMin(""); setAbvMax(""); }}>Clear</Button>
            <Button mode="contained" onPress={() => setOpenMenu(null)}>Apply</Button>
          </View>
        </MenuPanel>
      );
    }

    if (openMenu === "ibu") {
      return (
        <MenuPanel>
          <Text style={styles.menuTitle}>IBU range (min - max)</Text>
          <View style={styles.rowInputs}>
            <TextInput
              placeholder="min"
              value={ibuMin}
              keyboardType="numeric"
              onChangeText={setIbuMin}
              style={styles.numericInput}
            />
            <TextInput
              placeholder="max"
              value={ibuMax}
              keyboardType="numeric"
              onChangeText={setIbuMax}
              style={styles.numericInput}
            />
          </View>
          <View style={styles.menuActions}>
            <Button mode="text" onPress={() => { setIbuMin(""); setIbuMax(""); }}>Clear</Button>
            <Button mode="contained" onPress={() => setOpenMenu(null)}>Apply</Button>
          </View>
        </MenuPanel>
      );
    }

    if (openMenu === "srm") {
      return (
        <MenuPanel>
          <Text style={styles.menuTitle}>SRM range (min - max)</Text>
          <View style={styles.rowInputs}>
            <TextInput
              placeholder="min"
              value={srmMin}
              keyboardType="numeric"
              onChangeText={setSrmMin}
              style={styles.numericInput}
            />
            <TextInput
              placeholder="max"
              value={srmMax}
              keyboardType="numeric"
              onChangeText={setSrmMax}
              style={styles.numericInput}
            />
          </View>
          <View style={styles.menuActions}>
            <Button mode="text" onPress={() => { setSrmMin(""); setSrmMax(""); }}>Clear</Button>
            <Button mode="contained" onPress={() => setOpenMenu(null)}>Apply</Button>
          </View>
        </MenuPanel>
      );
    }

    if (openMenu === "rating") {
      return (
        <MenuPanel>
          <Text style={styles.menuTitle}>Rating range (min - max)</Text>
          <View style={styles.rowInputs}>
            <TextInput
              placeholder="min"
              value={ratingMin}
              keyboardType="numeric"
              onChangeText={setRatingMin}
              style={styles.numericInput}
            />
            <TextInput
              placeholder="max"
              value={ratingMax}
              keyboardType="numeric"
              onChangeText={setRatingMax}
              style={styles.numericInput}
            />
          </View>
          <View style={styles.menuActions}>
            <Button mode="text" onPress={() => { setRatingMin(""); setRatingMax(""); }}>Clear</Button>
            <Button mode="contained" onPress={() => setOpenMenu(null)}>Apply</Button>
          </View>
        </MenuPanel>
      );
    }

    if (openMenu === "difficulty") {
      return (
        <MenuPanel>
          <Text style={styles.menuTitle}>Difficulty</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {["beginner", "intermediate", "master"].map((d) => {
              const sel = selectedDifficulties.includes(d);
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => toggleArrayValue(selectedDifficulties, d, setSelectedDifficulties)}
                  style={[styles.optionChip, sel && styles.optionChipSelected]}
                >
                  <Text style={[styles.optionChipText, sel && styles.optionChipTextSelected]}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.menuActions}>
            <Button mode="text" onPress={() => setSelectedDifficulties([])}>Clear</Button>
            <Button mode="contained" onPress={() => setOpenMenu(null)}>Apply</Button>
          </View>
        </MenuPanel>
      );
    }

    if (openMenu === "haze") {
      return (
        <MenuPanel>
          <Text style={styles.menuTitle}>Haze level(s)</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {availableHazeLevels.length === 0 ? (
              <Text>No haze options</Text>
            ) : (
              availableHazeLevels.map((h) => {
                const sel = selectedHazeLevels.includes(h);
                return (
                  <TouchableOpacity
                    key={String(h)}
                    onPress={() => toggleArrayValue(selectedHazeLevels, h, setSelectedHazeLevels)}
                    style={[styles.optionChip, sel && styles.optionChipSelected]}
                  >
                    <Text style={[styles.optionChipText, sel && styles.optionChipTextSelected]}>
                      {String(h)}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
          <View style={styles.menuActions}>
            <Button mode="text" onPress={() => setSelectedHazeLevels([])}>Clear</Button>
            <Button mode="contained" onPress={() => setOpenMenu(null)}>Apply</Button>
          </View>
        </MenuPanel>
      );
    }

    return null;
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{
        backgroundColor: BASE_COLORS.LIGHT_BG,
      }}
    >
      <Header title="Recipes" />

      {/* Horizontal scrollable category chips */}
      <View style={{ paddingVertical: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filterCategories.map((cat) => {
            const isActive =
              (cat.id === "favorites" && showOnlyFavorites) || openMenu === cat.id;
            return (
              <View key={cat.id} style={{ marginRight: 8 }}>
                <Chip
                  mode="flat"
                  selected={isActive}
                  onPress={() => {
                    if (cat.id === "favorites") {
                      setShowOnlyFavorites((prev) => !prev);
                      setOpenMenu(null);
                      return;
                    }
                    setOpenMenu((prev) => (prev === cat.id ? null : (cat.id as any)));
                  }}
                  icon={
                    isActive
                      ? () => (
                          <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Check size={Math.min(14 * scale, 20)} color={BASE_COLORS.WHITE} />
                          </View>
                        )
                      : undefined
                  }
                  textStyle={{
                    color: isActive ? BASE_COLORS.WHITE : BASE_COLORS.STONE500,
                    fontFamily: FontFamilies.BODY,
                    fontSize: Math.min(14 * scale, 16),
                  }}
                  style={{
                    backgroundColor: isActive ? BASE_COLORS.ACCENT_PRIMARY : BASE_COLORS.WHITE,
                    borderColor: isActive ? BASE_COLORS.WHITE : BASE_COLORS.STONE300,
                    borderWidth: 1,
                    height: Math.min(40 * scale, 50),
                    paddingVertical: 0,
                    marginVertical: 5,
                    alignItems: "center",
                  }}
                >{cat.name}</Chip>
              </View>
            );
          })}
        </ScrollView>

        {/* Render whichever menu is open below the chips (so it won't be clipped) */}
        <View style={{ paddingHorizontal: 12, marginTop: 6 }}>
          {renderOpenMenu()}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator 
            animating size="large"
            color={BASE_COLORS.ACCENT_PRIMARY}
          />
          <ThemedText type="defaultText" className="mt-3">
            Loading recipes...
          </ThemedText>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <ThemedText type="title" className="mb-2 text-center">
            Oeps
          </ThemedText>
          <ThemedText type="defaultText" className="text-center">
            {error}
          </ThemedText>
        </View>
      ) : showOnlyFavorites && favoriteSlugs.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <ThemedText type="defaultText" className="text-center">
            You don&apos;t have any favorites at the moment.
          </ThemedText>
        </View>
      ) : (
        <ScrollView>
          {/* Searchbar */}
          <Searchbar
            placeholder="Search"
            value={searchQuery}
            onChangeText={setSearchQuery}
            inputStyle={{ color: BASE_COLORS.STONE700 }}
            icon={() => <Search size={20} color={BASE_COLORS.STONE300} />}
            clearIcon={
              searchQuery
                ? () => <X size={18} color={BASE_COLORS.STONE500} />
                : undefined
            }
            onClearIconPress={() => setSearchQuery("")}
            style={{
              backgroundColor: BASE_COLORS.WHITE,
              borderColor: BASE_COLORS.STONE300,
              borderWidth: 1,
              marginBottom: 15,
            }}
          />
          <View>
            {filteredRecipes.map((beer) => (
              <BeerCard
                key={beer.recipe_slug}
                {...beer}
                isFavorite={favoriteSlugs.includes(beer.recipe_slug)}
                onToggleFavorite={() => toggleFavorite(beer.recipe_slug)}
                onPress={() =>
                  router.push({
                    pathname: "/SpecificRecipe",
                    params: {
                      recipe_slug: beer.recipe_slug,
                      isFavorite: favoriteSlugs.includes(beer.recipe_slug) ? "true" : "false",
                    },
                  })
                }
              />
            ))}
            {showOnlyFavorites && filteredRecipes.length === 0 && favoriteSlugs.length > 0 && (
              <View className="items-center mt-6 px-6">
                <ThemedText type="defaultText" className="text-center">
                  No favorites match your search.
                </ThemedText>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  menuPanel: {
    marginTop: 8,
    marginBottom: 6,
    marginRight: 8,
    padding: 10,
    width: 300,
    backgroundColor: "white",
    borderRadius: 8,
    borderColor: "#e6e6e6",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  menuTitle: {
    fontSize: 14,
    marginBottom: 8,
    color: "#333",
    fontWeight: "600",
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  optionChip: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "white",
  },
  optionChipSelected: {
    backgroundColor: BASE_COLORS.ACCENT_PRIMARY,
    borderColor: BASE_COLORS.ACCENT_PRIMARY,
  },
  optionChipText: {
    fontSize: 13,
    color: "#333",
  },
  optionChipTextSelected: {
    color: "white",
    fontWeight: "600",
  },
  menuActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  rowInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  numericInput: {
    flex: 1,
    marginRight: 8,
  },
});
