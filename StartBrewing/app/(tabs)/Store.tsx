import React from "react";
import { View, ScrollView } from "react-native";
import { Searchbar, Appbar } from "react-native-paper";

import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import StoreCard from "@/components/ui/StoreCard";
import { useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFonts } from "@/hooks/use-fonts";

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
    <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
      {/* Top Appbar row: title + cart */}
      <Appbar.Header className="pt-8 pb-8"
        style={{
          backgroundColor: BASE_COLORS.LIGHT_BG,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 16 }}>
          <Appbar.Content
            title="Store"
            titleStyle={{ fontSize: 36, fontFamily: FontFamilies.HEADING, color: BASE_COLORS.TEXT_DARK }}
          />

          <Appbar.Action
            testID="cart-button"
            icon={() => <MaterialCommunityIcons name="cart-outline" size={28} color={BASE_COLORS.TEXT_DARK} />}
            onPress={() => router.push("/cart" as any)}
          />
        </View>
      </Appbar.Header>

      {/* Searchbar placed under the appbar so it won't be clipped */}
      <View style={{ backgroundColor: BASE_COLORS.LIGHT_BG, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
        <Searchbar
          placeholder="Search"
          value={searchQuery}
          onChangeText={setSearchQuery}
          inputStyle={{ color: BASE_COLORS.STONE500 }}
          icon={() => <MaterialCommunityIcons name="magnify" size={20} color={BASE_COLORS.STONE300} />}
          clearIcon={
            searchQuery
              ? () => <MaterialCommunityIcons name="close" size={18} color={BASE_COLORS.STONE500} />
              : undefined
          }
          onClearIconPress={() => setSearchQuery("")}
          style={{ backgroundColor: BASE_COLORS.WHITE, borderColor: BASE_COLORS.STONE300, borderWidth: 1 }}
        />
      </View>

      {/* Scrollable Items */}
      <ScrollView className="px-5 pt-2">
        <View className="flex-row flex-wrap -mx-2">
          {items
            .filter((item) => filterMatches(item, searchQuery))
            .map((item, index) => (
              <View key={index} className="w-1/2 px-2">
                <StoreCard {...item} />
              </View>
            ))}
        </View>
      </ScrollView>
    </View>
  );
}
