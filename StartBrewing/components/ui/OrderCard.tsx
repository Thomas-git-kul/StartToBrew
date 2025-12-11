import { useState, useEffect, useMemo } from 'react';
import { View, Pressable, Image, Dimensions, Text, TextInput } from 'react-native';
import { Card } from 'react-native-paper';
import { BASE_COLORS } from '@/constants/Colors';
import { FontFamilies } from '@/constants/Fonts';
import { CirclePlus, CircleMinus } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_SCREEN_WIDTH = 375; 
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;
const IMAGE_WIDTH = Math.min(120, SCREEN_WIDTH * 0.2);
const IMAGE_HEIGHT = IMAGE_WIDTH;

type OrderCardProps = {
  image: any;
  title: string;
  quantity: number;
  price: string;
  starterkit: boolean;
  onQuantityChange: (newQty: number, starterkit: boolean) => void;
  onPress: () => void;
};

export default function OrderCard({ 
  image, title, quantity, price, starterkit, onQuantityChange, onPress 
}: OrderCardProps) {
  
  const [localQuantity, setLocalQuantity] = useState<string>(quantity?.toString() ?? "0");

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
  const formatter = useMemo(() => new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }), []);

  useEffect(() => {
    setLocalQuantity(quantity.toString());
  }, [quantity]);

  const handleQuantityChange = (newQty: number) => {
    onQuantityChange(newQty, starterkit);
  };

  const handleButtonChange = (newQty: number) => {
    setLocalQuantity(newQty.toString());
    onQuantityChange(newQty, starterkit);
  };

  return (
    <Card
      onPress={onPress}
      style={{
        marginBottom: 6,
        backgroundColor: BASE_COLORS.WHITE,
        borderRadius: 12,
        shadowColor: BASE_COLORS.STONE700,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        paddingRight: 8,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        <Image
          source={image}
          style={{
            width: IMAGE_WIDTH,
            height: IMAGE_HEIGHT,
            borderTopLeftRadius: 12,
            borderBottomLeftRadius: 12,
            borderRightWidth: 1,
            borderColor: BASE_COLORS.STONE100,
          }}
          resizeMode="cover"
        />
        <View className='flex-1 flex-row items-center gap-2 ml-3'>
          <View className="flex-1 mr-2">
            <Text
              numberOfLines={2}
              style={{
                fontFamily: FontFamilies.BODY,
                fontSize: Math.min(14 * scale, 18),
                color: BASE_COLORS.STONE950,
              }}
            >{title}</Text>
          </View>

          {/* Quantity Selector */}
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="flex-row items-center">
              <Pressable onPress={() => handleButtonChange(Math.max(0, parseInt(localQuantity) - 1))}>
                <CircleMinus size={20} color={BASE_COLORS.STONE500} />
              </Pressable>

              <TextInput
                value={localQuantity}
                inputMode="numeric"
                enterKeyHint="done"
                maxLength={2}
                onChangeText={(text) => {
                  const sanitized = text.replace(/[^0-9]/g, "");
                  setLocalQuantity(sanitized);
                }}
                onBlur={() => {
                  const finalValue = localQuantity === "" ? 0 : parseInt(localQuantity);
                  setLocalQuantity(finalValue.toString());
                  handleQuantityChange(finalValue);
                }}
                selectionColor={BASE_COLORS.ACCENT_PRIMARY}
                style={{
                  width: 25,
                  textAlign: "center",
                  fontFamily: FontFamilies.BODY,
                  fontSize: Math.min(16 * scale, 22),
                  color: BASE_COLORS.STONE700,
                }}
              />
              <Pressable onPress={() => handleButtonChange(parseInt(localQuantity || "0") + 1)}>
                <CirclePlus size={20} color={BASE_COLORS.STONE500} />
              </Pressable>
            </View>
          </Pressable>

          {/* Price */}
          <View style={{ width: 60, alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: FontFamilies.BODY, color: BASE_COLORS.STONE600 }}>
              {formatter.format(unitPrice * (parseInt(localQuantity) || 0))}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
};