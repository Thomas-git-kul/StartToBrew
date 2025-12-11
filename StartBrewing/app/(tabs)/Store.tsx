import Header from "@/components/header";
import StoreCard from "@/components/ui/StoreCard";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useFonts } from "@/hooks/use-fonts";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Check, Search, X } from "lucide-react-native";
import React, { useState } from "react";
import { Dimensions, FlatList, ScrollView, View } from "react-native";
import { Button, Chip, Searchbar } from "react-native-paper";
import Spinner from "../../components/spinner";
import { ThemedText } from "../../components/themed-text";
import { supabase } from "../../supabase";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BASE_SCREEN_WIDTH = 375;
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

interface Category {
  id: number;
  name: string;
}

interface Item {
  id: number;
  title: string;
  price: string;
  image: any;
  categoryId: number;
  imageUrl?: string;
}


export default function StorePage() {
  useFonts();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);

  const exampleImages: Record<number, any> = {
    1: require("@/assets/images/malt.png"),
    2: require("@/assets/images/hop.png"),
    3: require("@/assets/images/yeast.png"),
    4: require("@/assets/images/starterkit2.png"),
    5: require("@/assets/images/equipment.png"),
    6: require("@/assets/images/measurement.png"),
  }

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const filterMatches = (item: Item) => {
    const q = searchQuery.toLowerCase();

    const matchSearch =
      item.title.toLowerCase().includes(q) ||
      (typeof item.price === "string" && item.price.toLowerCase().includes(q));

    const matchCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(item.categoryId);

    return matchSearch && matchCategory;
  };

  const orderedCategories = [
    ...categories.filter((c) => selectedCategories.includes(c.id)),
    ...categories.filter((c) => !selectedCategories.includes(c.id)),
  ]
    // Bouw een public URL op basis van het pad in image_url
  const buildPublicImageUrl = (imageUrl?: string | null) => {
    const raw = imageUrl?.trim();
    const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

    if (!raw || !baseUrl) return null;

    // Als er al "tools/" in zit, gebruik dat pad, anders prefixen
    const path = raw.startsWith("tools/") ? raw : `tools/${raw}`;

    return `${baseUrl}/storage/v1/object/public/${path}`;
  };

    const getStoreItemImageSource = (row: any) => {
    // 1) Probeer public URL uit image_url
    const publicUrl = buildPublicImageUrl(row.image_url as string | null | undefined);
    if (publicUrl) {
      return { uri: publicUrl };
    }

    // 2) Fallback naar bestaande assets op basis van categorie
    return (
      exampleImages[row.category_id] ||
      require("@/assets/images/Premiumkit.png")
    );
  };




  const isFocused = useIsFocused();

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      const load = async () => {
        try {
          const { data: categoryData, error: categoryError } = await supabase
            .from("category")
            .select("id_category,name")
            .limit(10);
          if (categoryError) {
            console.warn("Supabase categories(fetch) error:", categoryError.message);
            if (mounted) setCategories([]);
          } else {
            const mappedCategories: Category[] = (categoryData ?? []).map((row: any) => ({
              id: row.id_category ?? undefined,
              name: row.name ?? "Untitled Category",
            }));
            if (mounted) setCategories(mappedCategories);
          }

          const { data: storeItemsData, error: storeItemsError } = await supabase
            .from("store_items")
            .select("id_store_item, name, category_id, price, image_url")
            .limit(50);
          const { data: starterkitItemsData, error: starterkitItemsError } = await supabase
            .from("starter_kits")
            .select("id_starter_kit, name, price")
            .limit(50);
          if (storeItemsError || starterkitItemsError) {
            console.warn("Supabase fetch error:", storeItemsError?.message || starterkitItemsError?.message);
            if (mounted) setItems([]);
          } else {
            const mappedStoreItems: Item[] = (storeItemsData ?? []).map((row: any) => ({
              id: row.id_store_item ?? undefined,
              title: row.name ?? "Untitled Item",
              categoryId: row.category_id ?? undefined,
              price: row.price ? `€${row.price}` : "N/A",
              // BELANGRIJK: gebruik helper, niet rechtstreeks exampleImages
              image: getStoreItemImageSource(row),
              imageUrl: row.image_url ?? undefined,
            }));

            const mappedStarterKits: Item[] = (starterkitItemsData ?? []).map((row: any) => ({
              id: row.id_starter_kit ?? undefined,
              title: row.name ?? "Untitled Starter Kit",
              categoryId: 4,
              price: row.price ? `€${row.price}` : "N/A",
              image: require("@/assets/images/starterkit2.png"),
            }));
            const combinedItems = [...mappedStoreItems, ...mappedStarterKits];
            combinedItems.sort((a, b) => a.title.localeCompare(b.title));
            if (mounted) setItems(combinedItems);
          }

        } catch (e: any) {
          console.warn("Supabase fetch exception:", e?.message ?? e);
        } finally {
          if (mounted) setLoading(false);
        }
      };

      load();

      return () => {
        mounted = false;
      };
    }, [])
  );

  if (loading) {
    return (
      <Spinner
        title="Loading store..."
      />
    );
  }

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}
    >
      <Header
        title="Store"
        iconName="ShoppingCart"
        onIconPress={() => router.push("/ShoppingCart" as any)}
        actionTestID="cart-button"
        showCartCount={true}
      />

      {/* Horizontal scrollable category chips */}
      <View style={{ height: 60 }} className="mx-3 h-60">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {orderedCategories.map((cat) => {
            const isSelected = selectedCategories.includes(cat.id);
            return (
              <Chip
                key={cat.id}
                mode="flat"
                selected={isSelected}
                onPress={() => toggleCategory(cat.id)}
                icon={
                  isSelected
                    ? () => (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Check size={14} color={BASE_COLORS.WHITE} />
                        </View>
                      )
                    : undefined
                }
                textStyle={{
                  color: isSelected ? BASE_COLORS.WHITE : BASE_COLORS.STONE500,
                  fontFamily: FontFamilies.BODY,
                  fontSize: 14,
                }}
                style={{
                  marginRight: 10,
                  backgroundColor: isSelected
                    ? BASE_COLORS.ACCENT_PRIMARY
                    : BASE_COLORS.WHITE,
                  borderColor: isSelected
                    ? BASE_COLORS.WHITE
                    : BASE_COLORS.STONE300,
                  borderWidth: 1,
                  height: Math.min(40 * scale, 50),
                  paddingVertical: 0,
                  marginVertical: 5,
                  alignItems: "center",
                }}
              >
                {cat.name}
              </Chip>
            );
          })}
        </ScrollView>
      </View>

      {/* Search Bar */}
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
            searchQuery
              ? () => <X size={18} color={BASE_COLORS.STONE500} />
              : undefined
          }
          onClearIconPress={() => setSearchQuery("")}
          style={{
            backgroundColor: BASE_COLORS.WHITE,
            borderColor: BASE_COLORS.STONE300,
            borderWidth: 1,
            marginBottom: 16,
          }}
        />
      </View>

      {/* Items List */}
      <FlatList
        data={items.filter(filterMatches)}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: "space-between",
          marginBottom: 16,
        }}
        contentContainerClassName="mx-3"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ width: "48%" }}>
            <StoreCard
              {...item}
              onPress={() =>
                router.push({
                  pathname: "/StoreItem",
                  params: { id: item.id, categoryNumber: item.categoryId },
                } as any)
              }
            />
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center mt-6 px-6">
            <ThemedText type="defaultText" className="text-center mb-2">No recipes match this filter.</ThemedText>
            <Button
              mode="contained"
              onPress={() => {
                setSearchQuery("");
                setSelectedCategories([]);
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
            >Clear Filters</Button>
          </View>
        }
      />
    </View>
  );
}
