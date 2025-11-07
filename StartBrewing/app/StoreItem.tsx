import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { IconButton } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const { width } = Dimensions.get("window");
const IMAGE_HEIGHT = 300;

export default function StoreItem() {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = [
    require("@/assets/images/Starterkit.png"),
    require("@/assets/images/starterkit2.png"),
  ];

  return (
    <View style={styles.container}>
      {/* back button with circular background (left side) */}
      <IconButton
        testID="back-button"
        icon={() => <MaterialCommunityIcons name="arrow-left" size={28} color={BASE_COLORS.TEXT_DARK} />}
        size={20}
        iconColor={BASE_COLORS.TEXT_DARK}
        onPress={() => router.push("/Store")}
        style={styles.backButton}
      />

      {/* Image Carousel + indicator dots */}
      <View style={{ height: IMAGE_HEIGHT }}>
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <Image source={item} style={styles.image} resizeMode="cover" />
          )}
          style={styles.carousel}
          contentContainerStyle={{}}
          onMomentumScrollEnd={(ev) => {
            const index = Math.round(ev.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
        />

        {/* Dots */}
        <View style={styles.dotsContainer} pointerEvents="none">
          {images.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, currentIndex === i && styles.activeDot]}
            />
          ))}
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollContainer}
      >
        {/* Title + Price */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Starter Brew Kit IPA</Text>
          <Text style={styles.price}>€32.99</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Slightly bitter with a fruity undertone.  This IPA has a moderate
          alcohol content of 5.1% ABV. For the lover of  distinctive flavours.
          With this all grain brew kit you can brew 5 litres of your own beer at
          home in just a few hours.  Brew kit with milled all grain mix  Brew
          from scratch Practical brew guide with tips & tricks for more brew
          fun and the best beer!
        </Text>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        {/* Quantity Selector */}
        <View style={styles.quantityRow}>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Text style={styles.qtyText}>-</Text>
          </TouchableOpacity>

          <Text style={styles.quantityNumber}>{quantity}</Text>

          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => setQuantity(quantity + 1)}
          >
            <Text style={styles.qtyText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Add to Order Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/cart")}
        >
          <Text style={styles.addButtonText}>Add to order</Text>
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

  // back button styled to appear like the one in cart (circular bg)
  backButton: {
    position: "absolute",
    top: 18,
    left: 12,
    zIndex: 30,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BASE_COLORS.LIGHT_BG,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },

  // force carousel to match image height so there isn't an unexpected gap
  carousel: {
    height: IMAGE_HEIGHT,
  },
  image: {
    width: width,
    height: IMAGE_HEIGHT,
  },

  // Ensure the scroll content sits directly under the carousel (minimal gap)
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 8,
  },

  dotsContainer: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    zIndex: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.65)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    marginHorizontal: 4,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BASE_COLORS.ACCENT_PRIMARY,
    borderColor: "rgba(0,0,0,0.12)",
  },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.TEXT_DARK,
  },
  price: {
    fontSize: 24,
    fontFamily: FontFamilies.BODY_BOLD,
    color: BASE_COLORS.ACCENT_PRIMARY,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FontFamilies.BODY,
    color: BASE_COLORS.TEXT_BODY,
  },
  bottomBar: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: BASE_COLORS.LIGHT_BG,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  qtyButton: {
    backgroundColor: BASE_COLORS.WHITE,
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BASE_COLORS.STONE_DARK,
  },
  qtyText: {
    fontSize: 22,
    fontFamily: FontFamilies.BODY_BOLD,
    color: BASE_COLORS.TEXT_DARK,
  },
  quantityNumber: {
    fontSize: 22,
    fontFamily: FontFamilies.BODY_BOLD,
    color: BASE_COLORS.TEXT_DARK,
    marginHorizontal: 12,
  },
  addButton: {
    backgroundColor: BASE_COLORS.TEXT_DARK,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  addButtonText: {
    color: BASE_COLORS.WHITE,
    fontSize: 18,
    fontFamily: FontFamilies.BODY_BOLD,
  },
});