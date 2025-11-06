import React from 'react';
import { View } from 'react-native';
import { Card, Text, IconButton, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface OrderCardProps {
  image: any;
  title: string;
  quantity: number;
  price: string;
  onIncrease: () => void;
  onDecrease: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  image,
  title,
  quantity,
  price,
  onIncrease,
  onDecrease,
}) => {
  return (
    <Card className="mb-4 p-4">
      <Text className="text-lg font-semibold mb-2">Order Summary</Text>
      <View className="flex-row items-center justify-between">
        <Avatar.Image source={image} size={60} />
        <Text className="flex-1 ml-4">{title}</Text>
        <View className="flex-row items-center">
          <IconButton
            icon="minus-circle-outline"
            size={24}
            onPress={onDecrease}
          />
          <Text className="mx-2">{quantity}</Text>
          <IconButton
            icon="plus-circle-outline"
            size={24}
            onPress={onIncrease}
          />
        </View>
        <Text className="ml-4">{price}</Text>
      </View>
    </Card>
  );
};

export default OrderCard;
