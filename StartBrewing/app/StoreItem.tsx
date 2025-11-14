import React, { useState, useMemo } from "react";
import { View, ScrollView, Image, Pressable, FlatList, Dimensions } from "react-native";
import { FAB } from "react-native-paper";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useFonts } from "@/hooks/use-fonts";
import Header from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { nanoid } from 'nanoid/non-secure';
import { CirclePlus, CircleMinus } from "lucide-react-native";

const { width } = Dimensions.get("window");
const IMAGE_WIDTH = width - 20;
const IMAGE_HEIGHT = IMAGE_WIDTH * 0.75;

export default function StoreItem() {
  useFonts();

  const router = useRouter();

  const [product] = useState({
    id: nanoid(),
    title: "Starter Brew Kit IPA",
    description:
      "Slightly bitter with a fruity undertone. This IPA has a moderate alcohol content of 5.1% ABV. Brew 5 liters of your own beer at home in just a few hours. Includes milled all-grain mix and practical brewing guide with tips & tricks.",
    basePrice: 32.99,
    images: [
      { id: nanoid(), source: require("@/assets/images/Starterkit.png") },
      { id: nanoid(), source: require("@/assets/images/starterkit2.png") },
    ],
  });

  const [quantity, setQuantity] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Format price in Euro
  const formatter = useMemo(
    () => new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }),
    []
  );

  // Calculate total price dynamically
  const totalPrice = useMemo(
    () => product.basePrice * quantity,
    [product.basePrice, quantity]
  );

  return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BASE_COLORS.LIGHT_BG }}>
        {/* Header */}
        <Header
          title={product.title}
          iconName="ArrowRight"
          onIconPress={() => router.push("/Store")}
          actionTestID="back-button"
        />

        {/* Scrollable Content */}
        <ScrollView className="flex-1 mx-3" showsVerticalScrollIndicator={false}>
          {/* Image Carousel */}
          <View>
            <FlatList
              data={product.images}
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
                const index = Math.round(
                  ev.nativeEvent.contentOffset.x / ev.nativeEvent.layoutMeasurement.width
                );
                setCurrentIndex(index);
              }}
            />

            {/* Pagination Dots */}
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
              {product.images.map((_, i) => (
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
          
          {/* Product information */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              marginTop: 12,
            }}
          >
            <ThemedText
              type="titleBlack"
              style={{ color: BASE_COLORS.ACCENT_PRIMARY }}
            >
              {formatter.format(totalPrice)}
            </ThemedText>
          </View>

          <ThemedText type="defaultText" className="mb-3">
            {product.description}
          </ThemedText>
        </ScrollView>

        {/* Bottom Bar */}
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
          {/* Quantity Selector */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable
              testID="quantity-minus"
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              hitSlop={8}
              style={{ justifyContent: "center", alignItems: "center", width: 40, height: 40 }}
            >
              <CircleMinus size={20} color={BASE_COLORS.STONE500} />
            </Pressable>

            <ThemedText type="numbers" style={{ marginHorizontal: 12 }}>
              {quantity}
            </ThemedText>

            <Pressable
              testID="quantity-plus"
              onPress={() => setQuantity(quantity + 1)}
              hitSlop={8}
              style={{ justifyContent: "center", alignItems: "center", width: 40, height: 40 }}
            >
              <CirclePlus size={20} color={BASE_COLORS.STONE500} />
            </Pressable>
          </View>

          <FAB
            label="Add to order"
            mode="elevated"
            testID="fab-add-to-order"
            onPress={() =>
              router.push({
                pathname: "/Store",
                params: {
                  id: product.id,
                  title: product.title,
                  quantity,
                  price: totalPrice,
                },
              })
            }
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
