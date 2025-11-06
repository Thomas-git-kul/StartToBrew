import React, { useState, useMemo, useEffect } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { Card, Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BASE_COLORS } from '@/constants/Colors';
import { FontFamilies } from '@/constants/Fonts';

type OrderCardProps = {
  image: any;
  title: string;
  quantity: number;
  price: string;
  onIncrease?: () => void;
  onDecrease?: () => void;
}

export default function OrderCard({ 
    image, 
    title,
    quantity, 
    price, 
    onIncrease, 
    onDecrease 
}: OrderCardProps) {
  const [localQuantity, setLocalQuantity] = useState<number>(quantity ?? 0);

  // Parse price string into number
  const parsePrice = (priceStr: string) => {
    if (!priceStr) return 0;
    let s = priceStr.replace(/[^0-9.,-]/g, '');
    if (s.indexOf('.') > -1 && s.indexOf(',') > -1) {
      s = s.replace(/\./g, '');
      s = s.replace(/,/g, '.');
    } else if (s.indexOf(',') > -1 && s.indexOf('.') === -1) {
      s = s.replace(/,/g, '.');
    }
    const n = parseFloat(s);
    return Number.isNaN(n) ? 0 : n;
  };

  const unitPrice = useMemo(() => parsePrice(price), [price]);
  const [currentPrice, setCurrentPrice] = useState<number>(unitPrice * (quantity ?? localQuantity));

  const formatter = useMemo(() => new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }), []);

  useEffect(() => {
    if (typeof quantity === 'number' && quantity !== localQuantity) {
      setLocalQuantity(quantity);
      setCurrentPrice(unitPrice * quantity);
    }
  }, [quantity]);

  const handleIncrease = () => {
    setLocalQuantity((q) => {
      const nq = q + 1;
      setCurrentPrice(unitPrice * nq);
      return nq;
    });
    if (onIncrease) onIncrease();
  };

  const handleDecrease = () => {
    setLocalQuantity((q) => {
      const nq = Math.max(0, q - 1);
      setCurrentPrice(unitPrice * nq);
      return nq;
    });
    if (onDecrease) onDecrease();
  };

  const displayedQuantity = localQuantity;
  const displayedPrice = currentPrice;

  return (
    <Card
        style = {{
            marginBottom: 10,
            backgroundColor: BASE_COLORS.WHITE
        }}
    >
        <ScrollView>
            <View className="flex-row items-center px-4 py-2">
                {/* Image */}
                <View className="w-20 items-center">
                    <Avatar.Image source={image} size={80} />
                </View>

                {/* Title */}
                <View className="flex-1 px-2">
                    <Text
                        numberOfLines={2}
                        className="text-lg ml-3"
                        style = {{
                            fontFamily: FontFamilies.BODY,
                            color: BASE_COLORS.STONE600
                        }}
                    >{title}</Text>
                </View>

                {/* Quantity Controls */}
                <View className="w-28 flex-row items-center justify-center">
                    <Pressable onPress={handleDecrease} hitSlop={8}>
                        <MaterialCommunityIcons name="minus-circle-outline" size={20} color={BASE_COLORS.STONE500} />
                    </Pressable>
                    <Text className="mx-2 text-lg"
                        style = {{
                            fontFamily: FontFamilies.BODY,
                            color: BASE_COLORS.STONE600
                        }}
                    >{displayedQuantity}</Text>
                    <Pressable onPress={handleIncrease} hitSlop={8}>
                        <MaterialCommunityIcons name="plus-circle-outline" size={20} color={BASE_COLORS.STONE500} />
                    </Pressable>
                </View>

                {/* Price */}
                <View className="w-24 items-end mr-5">
                    <Text className="text-base"
                        style = {{
                            fontFamily: FontFamilies.BODY,
                            color: BASE_COLORS.STONE600
                        }}
                    >{formatter.format(displayedPrice)}</Text>
                </View>
            </View>
        </ScrollView>
    </Card>
  );
};
