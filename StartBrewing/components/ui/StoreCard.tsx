import * as React from "react";
import { Dimensions, View, Image, TouchableOpacity, Text } from "react-native";
import { Card } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";
import { ThemedText } from "../themed-text";

type StoreCardProps = {
  image: any;
  title: string;
  price: string;
  onPress?: () => void;
};

const CARD_WIDTH = (Dimensions.get("window").width - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.45;

export default function StoreCard({ image, title, price, onPress }: StoreCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
    <Card 
      style={{ 
        width: CARD_WIDTH, 
        height: CARD_HEIGHT,
        marginBottom: 18,
        backgroundColor: BASE_COLORS.WHITE,
        borderRadius: 16,
        overflow: "hidden"
      }}
    >
      <View style={{ flexGrow: 1 }} className="flex-col px-3 pt-3">
        {/* Image */}
        <Image
          source={typeof image === "string" ? { uri: image } : image}
          style={{
            width: "100%",
            height: CARD_HEIGHT * 0.55,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            marginBottom: 3
          }}
          resizeMode="cover"
        />

        {/* Title */}
        <ThemedText type="title">{title}</ThemedText>

        {/* Price */}
        <ThemedText type="defaultText">{price}</ThemedText>
      </View>
    </Card>
    </TouchableOpacity>
  );
}
