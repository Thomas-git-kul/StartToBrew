import React, {useEffect, useState} from "react";
import { View, ScrollView, Dimensions, FlatList, ActivityIndicator } from "react-native";
import { Searchbar, Chip, Button } from "react-native-paper";
import { Search, X, Check } from "lucide-react-native";
import { BASE_COLORS } from "@/constants/Colors";
import { useRouter } from "expo-router";
import { useFonts } from "@/hooks/use-fonts";
import StoreCard from "@/components/ui/StoreCard";
import Header from "@/components/header"
import { FontFamilies } from "@/constants/Fonts";
import { supabase } from "../../supabase";
import { ThemedText } from "../../components/themed-text";


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
}

export default function StorePage() {
  useFonts();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [cartCount, setCartCount] = useState(0);

  const exampleImages: Record<number, any> = {
    1: require("@/assets/images/malt.png"),
    2: require("@/assets/images/hop.png"),
    3: require("@/assets/images/yeast.png"),
    4: require("@/assets/images/starterkit2.png"),
    5: require("@/assets/images/Airlock.png"),
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

  useEffect(() => {
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
          .select("id_store_item, name, category_id, price")
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
            image: exampleImages[row.category_id] || require("@/assets/images/Premiumkit.png"),
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

    // cartcount
    const loadCartCount = async () => {
      try {
        // Get the logged-in user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setCartCount(0);
          return;
        }

        // Fetch only rows for that user
        const { data, error } = await supabase
          .from("user_shopping_cart")
          .select("id_user_cart", { count: "exact" })  // we get an exact count
          .eq("user_id", user.id);
        // console.log("cartitems", data);

        if (error) {
          console.warn("Cart count error:", error.message);
          return;
        }

        // Use the count from Supabase
        setCartCount(data ? data.length : 0);

        // console.log("cartcount", data?.length ?? 0);
      } catch (e: any) {
        console.warn("Cart count fetch exception:", e?.message ?? e);
      }
    };

    loadCartCount();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}>
        <ActivityIndicator 
          animating
          size="large"
          color={BASE_COLORS.ACCENT_PRIMARY}
        />
        <ThemedText type="defaultText" className="mt-3">
          Loading store items...
        </ThemedText>
      </View>
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
        cartCount={cartCount}
      />

      {/* Horizontal scrollable category chips */}
      <View style={{ height: 60 }}>
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
                          <Check size={Math.min(14 * scale, 20)} color={BASE_COLORS.WHITE} />
                        </View>
                      )
                    : undefined
                }
                textStyle={{
                  color: isSelected ? BASE_COLORS.WHITE : BASE_COLORS.STONE500,
                  fontFamily: FontFamilies.BODY,
                  fontSize: Math.min(14 * scale, 16),
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

      {/* Items List */}
      <FlatList
        data={items.filter(filterMatches)}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: "space-between",
          marginBottom: 16,
        }}
        contentContainerStyle={{
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
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
        }
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
