import React, { useState, useMemo } from "react";
import { View, Image, ScrollView } from "react-native";
import { Text, Button, TextInput, Appbar } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useRouter } from "expo-router";
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
      {/* Top Appbar */}
      <Appbar.Header className="pt-8 pb-8"
        style={{
          backgroundColor: BASE_COLORS.LIGHT_BG,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 16 }}>
          <Appbar.Content
            title="Order Information"
            titleStyle={{ fontSize: 36, fontFamily: FontFamilies.HEADING, color: BASE_COLORS.TEXT_DARK }}
          />
        </View>
      </Appbar.Header>

      {/* Order Summary */}
      <View className="m-5">
        <Text className="text-lg mb-2"
          style ={{
            fontFamily: FontFamilies.BODY_BOLD,
            color: BASE_COLORS.ACCENT_PRIMARY
          }}
        >Order Summary</Text>
        <ScrollView>
          {/* Order cards */}
          {orders.map((Order, index) => (
            <OrderCard key={index} {...Order} onIncrease={() => handleIncrease(index)} onDecrease={() => handleDecrease(index)} />
          ))}
        </ScrollView>
        {/* Subtotal shown directly under the orders list */}
        <View style={{ marginTop: 12, alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: FontFamilies.BODY_BOLD, color: BASE_COLORS.TEXT_DARK }}>
            Subtotal: {formatter.format(total)}
          </Text>
        </View>
      </View>

      {/* Shipping Info */}
      <Text className="text-lg font-semibold mb-2">Shipping Information</Text>
      <TextInput label="Full Name" mode="outlined" className="mb-2" />
      <TextInput label="Street name and number" mode="outlined" className="mb-2" />
      <View className="flex-row justify-between">
        <TextInput label="City" mode="outlined" style={{ flex: 1, marginRight: 8 }} />
        <TextInput label="City zip code" mode="outlined" style={{ flex: 1 }} />
      </View>

      {/* Total & Button */}
  <Text className="text-lg font-semibold mt-4">Total: {formatter.format(total)}</Text>
      <Button
        mode="contained"
        style={{ backgroundColor: BASE_COLORS.TEXT_DARK, marginTop: 16 }}
        onPress={() => console.log("Proceed to payment")}
      >
        Proceed to payment
      </Button>

      <Button onPress={() => console.log("Return to store")} style={{ marginTop: 8 }}>
        Return to store
      </Button>
    </View>
  );
}
