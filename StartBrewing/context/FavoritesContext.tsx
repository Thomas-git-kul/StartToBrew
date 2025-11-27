import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getUserFavorites, addFavorite, removeFavorite } from "@/utils/favorites";
import { supabase } from "@/supabase";

interface FavoritesContextType {
  favoriteSlugs: string[];
  userId: string | null;
  loading: boolean;
  toggleFavorite: (slug: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshFavorites = async () => {
    if (!userId) return;
    const favs = await getUserFavorites(userId);
    setFavoriteSlugs(favs);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (user) setUserId(user.id);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (userId) {
      setLoading(true);
      getUserFavorites(userId).then((favs) => {
        setFavoriteSlugs(favs);
        setLoading(false);
      });
    }
  }, [userId]);

  const toggleFavorite = async (slug: string) => {
    if (!userId) return;
    const isFav = favoriteSlugs.includes(slug);
    if (isFav) {
      await removeFavorite(userId, slug);
      setFavoriteSlugs((prev) => prev.filter((s) => s !== slug));
    } else {
      await addFavorite(userId, slug);
      setFavoriteSlugs((prev) => [...prev, slug]);
    }
  };

  return (
    <FavoritesContext.Provider value={{ favoriteSlugs, userId, loading, toggleFavorite, refreshFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used within a FavoritesProvider");
  return context;
};
