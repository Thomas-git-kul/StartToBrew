import React from "react";
import { View, ScrollView, ImageSourcePropType } from "react-native";
import { Text, Searchbar } from "react-native-paper";

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
  useFonts();

  const filterMatches = (item: Item, q: string) => {
    if (!q) return true;
    const lower = q.toLowerCase();
    return (
      item.title.toLowerCase().includes(lower) ||
      item.price.toLowerCase().includes(lower)
    );
  };

  const router = useRouter();

  const items: Item[] = [
    { image: require("@/assets/images/Premiumkit.png"), title: "Superior starter kit Base", price: "€299" },
    { image: require("@/assets/images/Airlock.png"), title: "Airlock", price: "€1,49" },
    { image: require("@/assets/images/Starterkit.png"), title: "Starter Kit IPA", price: "€32,99" },
    { image: require("@/assets/images/PVCtap.png"), title: "Tap PVC with back nut", price: "€2,99" },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}>
      {/* Fixed header */}
      <View className="w-full px-5 pb-5" style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}>
        <Text
          className="mb-4 mt-3"
          style={{ fontSize: 50, fontFamily: FontFamilies.HEADING, color: BASE_COLORS.TEXT_DARK }}
        >
          Store
        </Text>

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
          style={{ backgroundColor: BASE_COLORS.WHITE, borderColor: BASE_COLORS.STONE300, borderWidth: 1, fontFamily: FontFamilies.BODY }}
        />
      </View>

      {/* Scrollable content */}
      <ScrollView className="px-5 pt-2">
        {!searchQuery ? (
          <View className="flex-row flex-wrap -mx-2">
            {items.map((item, index) => (
              <View key={index} className="w-1/2 px-2">
                <StoreCard {...item} />
              </View>
            ))}
          </View>
        ) : (
          <View className="flex-row flex-wrap -mx-2">
            {items
              .filter((b) => filterMatches(b, searchQuery))
              .map((item, index) => (
                <View key={index} className="w-1/2 px-2">
                  <StoreCard {...item} />
                </View>
              ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
