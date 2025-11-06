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
      <View style={styles.row}>
        <View style={styles.avatarColumn}>
          <Avatar.Image source={image} size={80} />
        </View>

        <View style={styles.titleColumn}>
          <Text
            numberOfLines={2}
            style={{
              fontFamily: FontFamilies.BODY,
              color: BASE_COLORS.STONE500,
            }}
          >
            {title}
          </Text>
        </View>

        <View style={styles.controlsColumn}>
          <Pressable onPress={handleDecrease} style={styles.iconButton} accessibilityLabel="Decrease quantity" hitSlop={8}>
            <MaterialCommunityIcons name="minus-circle-outline" size={26} color={BASE_COLORS.STONE500} />
          </Pressable>

          <Text
            style={{
              marginHorizontal: 8,
              fontFamily: FontFamilies.BODY,
              color: BASE_COLORS.STONE500,
            }}
          >
            {displayedQuantity}
          </Text>

          <Pressable onPress={handleIncrease} style={styles.iconButton} accessibilityLabel="Increase quantity" hitSlop={8}>
            <MaterialCommunityIcons name="plus-circle-outline" size={26} color={BASE_COLORS.STONE500} />
          </Pressable>
        </View>

        <View style={styles.priceColumn}>
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

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  avatarColumn: {
    width: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleColumn: {
    flex: 1,
    paddingHorizontal: 8,
    minWidth: 140,
  },
  controlsColumn: {
    width: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceColumn: {
    width: 80,
    alignItems: 'flex-end',
    paddingLeft: 8,
  },
  iconButton: {
    padding: 6,
    cursor: 'pointer',
  },
});

