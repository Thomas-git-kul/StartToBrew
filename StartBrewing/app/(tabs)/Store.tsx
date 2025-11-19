import React from "react";
import { View, ScrollView } from "react-native";
import { Searchbar, Chip } from "react-native-paper";
import { Search, X, Check } from "lucide-react-native";

import { BASE_COLORS } from "@/constants/Colors";

import { useRouter } from "expo-router";
import { useFonts } from "@/hooks/use-fonts";

import StoreCard from "@/components/ui/StoreCard";
import Header from "@/components/header"
import { FontFamilies } from "@/constants/Fonts";

interface Category {
  id: number;
  name: string;
}

interface Item {
  title: string;
  price: string;
  image: any;
  categoryId: number;
}

export default function StorePage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategories, setSelectedCategories] = React.useState<number[]>([]);
  const fontsLoaded = useFonts();
  const router = useRouter();

  if (!fontsLoaded) return null;

  // Example categories (these will come from DB)
  const categories: Category[] = [
    { id: 1, name: "Malts" },
    { id: 2, name: "Hops" },
    { id: 3, name: "Yeast" },
    { id: 4, name: "Kits" },
    { id: 5, name: "Equipment" },
    { id: 6, name: "Measurement" },
  ];

  // Example store items (categoryId matches DB category IDs)
  const items: Item[] = [
    { image: require("@/assets/images/Premiumkit.png"), title: "Superior starter kit Base", price: "€299", categoryId: 4 },
    { image: require("@/assets/images/Airlock.png"), title: "Airlock", price: "€1,49", categoryId: 5 },
    { image: require("@/assets/images/Starterkit.png"), title: "Starter Kit IPA", price: "€32,99", categoryId: 4 },
    { image: require("@/assets/images/PVCtap.png"), title: "Tap PVC with back nut", price: "€2,99", categoryId: 5 },
  ];

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const filterMatches = (item: Item) => {
    const q = searchQuery.toLowerCase();

    const matchSearch =
      item.title.toLowerCase().includes(q) ||
      item.price.toLowerCase().includes(q);

    // If no categories selected → show all
    const matchCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(item.categoryId);

    return matchSearch && matchCategory;
  };

  const orderedCategories = [
    ...categories.filter((c) => selectedCategories.includes(c.id)),
    ...categories.filter((c) => !selectedCategories.includes(c.id)),
  ];

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
      />

      {/* Horizontal scrollable category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mx-1 mb-2"
      >
        {orderedCategories.map((cat) => {
          const isSelected = selectedCategories.includes(cat.id);
          return (
            <Chip
              key={cat.id}
              mode="outlined"
              selected={isSelected}
              onPress={() => toggleCategory(cat.id)}
              icon={
                isSelected
                  ? () => (
                      <Check
                        size={14}
                        color={BASE_COLORS.WHITE}
                        style={{ marginRight: 4 }}
                      />
                    )
                  : undefined
              }
              style={{
                marginRight: 6,
                marginBottom: 10,
                backgroundColor: isSelected
                  ? BASE_COLORS.ACCENT_PRIMARY
                  : BASE_COLORS.WHITE,
                borderColor: BASE_COLORS.STONE300,
                borderWidth: 1,
                paddingHorizontal: 10,
                alignItems: "center",
              }}
              textStyle={{
                color: isSelected
                  ? BASE_COLORS.WHITE
                  : BASE_COLORS.STONE500,
                fontFamily: FontFamilies.BODY
              }}
            >
              {cat.name}
            </Chip>
          );
        })}
      </ScrollView>

      {/* Items List */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
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
            marginBottom: 10,
          }}
        />
        <View className="mt-1 mx-1 flex-row flex-wrap justify-between">
          {items.filter(filterMatches).map((item, index) => (
            <StoreCard
              key={index}
              {...item}
              onPress={() => router.push(`/StoreItem`)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
