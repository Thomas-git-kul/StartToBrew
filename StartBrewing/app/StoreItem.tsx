import React, { useState } from "react";
import { View, ScrollView, Image, TouchableOpacity, FlatList, Dimensions } from "react-native";
import { FAB } from "react-native-paper";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useFonts } from "@/hooks/use-fonts";
import Header from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { nanoid } from 'nanoid/non-secure';

const { width } = Dimensions.get("window");
const IMAGE_WIDTH = width - 20;
const IMAGE_HEIGHT = IMAGE_WIDTH * 0.75;

export default function StoreItem() {
  useFonts();

  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = [
    { id: nanoid(), source: require("@/assets/images/Starterkit.png") },
    { id: nanoid(), source: require("@/assets/images/starterkit2.png") },
  ];

  return (
    <SafeAreaView 
      style={{ 
        flex: 1, 
        backgroundColor: BASE_COLORS.LIGHT_BG 
      }}>
      <Header
        title="Starter Brew Kit IPA"
        iconName="ArrowRight"
        onIconPress={() => router.push("/Store")}
        actionTestID="back-button"
      />

      {/* Scrollable Content */}
      <ScrollView
        className="flex-1 mx-3"        
        showsVerticalScrollIndicator={false}
      >
        {/* Image Carousel inside ScrollView */}
        <View>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Image
                source={item.source}
                style={{
                  borderRadius: 20,
                  width: IMAGE_WIDTH,
                  height: IMAGE_HEIGHT,
                }}
                resizeMode="cover"
              />
            )}
            onMomentumScrollEnd={(ev) => {
              const index = Math.round(ev.nativeEvent.contentOffset.x / adjustedWidth);
              setCurrentIndex(index);
            }}
          />

          {/* Dots */}
          <View
            style={{
              position: "absolute",
              bottom: 8,
              left: 0,
              right: 0,
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {images.map((_, i) => (
              <View
                key={i}
                style={{
                  width: currentIndex === i ? 10 : 8,
                  height: currentIndex === i ? 10 : 8,
                  borderRadius: currentIndex === i ? 5 : 4,
                  backgroundColor:
                    currentIndex === i
                      ? BASE_COLORS.ACCENT_PRIMARY
                      : "rgba(255,255,255,0.65)",
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.12)",
                  marginHorizontal: 2,
                }}
              />
            ))}
          </View>
        </View>

        {/* Title + Price */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <ThemedText type="titleBlack">Starter Brew Kit IPA</ThemedText>
          <ThemedText
            type="titleBlack"
            style={{ color: BASE_COLORS.ACCENT_PRIMARY }}
          >
            €32.99
          </ThemedText>
        </View>

        {/* Description */}
        <ThemedText type="defaultText" className="mb-3">
        
          Slightly bitter with a fruity undertone. This IPA has a moderate alcohol content of 5.1% ABV. Brew 5 liters of your own beer at home in just a few hours. Includes milled all-grain mix and practical brewing guide with tips & tricks. 
        </ThemedText>
      </ScrollView>


      {/* Bottom Bar with FAB-style Button */}
      <View
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Quantity selector */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
            style={{
              backgroundColor: BASE_COLORS.WHITE,
              borderRadius: 8,
              width: 40,
              height: 40,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 1,
              borderColor: BASE_COLORS.STONE_DARK,
            }}
          >
            <ThemedText type="numbers">-</ThemedText>
          </TouchableOpacity>

          <ThemedText type="numbers" style={{ marginHorizontal: 12 }}>
            {quantity}
          </ThemedText>

          <TouchableOpacity
            onPress={() => setQuantity(quantity + 1)}
            style={{
              backgroundColor: BASE_COLORS.WHITE,
              borderRadius: 8,
              width: 40,
              height: 40,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 1,
              borderColor: BASE_COLORS.STONE_DARK,
            }}
          >
            <ThemedText type="numbers">+</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Add to Order Button */}
        <FAB
          label="Add to order"
          mode="elevated"
          testID="fab-add-to-order"
          onPress={() => router.push("/ShoppingCart")}
          style={{
            backgroundColor: BASE_COLORS.TEXT_DARK,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
          }}
          color={BASE_COLORS.WHITE}
          theme={{
            fonts: {
              labelLarge: { fontFamily: FontFamilies.BODY_BOLD, fontSize: 16 },
            },
          }}
        />
      </View>
    </SafeAreaView>
  );
}
