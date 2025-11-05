import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { StyleSheet, ScrollView, View } from "react-native";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useRouter } from "expo-router"; 
import Checkbox from "expo-checkbox";
import React, { useState } from "react";
import BeerCard from '@/components/ui/IPAcomponent';


interface Beer {
  name: string;
  rating: number;
  reviews: number;
  image: string;
  description: string;
}

export default function Recipes() {
  const router = useRouter();
  const beers: Beer[] = [
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
    <SafeAreaView style={styles.general}>
      <ScrollView>
        <ThemedText style={styles.title}>Recipes</ThemedText>
        <ThemedText style={styles.title2}>Popular Recipes</ThemedText>
        <ThemedText style={styles.title2}>Recipes</ThemedText>
        <View style={{ paddingHorizontal: 10, paddingBottom: 20 }}>
          {beers.map((beer, index) => (
            <BeerCard key={index} {...beer} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
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
