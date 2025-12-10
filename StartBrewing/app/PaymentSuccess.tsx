import { useEffect } from "react";
import { View, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { BASE_COLORS } from "@/constants/Colors";
import { ThemedText } from "@/components/themed-text";
import { CheckCircle } from "lucide-react-native";
import emailjs from "@emailjs/browser";
import { supabase } from "@/supabase";
import PrimaryButton from "@/components/primaryButton";
import { useFonts } from "@/hooks/use-fonts";

export default function PaymentSuccess() {
  useFonts();
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string | undefined;
  const amount = params.amount as string | undefined;
  const orderId = params.order_id as string | undefined;
  const amountInEuros = (Number(amount) / 100).toFixed(2);

  useEffect(() => {
    const processOrder = async () => {
      try {
        // 1. Get logged-in user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("User not logged in:", userError?.message);
          return;
        }
        const userId = user.id;

        // 2. Get user's cart
        const { data: userCart, error: cartError } = await supabase
          .from("shopping_carts")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (cartError || !userCart) {
          console.warn("No shopping cart found for user.");
          return;
        }

        const cartId = userCart.id_cart;

        // 3. Get cart items
        const { data: cartItems, error: itemsError } = await supabase
          .from("shopping_cart_items")
          .select("*")
          .eq("cart_id", cartId);

        if (itemsError) {
          console.error("Error fetching cart items:", itemsError);
          return;
        }

        if (!cartItems || cartItems.length === 0) {
          console.warn("Shopping cart is empty.");
        }

        // --------------------------
        // 4. Create the order with all fields at once
        // --------------------------
        let numericOrderId: number;

        if (orderId) {
          numericOrderId = Number(orderId);
          // Check if order exists
          const { data: existingOrder, error: orderCheckError } = await supabase
            .from("orders")
            .select("id_order")
            .eq("id_order", numericOrderId)
            .single();

          if (orderCheckError || !existingOrder) {
            console.warn("Order ID does not exist, creating a new paid order.");
            const { data: newOrder, error: newOrderError } = await supabase
              .from("orders")
              .insert({
                user_id: userId,
                total_amount: Number(amountInEuros),
                status: "paid",
                paid_at: new Date().toISOString(),
              })
              .select()
              .single();
            if (newOrderError || !newOrder) {
              console.error("Failed to create order:", newOrderError);
              return;
            }
            numericOrderId = newOrder.id_order;
          }
        } else {
          const { data: newOrder, error: newOrderError } = await supabase
            .from("orders")
            .insert({
              user_id: userId,
              total_amount: Number(amountInEuros),
              status: "paid",
              paid_at: new Date().toISOString(),
            })
            .select()
            .single();
          if (newOrderError || !newOrder) {
            console.error("Failed to create order:", newOrderError);
            return;
          }
          numericOrderId = newOrder.id_order;
        }

        // --------------------------
        // 5. Insert order_items with starter_kit
        // --------------------------
        if (cartItems && cartItems.length > 0) {
          const orderItemsPayload = (cartItems as any[]).map(item => ({
            order_id: numericOrderId,
            store_item_id: item.store_item_id,
            quantity: item.quantity,
            starter_kit: item.starter_kit ?? false, // <-- added starter_kit
          }));

          const { error: orderItemsErr } = await supabase
            .from("order_items")
            .insert(orderItemsPayload);

          if (orderItemsErr) console.error("Error inserting order items:", orderItemsErr);

          // 6. Delete cart items first, then cart
          const { error: deleteItemsErr } = await supabase
            .from("shopping_cart_items")
            .delete()
            .eq("cart_id", cartId);

          if (deleteItemsErr) console.error("Error deleting cart items:", deleteItemsErr);

          const { error: deleteCartErr } = await supabase
            .from("shopping_carts")
            .delete()
            .eq("id_cart", cartId);

          if (deleteCartErr) console.error("Error deleting shopping cart:", deleteCartErr);
        }

      } catch (err: any) {
        console.error("Unexpected error:", err?.message ?? err);
      }

      // --------------------------
      // EMAIL CODE (unchanged)
      // --------------------------
      if (email && amountInEuros && orderId) {
        emailjs
          .send(
            process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID!,
            process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID!,
            {
              customer_email: email,
              amount: amountInEuros,
              order_id: orderId,
            },
            process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY!
          )
          .then((result) => console.log("Email sent successfully:", result.text))
          .catch((error) => console.error("Failed to send email:", error.text || error));
      } else {
        console.warn("Missing email, amount, or order ID, cannot send receipt.");
      }
    };

    processOrder();
  }, [email, amount, orderId]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: BASE_COLORS.LIGHT_BG,
        justifyContent: "center",
      }}
    >
      <View className="mx-3 items-center">
        <ThemedText type="title" className="mb-2">
          Payment Successful!
        </ThemedText>

        <View className="items-center mb-6">
          <CheckCircle
            size={120}
            color={"#22c55e"}
            strokeWidth={1.5}
            className="mb-3"
          />
        </View>

        <ThemedText type="defaultText" className="text-center mb-6">
          Thank you for your purchase!
          {"\n"}
          You can now return to the homepage!
        </ThemedText>

        <PrimaryButton
          title="Back to home"
          testID="back-button"
          onPress={() => router.replace("/HomePage")}
        />
      </View>
    </SafeAreaView>
  );
}
