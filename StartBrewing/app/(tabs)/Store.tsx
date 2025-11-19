import React from "react";
import { View, ScrollView } from "react-native";
import { Searchbar, Chip } from "react-native-paper";
import { Search, X } from "lucide-react-native";

import { BASE_COLORS } from "@/constants/Colors";

import { useRouter } from "expo-router";
import { useFonts } from "@/hooks/use-fonts";

import StoreCard from "@/components/ui/StoreCard";
import Header from "@/components/header"

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
  const [selectedCategory, setSelectedCategory] = React.useState<number | null>(null);
  const fontsLoaded = useFonts();
  const router = useRouter();

  if (!fontsLoaded) return null;

  // Example categories (these will come from DB)
  const categories: Category[] = [
    { id: 1, name: "Kits" },
    { id: 2, name: "Parts" },
    { id: 3, name: "Accessories" },
  ];

  // Example store items (categoryId matches DB category IDs)
  const items: Item[] = [
    { image: require("@/assets/images/Premiumkit.png"), title: "Superior starter kit Base", price: "€299", categoryId: 1 },
    { image: require("@/assets/images/Airlock.png"), title: "Airlock", price: "€1,49", categoryId: 2 },
    { image: require("@/assets/images/Starterkit.png"), title: "Starter Kit IPA", price: "€32,99", categoryId: 1 },
    { image: require("@/assets/images/PVCtap.png"), title: "Tap PVC with back nut", price: "€2,99", categoryId: 2 },
  ];

  const filterMatches = (item: Item) => {
    const q = searchQuery.toLowerCase();

    const matchSearch =
      item.title.toLowerCase().includes(q) ||
      item.price.toLowerCase().includes(q);

    const matchCategory =
      selectedCategory === null || item.categoryId === selectedCategory;

    return matchSearch && matchCategory;
  };

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

      {/* Horizontal scroll chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 15, paddingLeft: 10 }}
      >
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            selected={selectedCategory === cat.id}
            onPress={() =>
              setSelectedCategory(prev =>
                prev === cat.id ? null : cat.id
              )
            }
            style={{
              marginRight: 10,
              backgroundColor:
                selectedCategory === cat.id
                  ? BASE_COLORS.STONE300
                  : BASE_COLORS.WHITE,
              borderColor: BASE_COLORS.STONE300,
              borderWidth: 1,
            }}
            textStyle={{
              color:
                selectedCategory === cat.id
                  ? BASE_COLORS.WHITE
                  : BASE_COLORS.STONE700,
            }}
          >
            {cat.name}
          </Chip>
        ))}
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
