import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@app:click_count";

type ClickContext = {
  count: number;
  increment: (reason?: string) => Promise<number>;
  reset: () => Promise<void>;
  get: () => number;
};

const ClickCounterContext = createContext<ClickContext | null>(null);

export function ClickCounterProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState<number>(0);
  const countRef = useRef<number>(0);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const n = raw ? parseInt(raw, 10) : 0;
        if (!Number.isNaN(n)) setCount(n);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    countRef.current = count;
  }, [count]);

  const persist = useCallback(async (n: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, String(n));
    } catch (e) {
      // ignore
    }
  }, []);

  const increment = useCallback(async (reason?: string) => {
    let next = 0;
    setCount((prev) => {
      next = prev + 1;
      // persist but don't await here
      persist(next);
      return next;
    });
    // ensure we return the computed next value, using the ref as a fallback
    return next || (countRef.current + 1);
  }, [persist]);

  const reset = useCallback(async () => {
    setCount(0);
    countRef.current = 0;
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }, []);

  const get = useCallback(() => countRef.current, []);

  return (
    <ClickCounterContext.Provider value={{ count, increment, reset, get }}>
      {children}
    </ClickCounterContext.Provider>
  );
}

export function useClickCounter() {
  const ctx = useContext(ClickCounterContext);
  if (!ctx) throw new Error("useClickCounter must be used within ClickCounterProvider");
  return ctx;
}

export default ClickCounterContext;
