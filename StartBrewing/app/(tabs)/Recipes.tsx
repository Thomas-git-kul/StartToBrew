import React from "react";
import { View, ScrollView } from "react-native";
import { Text, Searchbar, IconButton } from "react-native-paper";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import BeerCard from '@/components/ui/IPAcomponent';
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";

import { ThemedText } from "@/components/themed-text";
import { StyleSheet} from "react-native";
import { useRouter } from "expo-router"; 

interface Beer {
  name: string;
  rating: number;
  reviews: number;
  image: string;
  description: string;
}

export default function Recipes() {
  const [searchQuery, setSearchQuery] = React.useState("");

  // helper to check whether an item matches the query (name or description)
  const filterMatches = (item: Beer, q: string) => {
    if (!q) return true;
    const lower = q.toLowerCase();
    return (
      item.name.toLowerCase().includes(lower) ||
      item.description.toLowerCase().includes(lower)
    );
  };

  const router = useRouter();

  const popular_recipes: Beer[] = [
    {
      name: "IJ IPA",
      rating: 4.8,
      reviews: 256,
      image: require("@/assets/images/default-beer.png"),
      description: "An assertive bitterness that dominates the palate, with citrus and pine notes."
    },
    {
      name: "Voodoo Ranger",
      rating: 4.5,
      reviews: 98,
      image: require("@/assets/images/default-beer.png"),
      description: "A crystal-clear IPA dominated by citrus and resin hop profile.",
    },
    {
      name: "Two Hearted IPA",
      rating: 4.9,
      reviews: 322,
      image: require("@/assets/images/default-beer.png"),
      description: "A slightly hazy gold color with tropical flavors like mango and orange.",
    },
  ];

  const all_recipes: Beer[] = [
    {
      name: "IJ IPA",
      rating: 4.8,
      reviews: 256,
      image: require("@/assets/images/default-beer.png"),
      description: "An assertive bitterness that dominates the palate, with citrus and pine notes."
    },
    {
      name: "Voodoo Ranger",
      rating: 4.5,
      reviews: 98,
      image: require("@/assets/images/default-beer.png"),
      description: "A crystal-clear IPA dominated by citrus and resin hop profile.",
    },
    {
      name: "Two Hearted IPA",
      rating: 4.9,
      reviews: 322,
      image: require("@/assets/images/default-beer.png"),
      description: "A slightly hazy gold color with tropical flavors like mango and orange.",
    },
    {
      name: "IJ IPA",
      rating: 4.8,
      reviews: 256,
      image: require("@/assets/images/default-beer.png"),
      description: "An assertive bitterness that dominates the palate, with citrus and pine notes."
    },
    {
      name: "Voodoo Ranger",
      rating: 4.5,
      reviews: 98,
      image: require("@/assets/images/default-beer.png"),
      description: "A crystal-clear IPA dominated by citrus and resin hop profile.",
    },
    {
      name: "Two Hearted IPA",
      rating: 4.9,
      reviews: 322,
      image: require("@/assets/images/default-beer.png"),
      description: "A slightly hazy gold color with tropical flavors like mango and orange.",
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
          style={styles.title}
        >Recipes</Text>
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
            <ThemedText style={styles.title2}>Popular Recipes</ThemedText>
              <View style={{ paddingHorizontal: 10, paddingBottom: 20 }}>
                {popular_recipes.map((beer, index) => (
                  <BeerCard key={index} {...beer} />
                ))}
              </View>

            <ThemedText style={styles.title2}>Recipes</ThemedText>
            <View style={{ paddingHorizontal: 10, paddingBottom: 20 }}>
              {all_recipes.map((beer, index) => (
                <BeerCard key={index} {...beer} />
              ))}
            </View>
          </>
        ) : (
          <View style={{ paddingHorizontal: 10, paddingBottom: 20 }}>
            {all_recipes
              .filter((b) => filterMatches(b, searchQuery))
              .map((beer, index) => (
                <BeerCard key={index} {...beer} />
              ))}
          </View>
        )}
      </ScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  title: {
    paddingTop: 25,
    fontSize: 50,
    marginHorizontal: 10,
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.TEXT_DARK,
  },
  title2: {
    paddingTop: 10,
    fontSize: 25,
    marginHorizontal: 10,
    fontFamily: FontFamilies.BODY,
    color: BASE_COLORS.TEXT_DARK,
  },
});
