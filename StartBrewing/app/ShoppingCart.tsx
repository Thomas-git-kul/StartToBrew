import { useState, useMemo } from "react";
import { View, ScrollView } from "react-native";
import { Button } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useRouter, type Href } from "expo-router";
import OrderCard from "@/components/ui/OrderCard";
import { useFonts } from "@/hooks/use-fonts";
import Header from '@/components/header';
import TextInput from '@/components/textInput';
import { ThemedText } from "@/components/themed-text";
import { SafeAreaView } from "react-native-safe-area-context";

interface Order {
  image: any;
  title: string;
  quantity: number;
  price: string;
}

export default function ShoppingCart() {
  useFonts();
  const router = useRouter();

  const initialOrders: Order[] = [
    {
      image: require("@/assets/images/Premiumkit.png"),
      title: "Superior starter kit Base",
      quantity: 1,
      price: "€299",
    },
    {
      image: require("@/assets/images/Airlock.png"),
      title: "Airlock",
      quantity: 1,
      price: "€1,49",
    },
  ];
  const [orders, setOrders] = useState<Order[]>(initialOrders);

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

  const handleIncrease = (index: number) => {
    setOrders((prev) => prev.map((o, i) => i === index ? { ...o, quantity: o.quantity + 1 } : o));
  };

  const handleDecrease = (index: number) => {
    setOrders((prev) => prev.map((o, i) => i === index ? { ...o, quantity: Math.max(0, o.quantity - 1) } : o));
  };

  const total = useMemo(() => {
    return orders.reduce((sum, o) => sum + parsePrice(o.price) * o.quantity, 0);
  }, [orders]);

  const formatter = useMemo(() => new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }), []);

  return (
    <SafeAreaView 
      className="flex-1" 
      style={{ backgroundColor: BASE_COLORS.LIGHT_BG 
    }}>

      <Header
        title='Shopping Cart'
        iconName="ArrowRight"
        onIconPress={() => router.push("/Store" as any)}
        actionTestID="store-button"
      />

      <ScrollView className="mx-3">
        <ThemedText type="title">Order Summary</ThemedText>

        {/* Order cards */}
        <View className="mx-1">
          {orders.map((Order, index) => (
            <OrderCard key={index} {...Order} onIncrease={() => handleIncrease(index)} onDecrease={() => handleDecrease(index)} />
          ))}
        </View>

        {/* Subtotal */}
        <View className='mt-3 items-end'>
          <ThemedText type="accentDark">Subtotal: {formatter.format(total)}</ThemedText>
        </View>

        {/* Shipping Info */}
        <View className="mt-7">
          <ThemedText type="title">Shipping Information</ThemedText>
          <TextInput 
            label="Full Name"/>
          <TextInput 
            label="Street name and number"/>
          <View className="flex-row">
              <TextInput label="City" />
            <View className="flex-1 ml-3">
              <TextInput label="Zip code"/>
            </View>
          </View>
        </View>

        {/* Proceed */}
        <View className="mt-5">
          <Button
            mode="contained"
            onPress={() => console.log("Proceed to payment")}
            style={{
              backgroundColor: BASE_COLORS.TEXT_DARK,
              alignSelf: "flex-start",
            }}
            contentStyle={{ paddingHorizontal: 12, paddingVertical: 6 }}
            labelStyle={{ 
              fontSize: 14,
              color: BASE_COLORS.WHITE,
              fontFamily: FontFamilies.BODY
            }}
          >Proceed to payment</Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
