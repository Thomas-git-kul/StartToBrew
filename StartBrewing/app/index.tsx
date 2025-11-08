// app/index.tsx

import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { supabase } from "@/supabase";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";

import { useFonts } from "expo-font";
import { MaterialIcons } from "@expo/vector-icons";

export default function Index() {
  const [loading, setLoading] = useState<boolean>(true);
  const [session, setSession] = useState<Session | null>(null);

  const [fontsLoaded] = useFonts({
    MaterialIcons: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf"),
  });

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, newSession: Session | null) => {
        setSession(newSession ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ✅ WAIT FOR FONTS TO LOAD
  if (!fontsLoaded || loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/Auth" />;
  }

  return <Redirect href="/(tabs)/HomePage" />;
}
