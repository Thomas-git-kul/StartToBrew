import React from "react";
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
  onIncrease: () => void;
  onDecrease: () => void;
}

export default function ShoppingCart() {
  const router = useRouter();

  const orders: Order[] = [
      { image: require("@/assets/images/Premiumkit.png"), 
        title: "Superior starter kit Base", 
        quantity: 1,
        price: "€299",
        onIncrease: () => console.log("Increase"),
        onDecrease: () => console.log("Decrease"),
      },
      { image: require("@/assets/images/Airlock.png"), 
        title: "Airlock", 
        quantity: 1,
        price: "€1,49", 
        onIncrease: () => console.log("Increase"), 
        onDecrease: () => console.log("Decrease") },
    ];

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
            <OrderCard key={index} {...Order} />
          ))}
        </ScrollView>
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
      <Text className="text-lg font-semibold mt-4">Total: €34,48</Text>
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
