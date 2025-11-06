import React, { useState, useMemo } from "react";
import { View, Image, ScrollView } from "react-native";
import { Text, Button, TextInput, Appbar } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useRouter, type Href } from "expo-router";
import OrderCard from "@/components/ui/OrderCard";

interface Order {
  image: any;
  title: string;
  quantity: number;
  price: string;
}

export default function ShoppingCart() {
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
    <View className="flex-1" style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}>
      {/* Header */}
      <Appbar.Header
        className="pt-8 pb-4"
        style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}
      >
        <Appbar.Content
          title="Order Information"
          titleStyle={{
            fontSize: 36,
            fontFamily: FontFamilies.HEADING,
            color: BASE_COLORS.TEXT_DARK,
          }}
        />
        <Appbar.Action
            icon={() => <MaterialCommunityIcons name="arrow-right" size={28} color={BASE_COLORS.TEXT_DARK} />}
            onPress={() => router.push("./(tabs)/store")}
          />
      </Appbar.Header>

      {/* Order Summary */}
      <View className="mx-5">
        <Text className="text-xl mb-2"
          style ={{
            fontFamily: FontFamilies.BODY_BOLD,
            color: BASE_COLORS.ACCENT_PRIMARY
          }}
        >Order Summary</Text>
        {/* Order cards */}
        <ScrollView>
          {orders.map((Order, index) => (
            <OrderCard key={index} {...Order} onIncrease={() => handleIncrease(index)} onDecrease={() => handleDecrease(index)} />
          ))}
        </ScrollView>
        {/* Subtotal */}
        <View className='mt-3 items-end'>
          <Text className="text-lg"
            style={{ 
              fontFamily: FontFamilies.BODY_BOLD, 
              color: BASE_COLORS.TEXT_DARK 
            }}
          >Subtotal: {formatter.format(total)}</Text>
        </View>
      </View>

      {/* Shipping Info */}
      <View className="mx-5 mt-10">
        <Text className="text-xl mb-2"
          style ={{
                fontFamily: FontFamilies.BODY_BOLD,
                color: BASE_COLORS.ACCENT_PRIMARY
              }}
        >Shipping Information</Text>
        <TextInput label="Full Name" mode="outlined" className="mb-2"
          style = {{
            backgroundColor: BASE_COLORS.WHITE
          }}
        />
        <TextInput label="Street name and number" mode="outlined" className="mb-2" 
          style = {{
              backgroundColor: BASE_COLORS.WHITE
            }}
        />
        <View className="flex-row justify-between">
          <TextInput label="City" mode="outlined" className='flex-1' 
            style = {{
              backgroundColor: BASE_COLORS.WHITE
            }}
          />
          <TextInput label="City zip code" mode="outlined" className='flex-1'
            style = {{
              backgroundColor: BASE_COLORS.WHITE,
            }}
          />
        </View>
      </View>

      {/* Proceed */}
      <View style={{ marginTop: 50, paddingLeft: 20 }}>
      <Button
        mode="contained"
        onPress={() => console.log("Proceed to payment")}
        style={{
          backgroundColor: BASE_COLORS.TEXT_DARK,
          alignSelf: "flex-start",
        }}
        contentStyle={{ paddingHorizontal: 12, paddingVertical: 6 }}
        labelStyle={{ 
          fontSize: 16,
          color: BASE_COLORS.WHITE,
          fontFamily: FontFamilies.BODY_BOLD
        }}
      >Proceed to payment</Button>
      </View>
    </View>
  );
}
