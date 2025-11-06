import React from 'react';
import { View } from 'react-native';
import { Card, Text, IconButton, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BASE_COLORS } from '@/constants/Colors';
import { FontFamilies } from '@/constants/Fonts';

type OrderCardProps = {
  image: any;
  title: string;
  quantity: number;
  price: string;
  onIncrease: () => void;
  onDecrease: () => void;
}

export default function OrderCard({ 
    image, 
    title,
    quantity, 
    price, 
    onIncrease, 
    onDecrease 
}: OrderCardProps) {

  return (
    <Card
        style ={{
            marginBottom: 10,
            backgroundColor: BASE_COLORS.WHITE,
        }}
    >
      <View className="flex-row items-center justify-between">
        <Avatar.Image source={image} size={80} />
        <Text className="flex-1 ml-4"
            style = {{
                fontFamily: FontFamilies.BODY,
                color: BASE_COLORS.STONE500
            }}
        >{title}</Text>
        <View className="flex-row items-center">
          <IconButton
            icon="minus-circle-outline"
            size={24}
            onPress={onDecrease}
          />
          <Text className="mx-2"
            style = {{
                fontFamily: FontFamilies.BODY,
                color: BASE_COLORS.STONE500
            }}
          >{quantity}</Text>
          <IconButton
            icon="plus-circle-outline"
            size={24}
            onPress={onIncrease}
          />
        </View>
        <Text className="mx-4"
            style = {{
                    fontFamily: FontFamilies.BODY,
                    color: BASE_COLORS.STONE500
                }}
        >{price}</Text>
      </View>
    </Card>
  );
};

