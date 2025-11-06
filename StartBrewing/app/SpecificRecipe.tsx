import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function SpecificRecipe() {
  const router = useRouter();

  const ingredients = [
    "6.5 lb (2.95 kg) Pilsner malt",
    "2.25 lb (1 kg) wheat malt",
    "23 oz (652 g) white unmalted wheat flakes",
    "5 ml lactic acid",
    "0.75 oz (21 g) Bravo pellets, 15% a.a. (60 min)",
    "5 oz (141 g) dextrose (30 min)",
    "Kettle Finings (30 min)",
    "0.12 oz (3 g) fresh ground coriander (5 min)",
    "0.34 oz (10 g) fresh ground bitter orange peel (5 min)",
    "1.0 oz (28 g) Citra pellets (knockout)",
    "1.0 oz (28 g) Centennial pellets (knockout)",
    "0.5 oz (14 g) Cascade pellets (knockout)",
    "Yeast nutrient (optional)",
    "Wyeast 3787 Trappist High Gravity ale yeast",
  ];

  return (
    <View style={styles.container}>
        {/* Fixed title */}
        <View style={styles.fixedTitleContainer}>
        <Text style={styles.title}>IJ IPA</Text>
        </View>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Image */}
        <View style={styles.imageWrapper}>
          <Image
            source={require("@/assets/images/default-beer.png")}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        {/* Rating row */}
        <View style={styles.ratingRow}>
          <IconSymbol name="star.fill" size={22} color={BASE_COLORS.ACCENT_PRIMARY} />
          <Text style={styles.rating}>4.8 / 5 </Text>
          <Text style={styles.ratingText}>(265 reviews)</Text>
        </View>

        {/* Brew Info */}
        <Text style={styles.bodyText}>
          It features an assertive bitterness that dominates the palate,
          accompanied by strong aromatic notes that often recall citrus zest,
          pine, or tropical fruit ...
        </Text>

        {/* Ingredients */}
        <Text style={styles.bodyText}>
          Ingredients:
        </Text>
        {ingredients.map((item, index) => (
          <View key={index} style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bodyText}>{item}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Start Brewing Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("../progress")}
        >
          <Text style={styles.buttonText}>Start Brewing</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* -------------------- Styles -------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BASE_COLORS.LIGHT_BG,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 110,
  },
  scrollContent: {
    paddingBottom: 180,
  },
  title: {
    fontSize: 50,
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.TEXT_DARK,
    textAlign: "left",
    marginBottom: 16,
  },
  imageWrapper: {
    alignItems: "center",
    marginBottom: 24,
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 16,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  rating: {
    fontSize: 18,
    fontFamily: FontFamilies.BODY_BOLD,
    color: BASE_COLORS.TEXT_BODY,
    marginLeft: 6,
  },
  ratingText: {
    fontSize: 16,
    fontFamily: FontFamilies.BODY,
    color: BASE_COLORS.TEXT_BODY,
    marginLeft: 4,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FontFamilies.BODY_LIGHT,
    color: BASE_COLORS.TEXT_BODY,
    textAlign: "left",
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  bullet: {
    fontSize: 16,
    lineHeight: 22,
    marginRight: 6,
    color: BASE_COLORS.TEXT_BODY,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: BASE_COLORS.LIGHT_BG, // solid background behind button
    paddingBottom: 24,
    paddingTop: 16, // small top padding to separate button from text area
  },
  button: {
    backgroundColor: BASE_COLORS.TEXT_DARK,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 16,
    shadowColor: BASE_COLORS.STONE_DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  buttonText: {
    color: BASE_COLORS.WHITE,
    fontSize: 18,
    fontFamily: FontFamilies.BODY_BOLD,
  },
    fixedTitleContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: BASE_COLORS.LIGHT_BG,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 0,
    zIndex: 10,
  },
});
