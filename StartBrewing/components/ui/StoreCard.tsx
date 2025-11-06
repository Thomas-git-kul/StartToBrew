import React from 'react';
import { View, Image } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useRouter } from "expo-router";

type StoreCardProps = {
  image: string;
  title: string;
  price: string;
};

export default function StoreCard({ image, title, price }: StoreCardProps) {
  return (
    <Card className="rounded-lg shadow-md"
      style={{
        backgroundColor: BASE_COLORS.WHITE,
        borderColor: BASE_COLORS.WHITE,
        borderWidth: 1,
        marginBottom: 20
      }}
    >
      {/* Image */}
      <Image
        source={{ uri: image }}
        className="w-full h-40 rounded-t-lg"
        resizeMode="contain"
      />

      {/* Content */}
      <View className="p-3">
        <Text className="text-xl"
          style={{
            color: BASE_COLORS.ACCENT_PRIMARY,
            fontFamily: FontFamilies.BODY_BOLD
          }}
        >
          {title}
        </Text>
        <Text className="text-base text-[#9c4a00] mt-1">
          {price}
        </Text>
      </View>
    </Card>
  );
}
