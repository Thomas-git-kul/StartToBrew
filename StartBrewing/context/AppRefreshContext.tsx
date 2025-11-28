import React, { createContext, useContext, useState } from "react";

type AppRefresh = {
  refreshKey: number;
  triggerRefresh: () => void;
};

const AppRefreshContext = createContext<AppRefresh | null>(null);

export function AppRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);
  return (
    <AppRefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </AppRefreshContext.Provider>
  );
}

export function useAppRefresh() {
  const ctx = useContext(AppRefreshContext);
  if (!ctx) {
    // Return a safe no-op fallback so components can be used outside the provider
    // (useful for tests and isolated renders).
    return { refreshKey: 0, triggerRefresh: () => {} } as AppRefresh;
  }
  return ctx;
}
