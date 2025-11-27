import { useState, useMemo, useEffect } from 'react';
import { View, Pressable, Dimensions } from 'react-native';
import { Card, Text, Avatar, Menu, Button } from 'react-native-paper';
import { BASE_COLORS } from '@/constants/Colors';
import { FontFamilies } from '@/constants/Fonts';
import { CirclePlus, CircleMinus } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_SCREEN_WIDTH = 375; 
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

type OrderCardProps = {
  image: any;
  title: string;
  quantity: number;
  price: string;
  onQuantityChange?: (newQuantity: number) => void;  // <-- new prop
};

export default function OrderCard({ 
    image, 
    title,
    quantity, 
    price, 
    onQuantityChange,
}: OrderCardProps) {

  const [localQuantity, setLocalQuantity] = useState<number>(quantity ?? 0);
  const [menuVisible, setMenuVisible] = useState(false);

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

  const handleQuantityChange = (newQty: number) => {
    setLocalQuantity(newQty);
    setCurrentPrice(unitPrice * newQty);
    if (onQuantityChange) onQuantityChange(newQty);
    setMenuVisible(false);
  };

  return (
    <Card
      style = {{
          marginBottom: 2,
          backgroundColor: BASE_COLORS.WHITE,
          borderRadius: 12,
          marginBlock: 3,
          marginInline: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
      }}
    >
      <View className="flex-row">
        {/* Image */}
        <Avatar.Image source={image} size={80} />

        <View className="flex-1 flex-row ml-3 items-center">

          {/* Title */}
          <Text
            numberOfLines={3}
            style={{ 
              flex: 1,
              fontSize: Math.min(12 * scale, 18),
              fontFamily: FontFamilies.BODY,
              color: BASE_COLORS.STONE950,
            }}
          >{title}</Text>

          {/* Quantity Dropdown */}
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button 
                mode="outlined" 
                onPress={() => setMenuVisible(true)}
                style={{ 
                  borderColor: BASE_COLORS.STONE300, 
                  borderWidth: 1, 
                  borderRadius: 20,
                  width: 70,
                  marginLeft: 10
                }}
                labelStyle={{
                  color: BASE_COLORS.STONE600,
                  fontFamily: FontFamilies.BODY,
                }}
              >{localQuantity}</Button>
            }
            contentStyle={{
              backgroundColor: BASE_COLORS.WHITE,
            }}
          >
            {[...Array(20)].map((_, i) => (
              <Menu.Item
                key={i}
                title={i.toString()} 
                onPress={() => handleQuantityChange(i)}
                titleStyle={{
                  color: BASE_COLORS.STONE600,
                  fontFamily: FontFamilies.BODY,
                }}
              />
            ))}
          </Menu>

          {/* Price */}
          <View style={{ width: 80, alignItems: "flex-end", marginRight: 5 }}>
            <Text
              style={{
                fontSize: Math.min(15 * scale, 20),
                fontFamily: FontFamilies.BODY,
                color: BASE_COLORS.STONE600
              }}
            >{formatter.format(currentPrice)}</Text>
          </View>

        </View>
      </View>
    </Card>
  );
};
