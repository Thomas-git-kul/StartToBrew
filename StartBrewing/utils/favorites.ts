// utils/favorites.ts
import { supabase } from "@/supabase";

export async function getUserFavorites(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("account_to_recipes")
    .select("recipe_slug")
    .eq("account_id", userId);
  if (error) throw error;
  return data ? data.map((row: any) => row.recipe_slug) : [];
}

export async function isRecipeFavorite(userId: string, recipeSlug: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("account_to_recipes")
    .select("id_account_to_recipes")
    .eq("account_id", userId)
    .eq("recipe_slug", recipeSlug)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function addFavorite(userId: string, recipeSlug: string): Promise<void> {
  const { error } = await supabase
    .from("account_to_recipes")
    .insert({ account_id: userId, recipe_slug: recipeSlug });
  if (error) throw error;
}

export async function removeFavorite(userId: string, recipeSlug: string): Promise<void> {
  const { error } = await supabase
    .from("account_to_recipes")
    .delete()
    .eq("account_id", userId)
    .eq("recipe_slug", recipeSlug);
  if (error) throw error;
}
