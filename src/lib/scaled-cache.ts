import "server-only";
import { getSupabase } from "@/lib/supabase";
import type { Step } from "@/lib/types";

export async function getScaledSteps(
  recipeId: string,
  servings: number
): Promise<Step[] | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("recipe_scaled_cache")
    .select("steps")
    .eq("recipe_id", recipeId)
    .eq("servings", servings)
    .maybeSingle();
  if (error) throw error;
  return (data?.steps as Step[] | undefined) ?? null;
}

export async function saveScaledSteps(
  recipeId: string,
  servings: number,
  ingredients: Array<{ name: string; amount: number | null; unit: string | null; is_pantry: boolean }>,
  steps: Step[]
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("recipe_scaled_cache")
    .upsert(
      { recipe_id: recipeId, servings, ingredients, steps },
      { onConflict: "recipe_id,servings" }
    );
  if (error) throw error;
}
