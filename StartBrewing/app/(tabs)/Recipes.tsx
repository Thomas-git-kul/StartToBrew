import React from "react";
import { View, ScrollView } from "react-native";
import { Text, Searchbar, IconButton } from "react-native-paper";
import BeerCard from '@/components/ui/IPAcomponent';
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";

import { SafeAreaView } from "react-native-safe-area-context";
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
    <View className="w-full z-50"
      style={{
        backgroundColor: BASE_COLORS.LIGHT_BG,
      }}
    >
      <Text className=""
        style={{
          fontSize: 50,
          color: BASE_COLORS.TEXT_DARK,
          fontFamily: FontFamilies.HEADING,
        }}
      >Recipes</Text>

      <Searchbar
        placeholder="Search"
        value={searchQuery}
        onChangeText={setSearchQuery}
        className="rounded-full"
        icon="magnify"
        style={{
          backgroundColor: BASE_COLORS.WHITE,
          borderWidth: 1,
          borderColor: "#E7E5E4",
        }}
      />
    </View>
      
      
      
      
      
      <ScrollView>
        <ThemedText style={styles.title2}>Popular Recipes</ThemedText>
        <ThemedText style={styles.title2}>Recipes</ThemedText>
        <View style={{ paddingHorizontal: 10, paddingBottom: 20 }}>
          {popular_recipes.map((beer, index) => (
            <BeerCard key={index} {...beer} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  general: {
    flex: 1,
    backgroundColor: BASE_COLORS.WHITE,
  },
  title: {
    paddingTop: 25,
    fontSize: 50,
    //fontWeight: 'bold',
    marginHorizontal: 10,
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.TEXT_DARK,
  },
  title2: {
    paddingTop: 10,
    fontSize: 25,
    //fontWeight: 'bold',
    marginHorizontal: 10,
    fontFamily: FontFamilies.BODY,
    color: BASE_COLORS.TEXT_DARK,
  },
});
