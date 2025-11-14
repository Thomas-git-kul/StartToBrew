import React from "react";
import { View, ScrollView } from "react-native";
import { Searchbar } from "react-native-paper";
import { Search, X } from "lucide-react-native";

import { BASE_COLORS } from "@/constants/Colors";

import { useRouter } from "expo-router";
import { useFonts } from "@/hooks/use-fonts";

import StoreCard from "@/components/ui/StoreCard";
import Header from "@/components/header"

interface Item {
  title: string;
  price: string;
  image: string;
}

export default function StorePage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const fontsLoaded = useFonts();
  const router = useRouter();

  // wait for custom fonts to load so title uses the correct font
  if (!fontsLoaded) return null;

  const filterMatches = (item: Item, q: string) => {
    if (!q) return true;
    const lower = q.toLowerCase();
    return (
      item.title.toLowerCase().includes(lower) ||
      item.price.toLowerCase().includes(lower)
    );
  };

  const items: Item[] = [
    { image: require("@/assets/images/Premiumkit.png"), title: "Superior starter kit Base", price: "€299" },
    { image: require("@/assets/images/Airlock.png"), title: "Airlock", price: "€1,49" },
    { image: require("@/assets/images/Starterkit.png"), title: "Starter Kit IPA", price: "€32,99" },
    { image: require("@/assets/images/PVCtap.png"), title: "Tap PVC with back nut", price: "€2,99" },
  ];

  return (
    <View className="flex-1"
      style={{
        backgroundColor: BASE_COLORS.LIGHT_BG
      }}
    >
      <Header
        title='Store'
        iconName="ShoppingCart"
        onIconPress={() => router.push("/ShoppingCart" as any)}
        actionTestID="cart-button"
      />
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
          marginBottom: 15
        }}
      />

      {/* Scrollable Items */}
      <ScrollView>
        <View className="mt-1 mx-1 flex-row flex-wrap justify-between">
          {items
            .filter((item) => filterMatches(item, searchQuery))
            .map((item, index) => (
              <StoreCard key={index} {...item}
                onPress={() => router.push(`/StoreItem`)} />
            ))}
        </View>
      </ScrollView>
    </View>
  );
}
