import { useState, useMemo, useEffect } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { Card, Text, Avatar } from 'react-native-paper';
import { BASE_COLORS } from '@/constants/Colors';
import { FontFamilies } from '@/constants/Fonts';
import { ThemedText } from "@/components/themed-text";
import { CirclePlus, CircleMinus } from "lucide-react-native";

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
      <View className="flex-row items-center">
        {/* Image */}
        <Avatar.Image source={image} size={80} />

        <View className="flex-1 flex-row ml-3 items-center">

          {/* Title */}
          <ThemedText 
            type="subTitle" 
            style={{ flex: 1 }}
          >{title}</ThemedText>

          {/* Quantity */}
          <View style={{ width: 80 }} className="flex-row items-center justify-center">
            <Pressable onPress={handleDecrease} hitSlop={8}>
              <CircleMinus size={20} color={BASE_COLORS.STONE500} />
            </Pressable>
            <ThemedText type="numbers" className="mx-2">
              {displayedQuantity}
            </ThemedText>
            <Pressable onPress={handleIncrease} hitSlop={8}>
              <CirclePlus size={20} color={BASE_COLORS.STONE500} />
            </Pressable>
          </View>

          {/* Price */}
          <View style={{ width: 80, alignItems: "flex-end", marginRight: 5 }}>
            <ThemedText type="numbers">{formatter.format(displayedPrice)}</ThemedText>
          </View>

        </View>
      </View>
    </Card>
  );
};
