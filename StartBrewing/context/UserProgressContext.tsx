// context/UserProgressContext.tsx
import { createContext, useContext } from "react";
import { useUserProgress } from "@/hooks/useUserProgress";

const UserProgressContext = createContext<ReturnType<
  typeof useUserProgress
> | null>(null);

export function UserProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useUserProgress();
  return (
    <UserProgressContext.Provider value={value}>
      {children}
    </UserProgressContext.Provider>
  );
}

export function useUserProgressContext() {
  const ctx = useContext(UserProgressContext);
  if (!ctx) {
    throw new Error(
      "useUserProgressContext must be used within UserProgressProvider"
    );
  }
  return ctx;
}
