import React, { useState } from "react";

import { StyleSheet, View, ScrollView } from "react-native";
import { Text, Searchbar} from "react-native-paper";

import { ThemedText } from "@/components/themed-text";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import StoreCard from '@/components/ui/StoreCard';
import { useRouter } from "expo-router";

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface Item {
  title: string;
  price: string;
  image: string;
}

export default function StorePage() {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filterMatches = (item: Item, q: string) => {
    if (!q) return true;
    const lower = q.toLowerCase();
    return (
      item.title.toLowerCase().includes(lower) ||
      item.price.toLowerCase().includes(lower)
    );
  };

  const router = useRouter();

  const items = [
    {
      image: "@/assets/images/default-beer.png",
      title: "Superior starter kit Base",
      price: "€299"
    },
    {
      image: "@/assets/images/default-beer.png",
      title: "Airlock",
      price: "€1,49"
    },
    {
      image: "@/assets/images/default-beer.png",
      title: "Starter Kit IPA",
      price: "€32,99"
    },
  ];

  return (
     <View className="flex-1" 
      style={{ 
        backgroundColor: BASE_COLORS.LIGHT_BG 
      }}
    >
    
      {/* Fixed header */}
      <View className="w-full px-5 pb-5"
        style={{
          backgroundColor: BASE_COLORS.LIGHT_BG,
        }}
      >
        <Text className="mb-4"
        >Store</Text>
        <Searchbar
          placeholder="Search"
          value={searchQuery}
          onChangeText={setSearchQuery}
          // make typed text darker gray to match beer cards
          inputStyle={{ color: BASE_COLORS.STONE500 }}
          icon={() => (
            <MaterialCommunityIcons name="magnify" size={20} color={BASE_COLORS.STONE300} />
          )}
            clearIcon={searchQuery ? () => (
              <MaterialCommunityIcons name="close" size={18} color={BASE_COLORS.STONE500} />
            ) : undefined}
            onClearIconPress={() => setSearchQuery("")}
          style={{
            backgroundColor: BASE_COLORS.WHITE,
            borderColor: BASE_COLORS.STONE300,
            borderWidth: 1,
            fontFamily: FontFamilies.BODY,
          }}
        />
      </View>
    
      {/* Scrollable content */}
      <ScrollView className="pl-5">
        {!searchQuery ? ( 
          <>
            <View style={{ paddingHorizontal: 10, paddingBottom: 20 }}>
              {items.map((item, index) => (
                <StoreCard key={index} {...item} />
              ))}
            </View>
          </>
        ) : (
          <View style={{ paddingHorizontal: 10, paddingBottom: 20 }}>
            {items
              .filter((b) => filterMatches(b, searchQuery))
              .map((item, index) => (
                <StoreCard key={index} {...item} />
              ))}
          </View>
        )}
      </ScrollView>
      </View>
  );
}
