// app/index.tsx

import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { supabase } from "@/supabase";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import "./fontLoader.web"; // <-- Web-only font injection

export default function Index() {
  const [loading, setLoading] = useState<boolean>(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // 1) initiële sessie ophalen (async, zonder .then + any)
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setLoading(false);
    };

    init();

    // 2) luisteren naar login / logout / token refresh
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

  if (loading) {
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
