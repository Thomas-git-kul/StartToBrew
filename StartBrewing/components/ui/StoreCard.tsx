import * as React from "react";
import { Dimensions, View, Image, StyleSheet } from "react-native";
import { Card } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";
import { ThemedText } from "../themed-text";

type StoreCardProps = {
  image: any;
  title: string;
  price: string;
};

const CARD_WIDTH = (Dimensions.get("window").width - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.45;
const PRICE_BOTTOM_MARGIN = 12; // distance from bottom of card

export default function StoreCard({ image, title, price }: StoreCardProps) {
  return (
    <Card style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
      <View style={styles.container}>
        {/* Image */}
        <Image
          source={typeof image === "string" ? { uri: image } : image}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Title */}
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>

        {/* Spacer fills space to push price to fixed bottom margin */}
        <View style={{ flex: 1 }} />

        {/* Price */}
        <View style={{ marginBottom: PRICE_BOTTOM_MARGIN }}>
          <ThemedText type="defaultText">{price}</ThemedText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 18,
    backgroundColor: BASE_COLORS.WHITE,
    borderRadius: 16,
    overflow: "hidden",
  },
  container: {
    flex: 1,
    flexDirection: "column",
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  image: {
    width: "100%",
    height: CARD_HEIGHT * 0.55,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: {
    marginTop: 8,
  },
});
