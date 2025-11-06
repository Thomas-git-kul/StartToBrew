
import React from 'react';
import { View, Image } from 'react-native';
import { Card, Text } from 'react-native-paper';

type StoreCardProps = {
  image: string;
  title: string;
  price: string;
};

export default function StoreCard({ image, title, price }: StoreCardProps) {
  return (
    <Card className="bg-white rounded-lg shadow-md m-2">
      {/* Image */}
      <Image
        source={{ uri: image }}
        className="w-full h-40 rounded-t-lg"
        resizeMode="contain"
      />

      {/* Content */}
      <View className="p-3">
        <Text className="text-lg font-bold text-[#9c4a00]">
          {title}
        </Text>
        <Text className="text-base text-[#9c4a00] mt-1">
          {price}
        </Text>
      </View>
    </Card>
  );
}
