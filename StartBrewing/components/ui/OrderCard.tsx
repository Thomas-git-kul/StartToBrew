import React, { useState, useMemo, useEffect } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
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
        style ={{
            marginBottom: 10,
            backgroundColor: BASE_COLORS.WHITE,
        }}
    >
      <View className='items-center flex-row justify-between pr-5'>
        <View className='items-center justify-center'>
          <Avatar.Image source={image} size={80} />
        </View>

        <View className='flex-1 px-8 min-w-140'>
          <Text className='text-lg'
            numberOfLines={2}
            style={{
              fontFamily: FontFamilies.BODY,
              color: BASE_COLORS.STONE600,
            }}
          >{title}</Text>
        </View>

        <View className='flex-row items-center justify-center ml-10'>
          <Pressable className='p-6' onPress={handleDecrease} accessibilityLabel="Decrease quantity" hitSlop={8}>
            <MaterialCommunityIcons name="minus-circle-outline" size={20} color={BASE_COLORS.STONE500} />
          </Pressable>

          <Text className='text-lg mx-3'
            style={{
              fontFamily: FontFamilies.BODY,
              color: BASE_COLORS.STONE600,
            }}
          >{displayedQuantity}</Text>

          <Pressable className='p-6' onPress={handleIncrease} accessibilityLabel="Increase quantity" hitSlop={8}>
            <MaterialCommunityIcons name="plus-circle-outline" size={20} color={BASE_COLORS.STONE500} />
          </Pressable>
        </View>

        <View className='Items-end w-min-140 pl-8'>
          <Text
            style={{
              fontFamily: FontFamilies.BODY,
              color: BASE_COLORS.STONE500,
            }}
          >
            {formatter.format(displayedPrice)}
          </Text>
        </View>
      </View>
    </Card>
  );
};
