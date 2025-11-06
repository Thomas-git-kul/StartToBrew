
import React from "react";
import { View, Image } from "react-native";
import { Text, Button, TextInput } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { BASE_COLORS } from "@/constants/Colors";

export default function ShoppingCart() {
  return (
    <View className="flex-1 bg-light-bg p-5">
      <Text className="text-2xl font-bold mb-4" style={{ color: BASE_COLORS.TEXT_DARK }}>
        Order Information
      </Text>

      {/* Order Summary */}
      <View className="mb-4">
        <Text className="text-lg font-semibold mb-2">Order Summary</Text>
        <View className="flex-row items-center justify-between mb-3">
          <Image source={require("@/assets/images/Starterkit.png")} style={{ width: 60, height: 60 }} />
          <Text>Starter Kit IPA</Text>
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="minus-circle-outline" size={24} />
            <Text className="mx-2">1</Text>
            <MaterialCommunityIcons name="plus-circle-outline" size={24} />
          </View>
          <Text>€32,99</Text>
        </View>
        {/* Repeat for other items */}
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
